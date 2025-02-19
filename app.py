import json
from types import NoneType

from flask import Flask, request, jsonify, session, redirect, url_for, render_template
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
import csv
import os

app = Flask(__name__)
app.secret_key = 'FH7O4QVN-ON97323QYC-NVR[Q30NQ]U39-0V389'  # Замените на более безопасный секретный ключ

# Путь к базе данных
DATABASE = 'users.db'

app.config['SESSION_COOKIE_SAMESITE'] = None
app.config['SESSION_COOKIE_SECURE'] = False

def query_db(query, args=(), one=False):
    """Функция для выполнения SQL-запросов"""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute(query, args)
    rv = cur.fetchall()
    conn.commit()
    conn.close()
    return (rv[0] if rv else None) if one else rv


# Инициализация базы данных
def init_db():
    with sqlite3.connect(DATABASE) as conn:
        cursor = conn.cursor()
        cursor.execute('''CREATE TABLE IF NOT EXISTS users (
                          id INTEGER PRIMARY KEY,
                          username TEXT UNIQUE NOT NULL,
                          password TEXT NOT NULL,
                          is_admin BOOL NOT NULL
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

def find_nodes_json():
    # Определяем текущую директорию, где находится скрипт
    current_dir = os.path.dirname(os.path.abspath(__file__))

    # Указываем относительный путь к папке static и файлу nodes.json
    nodes_path = os.path.join(current_dir, "static", "nodes.json")

    # Проверяем, существует ли файл
    if os.path.exists(nodes_path):
        return nodes_path
    else:
        raise FileNotFoundError(f"Файл 'nodes.json' не найден по пути: {nodes_path}")

# Использование функции
try:
    NODES = find_nodes_json()
except FileNotFoundError as e:
    print(e)


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
        query_db("INSERT INTO users (username, password, is_admin) VALUES (?, ?, ?)", (username, hashed_password, False))
        login(username, password)
        return {'status': 'success', 'message': 'User registered successfully'}
    except sqlite3.IntegrityError:
        return {'status': 'error', 'message': 'Username already taken'}


def login(username, password):
    answer = query_db("SELECT password, id FROM users WHERE username = ?", (username,))
    if answer:
        user_password, user_id = answer[0]
    else:
        return {'status': 'error', 'message': 'Invalid username'}

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
        mn = [6000, 100, 1]
        timestamp = sum([int(el) * mn[i] for i, el in enumerate(timestamp.split(":"))])
    except ValueError:
        return jsonify({"error": "Invalid time format"}), 400

    # Сохраняем данные в базу данных
    query_delete = '''
                DELETE FROM user_node_data
                WHERE id IN (
                    SELECT id FROM user_node_data
                    WHERE user_id = ? AND node_name = ?
                    ORDER BY id ASC
                    LIMIT (SELECT CASE WHEN COUNT(*) > 100 THEN COUNT(*) - 100 ELSE 0 END
                           FROM user_node_data
                           WHERE user_id = ? AND node_name = ?)
                )
            '''
    query_db(query_delete, (session["username"], node_name, session["username"], node_name))
    query_db('''
            INSERT INTO user_node_data (user_id, node_name, timestamp)
            VALUES (?, ?, ?)
        ''', (session["username"], node_name, timestamp))

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
    try:
        error = request.args.get('error')
        user_id = session["username"]
        if not user_id:
            return "User not logged in", 403

        results = []
        with open(NODES, encoding="utf-8") as f:
            nodes = ["3 узла"] + list(map(lambda x: x["name"], json.load(f)))


        for node_name in nodes:
            user_query = """
                    SELECT
                        AVG(timestamp) AS avg_time,
                        MIN(timestamp) AS best_time
                    FROM user_node_data
                    WHERE user_id = ? AND node_name = ?
                """
            user_data = query_db(user_query, (user_id, node_name), 1)
            all_query = """
                    SELECT
                        AVG(timestamp) AS avg_time,
                        MIN(timestamp) AS best_time
                    FROM user_node_data
                    WHERE node_name = ?
                """
            all_data = query_db(all_query, (node_name,), 1)
            username_query = """
                        SELECT username, is_admin FROM users WHERE id=?
            """
            username, is_admin = query_db(username_query, (session["username"],), True)
            results.append({
                'node_name': node_name,
                'user_avg_time': time_read(user_data[0]),
                'user_best_time': time_read(user_data[1]),
                'all_avg_time': time_read(all_data[0]),
                'all_best_time': time_read(all_data[1])
            })

        return render_template('main_menu.html', results=results, username=username,
                               is_admin=is_admin, error=error)
    except:
        return redirect(url_for('auth'))


def time_read(milliseconds):
    if type(milliseconds) == NoneType:
        return milliseconds
    minutes = int(milliseconds // 6000)
    seconds = int(milliseconds % 6000) // 100
    remaining_milliseconds = int(milliseconds % 100)

    # Форматируем строку
    return f"{minutes:02}:{seconds:02}:{remaining_milliseconds:02}"


@app.route('/main', methods=['GET'])
def main():
    type_ = int(request.args.get('type'))
    selected = request.args.get('selected')
    if not selected:
        return redirect('/main_menu?error=no_nodes')

    # print(type_)
    return render_template("main.html", type_r=type_, sel_nodes=selected)


@app.route('/manage_users', methods=['GET', 'POST'])
def manage_users():
    is_admin = query_db("SELECT is_admin FROM users WHERE id=?", (session["username"],), True)
    if not is_admin:
        return redirect(url_for('main_menu'))
    if request.method == 'POST':
        data = request.json
        if data['action'] == 'delete_user':
            query_db("DELETE FROM users WHERE id = ?", (data['user_id'],))
            query_db("DELETE FROM user_node_data WHERE user_id = ?", (data['user_id'],))
        elif data['action'] == 'make_admin':
            query_db("UPDATE users SET is_admin = 1 WHERE id = ?", (data['user_id'],))
        return jsonify({'success': True})

    users = query_db("SELECT * FROM users")
    return render_template('manage_users.html', users=users)


@app.route('/manage_nodes', methods=['GET', "POST"])
def manage_nodes():
    is_admin = query_db("SELECT is_admin FROM users WHERE id=?", (session["username"],), True)
    if not is_admin:
        return redirect(url_for('main_menu'))
    if request.method == 'POST':
        data = request.json
        if data['action'] == 'delete_log':
            query_db("DELETE FROM user_node_data WHERE id = ?", (data['log_id'],))
            return jsonify({'success': True})

    user_filter = request.args.getlist('user_id')
    node_filter = request.args.getlist('node')
    sort_order = request.args.get('sort_order', 'asc')

    query = "SELECT user_node_data.id, user_node_data.user_id, user_node_data.node_name, user_node_data.timestamp, users.username as user_name FROM user_node_data JOIN users ON user_node_data.user_id = users.id WHERE 1=1"
    params = []

    if user_filter:
        query += " AND user_node_data.user_id IN ({})".format(','.join(['?'] * len(user_filter)))
        params.extend(user_filter)

    if node_filter:
        query += " AND user_node_data.node_name IN ({})".format(','.join(['?'] * len(node_filter)))
        # print(node_filter)
        params.extend(node_filter)

    query += f" ORDER BY user_node_data.timestamp {sort_order.upper()}"

    logs = query_db(query, params)
    users = query_db("SELECT id, username FROM users")
    nodes = query_db("SELECT DISTINCT node_name FROM user_node_data")

    return render_template('manage_nodes.html', logs=logs, users=users, nodes=nodes)



if __name__ == '__main__':
    app.run(debug=True)
