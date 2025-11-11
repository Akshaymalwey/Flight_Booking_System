import mysql.connector
from dotenv import load_dotenv
import os

load_dotenv()

db_password = os.getenv("BACKEND_PASS")

def get_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password=db_password,
        database="g3_schema"
    )