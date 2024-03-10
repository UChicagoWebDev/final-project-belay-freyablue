import string
import random
from datetime import datetime
from flask import *
from functools import wraps
import sqlite3

app = Flask(__name__)
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

users = {}
messages = {}
user_last_read = {}

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

def get_user_from_cookie(request):
    user_id = request.cookies.get('user_id')
    password = request.cookies.get('user_password')
    if user_id and password:
        return query_db('select * from users where id = ? and password = ?', [user_id, password], one=True)
    return None

# API endpoint for user signup
@app.route('/api/signup', methods=['POST'])
def signup():
    u = new_user()
    resp = make_response(jsonify({'id': u['id'], 'name': u['name'], 'api_key': u['api_key']}), 200)
    resp.set_cookie('user_id', str(u['id']))
    resp.set_cookie('user_password', u['password'])
    return resp

# API endpoint for user login
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    user = query_db('SELECT * FROM users WHERE name = ? AND password = ?', [username, password], one=True)
    # Check username and password (add proper authentication logic)
    if user:
        resp = make_response(jsonify({'success': True}), 200)
        resp.set_cookie('user_id', str(user['id']))
        resp.set_cookie('user_password', user['password'])
        return resp
    else:
        return jsonify({'error': 'Invalid credentials'}), 401

# Update Username
@app.route('/api/login', methods=['PUT'])
def update_username():
    user = get_user_from_cookie(request)
    if user is None:
        return jsonify({'error': 'Unauthorized'}), 401

    new_name = request.json.get('new_username')
    query_db('UPDATE users SET name = ? WHERE id = ?', [new_name, user['id']])
    return jsonify({'success': True})

# Update Password
@app.route('/api/login', methods=['PUT'])
def update_password():
    user = get_user_from_cookie(request)
    if user is None:
        return jsonify({'error': 'Unauthorized'}), 401

    new_password = request.json.get('new_password')
    query_db('UPDATE users SET password = ? WHERE id = ?', [new_password, user['id']])
    return jsonify({'success': True})

# Route for the main page
@app.route('/')
@app.route('/signup')
@app.route('/login')
@app.route('/authentication')
@app.route('/room')
@app.route('/create-channel')
@app.route('/get-channels')
@app.route('/room/<channel_id>')
def index():
    return app.send_static_file('index.html')

# Route for the room page
@app.route('/room/<int:channel_id>')
def room(channel_id):
    # Check if the user is authenticated
    auth_key = request.cookies.get('auth_key')
    if not auth_key:
        return redirect(url_for('login'))

    # Check if the channel exists
    channel = query_db('SELECT * FROM channels WHERE id = ?', (channel_id,), one=True)

    if channel:
        return app.send_static_file('index.html')
    else:
        return redirect(url_for('index'))

def generate_session_token():
    return ''.join(random.choices(string.ascii_letters + string.digits, k=40))

# Authentication endpoint
@app.route('/api/authentication', methods=['POST'])
def authenticate():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = query_db('SELECT * FROM users WHERE name = ? AND password = ?', (username, password), one=True)

    if user:
        session_token = generate_session_token()
        response = make_response(jsonify({'success': True, 'session_token': session_token}), 200)
        response.set_cookie('session_token', session_token)
        return response
    else:
        return jsonify({'error': 'Invalid credentials'}), 401


# New API endpoint for creating a message (change to POST)
@app.route('/api/room/<channel_id>', methods=['POST'])
def create_message(channel_id):
    data = request.get_json()
    user_id = request.cookies.get('user_id')
    message_text = data.get('message_text')

    if not (channel_id and user_id and message_text):
        return jsonify({'error': 'Channel ID, User ID, and Message Text are required'}), 400

    
    message_id = len(messages) + 1
    messages.append({'id': message_id, 'channel_id': channel_id, 'user_id': user_id, 'text': message_text})
    return jsonify({'success': True, 'message_id': message_id})

# New API endpoint for getting messages in a channel (remains as GET)
@app.route('/api/room/<channel_id>')
def get_messages(channel_id):
    channel_messages = [msg for msg in messages if msg['channel_id'] == channel_id]
    return jsonify({'messages': channel_messages})

# New API endpoint for updating a user's last read message in a channel (change to POST)
@app.route('/api/room/<channel_id>', methods=['POST'])
def update_last_read(channel_id):
    data = request.get_json()
    user_id = data.get('user_id')
    last_read_message_id = data.get('last_read_message_id')

    if not (user_id and channel_id and last_read_message_id):
        return jsonify({'error': 'User ID, Channel ID, and Last Read Message ID are required'}), 400

    user_last_read[user_id][channel_id] = last_read_message_id
    return jsonify({'success': True})

# API endpoint for getting unread message counts (remains as GET)
@app.route('/api/unread-counts')
def get_unread_counts():
    user_id = request.cookies.get('user_id')
    if not user_id:
        return jsonify({'error': 'User ID not found in cookies'}), 401

    # Your logic for calculating unread message counts goes here
    # For simplicity, we'll return a dictionary with counts for each channel
    unread_counts = {}
    channels = request.cookies.get('channels', '')
    channels_list = channels.split(',')
    for channel in channels_list:
        channel_id = channel['id']
        user_last_read_message_id = user_last_read[user_id].get(channel_id, 0)
        unread_counts[channel_id] = len([msg for msg in messages if msg['channel_id'] == channel_id and msg['id'] > user_last_read_message_id])

    return jsonify(unread_counts)


# New API endpoint for creating a channel (change to POST)
@app.route('/api/create-channel', methods=['POST'])
def create_channel():
    data = request.get_json()
    channel_name = data.get('channel_name')

    if not channel_name:
        return jsonify({'error': 'Channel name is required'}), 400

    channels = request.cookies.get('channels', '')
    channels_list = channels.split(',')  
    channel_id = len(channels_list) + 1
    channels_list.append(f'{channel_id}:{channel_name}')
    response = make_response(jsonify({'success': True, 'channel_id': channel_id}), 200)
    response.set_cookie('channels', ','.join(channels_list))
    return response

@app.route('/api/get-channels')
def get_channels():
    channels = request.cookies.get('channels', '')
    channels_list = channels.split(',')
    return jsonify({'channels': channels_list})

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