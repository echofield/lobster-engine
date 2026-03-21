# Quick Start Guide

## Port Configuration

```
┌─────────────────────────────────────────┐
│  Frontend (Next.js)                     │
│  http://localhost:3111                  │
│                                         │
│  - VAPOR:        /vapor                 │
│  - Ritual Modes: /instruments/ritual    │
│  - AETHER:       /aether                │
│                                         │
│         ↓ WebSocket Connection          │
│                                         │
│  Backend (FastAPI)                      │
│  http://localhost:3112                  │
│  ws://localhost:3112/lyria-stream       │
│                                         │
│  - Health: GET /                        │
│  - Modes:  GET /modes                   │
│  - Health: GET /health                  │
└─────────────────────────────────────────┘
```

## 1. Start Backend

```bash
cd backend
python main.py
```

You should see:
```
╔═══════════════════════════════════════════════╗
║  STUDIO INTELLIGENCE - Lyria Bridge          ║
║  Ritual Modes: IONIC • RADIANT • VORTEX • ETHER ║
╚═══════════════════════════════════════════════╝

Starting server on 0.0.0.0:3112
WebSocket endpoint: ws://0.0.0.0:3112/lyria-stream
```

## 2. Start Frontend

```bash
npm run dev
```

You should see:
```
- Local:   http://localhost:3111
```

## 3. Test the Setup

### Open VAPOR (Granular Synthesis + Lyria)
```
http://localhost:3111/vapor
```

1. Click "Initialize Audio"
2. Click "Connect" in Lyria Connection panel
3. Select a Ritual Mode (IONIC, RADIANT, VORTEX, ETHER)
4. Click the large play button
5. Adjust grain parameters
6. Watch the particle cloud!

### Open Ritual Modes (Mode Selector UI)
```
http://localhost:3111/instruments/ritual
```

1. Click "Initialize Audio"
2. Click "Connect to Backend"
3. Select a ritual mode
4. Use the test keyboard to play notes

### Open AETHER (Additive Synthesis)
```
http://localhost:3111/aether
```

Classic additive synthesis with recording and MIDI support.

## Troubleshooting

### Backend won't start
```bash
# Check if port 3112 is already in use
netstat -ano | findstr :3112

# Install dependencies
cd backend
pip install -r requirements.txt
```

### Frontend won't start
```bash
# Check if port 3111 is already in use
netstat -ano | findstr :3111

# Install dependencies
npm install
```

### WebSocket connection fails
1. Make sure backend is running on port 3112
2. Check browser console for errors
3. Verify CORS settings in backend/.env

### No audio output
1. Click "Initialize Audio" first
2. Grant browser permissions for audio
3. Check that audio engine initialized (no errors in console)
4. Note: Lyria is currently a placeholder (sends parameters, not audio)

## What Each Instrument Does

### VAPOR
- **Type**: Granular synthesis
- **Lyria**: Yes (sends grain parameters as carrier signals)
- **Visual**: Particle cloud
- **Controls**: Grain size, density, pitch variation, spread

### Ritual Modes
- **Type**: UI only (mode selector)
- **Lyria**: Yes (switches between IONIC/RADIANT/VORTEX/ETHER)
- **Visual**: Mode cards with descriptions
- **Controls**: Mode selector, test keyboard

### AETHER
- **Type**: Additive synthesis
- **Lyria**: No
- **Visual**: Ripples and waveforms
- **Controls**: Scale, root note, recording, MIDI

## Files to Check

```
backend/.env          # Backend port configuration (PORT=3112)
package.json          # Frontend port configuration (dev: "next dev -p 3111")
PORTS.md             # Detailed port documentation
```

---

Happy synthesizing! 🎵
