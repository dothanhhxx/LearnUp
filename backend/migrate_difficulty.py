import mysql.connector
from config.database import DB_CONFIG
from dotenv import load_dotenv

load_dotenv()

conn = mysql.connector.connect(**DB_CONFIG)
cursor = conn.cursor()

try:
    cursor.execute("ALTER TABLE articles ADD COLUMN difficulty VARCHAR(50) DEFAULT 'Beginner'")
    conn.commit()
    print("[OK] Migration successful: 'difficulty' column added to articles table.")
except mysql.connector.errors.DatabaseError as e:
    if e.errno == 1060:
        print("[SKIP] Column 'difficulty' already exists — no changes made.")
    else:
        raise
finally:
    cursor.close()
    conn.close()
