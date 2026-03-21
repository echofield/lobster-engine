"""
STUDIO INTELLIGENCE - Lyria WebSocket Server

FastAPI server providing WebSocket bridge between:
- Frontend (browser-based instruments)
- Lyria RealTime API (Google)
- MIDI hardware (future)
"""

import os
import asyncio
import json
from typing import Dict, Set
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import numpy as np

from ritual_modes import RitualModeEngine, create_ritual_engine, validate_mode

load_dotenv()

# Configuration
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
RITUAL_MODE = os.getenv("RITUAL_MODE", "IONIC")
LATENCY_TARGET_MS = int(os.getenv("LATENCY_TARGET_MS", "50"))
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8080"))

active_connections: Set[WebSocket] = set()
ritual_engines: Dict[WebSocket, RitualModeEngine] = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"[Startup] Studio Intelligence Backend")
    print(f"[Startup] Default ritual mode: {RITUAL_MODE}")
    yield
    print("[Shutdown] Closing all connections...")
    for ws in list(active_connections):
        await ws.close()
    active_connections.clear()

app = FastAPI(
    title="Studio Intelligence - Lyria Bridge",
    description="Real-time audio modulation via Lyria API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.websocket("/lyria-stream")
async def websocket_lyria_stream(websocket: WebSocket):
    await websocket.accept()
    active_connections.add(websocket)

    ritual_engine = create_ritual_engine(RITUAL_MODE)
    ritual_engines[websocket] = ritual_engine

    print(f"[WebSocket] Client connected. Active: {len(active_connections)}")

    try:
        await websocket.send_json({
            "type": "connected",
            "ritual_mode": ritual_engine.current_mode,
            "params": ritual_engine.get_params(),
        })

        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            message_type = message.get("type")

            if message_type == "carrier":
                await handle_carrier(websocket, ritual_engine, message)
            elif message_type == "set_mode":
                await handle_set_mode(websocket, ritual_engine, message)
            elif message_type == "steering_update":
                await handle_steering_update(websocket, ritual_engine, message)
            elif message_type == "ping":
                await websocket.send_json({"type": "pong"})

    except WebSocketDisconnect:
        print(f"[WebSocket] Client disconnected")
    finally:
        active_connections.discard(websocket)
        ritual_engines.pop(websocket, None)

async def handle_carrier(websocket: WebSocket, engine: RitualModeEngine, message: dict):
    midi_note = message.get("midi_note", 60)
    velocity = message.get("velocity", 100)
    spectral_snapshot = message.get("spectral_snapshot", [])

    user_activity = velocity / 127.0
    if spectral_snapshot:
        spectral_energy = float(np.mean(spectral_snapshot))
        user_activity = (user_activity + spectral_energy) / 2.0

    engine.modulate_density(user_activity)
    params = engine.get_params()

    await websocket.send_json({"type": "modulation", **params})

async def handle_set_mode(websocket: WebSocket, engine: RitualModeEngine, message: dict):
    mode = message.get("mode", "IONIC")

    if not validate_mode(mode):
        await websocket.send_json({"type": "error", "error": f"Invalid mode: {mode}"})
        return

    params = engine.set_mode(mode)
    await websocket.send_json({"type": "mode_changed", "mode": mode, "params": params})
    print(f"[RitualMode] Switched to {mode}")

async def handle_steering_update(websocket: WebSocket, engine: RitualModeEngine, message: dict):
    params = message.get("params", {})

    if "user_activity" in params:
        engine.modulate_density(params["user_activity"])
    if "gesture_energy" in params:
        engine.modulate_jitter(params["gesture_energy"])
    if "harmonic_field" in params:
        engine.apply_musical_context(params["harmonic_field"])
    if "session_duration" in params:
        engine.evolve(params["session_duration"])

    current_params = engine.get_params()
    await websocket.send_json({"type": "modulation", **current_params})

@app.get("/")
async def root():
    return {
        "service": "Studio Intelligence - Lyria Bridge",
        "status": "running",
        "version": "0.1.0",
        "active_connections": len(active_connections),
    }

@app.get("/modes")
async def list_modes():
    from ritual_modes import get_mode_description, RITUAL_PRESETS

    return {
        "modes": {
            mode: {
                "description": get_mode_description(mode),
                "params": RITUAL_PRESETS[mode],
            }
            for mode in ["IONIC", "RADIANT", "VORTEX", "ETHER"]
        }
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "connections": {"active": len(active_connections)},
        "config": {"latency_target_ms": LATENCY_TARGET_MS},
    }

if __name__ == "__main__":
    import uvicorn

    print("""
    ===============================================
      STUDIO INTELLIGENCE - Lyria Bridge
      Ritual Modes: IONIC | RADIANT | VORTEX | ETHER
    ===============================================
    """)

    uvicorn.run("main:app", host=HOST, port=PORT, log_level="info", reload=True)
