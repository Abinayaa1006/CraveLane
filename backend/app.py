import os
import razorpay
from dotenv import load_dotenv

load_dotenv()
import smtplib
from email.message import EmailMessage
from decimal import Decimal
from functools import wraps

from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired

from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash


from database.mysql_db import get_connection


app = Flask(__name__)

CORS(
    app,
    origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://cravelane.vercel.app"
    ],
    supports_credentials=True
)

app.config["SECRET_KEY"] = os.environ.get(
    "CRAVELANE_SECRET_KEY"
)

if not app.config["SECRET_KEY"]:
    raise RuntimeError(
        "CRAVELANE_SECRET_KEY is missing. Check your Backend/.env file."
    )

token_serializer = URLSafeTimedSerializer(
    app.config["SECRET_KEY"],
    salt="cravelane-auth"
)

# Separate serializer for password-reset links.
reset_serializer = URLSafeTimedSerializer(
    app.config["SECRET_KEY"],
    salt="cravelane-password-reset"
)

# Razorpay credentials are kept on the Flask server only.
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")
razorpay_client = (
    razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
    if RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET else None
)
# =====================================================
# TOKEN AUTHENTICATION
# =====================================================

def get_logged_in_user():

    auth_header = request.headers.get("Authorization", "")

    if not auth_header.startswith("Bearer "):
        return None

    token = auth_header.split(" ", 1)[1].strip()

    if not token:
        return None

    try:
        user_data = token_serializer.loads(
            token,
            max_age=8 * 60 * 60  # Token expires after 8 hours
        )

        return user_data

    except (BadSignature, SignatureExpired):
        return None


# =====================================================
# REQUIRE LOGIN
# =====================================================

def require_auth(function):

    @wraps(function)
    def wrapper(*args, **kwargs):

        user = get_logged_in_user()

        if not user:
            return jsonify({
                "message": "Authentication required. Please log in again."
            }), 401

        request.current_user = user

        return function(*args, **kwargs)

    return wrapper


# =====================================================
# REQUIRE ADMIN
# =====================================================

def require_admin(function):

    @wraps(function)
    def wrapper(*args, **kwargs):

        user = get_logged_in_user()

        if not user:
            return jsonify({
                "message": "Authentication required. Please log in again."
            }), 401

        if user.get("role") != "admin":
            return jsonify({
                "message": "Access denied. Admin privileges required."
            }), 403

        request.current_user = user

        return function(*args, **kwargs)

    return wrapper

# =====================================================
# BREVO EMAIL CONFIGURATION
# =====================================================

def send_reset_email(recipient_email, reset_link):
    smtp_server = os.getenv("MAIL_SERVER")
    smtp_port = int(os.getenv("MAIL_PORT", "587"))
    smtp_username = os.getenv("MAIL_USERNAME")
    smtp_password = os.getenv("MAIL_PASSWORD")
    sender_email = os.getenv("MAIL_DEFAULT_SENDER")

    if not all([smtp_server, smtp_username, smtp_password, sender_email]):
        raise RuntimeError("Brevo SMTP configuration is incomplete.")

    message = EmailMessage()
    message["Subject"] = "CraveLane - Password Reset"
    message["From"] = sender_email
    message["To"] = recipient_email
    message.set_content(f"""
Hello,

We received a request to reset your CraveLane account password.

Click the link below to create a new password:

{reset_link}

This link expires in 15 minutes.

If you did not request a password reset, please ignore this email.

Regards,
CraveLane Team
""")

    with smtplib.SMTP(smtp_server, smtp_port, timeout=20) as server:
        server.starttls()
        server.login(smtp_username, smtp_password)
        server.send_message(message)


# --------------------------------------------------
# HOME / HEALTH CHECK
# --------------------------------------------------

@app.route("/", methods=["GET"])
def home():
    return "CraveLane Backend is running!"


# --------------------------------------------------
# REGISTER
# --------------------------------------------------

@app.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}

    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip()
    phone = (data.get("phone") or "").strip()
    password = data.get("password") or ""
    address = (data.get("address") or "").strip()
    city = (data.get("city") or "").strip()
    pincode = (data.get("pincode") or "").strip()

    if not name or not email or not password:
        return jsonify({
            "message": "Name, email and password are required."
        }), 400

    hashed_password = generate_password_hash(password)

    db = None
    cursor = None

    try:
        db = get_connection()
        cursor = db.cursor()

        cursor.execute(
            "SELECT Customer_ID FROM Customer WHERE Email = %s",
            (email,)
        )

        if cursor.fetchone():
            return jsonify({
                "message": "Email already registered."
            }), 409

        cursor.execute(
            """
            INSERT INTO Customer
                (Name, Email, Phone, Password, Address, City, Pincode)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (
                name, email, phone, hashed_password,
                address, city, pincode
            )
        )

        db.commit()

        return jsonify({
            "message": "Registration successful!"
        }), 201

    except Exception:
        if db:
            db.rollback()

        app.logger.exception("Registration failed")

        return jsonify({
            "message": "Registration failed. Please try again."
        }), 500

    finally:
        if cursor:
            cursor.close()
        if db:
            db.close()


# --------------------------------------------------
# LOGIN
# --------------------------------------------------

@app.route("/login", methods=["POST"])
def login():

    data = request.get_json(silent=True) or {}

    email = (data.get("email") or "").strip()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({
            "message": "Email and password are required."
        }), 400

    db = None
    cursor = None

    try:

        db = get_connection()
        cursor = db.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT Customer_ID, Name, Email, Password, Role
            FROM customer
            WHERE Email = %s
            """,
            (email,)
        )

        customer = cursor.fetchone()

        if not customer or not check_password_hash(
            customer["Password"], password
        ):
            return jsonify({
                "message": "Invalid email or password."
            }), 401

        # Generate signed authentication token.
        token = token_serializer.dumps({
            "customer_id": customer["Customer_ID"],
            "role": customer["Role"]
        })

        return jsonify({
            "message": f"Welcome, {customer['Name']}!",
            "name": customer["Name"],
            "customer_id": customer["Customer_ID"],
            "email": customer["Email"],
            "role": customer["Role"],
            "token": token
        }), 200

    except Exception:

        app.logger.exception("Login failed")

        return jsonify({
            "message": "Login failed. Please try again."
        }), 500

    finally:

        if cursor:
            cursor.close()

        if db:
            db.close()

# =====================================================
# FORGOT PASSWORD
# POST /forgot-password
# =====================================================

@app.route("/forgot-password", methods=["POST"])
def forgot_password():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip()

    if not email:
        return jsonify({"message": "Please enter your email address."}), 400

    db = None
    cursor = None

    try:
        db = get_connection()
        cursor = db.cursor(dictionary=True)
        cursor.execute(
            "SELECT Customer_ID, Email FROM Customer WHERE Email = %s",
            (email,)
        )
        customer = cursor.fetchone()

        # Use the same response for existing and non-existing accounts.
        if customer:
            reset_token = reset_serializer.dumps({
                "customer_id": customer["Customer_ID"],
                "email": customer["Email"]
            })

            frontend_url = os.getenv(
                "FRONTEND_URL", "http://localhost:5173"
            ).rstrip("/")
            reset_link = f"{frontend_url}/reset-password/{reset_token}"

            try:
                send_reset_email(customer["Email"], reset_link)
            except Exception:
                app.logger.exception("Could not send password reset email")
                return jsonify({
                    "message": "Unable to send the reset email right now. Please try again later."
                }), 500

        return jsonify({
            "message": (
                "If an account exists with this email, "
                "a password reset link has been sent."
            )
        }), 200

    except Exception:
        app.logger.exception("Forgot password request failed")
        return jsonify({
            "message": "Could not process your request. Please try again."
        }), 500

    finally:
        if cursor:
            cursor.close()
        if db:
            db.close()


# =====================================================
# RESET PASSWORD
# POST /reset-password/<token>
# =====================================================

@app.route("/reset-password/<token>", methods=["POST"])
def reset_password(token):
    data = request.get_json(silent=True) or {}
    new_password = data.get("password") or ""

    if not isinstance(new_password, str) or len(new_password) < 8:
        return jsonify({
            "message": "Password must contain at least 8 characters."
        }), 400

    try:
        reset_data = reset_serializer.loads(token, max_age=15 * 60)
    except SignatureExpired:
        return jsonify({
            "message": "Your reset link has expired. Please request a new one."
        }), 400
    except BadSignature:
        return jsonify({"message": "Invalid password reset link."}), 400

    customer_id = reset_data.get("customer_id")
    email = reset_data.get("email")

    if not customer_id or not email:
        return jsonify({"message": "Invalid password reset link."}), 400

    db = None
    cursor = None

    try:
        db = get_connection()
        cursor = db.cursor()
        cursor.execute(
            "SELECT Customer_ID FROM Customer WHERE Customer_ID = %s AND Email = %s",
            (customer_id, email)
        )

        if not cursor.fetchone():
            return jsonify({"message": "Customer account not found."}), 404

        hashed_password = generate_password_hash(new_password)
        cursor.execute(
            "UPDATE Customer SET Password = %s WHERE Customer_ID = %s",
            (hashed_password, customer_id)
        )
        db.commit()

        return jsonify({
            "message": "Your password has been reset successfully. Please log in."
        }), 200

    except Exception:
        if db:
            db.rollback()
        app.logger.exception("Password reset failed")
        return jsonify({
            "message": "Could not reset your password. Please try again."
        }), 500

    finally:
        if cursor:
            cursor.close()
        if db:
            db.close()


# --------------------------------------------------
# GET ALL RESTAURANTS
# --------------------------------------------------

@app.route("/restaurants", methods=["GET"])
def get_restaurants():
    db = None
    cursor = None

    try:
        db = get_connection()
        cursor = db.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT *
            FROM restaurant
            ORDER BY Restaurant_ID
            """
        )

        return jsonify(cursor.fetchall()), 200

    except Exception:
        app.logger.exception("Could not fetch restaurants")

        return jsonify({
            "message": "Failed to fetch restaurants."
        }), 500

    finally:
        if cursor:
            cursor.close()
        if db:
            db.close()


# --------------------------------------------------
# GET MENU FOR A PARTICULAR RESTAURANT
# --------------------------------------------------

@app.route("/restaurants/<int:restaurant_id>/menu", methods=["GET"])
def get_restaurant_menu(restaurant_id):
    db = None
    cursor = None

    try:
        db = get_connection()
        cursor = db.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT Restaurant_ID, Restaurant_Name, Image_URL
            FROM restaurant
            WHERE Restaurant_ID = %s
            """,
            (restaurant_id,)
        )

        restaurant = cursor.fetchone()

        if not restaurant:
            return jsonify({
                "message": "Restaurant not found."
            }), 404

        cursor.execute(
            """
            SELECT Menu_ID, Restaurant_ID, Item_Name,
                   Description, Price, Category, Availability, Image_URL
            FROM menu
            WHERE Restaurant_ID = %s
              AND Availability = TRUE
            ORDER BY Menu_ID
            """,
            (restaurant_id,)
        )

        return jsonify(cursor.fetchall()), 200

    except Exception:
        app.logger.exception("Could not fetch restaurant menu")

        return jsonify({
            "message": "Failed to fetch menu."
        }), 500

    finally:
        if cursor:
            cursor.close()
        if db:
            db.close()


# --------------------------------------------------
# GET CUSTOMER PROFILE
# --------------------------------------------------

@app.route("/profile/<int:customer_id>", methods=["GET"])
def get_profile(customer_id):
    db = None
    cursor = None

    try:
        db = get_connection()
        cursor = db.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT Customer_ID, Name, Email, Phone,
                   Address, City, Pincode
            FROM Customer
            WHERE Customer_ID = %s
            """,
            (customer_id,)
        )

        customer = cursor.fetchone()

        if not customer:
            return jsonify({
                "message": "Customer not found."
            }), 404

        return jsonify(customer), 200

    except Exception:
        app.logger.exception("Could not fetch customer profile")

        return jsonify({
            "message": "Could not load profile."
        }), 500

    finally:
        if cursor:
            cursor.close()
        if db:
            db.close()


# --------------------------------------------------
# UPDATE CUSTOMER PROFILE
# --------------------------------------------------

@app.route("/profile/<int:customer_id>", methods=["PUT"])
def update_profile(customer_id):
    data = request.get_json(silent=True) or {}

    name = (data.get("name") or "").strip()
    phone = (data.get("phone") or "").strip()
    address = (data.get("address") or "").strip()
    city = (data.get("city") or "").strip()
    pincode = (data.get("pincode") or "").strip()

    if not name:
        return jsonify({
            "message": "Name is required."
        }), 400

    db = None
    cursor = None

    try:
        db = get_connection()
        cursor = db.cursor()

        cursor.execute(
            """
            UPDATE Customer
            SET Name = %s,
                Phone = %s,
                Address = %s,
                City = %s,
                Pincode = %s
            WHERE Customer_ID = %s
            """,
            (name, phone, address, city, pincode, customer_id)
        )

        if cursor.rowcount == 0:
            cursor.execute(
                """
                SELECT Customer_ID
                FROM Customer
                WHERE Customer_ID = %s
                """,
                (customer_id,)
            )

            if not cursor.fetchone():
                return jsonify({
                    "message": "Customer not found."
                }), 404

        db.commit()

        return jsonify({
            "message": "Profile updated successfully."
        }), 200

    except Exception:
        if db:
            db.rollback()

        app.logger.exception("Could not update customer profile")

        return jsonify({
            "message": "Could not update profile."
        }), 500

    finally:
        if cursor:
            cursor.close()
        if db:
            db.close()


# --------------------------------------------------
# PLACE ORDER
# POST /orders
# --------------------------------------------------

@app.route("/orders", methods=["POST"])
def place_order():
    data = request.get_json(silent=True) or {}

    try:
        customer_id = int(data.get("customer_id"))
        if customer_id <= 0:
            raise ValueError
    except (TypeError, ValueError):
        return jsonify({
            "message": "A valid customer ID is required."
        }), 400

    address = (data.get("delivery_address") or "").strip()
    city = (data.get("city") or "").strip()
    pincode = (data.get("pincode") or "").strip()

    if not address or not city or not pincode:
        return jsonify({
            "message": "Delivery address, city and pincode are required."
        }), 400

    payment_method = data.get("payment_method")
    allowed_methods = {"Cash on Delivery"}

    if payment_method not in allowed_methods:
        return jsonify({
            "message": "Please select a valid payment method."
        }), 400

    items = data.get("items")

    if not isinstance(items, list) or not items:
        return jsonify({
            "message": "Your cart is empty."
        }), 400

    quantities = {}

    try:
        for item in items:
            if not isinstance(item, dict):
                raise ValueError

            menu_id = int(item.get("menu_id"))
            quantity = int(item.get("quantity"))

            if menu_id <= 0 or quantity <= 0:
                raise ValueError

            quantities[menu_id] = quantities.get(menu_id, 0) + quantity

            if quantities[menu_id] > 100:
                return jsonify({
                    "message": "Quantity cannot exceed 100 per item."
                }), 400

    except (TypeError, ValueError):
        return jsonify({
            "message": "Invalid menu item or quantity."
        }), 400

    db = None
    cursor = None

    try:
        db = get_connection()
        db.start_transaction()
        cursor = db.cursor(dictionary=True)

        cursor.execute(
            "SELECT Customer_ID FROM Customer WHERE Customer_ID = %s",
            (customer_id,)
        )

        if not cursor.fetchone():
            db.rollback()
            return jsonify({
                "message": "Customer not found. Please log in again."
            }), 404

        total_amount = Decimal("0.00")
        order_items = []

        for menu_id, quantity in sorted(quantities.items()):
            cursor.execute(
                """
                SELECT Menu_ID, Item_Name, Price, Availability
                FROM Menu
                WHERE Menu_ID = %s
                FOR UPDATE
                """,
                (menu_id,)
            )

            menu_item = cursor.fetchone()

            if not menu_item:
                db.rollback()
                return jsonify({
                    "message": f"Menu item {menu_id} was not found."
                }), 400

            if not menu_item["Availability"]:
                db.rollback()
                return jsonify({
                    "message": (
                        f"{menu_item['Item_Name']} is currently unavailable."
                    )
                }), 400

            unit_price = Decimal(str(menu_item["Price"]))
            total_amount += unit_price * quantity

            order_items.append({
                "menu_id": menu_id,
                "quantity": quantity,
                "unit_price": unit_price
            })

        payment_status = "Pending"

        cursor.execute(
            """
            INSERT INTO Orders (
                Customer_ID, Total_Amount, Delivery_Address,
                City, Pincode, Order_Status,
                Payment_Method, Payment_Status
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                customer_id,
                total_amount,
                address,
                city,
                pincode,
                "Pending",
                payment_method,
                payment_status
            )
        )

        order_id = cursor.lastrowid

        for item in order_items:
            cursor.execute(
                """
                INSERT INTO Order_Item (
                    Order_ID, Menu_ID, Quantity, Unit_Price
                )
                VALUES (%s, %s, %s, %s)
                """,
                (
                    order_id,
                    item["menu_id"],
                    item["quantity"],
                    item["unit_price"]
                )
            )

        db.commit()

        return jsonify({
            "message": "Order placed successfully!",
            "order_id": order_id,
            "total_amount": float(total_amount),
            "order_status": "Pending",
            "payment_method": payment_method,
            "payment_status": payment_status
        }), 201

    except Exception:
        if db:
            db.rollback()

        app.logger.exception("Could not place order")

        return jsonify({
            "message": "Could not place your order. Please try again."
        }), 500

    finally:
        if cursor:
            cursor.close()
        if db:
            db.close()



# =====================================================
# RAZORPAY UPI PAYMENT
# =====================================================

@app.route("/payments/razorpay/create-order", methods=["POST"])
def create_razorpay_order():
    if not razorpay_client:
        return jsonify({
            "message": "Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to Backend/.env."
        }), 500

    data = request.get_json(silent=True) or {}

    # UPI is intentionally not offered by CraveLane.
    selected_method = (data.get("payment_method") or "").strip()
    allowed_methods = {"Cards", "Net Banking", "Wallets"}
    if selected_method not in allowed_methods:
        return jsonify({"message": "Please select Cards, Net Banking, or Wallets."}), 400

    try:
        customer_id = int(data.get("customer_id"))
        if customer_id <= 0:
            raise ValueError
    except (TypeError, ValueError):
        return jsonify({"message": "A valid customer ID is required."}), 400

    address = (data.get("delivery_address") or "").strip()
    city = (data.get("city") or "").strip()
    pincode = (data.get("pincode") or "").strip()
    items = data.get("items")

    if not address or not city or not pincode:
        return jsonify({"message": "Delivery address, city and pincode are required."}), 400
    if not isinstance(items, list) or not items:
        return jsonify({"message": "Your cart is empty."}), 400

    quantities = {}
    try:
        for item in items:
            menu_id = int(item.get("menu_id"))
            quantity = int(item.get("quantity"))
            if menu_id <= 0 or quantity <= 0:
                raise ValueError
            quantities[menu_id] = quantities.get(menu_id, 0) + quantity
            if quantities[menu_id] > 100:
                return jsonify({"message": "Quantity cannot exceed 100 per item."}), 400
    except (TypeError, ValueError, AttributeError):
        return jsonify({"message": "Invalid menu item or quantity."}), 400

    db = None
    cursor = None
    try:
        db = get_connection()
        db.start_transaction()
        cursor = db.cursor(dictionary=True)

        cursor.execute(
            "SELECT Customer_ID, Name, Email, Phone FROM Customer WHERE Customer_ID = %s",
            (customer_id,)
        )
        customer = cursor.fetchone()
        if not customer:
            db.rollback()
            return jsonify({"message": "Customer not found. Please log in again."}), 404

        total_amount = Decimal("0.00")
        order_items = []
        for menu_id, quantity in sorted(quantities.items()):
            cursor.execute(
                """
                SELECT Menu_ID, Item_Name, Price, Availability
                FROM Menu WHERE Menu_ID = %s FOR UPDATE
                """,
                (menu_id,)
            )
            menu_item = cursor.fetchone()
            if not menu_item or not menu_item["Availability"]:
                db.rollback()
                return jsonify({
                    "message": f"Menu item {menu_id} is unavailable or was not found."
                }), 400

            unit_price = Decimal(str(menu_item["Price"]))
            total_amount += unit_price * quantity
            order_items.append({
                "menu_id": menu_id,
                "quantity": quantity,
                "unit_price": unit_price
            })

        amount_paise = int((total_amount * 100).quantize(Decimal("1")))
        if amount_paise <= 0:
            db.rollback()
            return jsonify({"message": "The payment amount must be greater than zero."}), 400

        # Create the gateway order from the server-calculated database amount.
        gateway_order = razorpay_client.order.create(data={
            "amount": amount_paise,
            "currency": "INR",
            "receipt": f"cravelane_{customer_id}_{os.urandom(4).hex()}",
            "notes": {"customer_id": str(customer_id)}
        })

        cursor.execute(
            """
            INSERT INTO Orders (
                Customer_ID, Total_Amount, Delivery_Address,
                City, Pincode, Order_Status, Payment_Method, Payment_Status,
                Razorpay_Order_ID
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                customer_id, total_amount, address, city, pincode,
                "Pending", f"{selected_method} (Razorpay)", "Pending", gateway_order["id"]
            )
        )
        internal_order_id = cursor.lastrowid

        for item in order_items:
            cursor.execute(
                """
                INSERT INTO Order_Item (Order_ID, Menu_ID, Quantity, Unit_Price)
                VALUES (%s, %s, %s, %s)
                """,
                (internal_order_id, item["menu_id"], item["quantity"], item["unit_price"])
            )

        db.commit()

        contact = (customer.get("Phone") or "").strip()
        if contact and not contact.startswith("+"):
            contact = "+91" + contact

        return jsonify({
            "order_id": internal_order_id,
            "razorpay_order_id": gateway_order["id"],
            "key_id": RAZORPAY_KEY_ID,
            "amount": amount_paise,
            "currency": "INR",
            "prefill": {
                "name": customer.get("Name") or "",
                "email": customer.get("Email") or "",
                "contact": contact
            }
        }), 201

    except Exception:
        if db:
            db.rollback()
        app.logger.exception("Could not create Razorpay order")
        return jsonify({"message": f"Could not start {selected_method} payment. Check the Flask terminal for details."}), 500
    finally:
        if cursor:
            cursor.close()
        if db:
            db.close()


@app.route("/payments/razorpay/verify", methods=["POST"])
def verify_razorpay_payment():
    if not razorpay_client:
        return jsonify({"message": "Razorpay is not configured on the server."}), 500

    data = request.get_json(silent=True) or {}
    try:
        internal_order_id = int(data.get("order_id"))
        customer_id = int(data.get("customer_id"))
    except (TypeError, ValueError):
        return jsonify({"message": "Invalid order details."}), 400

    razorpay_order_id = (data.get("razorpay_order_id") or "").strip()
    payment_id = (data.get("razorpay_payment_id") or "").strip()
    signature = (data.get("razorpay_signature") or "").strip()

    if not all([razorpay_order_id, payment_id, signature]):
        return jsonify({"message": "Incomplete Razorpay payment response."}), 400

    db = None
    cursor = None
    try:
        db = get_connection()
        cursor = db.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT Order_ID, Customer_ID, Total_Amount, Payment_Status, Razorpay_Order_ID, Payment_Method
            FROM Orders
            WHERE Order_ID = %s AND Customer_ID = %s
            """,
            (internal_order_id, customer_id)
        )
        order = cursor.fetchone()

        if not order:
            return jsonify({"message": "CraveLane order not found."}), 404
        if order["Razorpay_Order_ID"] != razorpay_order_id:
            return jsonify({"message": "Razorpay order does not match this CraveLane order."}), 400
        if order["Payment_Status"] == "Paid":
            return jsonify({
                "order_id": internal_order_id,
                "total_amount": float(order["Total_Amount"]),
                "order_status": "Pending",
                "payment_method": order["Payment_Method"],
                "payment_status": "Paid"
            }), 200

        razorpay_client.utility.verify_payment_signature({
            "razorpay_order_id": razorpay_order_id,
            "razorpay_payment_id": payment_id,
            "razorpay_signature": signature
        })

        # A valid signature alone is not enough: require captured payment before marking paid.
        payment = razorpay_client.payment.fetch(payment_id)
        if payment.get("order_id") != razorpay_order_id:
            return jsonify({"message": "Payment does not belong to this Razorpay order."}), 400
        if int(payment.get("amount", 0)) != int((Decimal(str(order["Total_Amount"])) * 100).quantize(Decimal("1"))):
            return jsonify({"message": "Payment amount does not match the CraveLane order."}), 400
        if payment.get("currency") != "INR":
            return jsonify({"message": "Unexpected payment currency."}), 400
        if payment.get("status") != "captured":
            return jsonify({
                "message": "Payment is authorised but not yet captured. Please wait for confirmation."
            }), 409

        cursor.execute(
            """
            UPDATE Orders
            SET Payment_Status = 'Paid',
                Razorpay_Payment_ID = %s
            WHERE Order_ID = %s AND Customer_ID = %s
            """,
            (payment_id, internal_order_id, customer_id)
        )
        db.commit()

        return jsonify({
            "message": "Payment verified and order confirmed.",
            "order_id": internal_order_id,
            "total_amount": float(order["Total_Amount"]),
            "order_status": "Pending",
            "payment_method": order["Payment_Method"],
            "payment_status": "Paid"
        }), 200

    except razorpay.errors.SignatureVerificationError:
        return jsonify({"message": "Razorpay payment signature verification failed."}), 400
    except Exception:
        if db:
            db.rollback()
        app.logger.exception("Razorpay payment verification failed")
        return jsonify({"message": "Could not verify payment. Contact support if money was deducted."}), 500
    finally:
        if cursor:
            cursor.close()
        if db:
            db.close()



# --------------------------------------------------
# GET ALL ORDERS FOR A CUSTOMER
# GET /orders/customer/<customer_id>
# --------------------------------------------------

# Replace the existing GET /orders/customer/<customer_id> route with this version.
# The important changes are:
# 1. Select m.Image_URL AS image_url from the Menu table.
# 2. Include image_url in every order item's JSON object.

@app.route("/orders/customer/<int:customer_id>", methods=["GET"])
def get_customer_orders(customer_id):
    db = None
    cursor = None

    try:
        db = get_connection()
        cursor = db.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT
                o.Order_ID,
                o.Customer_ID,
                o.Total_Amount,
                o.Delivery_Address,
                o.City,
                o.Pincode,
                o.Order_Status,
                o.Payment_Method,
                o.Payment_Status,
                r.Restaurant_Name,
                oi.Menu_ID,
                m.Item_Name,
                m.Image_URL AS image_url,
                oi.Quantity,
                oi.Unit_Price
            FROM Orders o
            LEFT JOIN Order_Item oi
                ON o.Order_ID = oi.Order_ID
            LEFT JOIN Menu m
                ON oi.Menu_ID = m.Menu_ID
            LEFT JOIN Restaurant r
                ON m.Restaurant_ID = r.Restaurant_ID
            WHERE o.Customer_ID = %s
            ORDER BY o.Order_ID DESC
            """,
            (customer_id,)
        )

        rows = cursor.fetchall()
        orders_by_id = {}

        for row in rows:
            order_id = row["Order_ID"]

            if order_id not in orders_by_id:
                orders_by_id[order_id] = {
                    "order_id": order_id,
                    "customer_id": row["Customer_ID"],
                    "total_amount": float(row["Total_Amount"] or 0),
                    "delivery_address": row["Delivery_Address"],
                    "city": row["City"],
                    "pincode": row["Pincode"],
                    "order_status": row["Order_Status"],
                    "payment_method": row["Payment_Method"],
                    "payment_status": row["Payment_Status"],
                    "restaurant_names": [],
                    "items": []
                }

            order = orders_by_id[order_id]
            restaurant_name = row["Restaurant_Name"]

            if restaurant_name and restaurant_name not in order["restaurant_names"]:
                order["restaurant_names"].append(restaurant_name)

            if row["Menu_ID"] is not None:
                order["items"].append({
                    "menu_id": row["Menu_ID"],
                    "item_name": row["Item_Name"],
                    "image_url": row["image_url"],
                    "quantity": row["Quantity"],
                    "unit_price": float(row["Unit_Price"] or 0)
                })

        orders = list(orders_by_id.values())

        for order in orders:
            order["restaurant_name"] = ", ".join(
                order["restaurant_names"]
            ) or "Restaurant unavailable"

        return jsonify({
            "count": len(orders),
            "orders": orders
        }), 200

    except Exception:
        app.logger.exception("Could not fetch customer orders")
        return jsonify({
            "message": "Could not fetch your orders."
        }), 500

    finally:
        if cursor:
            cursor.close()
        if db:
            db.close()


# --------------------------------------------------
# GET ORDER STATUS
# GET /orders/<order_id>/status
# --------------------------------------------------

@app.route("/orders/<int:order_id>/status", methods=["GET"])
def get_order_status(order_id):
    db = None
    cursor = None

    try:
        db = get_connection()
        cursor = db.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT Order_ID, Order_Status
            FROM Orders
            WHERE Order_ID = %s
            """,
            (order_id,)
        )

        order = cursor.fetchone()

        if not order:
            return jsonify({
                "message": "Order not found."
            }), 404

        return jsonify({
            "order_id": order["Order_ID"],
            "order_status": order["Order_Status"]
        }), 200

    except Exception:
        app.logger.exception("Could not fetch order status")

        return jsonify({
            "message": "Could not fetch order status."
        }), 500

    finally:
        if cursor:
            cursor.close()
        if db:
            db.close()


# --------------------------------------------------
# UPDATE ORDER STATUS
# PUT /orders/<order_id>/status
#
# For local development/testing.
# Restrict this endpoint to authorized staff before deployment.
# --------------------------------------------------

VALID_ORDER_STATUSES = {
    "Pending",
    "Preparing",
    "Out for Delivery",
    "Delivered",
    "Cancelled"
}


@app.route("/orders/<int:order_id>/status", methods=["PUT"])
@require_admin
def update_order_status(order_id):
    data = request.get_json(silent=True) or {}
    new_status = data.get("order_status")

    if not isinstance(new_status, str):
        return jsonify({
            "message": "An order status is required.",
            "valid_statuses": sorted(VALID_ORDER_STATUSES)
        }), 400

    new_status = new_status.strip()

    if new_status not in VALID_ORDER_STATUSES:
        return jsonify({
            "message": "Invalid order status.",
            "valid_statuses": sorted(VALID_ORDER_STATUSES)
        }), 400

    db = None
    cursor = None

    try:
        db = get_connection()
        cursor = db.cursor()

        cursor.execute(
            "SELECT Order_ID FROM Orders WHERE Order_ID = %s",
            (order_id,)
        )

        if not cursor.fetchone():
            return jsonify({
                "message": "Order not found."
            }), 404

        cursor.execute(
            """
            UPDATE Orders
            SET Order_Status = %s
            WHERE Order_ID = %s
            """,
            (new_status, order_id)
        )

        db.commit()

        return jsonify({
            "message": "Order status updated successfully.",
            "order_id": order_id,
            "order_status": new_status
        }), 200

    except Exception:
        if db:
            db.rollback()

        app.logger.exception("Could not update order status")

        return jsonify({
            "message": "Could not update order status."
        }), 500

    finally:
        if cursor:
            cursor.close()
        if db:
            db.close()


# =====================================================
# ADMIN DASHBOARD STATISTICS
# =====================================================

@app.route("/admin/dashboard/stats", methods=["GET"])
@require_admin
def admin_dashboard_stats():

    db = None
    cursor = None

    try:

        db = get_connection()
        cursor = db.cursor(dictionary=True)

        # Total orders
        cursor.execute("""
            SELECT COUNT(*) AS total_orders
            FROM Orders
        """)

        order_result = cursor.fetchone()


        # Revenue from orders that are not cancelled
        cursor.execute("""
            SELECT COALESCE(
                SUM(
                    CASE
                        WHEN Order_Status != 'Cancelled'
                        THEN Total_Amount
                        ELSE 0
                    END
                ), 0
            ) AS total_revenue
            FROM Orders
        """)

        revenue_result = cursor.fetchone()


        # Registered customers (excluding admin accounts)
        cursor.execute("""
            SELECT COUNT(*) AS total_customers
            FROM Customer
            WHERE Role = 'customer'
        """)

        customer_result = cursor.fetchone()


        # Total restaurants
        cursor.execute("""
            SELECT COUNT(*) AS total_restaurants
            FROM Restaurant
        """)

        restaurant_result = cursor.fetchone()


        return jsonify({

            "total_orders": order_result["total_orders"],

            "total_revenue": float(
                revenue_result["total_revenue"] or 0
            ),

            "total_customers": customer_result["total_customers"],

            "total_restaurants": restaurant_result["total_restaurants"]

        }), 200


    except Exception:

        app.logger.exception(
            "Admin dashboard statistics failed"
        )

        return jsonify({
            "message": "Could not load dashboard statistics."
        }), 500


    finally:

        if cursor:
            cursor.close()

        if db:
            db.close()


# =====================================================
# ADMIN RESTAURANT AND MENU MANAGEMENT
# All endpoints below require an authenticated admin.
# =====================================================

@app.route("/admin/restaurants", methods=["GET"])
@require_admin
def admin_get_restaurants():
    db = None
    cursor = None

    try:
        db = get_connection()
        cursor = db.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT
                r.Restaurant_ID AS restaurant_id,
                r.Restaurant_Name AS restaurant_name,
                r.Description AS description,
                r.Phone AS phone,
                r.Address AS address,
                r.City AS city,
                r.Rating AS rating,
                r.Status AS status,
                r.Image_URL AS image_url,
                COUNT(m.Menu_ID) AS total_menu_items
            FROM Restaurant r
            LEFT JOIN Menu m ON m.Restaurant_ID = r.Restaurant_ID
            GROUP BY
                r.Restaurant_ID, r.Restaurant_Name, r.Description,
                r.Phone, r.Address, r.City, r.Rating, r.Status, r.Image_URL
            ORDER BY r.Restaurant_ID DESC
            """
        )
        restaurants = cursor.fetchall()
        for restaurant in restaurants:
            if restaurant.get("rating") is not None:
                restaurant["rating"] = float(restaurant["rating"])
            restaurant["total_menu_items"] = int(restaurant["total_menu_items"] or 0)

        return jsonify({"restaurants": restaurants}), 200

    except Exception:
        app.logger.exception("Admin could not fetch restaurants")
        return jsonify({"message": "Could not load restaurants."}), 500

    finally:
        if cursor:
            cursor.close()
        if db:
            db.close()


@app.route("/admin/restaurants", methods=["POST"])
@require_admin
def admin_create_restaurant():
    data = request.get_json(silent=True) or {}
    restaurant_name = (data.get("restaurant_name") or "").strip()

    if not restaurant_name:
        return jsonify({"message": "Restaurant name is required."}), 400
    if len(restaurant_name) > 100:
        return jsonify({"message": "Restaurant name cannot exceed 100 characters."}), 400

    image_url = (data.get("image_url") or "").strip() or None
    if image_url and len(image_url) > 500:
        return jsonify({"message": "Restaurant image URL cannot exceed 500 characters."}), 400

    db = None
    cursor = None
    try:
        db = get_connection()
        cursor = db.cursor()
        cursor.execute(
            """
            INSERT INTO Restaurant
                (Restaurant_Name, Description, Phone, Address, City,
                 Rating, Status, Image_URL)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                restaurant_name,
                (data.get("description") or "").strip() or None,
                (data.get("phone") or "").strip() or None,
                (data.get("address") or "").strip() or None,
                (data.get("city") or "").strip() or None,
                0.0,
                (data.get("status") or "Open").strip(),
                image_url
            )
        )
        restaurant_id = cursor.lastrowid
        db.commit()
        return jsonify({
            "message": "Restaurant added successfully.",
            "restaurant_id": restaurant_id
        }), 201

    except Exception:
        if db:
            db.rollback()
        app.logger.exception("Admin could not create restaurant")
        return jsonify({"message": "Could not add restaurant."}), 500

    finally:
        if cursor:
            cursor.close()
        if db:
            db.close()


@app.route("/admin/restaurants/<int:restaurant_id>", methods=["PUT"])
@require_admin
def admin_update_restaurant(restaurant_id):
    data = request.get_json(silent=True) or {}
    restaurant_name = (data.get("restaurant_name") or "").strip()

    if not restaurant_name:
        return jsonify({"message": "Restaurant name is required."}), 400
    if len(restaurant_name) > 100:
        return jsonify({"message": "Restaurant name cannot exceed 100 characters."}), 400

    image_url = (data.get("image_url") or "").strip() or None
    if image_url and len(image_url) > 500:
        return jsonify({"message": "Restaurant image URL cannot exceed 500 characters."}), 400

    db = None
    cursor = None
    try:
        db = get_connection()
        cursor = db.cursor()
        cursor.execute(
            """
            UPDATE Restaurant
            SET Restaurant_Name = %s,
                Description = %s,
                Phone = %s,
                Address = %s,
                City = %s,
                Status = %s,
                Image_URL = %s
            WHERE Restaurant_ID = %s
            """,
            (
                restaurant_name,
                (data.get("description") or "").strip() or None,
                (data.get("phone") or "").strip() or None,
                (data.get("address") or "").strip() or None,
                (data.get("city") or "").strip() or None,
                (data.get("status") or "Open").strip(),
                image_url,
                restaurant_id
            )
        )
        if cursor.rowcount == 0:
            cursor.execute("SELECT Restaurant_ID FROM Restaurant WHERE Restaurant_ID = %s", (restaurant_id,))
            if not cursor.fetchone():
                return jsonify({"message": "Restaurant not found."}), 404
        db.commit()
        return jsonify({"message": "Restaurant updated successfully."}), 200

    except Exception:
        if db:
            db.rollback()
        app.logger.exception("Admin could not update restaurant")
        return jsonify({"message": "Could not update restaurant."}), 500

    finally:
        if cursor:
            cursor.close()
        if db:
            db.close()


@app.route("/admin/restaurants/<int:restaurant_id>", methods=["DELETE"])
@require_admin
def admin_delete_restaurant(restaurant_id):
    db = None
    cursor = None
    try:
        db = get_connection()
        cursor = db.cursor()
        cursor.execute("DELETE FROM Restaurant WHERE Restaurant_ID = %s", (restaurant_id,))
        if cursor.rowcount == 0:
            return jsonify({"message": "Restaurant not found."}), 404
        db.commit()
        return jsonify({"message": "Restaurant deleted successfully."}), 200

    except Exception as exc:
        if db:
            db.rollback()
        app.logger.exception("Admin could not delete restaurant")
        # A restaurant may be referenced by menu rows; do not cascade-delete customer/order data.
        if getattr(exc, "errno", None) == 1451:
            return jsonify({
                "message": "This restaurant cannot be deleted because it has menu items or related records. Remove or reassign those records first."
            }), 409
        return jsonify({"message": "Could not delete restaurant."}), 500

    finally:
        if cursor:
            cursor.close()
        if db:
            db.close()


@app.route("/admin/restaurants/<int:restaurant_id>/menu", methods=["GET"])
@require_admin
def admin_get_restaurant_menu(restaurant_id):
    db = None
    cursor = None
    try:
        db = get_connection()
        cursor = db.cursor(dictionary=True)
        cursor.execute("SELECT Restaurant_ID FROM Restaurant WHERE Restaurant_ID = %s", (restaurant_id,))
        if not cursor.fetchone():
            return jsonify({"message": "Restaurant not found."}), 404

        cursor.execute(
            """
            SELECT Menu_ID AS menu_id,
                   Restaurant_ID AS restaurant_id,
                   Item_Name AS item_name,
                   Description AS description,
                   Price AS price,
                   Category AS category,
                   Availability AS availability,
                   Image_URL AS image_url
            FROM Menu
            WHERE Restaurant_ID = %s
            ORDER BY Menu_ID DESC
            """,
            (restaurant_id,)
        )
        menu_items = cursor.fetchall()
        for item in menu_items:
            item["price"] = float(item["price"] or 0)
            item["availability"] = bool(item["availability"])
        return jsonify({"menu_items": menu_items}), 200

    except Exception:
        app.logger.exception("Admin could not fetch restaurant menu")
        return jsonify({"message": "Could not load restaurant menu."}), 500

    finally:
        if cursor:
            cursor.close()
        if db:
            db.close()


@app.route("/admin/restaurants/<int:restaurant_id>/menu", methods=["POST"])
@require_admin
def admin_create_menu_item(restaurant_id):
    data = request.get_json(silent=True) or {}
    item_name = (data.get("item_name") or "").strip()

    if not item_name:
        return jsonify({"message": "Menu item name is required."}), 400
    if len(item_name) > 100:
        return jsonify({"message": "Menu item name cannot exceed 100 characters."}), 400

    try:
        price = Decimal(str(data.get("price")))
        if not price.is_finite() or price <= 0 or price > Decimal("99999999.99"):
            raise ValueError
    except Exception:
        return jsonify({"message": "Enter a valid menu item price."}), 400

    image_url = (data.get("image_url") or "").strip() or None
    if image_url and len(image_url) > 500:
        return jsonify({"message": "Food image URL cannot exceed 500 characters."}), 400

    db = None
    cursor = None
    try:
        db = get_connection()
        cursor = db.cursor()
        cursor.execute("SELECT Restaurant_ID FROM Restaurant WHERE Restaurant_ID = %s", (restaurant_id,))
        if not cursor.fetchone():
            return jsonify({"message": "Restaurant not found."}), 404

        cursor.execute(
            """
            INSERT INTO Menu
                (Restaurant_ID, Item_Name, Description, Price,
                 Category, Availability, Image_URL)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (
                restaurant_id,
                item_name,
                (data.get("description") or "").strip() or None,
                price,
                (data.get("category") or "").strip() or None,
                bool(data.get("availability", True)),
                image_url
            )
        )
        menu_id = cursor.lastrowid
        db.commit()
        return jsonify({"message": "Menu item added successfully.", "menu_id": menu_id}), 201

    except Exception:
        if db:
            db.rollback()
        app.logger.exception("Admin could not create menu item")
        return jsonify({"message": "Could not add menu item."}), 500

    finally:
        if cursor:
            cursor.close()
        if db:
            db.close()


@app.route("/admin/menu/<int:menu_id>", methods=["PUT"])
@require_admin
def admin_update_menu_item(menu_id):
    data = request.get_json(silent=True) or {}
    item_name = (data.get("item_name") or "").strip()

    if not item_name:
        return jsonify({"message": "Menu item name is required."}), 400
    if len(item_name) > 100:
        return jsonify({"message": "Menu item name cannot exceed 100 characters."}), 400

    try:
        price = Decimal(str(data.get("price")))
        if not price.is_finite() or price <= 0 or price > Decimal("99999999.99"):
            raise ValueError
    except Exception:
        return jsonify({"message": "Enter a valid menu item price."}), 400

    image_url = (data.get("image_url") or "").strip() or None
    if image_url and len(image_url) > 500:
        return jsonify({"message": "Food image URL cannot exceed 500 characters."}), 400

    db = None
    cursor = None
    try:
        db = get_connection()
        cursor = db.cursor()
        cursor.execute(
            """
            UPDATE Menu
            SET Item_Name = %s,
                Description = %s,
                Price = %s,
                Category = %s,
                Availability = %s,
                Image_URL = %s
            WHERE Menu_ID = %s
            """,
            (
                item_name,
                (data.get("description") or "").strip() or None,
                price,
                (data.get("category") or "").strip() or None,
                bool(data.get("availability", True)),
                image_url,
                menu_id
            )
        )
        if cursor.rowcount == 0:
            cursor.execute("SELECT Menu_ID FROM Menu WHERE Menu_ID = %s", (menu_id,))
            if not cursor.fetchone():
                return jsonify({"message": "Menu item not found."}), 404
        db.commit()
        return jsonify({"message": "Menu item updated successfully."}), 200

    except Exception:
        if db:
            db.rollback()
        app.logger.exception("Admin could not update menu item")
        return jsonify({"message": "Could not update menu item."}), 500

    finally:
        if cursor:
            cursor.close()
        if db:
            db.close()


@app.route("/admin/menu/<int:menu_id>", methods=["DELETE"])
@require_admin
def admin_delete_menu_item(menu_id):
    db = None
    cursor = None
    try:
        db = get_connection()
        cursor = db.cursor()
        cursor.execute("DELETE FROM Menu WHERE Menu_ID = %s", (menu_id,))
        if cursor.rowcount == 0:
            return jsonify({"message": "Menu item not found."}), 404
        db.commit()
        return jsonify({"message": "Menu item deleted successfully."}), 200

    except Exception as exc:
        if db:
            db.rollback()
        app.logger.exception("Admin could not delete menu item")
        if getattr(exc, "errno", None) == 1451:
            return jsonify({
                "message": "This menu item is linked to an existing order and cannot be deleted."
            }), 409
        return jsonify({"message": "Could not delete menu item."}), 500

    finally:
        if cursor:
            cursor.close()
        if db:
            db.close()




# =====================================================
# ADMIN CUSTOMER MANAGEMENT
# GET /admin/customers
# =====================================================

@app.route("/admin/customers", methods=["GET"])
@require_admin
def admin_get_customers():
    db = None
    cursor = None

    try:
        db = get_connection()
        cursor = db.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT
                c.Customer_ID AS customer_id,
                c.Name AS name,
                c.Email AS email,
                c.Phone AS phone,
                c.Address AS address,
                c.City AS city,
                c.Pincode AS pincode,
                COUNT(DISTINCT o.Order_ID) AS total_orders,
                COALESCE(
                    SUM(
                        CASE
                            WHEN o.Order_Status <> 'Cancelled'
                            THEN o.Total_Amount
                            ELSE 0
                        END
                    ), 0
                ) AS total_order_value
            FROM Customer c
            LEFT JOIN Orders o
                ON c.Customer_ID = o.Customer_ID
            WHERE c.Role = 'customer'
            GROUP BY
                c.Customer_ID,
                c.Name,
                c.Email,
                c.Phone,
                c.Address,
                c.City,
                c.Pincode
            ORDER BY c.Customer_ID DESC
            """
        )

        customers = cursor.fetchall()

        for customer in customers:
            customer["total_orders"] = int(customer["total_orders"] or 0)
            customer["total_order_value"] = float(
                customer["total_order_value"] or 0
            )

        return jsonify({
            "count": len(customers),
            "customers": customers
        }), 200

    except Exception:
        app.logger.exception("Admin could not fetch customers")
        return jsonify({
            "message": "Could not load customers."
        }), 500

    finally:
        if cursor:
            cursor.close()
        if db:
            db.close()


# =====================================================
# ADMIN ORDER MANAGEMENT
# GET /admin/orders
# =====================================================

@app.route("/admin/orders", methods=["GET"])
@require_admin
def admin_get_orders():
    db = None
    cursor = None

    try:
        db = get_connection()
        cursor = db.cursor(dictionary=True)

        cursor.execute(
            """
            SELECT
                o.Order_ID AS order_id,
                o.Customer_ID AS customer_id,
                c.Name AS customer_name,
                c.Email AS customer_email,
                c.Phone AS customer_phone,
                o.Total_Amount AS total_amount,
                o.Delivery_Address AS delivery_address,
                o.City AS city,
                o.Pincode AS pincode,
                o.Order_Status AS order_status,
                o.Payment_Method AS payment_method,
                o.Payment_Status AS payment_status,
                r.Restaurant_Name AS restaurant_name,
                oi.Menu_ID AS menu_id,
                m.Item_Name AS item_name,
                oi.Quantity AS quantity,
                oi.Unit_Price AS unit_price
            FROM Orders o
            LEFT JOIN Customer c
                ON o.Customer_ID = c.Customer_ID
            LEFT JOIN Order_Item oi
                ON o.Order_ID = oi.Order_ID
            LEFT JOIN Menu m
                ON oi.Menu_ID = m.Menu_ID
            LEFT JOIN Restaurant r
                ON m.Restaurant_ID = r.Restaurant_ID
            ORDER BY o.Order_ID DESC
            """
        )

        rows = cursor.fetchall()
        orders_by_id = {}

        for row in rows:
            order_id = row["order_id"]

            if order_id not in orders_by_id:
                orders_by_id[order_id] = {
                    "order_id": order_id,
                    "customer_id": row["customer_id"],
                    "customer_name": row["customer_name"] or "Unknown customer",
                    "customer_email": row["customer_email"] or "",
                    "customer_phone": row["customer_phone"] or "",
                    "total_amount": float(row["total_amount"] or 0),
                    "delivery_address": row["delivery_address"] or "",
                    "city": row["city"] or "",
                    "pincode": row["pincode"] or "",
                    "order_status": row["order_status"] or "Pending",
                    "payment_method": row["payment_method"] or "",
                    "payment_status": row["payment_status"] or "",
                    "restaurant_names": [],
                    "items": []
                }

            order = orders_by_id[order_id]

            restaurant_name = row["restaurant_name"]
            if restaurant_name and restaurant_name not in order["restaurant_names"]:
                order["restaurant_names"].append(restaurant_name)

            if row["menu_id"] is not None:
                order["items"].append({
                    "menu_id": row["menu_id"],
                    "item_name": row["item_name"] or "Menu item",
                    "quantity": int(row["quantity"] or 0),
                    "unit_price": float(row["unit_price"] or 0)
                })

        orders = list(orders_by_id.values())

        for order in orders:
            order["restaurant_name"] = ", ".join(
                order["restaurant_names"]
            ) or "Restaurant unavailable"

        return jsonify({
            "count": len(orders),
            "orders": orders
        }), 200

    except Exception:
        app.logger.exception("Admin could not fetch orders")
        return jsonify({
            "message": "Could not load orders."
        }), 500

    finally:
        if cursor:
            cursor.close()
        if db:
            db.close()


# --------------------------------------------------
# START SERVER
# --------------------------------------------------

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )
