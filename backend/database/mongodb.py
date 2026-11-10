
import os
from pathlib import Path

from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.errors import PyMongoError


# Load the backend .env file
BACKEND_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BACKEND_DIR / ".env")

MONGO_URI = os.getenv("MONGO_URI")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "cravelane")

client = None
db = None


def connect_mongodb():
    """Connect to MongoDB Atlas and verify the connection."""
    global client, db

    if not MONGO_URI:
        raise ValueError("MONGO_URI is missing from the backend .env file")

    try:
        client = MongoClient(
            MONGO_URI,
            serverSelectionTimeoutMS=5000
        )

        # Verify that Atlas is reachable
        client.admin.command("ping")

        db = client[MONGO_DB_NAME]

        print("MongoDB connected successfully!")
        print(f"Database: {MONGO_DB_NAME}")

        return db

    except (PyMongoError, ValueError) as error:
        if client is not None:
            client.close()

        client = None
        db = None

        print("MongoDB connection failed:", error)
        raise


def close_mongodb():
    """Close the MongoDB connection."""
    global client, db

    if client is not None:
        client.close()

    client = None
    db = None


if __name__ == "__main__":
    try:
        connect_mongodb()
    except Exception:
        raise SystemExit(1)
    finally:
        close_mongodb()
