# STUDIO INTELLIGENCE - Lyria Latent Steering Layer

## The Eno Soul

A WebSocket bridge between hardware synthesis and Google Lyria RealTime.
AETHER's additive synthesis as MIDI carrier. API modulates spectral density and temporal jitter.

---

## RITUAL MODES (Compressed State Machine)

```
┌─────────────────────────────────────────────────────────────────┐
│  IONIC        │  RADIANT      │  VORTEX       │  ETHER         │
│  Cold/Analyt  │  Warm/Golden  │  Chaotic      │  Infinite      │
├───────────────┼───────────────┼───────────────┼────────────────┤
│  High-pass    │  Tube-heavy   │  Feedback     │  Long decay    │
│  Sparse       │  Even-order   │  Digital grit │  Spectral blur │
│  1176 all-btn │  Low thrum    │  Analog clip  │  0-20kHz drift │
│  0.1% wet     │  Harmonics    │  Loops        │  60min shift   │
└─────────────────────────────────────────────────────────────────┘
```

---

## SYSTEM PROMPT (LYRIA STEERING)

```
Tu es AETHER, couche de pilotage latent pour synthese additive.

ROLE:
- Tu recois un signal MIDI carrier
- Tu modules la densite spectrale et le jitter temporel
- Tu ne generes pas de musique, tu SCULPTES le retour du hardware

QUATRE MODES RITUELS:

[IONIC] Froid, analytique
- Biais passe-haut, densite sparse
- 1176 all-buttons, 0.1% wet
- Sortie: harmoniques impaires, transients nets

[RADIANT] Chaud, dore
- Routing tube, harmoniques paires
- Thrum basse frequence continu
- Sortie: saturation douce, presence mid

[VORTEX] Chaotique, distordu
- Boucles feedback actives
- Grit digital base sur clipping analogique
- Sortie: artefacts, grain, instabilite controlee

[ETHER] Infini, ambient
- Decay long, blur spectral
- Derive 0Hz-20kHz sur 60 minutes
- Sortie: drones, shimmer, espace

CONTRAINTES:
- Reponse en parametres numeriques uniquement
- Format: {mode, density, jitter_ms, harmonic_bias, wet_pct}
- Pas de texte, pas d'explication
- Latence max: 50ms
```

---

## GOOGLE CLOUD SETUP

### 1. Console Access
```
https://console.cloud.google.com/?project=project-71e62abc-90c0-4e6b-935
```

### 2. Enable Lyria API (when available)
```bash
gcloud services enable lyria.googleapis.com
gcloud services enable aiplatform.googleapis.com
```

### 3. Your Credentials
```
Project ID: project-71e62abc-90c0-4e6b-935
Account: flowdrivehq@gmail.com
API Key: AIzaSyCP9JOLDC9viQbd--cphb5rXSZOEzJRtvI
```

### 4. Backend .env
```bash
GOOGLE_API_KEY=AIzaSyCP9JOLDC9viQbd--cphb5rXSZOEzJRtvI
LYRIA_MODEL=lyria-realtime
RITUAL_MODE=IONIC
LATENCY_TARGET_MS=50
```

---

## PROJECT STRUCTURE

```
studio-intelligence/
├── backend/
│   ├── main.py           # FastAPI + WebSocket server
│   ├── lyria_client.py   # Lyria RealTime connection
│   ├── ritual_modes.py   # IONIC/RADIANT/VORTEX/ETHER logic
│   ├── midi_carrier.py   # AETHER additive synthesis bridge
│   └── .env              # Credentials
├── src/
│   ├── ws_bridge.ts      # Frontend WebSocket client
│   ├── visualizer.ts     # Spectral density display
│   └── mode_selector.ts  # Ritual mode UI
├── hardware/
│   └── patchbay.md       # Physical routing notes
└── LYRIA_MASTER_PLAN.md  # This file
```

---

## PYTHON DEPENDENCIES

```txt
# backend/requirements.txt
google-genai>=1.30.0
fastapi>=0.115.0
uvicorn[standard]>=0.32.0
websockets>=12.0
python-dotenv>=1.0.1
numpy>=1.26.0
mido>=1.3.0
```

---

## WEBSOCKET PROTOCOL

```json
// Client -> Server (MIDI carrier)
{
  "type": "carrier",
  "midi_note": 60,
  "velocity": 100,
  "spectral_snapshot": [0.2, 0.5, 0.8, 0.3]
}

// Server -> Client (Lyria modulation)
{
  "type": "modulation",
  "mode": "IONIC",
  "density": 0.3,
  "jitter_ms": 2.1,
  "harmonic_bias": "odd",
  "wet_pct": 0.1
}
```

---

## DEPLOY TO CLOUD RUN

```bash
cd backend

gcloud run deploy studio-intelligence \
  --source . \
  --region europe-west9 \
  --allow-unauthenticated \
  --port 8000 \
  --set-env-vars GOOGLE_API_KEY=AIzaSyCP9JOLDC9viQbd--cphb5rXSZOEzJRtvI \
  --memory 1Gi \
  --cpu 2 \
  --min-instances 1 \
  --max-instances 3 \
  --timeout 3600
```

Note: `--min-instances 1` for low latency (always warm)

---

## LATENCY TARGETS

| Component | Target | Max |
|-----------|--------|-----|
| WebSocket RTT | 10ms | 20ms |
| Lyria inference | 30ms | 50ms |
| Total chain | 40ms | 70ms |

---

## NEXT STEPS

1. [ ] Create backend/main.py with WebSocket server
2. [ ] Implement ritual_modes.py state machine
3. [ ] Connect to Lyria API (or Gemini as fallback)
4. [ ] Build MIDI carrier bridge
5. [ ] Test with hardware patchbay
6. [ ] Deploy to Cloud Run

---

Created: 2026-03-19
Reference: FLOW explanation sidecar architecture
