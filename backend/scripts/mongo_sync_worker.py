"""CraveLane MySQL -> MongoDB outbox worker.

Run from backend/: python -m scripts.mongo_sync_worker
MySQL is authoritative. MongoDB is an asynchronously synchronized copy.
"""
import logging
import os
import signal
import sys
import time
from datetime import datetime, timedelta
from decimal import Decimal

from bson.decimal128 import Decimal128
from dotenv import load_dotenv

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(BACKEND_DIR, ".env"))
sys.path.insert(0, BACKEND_DIR)

from database.mongodb import connect_mongodb, close_mongodb
from database.mysql_db import get_connection

logging.basicConfig(
    level=os.getenv("SYNC_LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s %(levelname)s %(message)s",
)
log = logging.getLogger("cravelane-sync")
POLL_SECONDS = max(1, int(os.getenv("SYNC_POLL_SECONDS", "5")))
BATCH_SIZE = max(1, min(100, int(os.getenv("SYNC_BATCH_SIZE", "20"))))
MAX_ATTEMPTS = max(1, int(os.getenv("SYNC_MAX_ATTEMPTS", "10")))
LOCK_TIMEOUT_MINUTES = max(1, int(os.getenv("SYNC_LOCK_TIMEOUT_MINUTES", "10")))
STOP = False

COLLECTIONS = {
    "customer": ("customers", "Customer_ID"),
    "restaurant": ("restaurants", "Restaurant_ID"),
    "menu": ("menu_items", "Menu_ID"),
    "orders": ("orders", "Order_ID"),
    "review": ("reviews", "Review_ID"),
}


def money(value):
    if value is None:
        return None
    return Decimal128(str(value if isinstance(value, Decimal) else Decimal(str(value))))


def fetch_one(cursor, sql, params):
    cursor.execute(sql, params)
    return cursor.fetchone()


def load_document(cursor, entity_type, entity_id):
    """Build the same document shape and fields as migrate_mysql_to_mongo.py."""
    if entity_type == "customer":
        row = fetch_one(cursor, """
            SELECT Customer_ID, Name, Email, Phone, Address, City, Pincode, Role
            FROM customer WHERE Customer_ID = %s
        """, (entity_id,))
        if not row:
            return "customers", None
        doc = {
            "customer_id": row["Customer_ID"], "name": row["Name"],
            "email": row["Email"], "phone": row["Phone"],
            "address": row["Address"], "city": row["City"],
            "pincode": row["Pincode"], "role": row["Role"],
        }
        return "customers", doc

    if entity_type == "restaurant":
        row = fetch_one(cursor, "SELECT * FROM restaurant WHERE Restaurant_ID = %s", (entity_id,))
        if not row:
            return "restaurants", None
        return "restaurants", {
            "restaurant_id": row["Restaurant_ID"],
            "restaurant_name": row["Restaurant_Name"],
            "description": row["Description"], "phone": row["Phone"],
            "address": row["Address"], "city": row["City"],
            "rating": money(row["Rating"]), "status": row["Status"],
            "image_url": row["Image_URL"],
        }

    if entity_type == "menu":
        row = fetch_one(cursor, "SELECT * FROM menu WHERE Menu_ID = %s", (entity_id,))
        if not row:
            return "menu_items", None
        return "menu_items", {
            "menu_id": row["Menu_ID"], "restaurant_id": row["Restaurant_ID"],
            "item_name": row["Item_Name"], "description": row["Description"],
            "price": money(row["Price"]), "category": row["Category"],
            "availability": bool(row["Availability"]), "image_url": row["Image_URL"],
        }

    if entity_type == "orders":
        row = fetch_one(cursor, "SELECT * FROM orders WHERE Order_ID = %s", (entity_id,))
        if not row:
            return "orders", None
        cursor.execute("""
            SELECT Order_Item_ID, Menu_ID, Quantity, Unit_Price
            FROM order_item WHERE Order_ID = %s ORDER BY Order_Item_ID
        """, (entity_id,))
        items = cursor.fetchall()
        return "orders", {
            "order_id": row["Order_ID"], "customer_id": row["Customer_ID"],
            "order_date": row["Order_Date"], "total_amount": money(row["Total_Amount"]),
            "delivery_address": row["Delivery_Address"], "city": row["City"],
            "pincode": row["Pincode"], "order_status": row["Order_Status"],
            "payment_method": row["Payment_Method"], "payment_status": row["Payment_Status"],
            "razorpay_order_id": row["Razorpay_Order_ID"],
            "razorpay_payment_id": row["Razorpay_Payment_ID"],
            "items": [{
                "order_item_id": item["Order_Item_ID"],
                "menu_id": item["Menu_ID"], "quantity": item["Quantity"],
                "unit_price": money(item["Unit_Price"]),
            } for item in items],
        }

    if entity_type == "review":
        row = fetch_one(cursor, "SELECT * FROM review WHERE Review_ID = %s", (entity_id,))
        if not row:
            return "reviews", None
        return "reviews", {
            "review_id": row["Review_ID"], "customer_id": row["Customer_ID"],
            "restaurant_id": row["Restaurant_ID"], "order_id": row["Order_ID"],
            "rating": row["Rating"], "comments": row["Comments"],
            "review_date": row["Review_Date"],
        }

    raise ValueError(f"Unsupported outbox entity type: {entity_type}")


def claim_batch():
    """Claim a batch in a short transaction. Run one worker instance only."""
    db = get_connection()
    cursor = None
    try:
        db.start_transaction()
        cursor = db.cursor(dictionary=True)
        cursor.execute("""
            SELECT Event_ID, Entity_Type, Entity_ID, Operation, Attempts
            FROM sync_outbox
            WHERE Status = 'pending' AND Attempts < %s
            ORDER BY Event_ID
            LIMIT %s
            FOR UPDATE
        """, (MAX_ATTEMPTS, BATCH_SIZE))
        events = cursor.fetchall()
        if events:
            ids = [int(event["Event_ID"]) for event in events]
            placeholders = ",".join(["%s"] * len(ids))
            cursor.execute(f"""
                UPDATE sync_outbox
                SET Status = 'processing', Locked_At = NOW(), Attempts = Attempts + 1
                WHERE Event_ID IN ({placeholders})
            """, tuple(ids))
        db.commit()
        return events
    except Exception:
        db.rollback()
        raise
    finally:
        if cursor:
            cursor.close()
        db.close()


def mark_event(event, status, error=None):
    db = get_connection()
    cursor = None
    try:
        cursor = db.cursor()
        if status == "processed":
            cursor.execute("""
                UPDATE sync_outbox
                SET Status='processed', Processed_At=NOW(), Locked_At=NULL, Last_Error=NULL
                WHERE Event_ID=%s
            """, (event["Event_ID"],))
        else:
            attempts = int(event["Attempts"]) + 1
            next_status = "failed" if attempts >= MAX_ATTEMPTS else "pending"
            cursor.execute("""
                UPDATE sync_outbox
                SET Status=%s, Locked_At=NULL, Last_Error=%s
                WHERE Event_ID=%s
            """, (next_status, str(error)[:60000], event["Event_ID"]))
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        if cursor:
            cursor.close()
        db.close()


def recover_stale_locks():
    db = get_connection()
    cursor = None
    try:
        cursor = db.cursor()
        cursor.execute("""
            UPDATE sync_outbox
            SET Status = CASE WHEN Attempts >= %s THEN 'failed' ELSE 'pending' END,
                Locked_At = NULL,
                Last_Error = COALESCE(Last_Error, 'Recovered stale worker lock')
            WHERE Status = 'processing'
              AND Locked_At < NOW() - INTERVAL %s MINUTE
        """, (MAX_ATTEMPTS, LOCK_TIMEOUT_MINUTES))
        changed = cursor.rowcount
        db.commit()
        if changed:
            log.warning("Recovered %s stale event(s)", changed)
    except Exception:
        db.rollback()
        raise
    finally:
        if cursor:
            cursor.close()
        db.close()


def sync_event(event, mongo_db):
    entity_type = event["Entity_Type"]
    entity_id = int(event["Entity_ID"])
    if entity_type not in COLLECTIONS:
        raise ValueError(f"Unsupported entity type: {entity_type}")
    collection_name, pk_field = COLLECTIONS[entity_type]
    collection = mongo_db[collection_name]

    if event["Operation"] == "delete":
        collection.delete_one({"_id": entity_id})
        if entity_type == "restaurant":
            # MySQL ON DELETE CASCADE removes its menu rows.
            mongo_db["menu_items"].delete_many({"restaurant_id": entity_id})
        return

    db = get_connection()
    cursor = None
    try:
        cursor = db.cursor(dictionary=True)
        collection_name, document = load_document(cursor, entity_type, entity_id)
    finally:
        if cursor:
            cursor.close()
        db.close()

    if document is None:
        # Handles an upsert event whose source row was subsequently deleted.
        collection.delete_one({"_id": entity_id})
        if entity_type == "restaurant":
            mongo_db["menu_items"].delete_many({"restaurant_id": entity_id})
        return

    document["_id"] = entity_id
    collection.replace_one({"_id": entity_id}, document, upsert=True)


def run_once(mongo_db):
    events = claim_batch()
    for event in events:
        try:
            sync_event(event, mongo_db)
            mark_event(event, "processed")
            log.info("Synced event %s (%s:%s)", event["Event_ID"], event["Entity_Type"], event["Entity_ID"])
        except Exception as exc:
            log.exception("Event %s failed", event["Event_ID"])
            try:
                mark_event(event, "failed", exc)
            except Exception:
                log.exception("Could not update event %s status", event["Event_ID"])
    return len(events)


def stop_worker(_signum, _frame):
    global STOP
    STOP = True


def main():
    signal.signal(signal.SIGINT, stop_worker)
    signal.signal(signal.SIGTERM, stop_worker)
    mongo_db = connect_mongodb()
    log.info("Connected to MongoDB database %s", mongo_db.name)
    try:
        mongo_db["customers"].create_index("email", unique=True)
        mongo_db["reviews"].create_index(
            [("customer_id", 1), ("restaurant_id", 1), ("order_id", 1)],
            unique=True,
        )
        recover_stale_locks()
        while not STOP:
            count = run_once(mongo_db)
            if count == 0:
                time.sleep(POLL_SECONDS)
    finally:
        close_mongodb()
        log.info("MongoDB sync worker stopped")


if __name__ == "__main__":
    try:
        main()
    except Exception:
        log.exception("MongoDB sync worker could not start")
        sys.exit(1)
