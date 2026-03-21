# Port Update: 8080 → 3111

All references to port 8080 have been updated to port 3111 across the entire stack.

## Files Updated

### Backend Configuration
- ✅ `backend/.env` - PORT=3111

### Frontend Engines
- ✅ `src/lib/lyria-stream-engine.ts` - Default serverUrl updated

### UI Pages
- ✅ `src/app/instruments/ritual/page.tsx` - WebSocket URL updated
- ✅ `src/app/vapor/page.tsx` - WebSocket URL updated

### Documentation
- ✅ `README.md` - All port references updated
- ✅ `backend/README.md` - All port references updated
- ✅ `LYRIA_INTEGRATION_COMPLETE.md` - All port references updated
- ✅ `VAPOR_INSTRUMENT.md` - All port references updated

## New URLs

### Backend
```
http://localhost:3111      # HTTP server
ws://localhost:3111/lyria-stream  # WebSocket endpoint
```

### Endpoints
- `GET http://localhost:3111/` - Health check
- `GET http://localhost:3111/modes` - List ritual modes
- `GET http://localhost:3111/health` - Detailed health
- `WS ws://localhost:3111/lyria-stream` - Main WebSocket

## How to Run

### Start Backend (New Port)
```bash
cd backend
python main.py
```
Server will start on port **3111**

### Frontend (Unchanged)
```bash
npm run dev
```
Still runs on port **3000**

Frontend will automatically connect to backend at `ws://localhost:3111/lyria-stream`

## Testing

### Test Backend
```bash
curl http://localhost:3111/
```

### Test WebSocket
```bash
wscat -c ws://localhost:3111/lyria-stream
```

## All Instruments Ready

Both instruments will now connect to port 3111:

- **VAPOR** (`/vapor`) - Granular synthesis with Lyria
- **Ritual Modes** (`/instruments/ritual`) - Mode selector UI

---

Updated: 2026-03-19
