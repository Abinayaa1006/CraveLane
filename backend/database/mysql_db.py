import mysql.connector


def get_connection():
    return mysql.connector.connect(
        host="localhost",
        port=3305,
        user="root",
        password="ABInay10!",
        database="foodorderingdb"
    )