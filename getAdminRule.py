import sqlite3

from app import DATABASE

username = input("Input admin username: ")

with sqlite3.connect(DATABASE) as conn:
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET is_admin = ? WHERE username = ?",
                   (True, username))
    conn.commit()