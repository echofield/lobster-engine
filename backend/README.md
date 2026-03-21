# Studio Intelligence Backend - Lyria Bridge

WebSocket server providing real-time audio modulation via Google Lyria API and Ritual Mode steering.

## Architecture

```
Frontend (Browser)
    ↓ WebSocket
Backend (FastAPI)
    ↓ Ritual Modes
Lyria API (Google)
```

## Ritual Modes

Four sonic characters with distinct parameter profiles:

| Mode | Character | Density | Jitter | Harmonic Bias | Wet Mix |
|------|-----------|---------|--------|---------------|---------|
| **IONIC** | Cold, analytical | 15% | 0.5ms | Odd harmonics | 0.1% |
| **RADIANT** | Warm, golden | 45% | 1.2ms | Even harmonics | 25% |
| **VORTEX** | Chaotic, distorted | 85% | 8.5ms | All harmonics | 60% |
| **ETHER** | Infinite, ambient | 30% | 120ms | Spectral blur | 80% |

## Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment

Copy `.env` and add your Google API key:

```bash
GOOGLE_API_KEY=your_actual_api_key_here
RITUAL_MODE=IONIC
LATENCY_TARGET_MS=50
HOST=0.0.0.0
PORT=3111
CORS_ORIGINS=http://localhost:3000
```

### 3. Run Server

```bash
python main.py
```

Server starts on `http://localhost:3111`

WebSocket endpoint: `ws://localhost:3111/lyria-stream`

## API Endpoints

### HTTP Endpoints

#### `GET /`
Health check

```json
{
  "service": "Studio Intelligence - Lyria Bridge",
  "status": "running",
  "version": "0.1.0",
  "active_connections": 1
}
```

#### `GET /modes`
List available ritual modes with descriptions and parameters

#### `GET /health`
Detailed health check with connection stats

### WebSocket Protocol

#### Client → Server Messages

**Carrier Signal (MIDI note)**
```json
{
  "type": "carrier",
  "midi_note": 60,
  "velocity": 100,
  "spectral_snapshot": [0.2, 0.5, 0.8, 0.3]
}
```

**Set Ritual Mode**
```json
{
  "type": "set_mode",
  "mode": "RADIANT"
}
```

**Steering Update**
```json
{
  "type": "steering_update",
  "params": {
    "user_activity": 0.8,
    "gesture_energy": 0.5,
    "harmonic_field": [60, 64, 67],
    "session_duration": 120.5
  }
}
```

**Ping (latency check)**
```json
{
  "type": "ping"
}
```

#### Server → Client Messages

**Connection Established**
```json
{
  "type": "connected",
  "ritual_mode": "IONIC",
  "params": {
    "mode": "IONIC",
    "density": 0.15,
    "jitter_ms": 0.5,
    "harmonic_bias": "odd",
    "wet_pct": 0.001
  }
}
```

**Modulation Response**
```json
{
  "type": "modulation",
  "mode": "IONIC",
  "density": 0.15,
  "jitter_ms": 0.5,
  "harmonic_bias": "odd",
  "wet_pct": 0.001
}
```

**Mode Changed**
```json
{
  "type": "mode_changed",
  "mode": "VORTEX",
  "params": { ... }
}
```

**Error**
```json
{
  "type": "error",
  "error": "Invalid mode: INVALID_MODE"
}
```

## File Structure

```
backend/
├── main.py              # FastAPI server + WebSocket handler
├── ritual_modes.py      # Four ritual mode implementations
├── lyria_client.py      # Lyria API client (placeholder)
├── midi_carrier.py      # MIDI hardware bridge
├── requirements.txt     # Python dependencies
├── .env                 # Configuration
└── README.md            # This file
```

## Ritual Mode Engine

The `RitualModeEngine` class manages mode state and dynamic parameter modulation:

```python
from ritual_modes import create_ritual_engine

engine = create_ritual_engine("IONIC")

# Switch modes
engine.set_mode("RADIANT")

# Dynamic modulation
engine.modulate_density(user_activity=0.7)  # 0-1
engine.modulate_jitter(gesture_energy=0.5)  # 0-1
engine.apply_musical_context([60, 64, 67])  # MIDI notes
engine.evolve(session_duration=300)  # seconds

# Get current parameters
params = engine.get_params()
```

## MIDI Integration (Optional)

Connect MIDI hardware as carrier signal:

```python
from midi_carrier import MIDICarrierBridge

bridge = MIDICarrierBridge()
ports = bridge.list_ports()
bridge.connect(ports[0])

def handle_note(note):
    # Send to WebSocket clients
    # Trigger Lyria steering
    pass

bridge.on_note_event = handle_note
bridge.start_listening()  # Blocking
```

## Lyria API Status

**Current:** Placeholder implementation

**When available:** Will use `google-genai` library for real-time streaming:

```python
from google import genai

client = genai.Client(api_key=GOOGLE_API_KEY)
stream = client.audio.stream_generate(
    model="lyria-realtime",
    format="pcm_f32",
    sample_rate=48000,
)

# Send steering
await stream.send_steering({
    "mood": "ambient",
    "density": 0.3,
    "harmonic_field": [60, 67, 72]
})

# Receive audio
async for chunk in stream:
    # Send PCM to WebSocket client
    await websocket.send_bytes(chunk.audio_data)
```

## Development

### Running with Auto-Reload

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 3111
```

### Testing WebSocket Connection

```bash
# Install wscat
npm install -g wscat

# Connect
wscat -c ws://localhost:3111/lyria-stream

# Send test message
{"type": "ping"}
```

## Deployment

### Google Cloud Run

```bash
gcloud run deploy studio-intelligence \\
  --source . \\
  --region europe-west9 \\
  --allow-unauthenticated \\
  --port 8000 \\
  --set-env-vars GOOGLE_API_KEY=${GOOGLE_API_KEY} \\
  --memory 1Gi \\
  --cpu 2 \\
  --min-instances 1 \\
  --max-instances 3 \\
  --timeout 3600
```

**Note:** `--min-instances 1` ensures low latency (always warm)

## Latency Targets

| Component | Target | Max |
|-----------|--------|-----|
| WebSocket RTT | 10ms | 20ms |
| Lyria Inference | 30ms | 50ms |
| **Total Chain** | **40ms** | **70ms** |

## Troubleshooting

### WebSocket connection fails
- Check CORS_ORIGINS includes your frontend URL
- Verify backend is running on correct port
- Check firewall/network settings

### High latency
- Reduce buffer size in frontend config
- Check network conditions
- Consider deploying backend closer to users

### Ritual mode not switching
- Verify mode name is valid: IONIC, RADIANT, VORTEX, ETHER
- Check WebSocket connection state
- Look for errors in server logs

## Credits

Based on the LYRIA_MASTER_PLAN.md specification.

Ritual modes inspired by classic studio processing chains:
- **IONIC**: 1176 all-buttons compression
- **RADIANT**: Tube saturation (Manley, Chandler)
- **VORTEX**: Feedback/distortion (Moog, fuzz pedals)
- **ETHER**: Long reverbs (EMT 250, Lexicon 480L)
