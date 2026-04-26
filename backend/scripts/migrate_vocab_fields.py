"""
Migration: Thêm cột phonetic, definition, example vào bảng vocabularies.
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

columns = {
    "phonetic": "VARCHAR(255)",
    "definition": "TEXT",
    "example": "TEXT",
    "vietnamese": "TEXT",
}

for col, col_type in columns.items():
    cursor.execute(f"SHOW COLUMNS FROM vocabularies LIKE '{col}'")
    row = cursor.fetchone()
    if row:
        print(f"Column '{col}' already exists.")
    else:
        cursor.execute(f"ALTER TABLE vocabularies ADD COLUMN {col} {col_type}")
        conn.commit()
        print(f"Column '{col}' ADDED successfully.")

cursor.close()
conn.close()
print("Migration complete.")
