import json
from types import NoneType

from flask import Flask, request, jsonify, session, redirect, url_for, render_template
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
import csv
import os

app = Flask(__name__)
app.secret_key = 'your_secret_key'  # Замените на более безопасный секретный ключ

# Путь к базе данных
DATABASE = 'users.db'
NODES = "static\\nodes.json"
app.config['SESSION_COOKIE_SAMESITE'] = None
app.config['SESSION_COOKIE_SECURE'] = False


# Инициализация базы данных
def init_db():
    with sqlite3.connect(DATABASE) as conn:
        cursor = conn.cursor()
        cursor.execute('''CREATE TABLE IF NOT EXISTS users (
                          id INTEGER PRIMARY KEY,
                          username TEXT UNIQUE NOT NULL,
                          password TEXT NOT NULL
                      )''')
        cursor.execute('''
               CREATE TABLE IF NOT EXISTS user_node_data (
                   id INTEGER PRIMARY KEY AUTOINCREMENT,
                   user_id TEXT NOT NULL,
                   node_name TEXT NOT NULL,
                   timestamp INTEGER NOT NULL
               )
           ''')
        conn.commit()
        # print(conn)


init_db()

@app.route('/auth', methods=['GET', 'POST'])
def auth():
    error = None
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        is_register = 'is_register' in request.form  # Проверка чекбокса

        if is_register:
            answer = register(username, password)
            if answer["status"] == "success":
                return redirect('/')
            else:
                error = answer["message"]
        else:
            answer = login(username, password)
            if answer["status"] == "success":
                return redirect('/')
            else:
                error = answer["message"]
    return render_template('authorization.html', error=error)


def register(username, password):
    if not username:
        return {'status': 'error', 'message': 'Username are required'}
    if not password:
        return {'status': 'error', 'message': 'Password are required'}

    hashed_password = generate_password_hash(password)
    try:
        with sqlite3.connect(DATABASE) as conn:
            cursor = conn.cursor()
            cursor.execute("INSERT INTO users (username, password) VALUES (?, ?)", (username, hashed_password))
            conn.commit()
            login(username, password)
        return {'status': 'success', 'message': 'User registered successfully'}
    except sqlite3.IntegrityError:
        return {'status': 'error', 'message': 'Username already taken'}


def login(username, password):
    with (sqlite3.connect(DATABASE) as conn):
        cursor = conn.cursor()
        cursor.execute("SELECT password, id FROM users WHERE username = ?", (username,))
        user_password, user_id = cursor.fetchone()
        # print(user_password, cursor.fetchone())

        if user_password:

            if check_password_hash(user_password, password):
                session['username'] = user_id
                return {'status': 'success', 'message': "User logged in successfully"}
            else:
                return {'status': 'error', 'message': 'Invalid password'}
        else:
            return {'status': 'error', 'message': 'Invalid username'}


# Маршрут для сохранения данных времени
@app.route('/save_time', methods=['POST'])
def save_time():
    if 'username' not in session:
        return jsonify({'status': 'error', 'message': 'User not logged in'}), 403

    if not request.is_json:
        return jsonify({"error": "Invalid JSON format"}), 401

    data = request.get_json()
    node_name = data.get('node')
    timestamp = data.get('time')

    # Проверяем наличие всех необходимых данных
    if not node_name or not timestamp:
        return jsonify({"error": "Missing 'node_name' or 'time' in request"}), 402

    try:
        # Преобразуем время в стандартный формат
        mn = [600, 60, 1]
        timestamp = sum([int(el) * mn[i] for i, el in enumerate(timestamp.split(":")[1:])])
    except ValueError:
        return jsonify({"error": "Invalid time format"}), 400

    # Сохраняем данные в базу данных
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    cursor.execute('''
                DELETE FROM user_node_data
                WHERE id IN (
                    SELECT id FROM user_node_data
                    WHERE user_id = ? AND node_name = ?
                    ORDER BY id ASC
                    LIMIT (SELECT CASE WHEN COUNT(*) > 100 THEN COUNT(*) - 100 ELSE 0 END
                           FROM user_node_data
                           WHERE user_id = ? AND node_name = ?)
                )
            ''', (session["username"], node_name, session["username"], node_name))
    cursor.execute('''
            INSERT INTO user_node_data (user_id, node_name, timestamp)
            VALUES (?, ?, ?)
        ''', (session["username"], node_name, timestamp))
    # conn.commit()

    conn.commit()
    conn.close()

    return jsonify({"message": "Data saved successfully"}), 200


# Маршрут для выхода
@app.route('/logout', methods=['GET'])
def logout():
    session.pop('username', None)
    return redirect('/')

@app.route('/', methods=['GET'])
def home():
    if 'username' in session:
        return redirect(url_for('main_menu'))
    return redirect(url_for('auth'))

@app.route('/main_menu', methods=['GET'])
def main_menu():
    # print(session)
    user_id = session["username"]
    if not user_id:
        return "User not logged in", 403

    conn = sqlite3.connect(DATABASE)
    db = conn.cursor()
    results = []
    with open(NODES, encoding="utf-8") as f:
        nodes = json.load(f)

    for node in nodes:
        node_name = node['name']

        # Query for current user
        user_query = """
                SELECT 
                    AVG(timestamp) AS avg_time,
                    MIN(timestamp) AS best_time
                FROM user_node_data
                WHERE user_id = ? AND node_name = ?
            """
        user_data = db.execute(user_query, (user_id, node_name)).fetchone()

        # Query for all users
        all_query = """
                SELECT 
                    AVG(timestamp) AS avg_time,
                    MIN(timestamp) AS best_time
                FROM user_node_data
                WHERE node_name = ?
            """
        all_data = db.execute(all_query, (node_name,)).fetchone()
        username_query = """
                    SELECT username FROM users WHERE id=?
        """
        username = db.execute(username_query, (session["username"],)).fetchone()[0]
        # print(user_data, all_data)
        results.append({
            'node_name': node_name,
            'user_avg_time': time_read(user_data[0]),
            'user_best_time': time_read(user_data[1]),
            'all_avg_time': time_read(all_data[0]),
            'all_best_time': time_read(all_data[1])
        })

    return render_template('main_menu.html', results=results, username=username)


def time_read(n):
    if type(n) == NoneType:
        return n
    n = int(n)
    milis = n % 100
    n //= 100
    sec = n % 60
    min = n // 60
    return f"{str(min).rjust(2, "0")}:{str(sec).rjust(2, "0")}:{str(milis).rjust(2, "0")}"


@app.route('/main', methods=['GET'])
def main():
    return render_template("main.html")



if __name__ == '__main__':
    app.run(debug=True)
