
import os
import mysql.connector


def get_connection():

    use_cloud = os.getenv("USE_CLOUD_DB", "false").lower() == "true"

    if use_cloud:
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
        password=os.getenv("LOCAL_DB_PASSWORD"),
        database="foodorderingdb"
    )
