create table users (
  id INTEGER PRIMARY KEY,
  name VARCHAR(40) UNIQUE,
  password VARCHAR(40),
  api_key VARCHAR(40)
);

create table channels (
    id INTEGER PRIMARY KEY,
    name VARCHAR(40) UNIQUE
);

create table messages (
  id INTEGER PRIMARY KEY,
  channel_id INTEGER,
  user_id INTEGER,
  text TEXT,
  replies_to INTEGER, -- the message_id of the replied message
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(channel_id) REFERENCES channels(id),
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(replies_to) REFERENCES messages(id)
  
);

--  reactions table
CREATE TABLE reactions (
    id INTEGER PRIMARY KEY,
    emoji TEXT,
    message_id INTEGER,
    user_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (message_id) REFERENCES messages(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- user messages table for tracking seen messages
CREATE TABLE user_messages (
    user_id INTEGER,
    channel_id INTEGER,
    last_seen_message_id INTEGER,
    last_seen_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Store the latest timestamp seen
    PRIMARY KEY (user_id, channel_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (channel_id) REFERENCES channels(id),
    FOREIGN KEY (last_seen_message_id) REFERENCES messages(id)
);