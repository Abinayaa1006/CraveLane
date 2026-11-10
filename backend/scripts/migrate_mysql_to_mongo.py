
import sys
import os
import argparse
from pathlib import Path
from decimal import Decimal

import mysql.connector
from bson.decimal128 import Decimal128
from dotenv import load_dotenv

# Load backend/.env
BACKEND_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BACKEND_DIR / ".env", override=True)

sys.path.insert(0, str(BACKEND_DIR))

from database.mongodb import connect_mongodb, close_mongodb


def convert_value(value):
    if isinstance(value, Decimal):
        return Decimal128(str(value))
    return value


def get_railway_connection():
    required = [
        "MIGRATION_DB_HOST",
        "MIGRATION_DB_PORT",
        "MIGRATION_DB_USER",
        "MIGRATION_DB_PASSWORD",
        "MIGRATION_DB_NAME"
    ]

    missing = [
        key for key in required
        if not os.getenv(key)
    ]

    if missing:
        raise ValueError(
            "Missing migration settings in backend/.env: "
            + ", ".join(missing)
        )

    return mysql.connector.connect(
        host=os.getenv("MIGRATION_DB_HOST"),
        port=int(os.getenv("MIGRATION_DB_PORT")),
        user=os.getenv("MIGRATION_DB_USER"),
        password=os.getenv("MIGRATION_DB_PASSWORD"),
        database=os.getenv("MIGRATION_DB_NAME"),
        connection_timeout=20
    )


def migrate():

    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Write records into MongoDB"
    )
    args = parser.parse_args()

    mysql_connection = None

    try:
        print("\nConnecting to Railway MySQL...")
        mysql_connection = get_railway_connection()
        print("Railway MySQL connected successfully!")

        print("\nConnecting to MongoDB Atlas...")
        mongo_database = connect_mongodb()

        cursor = mysql_connection.cursor(dictionary=True)

        tables = [
            "customer",
            "restaurant",
            "menu",
            "orders",
            "order_item",
            "review"
        ]

        source_data = {}

        print("\nReading Railway data...")

        for table in tables:
            cursor.execute(f"SELECT * FROM `{table}`")
            source_data[table] = cursor.fetchall()

            print(
                f"{table}: {len(source_data[table])} records"
            )

        cursor.close()

        # Group order items by order
        items_by_order = {}

        for item in source_data["order_item"]:
            order_id = item["Order_ID"]

            items_by_order.setdefault(
                order_id, []
            ).append({
                "order_item_id": item["Order_Item_ID"],
                "menu_id": item["Menu_ID"],
                "quantity": item["Quantity"],
                "unit_price": convert_value(
                    item["Unit_Price"]
                )
            })

        # Customers - exclude password hashes
        customers = []

        for row in source_data["customer"]:
            customers.append({
                "_id": row["Customer_ID"],
                "customer_id": row["Customer_ID"],
                "name": row["Name"],
                "email": row["Email"],
                "phone": row["Phone"],
                "address": row["Address"],
                "city": row["City"],
                "pincode": row["Pincode"],
                "role": row["Role"]
            })

        # Restaurants
        restaurants = []

        for row in source_data["restaurant"]:
            restaurants.append({
                "_id": row["Restaurant_ID"],
                "restaurant_id": row["Restaurant_ID"],
                "restaurant_name": row["Restaurant_Name"],
                "description": row["Description"],
                "phone": row["Phone"],
                "address": row["Address"],
                "city": row["City"],
                "rating": convert_value(row["Rating"]),
                "status": row["Status"],
                "image_url": row["Image_URL"]
            })

        # Menu items
        menu_items = []

        for row in source_data["menu"]:
            menu_items.append({
                "_id": row["Menu_ID"],
                "menu_id": row["Menu_ID"],
                "restaurant_id": row["Restaurant_ID"],
                "item_name": row["Item_Name"],
                "description": row["Description"],
                "price": convert_value(row["Price"]),
                "category": row["Category"],
                "availability": bool(row["Availability"]),
                "image_url": row["Image_URL"]
            })

        # Orders with embedded items
        orders = []

        for row in source_data["orders"]:
            order_id = row["Order_ID"]

            orders.append({
                "_id": order_id,
                "order_id": order_id,
                "customer_id": row["Customer_ID"],
                "order_date": row["Order_Date"],
                "total_amount": convert_value(
                    row["Total_Amount"]
                ),
                "delivery_address": row["Delivery_Address"],
                "city": row["City"],
                "pincode": row["Pincode"],
                "order_status": row["Order_Status"],
                "payment_method": row["Payment_Method"],
                "payment_status": row["Payment_Status"],
                "razorpay_order_id": row["Razorpay_Order_ID"],
                "razorpay_payment_id": row["Razorpay_Payment_ID"],
                "items": items_by_order.get(order_id, [])
            })

        # Reviews
        reviews = []

        for row in source_data["review"]:
            reviews.append({
                "_id": row["Review_ID"],
                "review_id": row["Review_ID"],
                "customer_id": row["Customer_ID"],
                "restaurant_id": row["Restaurant_ID"],
                "order_id": row["Order_ID"],
                "rating": row["Rating"],
                "comments": row["Comments"],
                "review_date": row["Review_Date"]
            })

        documents = {
            "customers": customers,
            "restaurants": restaurants,
            "menu_items": menu_items,
            "orders": orders,
            "reviews": reviews
        }

        print("\nMIGRATION PREVIEW")
        print("-----------------")

        for name, records in documents.items():
            print(f"{name}: {len(records)} documents")

        if not args.apply:
            print("\nDRY RUN COMPLETE.")
            print("No MongoDB documents were modified.")
            print("Use --apply after checking the counts.")
            return

        # Indexes
        mongo_database["customers"].create_index(
            "email", unique=True
        )

        mongo_database["reviews"].create_index(
            [
                ("customer_id", 1),
                ("restaurant_id", 1),
                ("order_id", 1)
            ],
            unique=True
        )

        # Upsert records
        print("\nMigrating records...")

        for name, records in documents.items():
            collection = mongo_database[name]

            for document in records:
                collection.replace_one(
                    {"_id": document["_id"]},
                    document,
                    upsert=True
                )

            print(f"{name}: {len(records)} processed")

        print("\nMIGRATION COMPLETED!")

        print("\nMongoDB collection counts:")

        for name in documents:
            count = mongo_database[name].count_documents({})
            print(f"{name}: {count}")

    finally:
        if mysql_connection is not None:
            mysql_connection.close()

        close_mongodb()


if __name__ == "__main__":
    migrate()
