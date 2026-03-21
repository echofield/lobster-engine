# VAPOR + Lyria Integration Handoff

**Date**: 2026-03-19
**Status**: Functional - Frontend & Backend Running, Particles Not Visible
**Ports**: Frontend on 3111, Backend on 3112

---

## 🎯 PROJECT INTENT

Created a **VAPOR granular synthesis instrument** with **Lyria backend integration** for the Studio Intelligence project. VAPOR generates cloud-like textures through granular synthesis, with Lyria providing AI-driven ritual mode modulation.

### Core Concept
- **VAPOR** = Frontend Web Audio granular synth with particle visualization
- **Lyria Bridge** = Python/FastAPI backend with 4 ritual modes (IONIC, RADIANT, VORTEX, ETHER)
- **WebSocket** = Real-time bidirectional communication between frontend and backend

---

## 🚀 QUICK START

### 1. Start Backend (Terminal 1)
```bash
cd C:\Users\echof\Desktop\02_PROJECTS\studio-intelligence\backend
python main.py
```
**Expected output:**
```
===============================================
  STUDIO INTELLIGENCE - Lyria Bridge
  Ritual Modes: IONIC | RADIANT | VORTEX | ETHER
===============================================

Starting server on 0.0.0.0:3112
WebSocket endpoint: ws://0.0.0.0:3112/lyria-stream
```

### 2. Start Frontend (Terminal 2)
```bash
cd C:\Users\echof\Desktop\02_PROJECTS\studio-intelligence
npm run dev
```
**Expected output:**
```
▲ Next.js 16.2.0 (Turbopack)
- Local:         http://localhost:3111
```

### 3. Open VAPOR
Navigate to: **http://localhost:3111/vapor**

### 4. Test Flow
1. Click "Initialize" button
2. Click "Connect" in Lyria Bridge panel (should show "Connected")
3. Click purple play button at bottom center
4. Press keyboard keys **A S D F G H J K** to play notes
5. Adjust sliders to control grain parameters
6. Switch Ritual Modes to change Lyria behavior

---

## 📁 FILE STRUCTURE

### Backend Files (Python/FastAPI)
```
backend/
├── main.py                  # WebSocket server, endpoints
├── ritual_modes.py          # 4 ritual mode state machines
├── lyria_client.py          # Google Lyria API client (placeholder)
├── midi_carrier.py          # MIDI hardware bridge
├── requirements.txt         # Python dependencies
├── .env                     # Environment config (PORT=3112)
└── README.md               # API documentation
```

### Frontend Files (Next.js/React/TypeScript)
```
src/
├── app/vapor/page.tsx       # VAPOR instrument UI component
├── lib/
│   ├── vapor-engine.ts      # Granular synthesis Web Audio engine
│   └── lyria-stream-engine.ts  # WebSocket client for Lyria
└── components/
    └── Navigation.tsx       # Added VAPOR link
```

### Documentation
```
├── VAPOR_LYRIA_HANDOFF.md       # This file
├── START.md                     # Quick start guide
├── PORTS.md                     # Port configuration details
├── VAPOR_INSTRUMENT.md          # VAPOR documentation
├── LYRIA_INTEGRATION_COMPLETE.md # Integration summary
└── backend/README.md            # Backend API docs
```

---

## 🔌 PORT CONFIGURATION

| Service | Port | URL |
|---------|------|-----|
| **Frontend** (Next.js) | 3111 | http://localhost:3111 |
| **Backend** (FastAPI) | 3112 | http://localhost:3112 |
| **WebSocket** | 3112 | ws://localhost:3112/lyria-stream |

### Where Ports Are Configured

**Frontend Port (3111):**
- File: `package.json`
- Line: `"dev": "next dev -p 3111"`

**Backend Port (3112):**
- File: `backend/.env`
- Line: `PORT=3112`

**WebSocket URL:**
- File: `src/lib/lyria-stream-engine.ts`
- Line 37: `serverUrl: 'ws://localhost:3112/lyria-stream'`

**CORS Configuration:**
- File: `backend/.env`
- Line: `CORS_ORIGINS=http://localhost:3111,https://studio-intelligence.vercel.app`

---

## 🎨 DESIGN SYSTEM

### Color Palette
- **Background**: `var(--background)` → `#FAF8F2` (cream)
- **Foreground**: `var(--foreground)` → `rgba(26, 26, 26, 0.8)`
- **Accent**: `rgba(124, 92, 255, 0.6)` (purple)
- **Particles**: `hsl(270 + pitch, 60%, 55%)` (purple with pitch variation)

### Typography
- **Title**: `text-3xl tracking-[0.3em] font-light uppercase`
- **Labels**: `text-[9px] tracking-[0.2em] uppercase opacity-0.35`
- **Values**: `text-xs font-light opacity-0.6`

### Layout
- **Canvas Container**: 800×500px centered
- **Sidebar**: 320px (w-80) right panel
- **Spacing**: p-6 for sections, space-y-6 for controls

---

## 🎹 AUDIO ENGINE ARCHITECTURE

### VaporEngine (src/lib/vapor-engine.ts)

**Parameters:**
```typescript
interface VaporParams {
  grainSize: number;      // 20-200ms
  density: number;        // 1-100 grains/sec
  pitchVariation: number; // 0-12 semitones
  spread: number;         // 0-1 position randomness
  baseFreq: number;       // Base frequency in Hz
}
```

**Key Methods:**
- `init()` - Initialize Web Audio context and nodes
- `start()` - Begin grain generation
- `stop()` - Stop grain generation
- `setGrainSize(size)`, `setDensity(density)`, etc. - Update parameters
- `getSpectralSnapshot()` - Return current spectral data for Lyria

**Audio Chain:**
```
GrainSource → GainNode (envelope) → StereoPanner → MasterGain
                                                        ↓
                                                    DryGain → Compressor → Output
                                                        ↓
                                                    Reverb → ReverbGain ↗
```

**Grain Buffer:**
- Rich harmonic spectrum: fundamental + 6 harmonics
- 500ms buffer duration
- Regenerated when baseFreq changes

### LyriaStreamEngine (src/lib/lyria-stream-engine.ts)

**WebSocket Protocol:**

**Client → Server:**
```json
{
  "type": "carrier",
  "midi_note": 60,
  "velocity": 100,
  "spectral_snapshot": [0.1, 0.3, 0.5, ...]
}

{
  "type": "set_mode",
  "mode": "IONIC" // or RADIANT, VORTEX, ETHER
}

{
  "type": "steering_update",
  "params": {
    "user_activity": 0.5,
    "gesture_energy": 0.3,
    "harmonic_field": [...]
  }
}
```

**Server → Client:**
```json
{
  "type": "connected",
  "ritual_mode": "IONIC",
  "params": {...}
}

{
  "type": "mode_changed",
  "mode": "RADIANT",
  "params": {...}
}

{
  "type": "modulation",
  "density": 0.15,
  "jitter_ms": 0.5,
  "harmonic_bias": "ODD",
  "wet_pct": 0.001
}
```

---

## 🔮 RITUAL MODES

Defined in `backend/ritual_modes.py`

### IONIC (Sparse, Analytical)
```python
{
  "density": 0.15,      # 15% grain density
  "jitter_ms": 0.5,     # 0.5ms timing jitter
  "harmonic_bias": "ODD",  # Odd harmonics
  "wet_pct": 0.001      # 0.1% Lyria wet signal
}
```

### RADIANT (Warm, Generous)
```python
{
  "density": 0.45,      # 45% grain density
  "jitter_ms": 1.2,     # 1.2ms timing jitter
  "harmonic_bias": "EVEN", # Even harmonics
  "wet_pct": 0.25       # 25% Lyria wet signal
}
```

### VORTEX (Chaotic, Dense)
```python
{
  "density": 0.85,      # 85% grain density
  "jitter_ms": 5.0,     # 5ms timing jitter
  "harmonic_bias": "FULL", # All harmonics
  "wet_pct": 0.60       # 60% Lyria wet signal
}
```

### ETHER (Ambient, Ethereal)
```python
{
  "density": 0.10,      # 10% grain density
  "jitter_ms": 2.5,     # 2.5ms timing jitter
  "harmonic_bias": "NONE", # No harmonics
  "wet_pct": 0.90       # 90% Lyria wet signal
}
```

---

## 🎨 PARTICLE VISUALIZATION

### Current Configuration (src/app/vapor/page.tsx)

**Particle Properties:**
```typescript
interface Particle {
  id: number;
  x: number;          // Position X
  y: number;          // Position Y
  vx: number;         // Velocity X (±2)
  vy: number;         // Velocity Y (±2)
  size: number;       // 20-60px
  opacity: number;    // 1.0 initial
  hue: number;        // 270 + pitch*6
}
```

**Spawn Logic:**
```typescript
spawnParticle(x, y, size, pitch) {
  // Called on every grain spawn
  // x, y: 0-1 normalized position
  // size: grain size factor
  // pitch: semitone offset from base
}
```

**Animation Loop:**
- Clear: `rgba(250, 248, 242, 0.15)` (fade trails)
- Update: `opacity *= 0.985`, `size *= 0.992`
- Draw: Radial gradient with 3 color stops
- Remove: When opacity < 0.01 or size < 1
- Max particles: 500

**Gradient:**
```javascript
gradient.addColorStop(0, `hsla(${hue}, 60%, 55%, ${opacity * 0.8})`);   // Center
gradient.addColorStop(0.5, `hsla(${hue}, 60%, 55%, ${opacity * 0.4})`); // Mid
gradient.addColorStop(1, `hsla(${hue}, 60%, 55%, 0)`);                  // Edge
```

---

## 🐛 CURRENT ISSUE: PARTICLES NOT VISIBLE

### Diagnosis

**User reports:** "don't see it still" (particles not appearing)

**Expected behavior:**
- When user clicks play button → spawn 10 initial particles
- When grains play → spawn particles continuously
- Particles should float across 800×500px canvas with purple trails

**Possible causes:**
1. **Canvas not rendering** - Check browser console for errors
2. **Animation loop not running** - `requestAnimationFrame` may not be starting
3. **Particles spawning outside canvas** - Position calculation issue
4. **Opacity/fade too aggressive** - Particles disappearing instantly
5. **Z-index issue** - Canvas hidden behind other elements

### Debug Steps for Next Claude Session

1. **Check browser console** (F12) for JavaScript errors
2. **Verify animation loop is running:**
   ```typescript
   // Add console.log in animate() function
   console.log('[VAPOR] Particles:', particlesRef.current.length);
   ```
3. **Test particle spawn directly:**
   ```typescript
   // Add to initEngines after startAnimation()
   setInterval(() => {
     spawnParticle(0.5, 0.5, 0.5, 0);
   }, 100);
   ```
4. **Check canvas dimensions:**
   ```typescript
   console.log('Canvas size:', canvas.width, canvas.height);
   ```
5. **Verify grain spawning:**
   ```typescript
   // In vapor-engine.ts spawnGrain()
   console.log('[Grain] Spawned at', now);
   ```

### Quick Fix Attempts

**Option 1: Force-spawn particles on init**
```typescript
useEffect(() => {
  if (isInitialized) {
    const interval = setInterval(() => {
      spawnParticle(Math.random(), Math.random(), 0.5, (Math.random() - 0.5) * 10);
    }, 50);

    setTimeout(() => clearInterval(interval), 2000);
  }
}, [isInitialized]);
```

**Option 2: Increase particle opacity/size**
```typescript
size: 40 + size * 60,  // Even bigger
opacity: 1.0,
ctx.fillStyle = 'rgba(250, 248, 242, 0.02)'; // Almost no fade
```

**Option 3: Test with solid color**
```typescript
// Replace gradient with solid color
ctx.fillStyle = `rgba(124, 92, 255, ${p.opacity})`;
ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
```

---

## 🎛️ KEYBOARD MAPPING

```
A → 261.63 Hz (C4)
S → 293.66 Hz (D4)
D → 329.63 Hz (E4)
F → 349.23 Hz (F4)
G → 392.00 Hz (G4)
H → 440.00 Hz (A4)
J → 493.88 Hz (B4)
K → 523.25 Hz (C5)

W, E, T, Y, U → Black keys (sharps/flats)
```

**Implementation:**
```typescript
const noteFrequencies: Record<string, number> = {
  'a': 261.63, 'w': 277.18, 's': 293.66, // etc...
};

handleKeyDown(e) {
  const freq = noteFrequencies[e.key.toLowerCase()];
  if (freq) {
    vaporRef.current.setBaseFreq(freq);
    vaporRef.current.start();
  }
}
```

---

## 📦 DEPENDENCIES

### Backend (backend/requirements.txt)
```
google-genai>=1.30.0        # Google Lyria API (placeholder)
fastapi>=0.115.0            # Web framework
uvicorn[standard]>=0.32.0   # ASGI server
websockets>=12.0            # WebSocket support
python-dotenv>=1.0.1        # Environment variables
numpy>=1.26.0               # Array operations
mido>=1.3.0                 # MIDI hardware support
```

**Installed versions:**
- numpy-2.4.3
- mido-1.3.3
- python-dotenv-1.2.2

### Frontend (package.json)
Already installed with the project:
- Next.js 16.2.0
- React 19
- TypeScript
- Tailwind CSS v4

---

## 🔧 BACKEND API REFERENCE

### Endpoints

**GET /**
```json
{
  "service": "Studio Intelligence - Lyria Bridge",
  "status": "running",
  "version": "0.1.0",
  "active_connections": 0
}
```

**GET /health**
```json
{
  "status": "healthy",
  "ritual_mode": "IONIC"
}
```

**GET /modes**
```json
{
  "available_modes": ["IONIC", "RADIANT", "VORTEX", "ETHER"],
  "current_mode": "IONIC"
}
```

**WebSocket /lyria-stream**
- Binary frames: PCM audio data (Float32Array)
- Text frames: JSON control messages

---

## 🎯 NEXT STEPS FOR CLAUDE

### Immediate Priority: Fix Particle Visualization

1. **Debug why particles aren't showing:**
   - Add console logging to track particle spawning
   - Verify animation loop is running
   - Check canvas rendering context

2. **Test particle system in isolation:**
   - Create simple test that spawns particles on click
   - Verify canvas dimensions match container
   - Test with solid colors before gradients

3. **Verify grain spawning:**
   - Confirm VaporEngine is actually generating grains
   - Check if `onGrainSpawn` callback is being called
   - Log grain spawn events to console

### Secondary: Enhance Integration

4. **Implement actual Lyria modulation:**
   - Backend currently just echoes parameters
   - Add real parameter modulation based on ritual modes
   - Implement density/jitter effects on grain generation

5. **Add visual feedback for ritual modes:**
   - Change particle colors based on active mode
   - Adjust particle behavior per mode (VORTEX = more chaos, ETHER = sparse)

6. **Audio improvements:**
   - Fine-tune reverb impulse response
   - Add filters for harmonic biasing
   - Implement stereo field controls

### Polish:

7. **UI refinements:**
   - Add tooltips to explain parameters
   - Show current note/frequency when playing
   - Display grain count/activity meter

8. **Performance optimization:**
   - Limit particle updates when not visible
   - Use WebGL for particle rendering if needed
   - Optimize grain scheduler

---

## 💡 DESIGN PHILOSOPHY

### Aesthetic Principles
- **High-end minimalism** - Every element has purpose
- **Cream & purple** - Warm background, cool accents
- **Space & breathing room** - Don't overcrowd
- **Subtle motion** - Particles float gently, not frantically
- **Typography as interface** - Clean uppercase tracking

### Interaction Principles
- **Immediate feedback** - Click should spawn particles instantly
- **Keyboard-first** - Quick note entry via ASDF keys
- **Visual = sonic** - What you see reflects what you hear
- **No loading states** - Initialize fast, connect async

### Code Principles
- **Composition over inheritance** - VaporEngine is self-contained
- **Callbacks for coupling** - `onGrainSpawn` links audio to visual
- **TypeScript strictness** - Full type safety
- **Separation of concerns** - UI, audio, network in separate files

---

## 📝 NOTES FOR HANDOFF

### What's Working:
✅ Frontend server running on port 3111
✅ Backend server running on port 3112
✅ WebSocket connection establishes successfully
✅ Lyria Bridge shows "Connected"
✅ Ritual mode buttons render and send messages
✅ Audio engine initializes without errors
✅ Keyboard input captured
✅ Parameter sliders functional

### What's Not Working:
❌ Particles not visible on canvas (CRITICAL ISSUE)
❌ No visual feedback when playing
❌ Backend doesn't actually modulate parameters yet
❌ Ritual modes don't affect grain generation

### What Needs Testing:
⚠️ Actual audio output (user hasn't mentioned hearing sound)
⚠️ Ritual mode parameter changes reaching frontend
⚠️ Grain density responding to slider changes
⚠️ Multiple simultaneous notes (polyphony)

### Environment Context:
- **OS**: Windows 11
- **Python**: 3.13
- **Node**: Latest (Turbopack enabled)
- **Browser**: Unknown (likely Chrome/Edge)
- **Working directory**: `C:\Users\echof\Desktop\02_PROJECTS\studio-intelligence`

### User Expectations:
- "Beautiful floating balls" with trails
- Clean, minimal aesthetic like Aether instrument
- Ritual modes should work
- Keyboard playable immediately
- Professional, "future-looking" design

---

## 🚨 CRITICAL PATH FOR FIX

**Priority 1:** Get particles visible
```typescript
// Test in browser console:
document.querySelector('canvas').getContext('2d').fillStyle = 'red';
document.querySelector('canvas').getContext('2d').fillRect(100, 100, 50, 50);
// Should see red square - if not, canvas isn't rendering
```

**Priority 2:** Verify audio is playing
```typescript
// Check in browser console:
console.log(vaporRef.current?.isActive());
// Should return true when playing
```

**Priority 3:** Add debug overlays
```typescript
// Show particle count on canvas
ctx.fillStyle = 'black';
ctx.font = '12px monospace';
ctx.fillText(`Particles: ${particlesRef.current.length}`, 10, 20);
```

---

## 📞 WHERE TO GET HELP

- **Backend issues**: Check `backend/README.md` for API docs
- **Audio issues**: Review `src/lib/vapor-engine.ts` comments
- **WebSocket issues**: See `src/lib/lyria-stream-engine.ts`
- **Design reference**: Look at `src/app/aether/page.tsx` (working example)

---

**Generated**: 2026-03-19 by Claude Sonnet 4.5
**Project**: Studio Intelligence - VAPOR + Lyria Integration
**Session Goal**: Get particle visualization working, ritual modes functional
