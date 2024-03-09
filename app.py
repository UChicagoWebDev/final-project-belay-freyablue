import string
import random
from datetime import datetime
from flask import *
from functools import wraps
import sqlite3

app = Flask(__name__)
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

users = {}


def get_db():
    db = getattr(g, '_database', None)

    if db is None:
        db = g._database = sqlite3.connect('db/watchparty.sqlite3')
        db.row_factory = sqlite3.Row
        setattr(g, '_database', db)
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

def query_db(query, args=(), one=False):
    db = get_db()
    cursor = db.execute(query, args)
    rows = cursor.fetchall()
    db.commit()
    cursor.close()
    if rows:
        if one: 
            return rows[0]
        return rows
    return None

# API endpoint for user signup
@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    # Check if the username is available 
    if username not in users:
        # Create a new user
        users[username] = {'password': password, 'channels': {}}
        return jsonify({'success': True})
    else:
        return jsonify({'error': 'Username already taken'}), 400
    
# API endpoint for user login
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    # Check username and password (add proper authentication logic)
    if username in users and users[username]['password'] == password:
        return jsonify({'success': True})
    else:
        return jsonify({'error': 'Invalid credentials'}), 401

# Route for the main page
@app.route('/')
def index():
    return app.send_static_file('index.html')

# # Route for the room page
# @app.route('/room/<int:channel_id>')
# def room(channel_id):
#     # Check if the user is authenticated
#     if 'auth_key' not in request.cookies:
#         return redirect(url_for('login'))

#     # Check if the channel exists
#     channel = next((ch for ch in channels if ch['id'] == channel_id), None)
#     if channel:
#         return render_template('room.html', channel=channel)
#     else:
#         return redirect(url_for('index'))

#  for getting unread message counts
@app.route('/api/unread-counts')
def get_unread_counts():
    # Replace this with your logic to calculate unread counts
    # For simplicity, assuming the counts are 0 for all channels
    unread_counts = {1: 0, 2: 0, 3: 0}  # Channel IDs
    return jsonify(unread_counts)

def new_user():
    name = "Unnamed User #" + ''.join(random.choices(string.digits, k=6))
    password = ''.join(random.choices(string.ascii_lowercase + string.digits, k=10))
    api_key = ''.join(random.choices(string.ascii_lowercase + string.digits, k=40))
    u = query_db('insert into users (name, password, api_key) ' + 
        'values (?, ?, ?) returning id, name, password, api_key',
        (name, password, api_key),
        one=True)
    return u


if __name__ == '__main__':
    app.run(debug=True)