# Studio Intelligence

A bilingual (FR/EN) studio assistant web app for a professional recording/mastering studio in Paris.

## What This Is

- **Studio Encyclopedia**: Complete gear inventory, patchbay topology, and signal routing
- **Web Instruments**: Browser-based synthesizers with recording and export
- **Lyria Integration**: Real-time AI audio modulation via Google Lyria API

## Tech Stack

- **Frontend**: Next.js 16+ App Router, TypeScript, Tailwind CSS v4
- **Backend**: FastAPI (Python), WebSocket streaming
- **Audio**: Web Audio API, additive synthesis
- **AI**: Google Lyria RealTime API (when available)

## Getting Started

### Frontend

```bash
npm install
npm run dev
```

Open [http://localhost:3111](http://localhost:3111)

### Backend (Lyria Bridge)

```bash
cd backend
pip install -r requirements.txt
python main.py
```

Backend runs on `http://localhost:3112`

See [backend/README.md](./backend/README.md) for full backend documentation.

## Project Structure

```
studio-intelligence/
├── backend/              # Python FastAPI server
│   ├── main.py           # WebSocket server
│   ├── ritual_modes.py   # Four ritual mode implementations
│   ├── lyria_client.py   # Lyria API integration (placeholder)
│   └── midi_carrier.py   # MIDI hardware bridge
├── src/
│   ├── app/              # Next.js pages
│   │   ├── aether/       # Aether instrument (additive synthesis)
│   │   ├── instruments/
│   │   │   └── ritual/   # Ritual Modes instrument
│   │   ├── gear/         # Studio gear catalog
│   │   ├── patchbay/     # Interactive patchbay
│   │   └── chains/       # Signal chain builder
│   ├── components/       # React components
│   ├── data/             # Studio knowledge base
│   │   ├── gear.ts       # Complete equipment specs
│   │   ├── patchbay.ts   # Patchbay topology
│   │   └── signal-chains.ts
│   ├── lib/              # Audio engines & utilities
│   │   ├── aether-engine.ts         # Additive synthesis
│   │   ├── lyria-stream-engine.ts   # WebSocket audio streaming
│   │   └── signal-engine.ts         # Studio signal routing
│   └── types/            # TypeScript interfaces
└── LYRIA_MASTER_PLAN.md  # Lyria integration spec
```

## Features

### Web Instruments

#### Aether
Crystalline additive synthesis engine
- Pentatonic/modal scales
- MIDI hardware support
- Recording & WAV export
- Visual feedback (ripples, waveforms)

**Route**: `/aether`

#### Ritual Modes
Four sonic characters powered by Lyria steering:

| Mode | Character | Use Case |
|------|-----------|----------|
| **IONIC** | Cold, analytical | Precision work, clarity |
| **RADIANT** | Warm, golden | Musical sweetening |
| **VORTEX** | Chaotic, distorted | Creative destruction |
| **ETHER** | Infinite, ambient | Long-form atmospheres |

**Route**: `/instruments/ritual`

### Studio Features

- **Gear Catalog** (`/gear`): Complete equipment inventory with specs
- **Patchbay** (`/patchbay`): Interactive signal routing visualization
- **Signal Chains** (`/chains`): Pre-built routing templates
- **Guided Mode** (`/guide`): Step-by-step workflow assistance

## Lyria Integration

The backend provides a WebSocket bridge for real-time Lyria API streaming:

1. **Carrier Signal**: Frontend sends MIDI notes + spectral data
2. **Ritual Modes**: Backend applies one of four sonic characters
3. **Modulation**: Lyria returns audio processing parameters
4. **Sub-50ms latency** target

**WebSocket**: `ws://localhost:3112/lyria-stream`

See `LYRIA_MASTER_PLAN.md` for full integration spec.

## Commands

- `npm run dev` — Start Next.js dev server
- `npm run build` — Production build
- `npm run lint` — Run ESLint

## Environment Variables

### Frontend (`.env.local`)

```bash
# Optional: Custom backend URL
NEXT_PUBLIC_LYRIA_WS_URL=ws://localhost:3112/lyria-stream
```

### Backend (`backend/.env`)

```bash
GOOGLE_API_KEY=your_google_api_key
RITUAL_MODE=IONIC
LATENCY_TARGET_MS=50
PORT=3112
CORS_ORIGINS=http://localhost:3111
```

## Studio Context

This app encodes the complete topology of a professional Parisian recording studio:

- **Studer console**: Analog heart, all mic inputs and line routing
- **Patchbay**: Signex/Isopatch Bantam Pro Series (TT/bantam)
- **Digital path**: Lynx/Burl/Prism converters → Pro Tools HD Native
- **Analog path**: Studer console → tape or direct
- **Crookwood monitor controller**: Central monitoring hub

## Design Philosophy

- **Utilitarian aesthetic**: This is a working tool, not marketing
- **Dark theme**: Studio environment
- **Monospace labels**: Technical precision
- **Color-coded signal paths**: Match physical patchbay labels

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [FastAPI](https://fastapi.tiangolo.com/)

## Deploy

### Frontend (Vercel)

```bash
vercel deploy
```

### Backend (Google Cloud Run)

```bash
cd backend
gcloud run deploy studio-intelligence \
  --source . \
  --region europe-west9 \
  --set-env-vars GOOGLE_API_KEY=${GOOGLE_API_KEY}
```

See [backend/README.md](./backend/README.md) for full deployment guide.
