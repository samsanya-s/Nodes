from flask import Flask, request, jsonify, session, redirect, url_for
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
import csv
import os

app = Flask(__name__)
app.secret_key = 'your_secret_key'  # Замените на более безопасный секретный ключ

# Путь к базе данных
DATABASE = 'users.db'
CSV_FILE = 'click_speed_results.csv'


# Инициализация базы данных
def init_db():
    with sqlite3.connect(DATABASE) as conn:
        cursor = conn.cursor()
        cursor.execute('''CREATE TABLE IF NOT EXISTS users (
                          id INTEGER PRIMARY KEY,
                          username TEXT UNIQUE NOT NULL,
                          password TEXT NOT NULL
                      )''')
        conn.commit()


init_db()

# Проверяем, существует ли CSV файл; если нет, создаем с заголовком
if not os.path.exists(CSV_FILE):
    with open(CSV_FILE, mode='w', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(['username', 'time_elapsed'])  # Заголовок


# Маршрут для регистрации пользователя
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'status': 'error', 'message': 'Username and password are required'}), 400

    hashed_password = generate_password_hash(password)
    try:
        with sqlite3.connect(DATABASE) as conn:
            cursor = conn.cursor()
            cursor.execute("INSERT INTO users (username, password) VALUES (?, ?)", (username, hashed_password))
            conn.commit()
        return jsonify({'status': 'success', 'message': 'User registered successfully'})
    except sqlite3.IntegrityError:
        return jsonify({'status': 'error', 'message': 'Username already taken'}), 400


# Маршрут для входа пользователя
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    with sqlite3.connect(DATABASE) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT password FROM users WHERE username = ?", (username,))
        user = cursor.fetchone()

        if user and check_password_hash(user[0], password):
            session['username'] = username
            return jsonify({'status': 'success'})
        else:
            return jsonify({'status': 'error', 'message': 'Invalid username or password'}), 400


# Маршрут для сохранения данных времени
@app.route('/save_time', methods=['POST'])
def save_time():
    if 'username' not in session:
        return jsonify({'status': 'error', 'message': 'User not logged in'}), 403

    data = request.get_json()
    time_elapsed = data.get('timeElapsed')
    username = session['username']

    # Записываем время и имя пользователя в CSV файл
    with open(CSV_FILE, mode='a', newline='') as file:
        writer = csv.writer(file)
        writer.writerow([username, time_elapsed])

    return jsonify({'status': 'success', 'time_elapsed': time_elapsed})


# Маршрут для выхода
@app.route('/logout', methods=['POST'])
def logout():
    session.pop('username', None)
    return jsonify({'status': 'success', 'message': 'Logged out successfully'})


# Маршрут для отображения страницы
@app.route('/')
def index():
    return app.send_static_file('index.html')


if __name__ == '__main__':
    app.run(debug=True)
