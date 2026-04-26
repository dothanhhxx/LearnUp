import mysql.connector
from mysql.connector import pooling, Error
import os
from dotenv import load_dotenv

# Load env vars từ file .env
load_dotenv()

# Đọc config từ .env
DB_CONFIG = {
    "host": os.getenv("DB_HOST", "127.0.0.1"),
    "port": int(os.getenv("DB_PORT", 3306)),
    "user": os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD", "123456"),
    "database": os.getenv("DB_NAME", "LearnUp"),
    "charset": "utf8mb4",
}

# Lazy connection pool (chỉ tạo khi cần)
_pool = None


def _get_pool():
    global _pool
    if _pool is None:
        try:
            _pool = pooling.MySQLConnectionPool(
                pool_name="learnup_pool",
                pool_size=5,
                **DB_CONFIG
            )
            print("✅ MySQL connection pool created successfully!")
        except Error as e:
            print(f"❌ MySQL connection error: {e}")
            raise
    return _pool


def get_db():
    """FastAPI dependency — trả về connection, tự đóng sau khi dùng."""
    conn = _get_pool().get_connection()
    try:
        yield conn
    finally:
        conn.close()
