# Port Configuration

Frontend and Backend run on separate ports to avoid conflicts.

## Port Assignment

```
Frontend (Next.js):  http://localhost:3111
Backend (FastAPI):   http://localhost:3112
WebSocket:           ws://localhost:3112/lyria-stream
```

## Why Different Ports?

Both servers need to bind to a port. Running them on the same port would cause a conflict. The frontend connects to the backend via WebSocket on port 3112.

## How to Run

### 1. Start Backend (Port 3112)
```bash
cd backend
python main.py
```

Output:
```
Starting server on 0.0.0.0:3112
WebSocket endpoint: ws://0.0.0.0:3112/lyria-stream
```

### 2. Start Frontend (Port 3111)
```bash
npm run dev
```

Output:
```
- Local:   http://localhost:3111
```

### 3. Access Applications

**Instruments:**
- VAPOR: http://localhost:3111/vapor
- Ritual Modes: http://localhost:3111/instruments/ritual
- AETHER: http://localhost:3111/aether

**Backend API:**
- Health: http://localhost:3112/
- Modes: http://localhost:3112/modes
- Health Details: http://localhost:3112/health

## Configuration Files

### Backend (.env)
```bash
PORT=3112
CORS_ORIGINS=http://localhost:3111
```

### Frontend (package.json)
```json
{
  "scripts": {
    "dev": "next dev -p 3111"
  }
}
```

### WebSocket Connections
All frontend instruments connect to:
```
ws://localhost:3112/lyria-stream
```

Configured in:
- `src/lib/lyria-stream-engine.ts` (default URL)
- `src/app/instruments/ritual/page.tsx`
- `src/app/vapor/page.tsx`

## Production Deployment

In production, you typically:
1. Build frontend: `npm run build`
2. Deploy backend and frontend separately
3. Set environment variables for URLs

Example:
- Frontend: https://studio-intelligence.vercel.app
- Backend: https://api.studio-intelligence.app
- WebSocket: wss://api.studio-intelligence.app/lyria-stream

---

Updated: 2026-03-19
