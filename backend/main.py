from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Dict, Optional
import json
import uuid
from datetime import datetime
import asyncio
from contextlib import asynccontextmanager
import sqlite3
import os

# Database setup
DATABASE_URL = "chat_app.db"

def init_database():
    """Initialize the SQLite database with tables"""
    conn = sqlite3.connect(DATABASE_URL)
    cursor = conn.cursor()
    
    # Create tables if they don't exist
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            is_online BOOLEAN DEFAULT TRUE,
            last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS channels (
            id TEXT PRIMARY KEY,
            name TEXT UNIQUE NOT NULL,
            description TEXT,
            created_by TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_private BOOLEAN DEFAULT FALSE
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            text TEXT NOT NULL,
            sender_id TEXT NOT NULL,
            sender_username TEXT NOT NULL,
            channel_id TEXT NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            message_type TEXT DEFAULT 'text',
            FOREIGN KEY (sender_id) REFERENCES users (id),
            FOREIGN KEY (channel_id) REFERENCES channels (id)
        )
    ''')
    
    # Insert default channels if they don't exist
    default_channels = [
        ("general", "General discussion", "system"),
        ("random", "Random topics", "system"),
        ("tech", "Technology discussions", "system"),
        ("music", "Music and entertainment", "system"),
    ]
    
    for channel_id, description, created_by in default_channels:
        cursor.execute('''
            INSERT OR IGNORE INTO channels (id, name, description, created_by)
            VALUES (?, ?, ?, ?)
        ''', (channel_id, channel_id.title(), description, created_by))
    
    conn.commit()
    conn.close()

# Initialize database on startup
init_database()

# Data models
class User(BaseModel):
    id: str
    username: str
    is_online: bool = True
    last_seen: datetime = datetime.now()

class Message(BaseModel):
    id: str
    text: str
    sender_id: str
    sender_username: str
    channel_id: str
    timestamp: datetime
    message_type: str = "text"

class Channel(BaseModel):
    id: str
    name: str
    description: str
    created_by: str
    created_at: datetime
    is_private: bool = False
    member_count: int = 0

class CreateChannelRequest(BaseModel):
    name: str
    description: str
    is_private: bool = False

class ConnectUserRequest(BaseModel):
    username: str

# Global state for active connections (in production, use Redis)
active_connections: Dict[str, WebSocket] = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 Starting Chat API Server...")
    print("📊 Database initialized:", DATABASE_URL)
    yield
    # Shutdown
    print("🛑 Shutting down Chat API Server...")

app = FastAPI(
    title="Modern Chat API",
    description="A real-time chat application with WebSocket support",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database helper functions
def get_db_connection():
    return sqlite3.connect(DATABASE_URL)

def get_channels_from_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT c.*, COUNT(m.id) as message_count
        FROM channels c
        LEFT JOIN messages m ON c.id = m.channel_id
        GROUP BY c.id
    ''')
    rows = cursor.fetchall()
    conn.close()
    
    channels = []
    for row in rows:
        channels.append(Channel(
            id=row[0],
            name=row[1],
            description=row[2],
            created_by=row[3],
            created_at=datetime.fromisoformat(row[4]),
            is_private=bool(row[5]),
            member_count=row[6]
        ))
    return channels

def get_messages_from_db(channel_id: str, limit: int = 50):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT * FROM messages 
        WHERE channel_id = ? 
        ORDER BY timestamp DESC 
        LIMIT ?
    ''', (channel_id, limit))
    rows = cursor.fetchall()
    conn.close()
    
    messages = []
    for row in rows:
        messages.append(Message(
            id=row[0],
            text=row[1],
            sender_id=row[2],
            sender_username=row[3],
            channel_id=row[4],
            timestamp=datetime.fromisoformat(row[5]),
            message_type=row[6]
        ))
    return list(reversed(messages))  # Return in chronological order

def save_message_to_db(message: Message):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO messages (id, text, sender_id, sender_username, channel_id, timestamp, message_type)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (message.id, message.text, message.sender_id, message.sender_username, 
          message.channel_id, message.timestamp.isoformat(), message.message_type))
    conn.commit()
    conn.close()

def save_user_to_db(user: User):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT OR REPLACE INTO users (id, username, is_online, last_seen)
        VALUES (?, ?, ?, ?)
    ''', (user.id, user.username, user.is_online, user.last_seen.isoformat()))
    conn.commit()
    conn.close()

def save_channel_to_db(channel: Channel):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO channels (id, name, description, created_by, created_at, is_private)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (channel.id, channel.name, channel.description, channel.created_by, 
          channel.created_at.isoformat(), channel.is_private))
    conn.commit()
    conn.close()

# API Routes
@app.get("/")
async def root():
    return {"message": "Modern Chat API", "status": "running", "database": DATABASE_URL}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(), "database": DATABASE_URL}

@app.get("/api/users")
async def get_users():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM users')
    rows = cursor.fetchall()
    conn.close()
    
    users = []
    for row in rows:
        users.append(User(
            id=row[0],
            username=row[1],
            is_online=bool(row[2]),
            last_seen=datetime.fromisoformat(row[3])
        ))
    return users

@app.get("/api/channels")
async def get_channels():
    return get_channels_from_db()

@app.get("/api/channels/{channel_id}/messages")
async def get_channel_messages(channel_id: str, limit: int = 50):
    # Check if channel exists
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT id FROM channels WHERE id = ?', (channel_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Channel not found")
    conn.close()
    
    return get_messages_from_db(channel_id, limit)

@app.post("/api/channels")
async def create_channel(channel_request: CreateChannelRequest):
    channel_id = channel_request.name.lower().replace(" ", "-")
    
    # Check if channel already exists
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT id FROM channels WHERE id = ?', (channel_id,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Channel already exists")
    conn.close()
    
    new_channel = Channel(
        id=channel_id,
        name=channel_request.name,
        description=channel_request.description,
        created_by="system",  # In real app, get from auth
        created_at=datetime.now(),
        is_private=channel_request.is_private
    )
    
    save_channel_to_db(new_channel)
    return new_channel

@app.post("/api/users/connect")
async def connect_user(request: ConnectUserRequest):
    if not request.username.strip():
        raise HTTPException(status_code=400, detail="Username is required")
    
    # Check if username is already taken
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT id FROM users WHERE username = ?', (request.username,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Username already taken")
    conn.close()
    
    user_id = str(uuid.uuid4())
    new_user = User(
        id=user_id,
        username=request.username,
        is_online=True,
        last_seen=datetime.now()
    )
    
    save_user_to_db(new_user)
    return new_user

@app.post("/api/users/{user_id}/disconnect")
async def disconnect_user(user_id: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('UPDATE users SET is_online = FALSE, last_seen = ? WHERE id = ?', 
                  (datetime.now().isoformat(), user_id))
    conn.commit()
    conn.close()
    return {"message": "User disconnected"}

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        print(f"✅ User {user_id} connected")

    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
            print(f"❌ User {user_id} disconnected")

    async def send_personal_message(self, message: str, user_id: str):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_text(message)

    async def broadcast_to_channel(self, message: str, channel_id: str, exclude_user: str = None):
        for user_id, connection in self.active_connections.items():
            if user_id != exclude_user:
                try:
                    await connection.send_text(message)
                except:
                    pass

manager = ConnectionManager()

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(websocket, user_id)
    
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            if message_data["type"] == "message":
                # Create new message
                new_message = Message(
                    id=str(uuid.uuid4()),
                    text=message_data["text"],
                    sender_id=user_id,
                    sender_username=message_data.get("sender_username", "Unknown"),
                    channel_id=message_data["channel_id"],
                    timestamp=datetime.now()
                )
                
                # Save message to database
                save_message_to_db(new_message)
                
                # Broadcast to all connected users
                await manager.broadcast_to_channel(
                    json.dumps({
                        "type": "new_message",
                        "message": {
                            "id": new_message.id,
                            "text": new_message.text,
                            "sender_id": new_message.sender_id,
                            "sender_username": new_message.sender_username,
                            "channel_id": new_message.channel_id,
                            "timestamp": new_message.timestamp.isoformat()
                        }
                    }),
                    message_data["channel_id"],
                    exclude_user=user_id
                )
                
                # Send confirmation back to sender
                await manager.send_personal_message(
                    json.dumps({
                        "type": "message_sent",
                        "message_id": new_message.id
                    }),
                    user_id
                )
                
            elif message_data["type"] == "typing":
                # Broadcast typing indicator
                await manager.broadcast_to_channel(
                    json.dumps({
                        "type": "user_typing",
                        "user_id": user_id,
                        "username": message_data.get("username", "Unknown"),
                        "channel_id": message_data["channel_id"]
                    }),
                    message_data["channel_id"],
                    exclude_user=user_id
                )
                
    except WebSocketDisconnect:
        manager.disconnect(user_id)
        # Update user status in database
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('UPDATE users SET is_online = FALSE, last_seen = ? WHERE id = ?', 
                      (datetime.now().isoformat(), user_id))
        conn.commit()
        conn.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
