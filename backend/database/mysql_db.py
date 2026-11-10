
import os
from pathlib import Path

import mysql.connector
from dotenv import load_dotenv

# Always load the backend .env file, regardless of the terminal's working directory.
BACKEND_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BACKEND_DIR / ".env", override=False)


def get_connection():
    use_cloud = os.getenv("USE_CLOUD_DB", "false").lower() == "true"

    if use_cloud:
        required = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"]
        missing = [key for key in required if not os.getenv(key)]

        if missing:
            raise ValueError(
                "Missing Railway database environment variables: "
                + ", ".join(missing)
            )

        return mysql.connector.connect(
            host=os.getenv("DB_HOST"),
            port=int(os.getenv("DB_PORT", "3306")),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            database=os.getenv("DB_NAME"),
            connection_timeout=20
        )

    return mysql.connector.connect(
        host="localhost",
        port=3305,
        user="root",
        password=os.getenv("LOCAL_DB_PASSWORD", ""),
        database="foodorderingdb"
    )
