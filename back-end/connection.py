import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

config = {
    "user": os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD"),
    "host": os.getenv("DB_HOST", "localhost"),
    "database": os.getenv("DB_DATABASE", "oficina_mjp"),
    "autocommit": os.getenv("DB_AUTOCOMMIT", "True").lower() == "true"
}

def get_connection():
    try:
        conn = mysql.connector.connect(**config)
        conn.ping(reconnect=True, attempts=3, delay=2)
        return conn
    except mysql.connector.Error as err:
        print("Erro MySQL:", err)
        raise
