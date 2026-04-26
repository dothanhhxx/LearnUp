"""
Centralized Settings — Tập trung cấu hình từ .env
"""
import os
from dotenv import load_dotenv

load_dotenv()


# ===== Database =====
DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = int(os.getenv("DB_PORT", 3306))
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "123456")
DB_NAME = os.getenv("DB_NAME", "LearnUp")

# ===== JWT =====
JWT_SECRET = os.getenv("JWT_SECRET", "np_edu_secret_key_2026")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", 1440))  # 24h

# ===== Server =====
APP_HOST = os.getenv("APP_HOST", "0.0.0.0")
APP_PORT = int(os.getenv("PORT", 8001))
