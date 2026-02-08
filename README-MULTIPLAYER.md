# Blades of the Fallen - Online Multiplayer

A real-time online multiplayer fighting game built with React, Node.js, WebSockets, and MongoDB.

## Project Structure

```
js game/
├── client/          # React frontend (Vite)
│   ├── src/
│   │   ├── screens/     # Login, Lobby, Game, Results
│   │   ├── hooks/       # useWebSocket, useGameLoop, useInputHandler
│   │   ├── game/        # GameRenderer
│   │   └── styles/      # CSS
│   └── public/          # Sprites, images, audio
│
└── server/          # Node.js backend
    └── src/
        ├── game/        # GameRoom, Fighter, Physics
        ├── matchmaking/ # Lobby system
        ├── db/          # MongoDB models
        └── utils/       # Validation, constants
```

## Quick Start

### 1. Start the Server

```bash
cd server
npm install
cp .env.example .env  # Configure MongoDB URI
npm run dev
```

### 2. Start the Client

```bash
cd client
npm install
npm run dev
```

### 3. Open Game
Visit `http://localhost:5173` in two browser tabs to test locally.

## Game Controls

- **WASD** - Move
- **Space** - Attack

## Deployment

### Backend (Render/Railway)

1. Create new Web Service
2. Connect your GitHub repo
3. Set build command: `npm install`
4. Set start command: `node src/index.js`
5. Add environment variables:
   - `MONGODB_URI` - Your MongoDB Atlas connection string
   - `PORT` - Usually auto-set by host

### Frontend (Netlify)

1. Connect your GitHub repo
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variable:
   - `VITE_WS_URL` - Your backend WSS URL (e.g., `wss://your-app.onrender.com`)

## Features

- ✅ WebSocket real-time communication
- ✅ Authoritative server game loop
- ✅ Client-side prediction
- ✅ Room-based matchmaking
- ✅ Rate limiting & input validation
- ✅ Sprite-based animations
