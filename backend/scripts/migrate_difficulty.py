"""
Migration: Thêm cột difficulty vào bảng articles nếu chưa có.
"""
import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from dotenv import load_dotenv
load_dotenv()
import mysql.connector

conn = mysql.connector.connect(
    host=os.getenv("DB_HOST", "127.0.0.1"),
    port=int(os.getenv("DB_PORT", 3306)),
    user=os.getenv("DB_USER", "root"),
    password=os.getenv("DB_PASSWORD", "123456"),
    database=os.getenv("DB_NAME", "LearnUp"),
    charset="utf8mb4",
)
cursor = conn.cursor()

cursor.execute("SHOW COLUMNS FROM articles LIKE 'difficulty'")
row = cursor.fetchone()

if row:
    print("Column 'difficulty' already exists:", row)
else:
    cursor.execute("ALTER TABLE articles ADD COLUMN difficulty VARCHAR(50) DEFAULT 'Beginner'")
    conn.commit()
    print("Column 'difficulty' ADDED successfully to articles table.")

cursor.close()
conn.close()
