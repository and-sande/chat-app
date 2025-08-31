# 🚀 Modern Chat Application

A beautiful, real-time chat application built with **React + TypeScript + FastAPI + WebSockets** featuring a modern glassmorphism UI design.

## ✨ Features

- **Real-time messaging** with WebSocket support
- **Multiple chat channels** with dynamic creation
- **Modern glassmorphism UI** with smooth animations
- **Responsive design** that works on all devices
- **User management** with online/offline status
- **Typing indicators** for better user experience
- **Channel management** with private/public options
- **Beautiful gradients** and modern color schemes

## 🏗️ Architecture

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: FastAPI + WebSockets + Pydantic
- **Real-time**: WebSocket connections for instant messaging
- **Styling**: Modern glassmorphism design with custom animations

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- Python 3.8+
- npm or yarn

### 1. Clone and Setup

```bash
git clone <your-repo>
cd chat-app
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 4. Start the Backend Server

```bash
cd backend
python main.py
```

The FastAPI server will start on `http://localhost:8000`

### 5. Start the Frontend Development Server

```bash
# In a new terminal, from the root directory
npm run dev
```

The React app will start on `http://localhost:3000`

## 🌐 API Endpoints

### REST API
- `GET /api/health` - Health check
- `GET /api/users` - Get all users
- `GET /api/channels` - Get all channels
- `GET /api/channels/{id}/messages` - Get channel messages
- `POST /api/users/connect` - Connect a new user
- `POST /api/channels` - Create a new channel

### WebSocket
- `ws://localhost:8000/ws/{user_id}` - Real-time messaging

## 🎨 UI Features

- **Glassmorphism Design**: Modern translucent UI elements
- **Animated Backgrounds**: Floating blob animations
- **Gradient Themes**: Purple to pink color schemes
- **Smooth Transitions**: Hover effects and animations
- **Responsive Layout**: Works on desktop and mobile
- **Custom Icons**: Lucide React icon library
- **Dark Theme**: Modern dark color palette

## 🔧 Development

### Frontend Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Backend Scripts
```bash
cd backend
python main.py       # Start FastAPI server
```

### Project Structure
```
chat-app/
├── src/                 # React frontend
│   ├── App.tsx         # Main application component
│   ├── main.tsx        # React entry point
│   ├── index.css       # Global styles and animations
│   └── lib/            # Utility functions
├── backend/            # FastAPI backend
│   ├── main.py         # Main API server
│   └── requirements.txt # Python dependencies
├── public/             # Static assets
└── package.json        # Frontend dependencies
```

## 🌟 Key Components

### Frontend
- **Modern React Hooks**: useState, useEffect, useRef
- **TypeScript**: Full type safety
- **Tailwind CSS**: Utility-first styling
- **WebSocket Client**: Real-time communication
- **Responsive Design**: Mobile-first approach

### Backend
- **FastAPI**: Modern Python web framework
- **WebSockets**: Real-time bidirectional communication
- **Pydantic**: Data validation and serialization
- **CORS Support**: Cross-origin resource sharing
- **Async/Await**: High-performance async operations

## 🎯 Usage

1. **Connect**: Enter username to join the chat
2. **Navigate**: Use sidebar to switch between channels
3. **Chat**: Send real-time messages in any channel
4. **Create Channels**: Add new channels with descriptions
5. **Home Dashboard**: Overview of all available channels

## 🔒 Security Features

- **Username Validation**: Prevents duplicate usernames
- **Input Sanitization**: Safe message handling
- **CORS Configuration**: Secure cross-origin requests
- **WebSocket Authentication**: User-based connections

## 🚀 Deployment

### Frontend
```bash
npm run build
# Deploy dist/ folder to your hosting service
```

### Backend
```bash
# Use uvicorn for production
uvicorn main:app --host 0.0.0.0 --port 8000
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

MIT License - feel free to use this project for your own applications!

## 🆘 Support

If you encounter any issues:
1. Check the console for error messages
2. Ensure both frontend and backend are running
3. Verify WebSocket connections in browser dev tools
4. Check API endpoints are accessible

---

**Built with ❤️ using React + FastAPI + WebSockets**
