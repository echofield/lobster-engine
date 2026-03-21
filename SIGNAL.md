# SIGNAL: Playable Intelligence

## What SIGNAL Is

**SIGNAL is not a normal music app.**
**SIGNAL is not a plugin clone.**
**SIGNAL is not just "AI music generation".**

SIGNAL is a **hybrid musical paradigm**—a new kind of playable instrument where:
- **Deterministic control** provides precision and immediacy
- **Generative emergence** provides atmosphere and evolution
- **Visual embodiment** provides felt perception

This is the beginning of a series of instruments that reimagine what musical interfaces can be.

---

## System Architecture

SIGNAL operates as a **three-layer hybrid system**:

```
┌─────────────────────────────────────────────────────────────┐
│                        SIGNAL/FIELD                          │
│                  Hybrid Instrument System                    │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼────────┐  ┌─────────▼────────┐  ┌────────▼─────────┐
│  DETERMINISTIC │  │   LYRIA REALTIME │  │     FEEDBACK     │
│     LAYER      │  │      LAYER       │  │   MEMBRANE       │
│                │  │                  │  │                  │
│ • WebAudio     │  │ • WebSocket      │  │ • Pitch Analysis │
│ • MIDI/Mouse   │  │ • PCM Stream     │  │ • Energy Field   │
│ • Scale Locks  │  │ • Context Aware  │  │ • Motion Visual  │
│ • Immediate    │  │ • Steerable      │  │ • Living Geometry│
│                │  │                  │  │                  │
│ [Local Synth]  │  │ [AI Companion]   │  │ [Visual Echo]    │
└────────┬───────┘  └────────┬─────────┘  └────────┬─────────┘
         │                   │                      │
         └───────────────────┼──────────────────────┘
                             │
                      ┌──────▼──────┐
                      │ AUDIO MIXER │
                      │   ROUTING   │
                      └──────┬──────┘
                             │
                        [Output]
```

---

## Layer 1: Deterministic Engine

**File:** `src/lib/signal-engine.ts`

**Purpose:** Precision, immediacy, direct playability

**Capabilities:**
- 8 harmonic partials for rich additive synthesis
- Multiple voice types: `pad`, `drone`, `pulse`, `lead`, `texture`
- Musical scale quantization (9 scales)
- Dual filter paths (low-pass + band-pass)
- Enhanced stereo width processing
- 6-second reverb tail for ambient space
- 16-voice polyphony with intelligent voice stealing
- Chord memory (last 3 notes) and harmonic field tracking

**Sonic Character:**
Crystalline pads meet warm analog drones. Glass meets wood. Precision meets breath.

**Control:**
- Mouse/Touch: Click/drag on canvas
- Keyboard: ASDFGHJK / WERTYU for direct note control
- MIDI: Full MIDI input support (auto-detected)
- Parameters: Voice type, scale, root note

---

## Layer 2: Lyria RealTime Stream

**File:** `src/lib/lyria-stream-engine.ts`

**Purpose:** Emergence, atmosphere, adaptive accompaniment

**Capabilities:**
- WebSocket connection to Lyria backend
- PCM audio streaming (44.1kHz/48kHz)
- Real-time steering parameters:
  - **Mood:** ambient, tension, drift, pulse
  - **Density:** 0-1 (sparse to dense)
  - **Harmonic Field:** Inherits from Layer 1
  - **User Activity:** Auto-tracked 0-1
  - **Gesture Energy:** Responds to performance intensity
- Automatic reconnection with exponential backoff
- Crossfade transitions for seamless integration

**Philosophy:**
Lyria is **NOT** a "press button get track" feature.
It's a **responsive musical field** that:
- Expands when you play sparse notes
- Recedes when you play densely
- Mirrors your harmonic choices
- Fills space without dominating
- Acts as an intelligent ambient co-performer

**Connection:**
- Default: `ws://localhost:8080/lyria-stream`
- Configurable via `LyriaStreamConfig`
- Requires `lyria-realtime-exp` backend running

---

## Layer 3: Visual Feedback Membrane

**File:** `src/lib/field-renderer.ts`

**Purpose:** Turn sound into felt motion, embodied perception

**Visualization Modes:**

1. **Wave Field** (default)
   - Concentric rings pulsing with energy
   - Ripples on note onsets
   - Breathing central field

2. **Particle Cloud**
   - Orbiting particles responding to frequency
   - Energy-reactive size and glow
   - Purple-to-blue hue mapping

3. **Tension Arcs**
   - Bezier curves connecting energetic particles
   - Organic movement patterns
   - Reveals harmonic relationships

4. **Resonance Bloom**
   - Multi-layer radial gradients
   - Petal-like structures
   - Brightness-reactive color shifts

5. **Hybrid**
   - Combines Wave Field + Particle Cloud
   - Maximum visual richness

**Design Language:**
- Dark field (inverse of studio-intelligence cream)
- Purple/blue gradients
- No hard edges—only fields and flows
- **Not** a spectrum analyzer, **not** a DAW meter
- A **living membrane** between player and system

---

## Current Implementation Status

### ✅ Functional Now

- [x] SignalEngine with 8-partial additive synthesis
- [x] Multiple voice types (pad, drone, pulse, lead, texture)
- [x] Scale quantization (9 scales)
- [x] Mouse/keyboard input
- [x] MIDI support (Web MIDI API)
- [x] Dual filter paths + stereo processing
- [x] 6-second reverb
- [x] FieldRenderer with 5 visualization modes
- [x] Real-time visual feedback
- [x] LyriaStreamEngine architecture
- [x] WebSocket client for Lyria
- [x] Steering parameter system
- [x] UI integration in studio-intelligence
- [x] Navigation entry
- [x] Gear catalog entry

### 🚧 Experimental / In Development

- [ ] **Lyria backend integration** - Requires `lyria-realtime-exp` server
- [ ] **Audio analysis for pitch detection** - Currently uses simplified energy tracking
- [ ] **Gesture recording** - Architecture exists, UI not implemented
- [ ] **Preset system** - Types defined, storage not implemented
- [ ] **MIDI CC mapping** - Structure ready, UI controls needed

---

## How to Use

### 1. Start the Development Server

```bash
cd studio-intelligence
npm run dev
```

Navigate to `http://localhost:3000/signal`

### 2. Play the Instrument

**Mouse/Touch:**
- Click anywhere on the canvas to trigger a note
- Drag horizontally → change pitch
- Drag vertically → change velocity/brightness
- Release → note release (long tail)

**Keyboard:**
- `A S D F G H J K` → Lower octave scale degrees
- `W E R T Y U` → Upper octave scale degrees
- `SPACE` → Toggle Lyria connection (when backend available)

**MIDI:**
- Connect MIDI controller
- Web MIDI auto-detects inputs
- Notes are quantized to active scale

### 3. Shape the Sound

**Layer 1 (Deterministic):**
- **Voice Type:** Pad (long), Drone (continuous), Pulse (percussive), Lead (expressive), Texture (granular)
- **Scale:** Choose from 9 scales (pentatonic, major, minor, etc.)
- **Root Note:** Set fundamental pitch (MIDI 36-84)

**Layer 2 (Lyria):**
- **Activate Lyria:** Toggle connection (requires backend)
- **Mood:** Ambient, Tension, Drift, Pulse
- **Density:** 0-100% (sparse to dense)

**Layer 3 (Visual):**
- **Mode:** Wave Field, Particle Cloud, Tension Arcs, Resonance Bloom, Hybrid

---

## Setting Up Lyria Backend

**Note:** The Lyria backend (`lyria-realtime-exp`) is a separate system for real-time AI audio streaming.

### Requirements:
- WebSocket server at `ws://localhost:8080/lyria-stream`
- Accepts JSON steering messages
- Streams PCM audio as binary frames

### Example Server Message Format:

**Client → Server (Steering):**
```json
{
  "type": "steering_update",
  "params": {
    "mood": "ambient",
    "density": 0.3,
    "harmonicField": [60, 67, 72],
    "userActivity": 0.5,
    "gestureEnergy": 0.7,
    "sessionDuration": 120,
    "evolutionRate": 0.5
  }
}
```

**Server → Client (Audio):**
- Binary ArrayBuffer of Float32 PCM samples
- Interleaved stereo (LRLRLR...)
- Sample rate: 44100 or 48000 Hz

---

## Next Evolution Phases

### Phase 2A: Enhanced Playability (Immediate Next Steps)

**Goals:**
- Make SIGNAL/FIELD production-ready
- Add missing playability features
- Improve responsiveness

**Tasks:**
1. **Proper Audio Analysis**
   - Implement pitch detection (autocorrelation or YIN algorithm)
   - Real-time frequency analysis for visual layer
   - Onset detection for particle bursts

2. **Gesture Recording & Playback**
   - Record user gestures with timestamps
   - Playback loops
   - Export as MIDI or JSON

3. **Preset System**
   - Save/load instrument states
   - Preset browser
   - Tagging and search

4. **MIDI CC Mapping UI**
   - Visual CC mapping interface
   - Learn mode for quick mapping
   - Save mappings per preset

5. **Session Memory**
   - Auto-save last state
   - Session history
   - Export session data

---

### Phase 2B: Additional Instruments (Expand the Series)

**Goals:**
- Create 3 more SIGNAL instruments
- Each with distinct sonic identity
- Reuse core architecture

**Instruments:**

#### **SIGNAL/ORBIT**
- **Type:** Rhythmic field instrument
- **Sonic Identity:** Sequenced pulses, polyrhythmic patterns, percussive drones
- **Unique Features:**
  - Euclidean rhythm generator
  - Phase-offset oscillators
  - Pulse density control
  - Orbital motion visuals

#### **SIGNAL/WAVE**
- **Type:** Melodic lead instrument
- **Sonic Identity:** Singing, expressive, FM-like clarity
- **Unique Features:**
  - Expressive pitch bend
  - Vibrato and tremolo
  - Lead voice with formants
  - Wave interference visuals

#### **SIGNAL/MEMBRANE**
- **Type:** Drone and texture instrument
- **Sonic Identity:** Sustained, evolving, granular atmospheres
- **Unique Features:**
  - Infinite sustain mode
  - Granular texture engine
  - Slow LFO modulation
  - Membrane tension visuals

---

### Phase 3: Collaborative & Connected (Future Vision)

**Goals:**
- Multi-user sessions
- Integration with real studio synths
- External audio input
- Cloud session storage

**Features:**

1. **Collaborative Sessions**
   - Multiple users in same SIGNAL instance
   - Each user has a color/identifier
   - Shared harmonic field
   - Real-time gesture synchronization
   - WebRTC or WebSocket-based

2. **Studio Synth Integration**
   - MIDI output to hardware synths
   - Audio input from external sources
   - Hybrid analog/digital/AI routing
   - Patchbay integration

3. **External Audio Input**
   - Microphone input
   - Line input via WebRTC
   - Real-time audio analysis
   - Use external audio to steer Lyria

4. **Recording & Looping**
   - Multi-track recording
   - Live looping with overdub
   - Export to WAV/FLAC
   - Session export to DAW

5. **Cloud Features**
   - Session storage
   - Preset sharing
   - Collaborative preset library
   - Session replay

---

### Phase 4: Platform & Ecosystem (Long-term Vision)

**Goals:**
- SIGNAL becomes a platform
- Plugin architecture for community instruments
- Mobile and hardware versions

**Features:**

1. **Plugin Architecture**
   - Community-created instruments
   - Custom visual renderers
   - Custom Lyria steering models
   - Marketplace for instruments

2. **Mobile Version**
   - Touch-optimized UI
   - Accelerometer control
   - AirPlay/Bluetooth audio
   - Cross-device sessions

3. **Hardware Controller**
   - Custom MIDI controller design
   - Physical knobs/pads
   - Visual feedback display
   - Standalone operation

4. **DAW Integration**
   - VST/AU plugin wrapper
   - Ableton Link integration
   - MIDI clock sync
   - Audio/MIDI export

---

## Technical Architecture Notes

### File Structure

```
studio-intelligence/
├── src/
│   ├── app/
│   │   └── signal/
│   │       └── page.tsx              # Main SIGNAL/FIELD UI
│   ├── lib/
│   │   ├── signal-engine.ts          # Layer 1: Deterministic synthesis
│   │   ├── lyria-stream-engine.ts    # Layer 2: AI streaming
│   │   └── field-renderer.ts         # Layer 3: Visual feedback
│   ├── types/
│   │   └── signal.ts                 # All SIGNAL type definitions
│   ├── data/
│   │   └── gear.ts                   # SIGNAL added to gear catalog
│   └── components/
│       └── Navigation.tsx            # SIGNAL added to nav
└── SIGNAL.md                         # This document
```

### Key Dependencies

- **Next.js 16** - App Router framework
- **React 19** - UI components
- **TypeScript 5** - Type safety
- **Tailwind CSS v4** - Styling
- **Web Audio API** - Local synthesis
- **Web MIDI API** - MIDI input
- **WebSocket API** - Lyria streaming
- **Canvas API** - Visual rendering

### Browser Requirements

- Modern browser with:
  - Web Audio API support
  - Web MIDI API support (optional)
  - WebSocket support
  - Canvas 2D support
  - ES2020+ JavaScript

Tested on:
- Chrome/Edge 120+
- Firefox 120+
- Safari 17+

---

## Design Philosophy

### The Intent is King

Every design decision in SIGNAL prioritizes **playability** and **intent expression**:
- Direct manipulation over parameter tweaking
- Musical constraints (scales) over infinite possibility
- Visual feedback over technical monitoring
- Emergence over randomness

### The Future Must Look Like the Future

SIGNAL's visual and interaction design avoids:
- Generic plugin UIs
- Cliché sci-fi aesthetics
- Dashboard-heavy layouts
- Skeuomorphic controls

Instead, it embraces:
- Minimal but alive
- Elegant, not crowded
- Subtle motion
- Wave, resonance, orbit, field, tension, signal

### Everything Must Lead Somewhere

SIGNAL is designed as **Phase 1** of a larger vision:
- Modular architecture for extensibility
- Clean APIs for future integrations
- Type-safe contracts between layers
- Documented evolution path

This is not a finished product.
This is the **first artifact in a new family of instruments.**

---

## Quality Bar

**If this feels like:**
- A normal browser synth with AI pasted on top → **FAILED**
- A generic generative music toy → **FAILED**
- A tech demo without musical soul → **FAILED**

**If this feels like:**
- A living hybrid instrument from the future → **SUCCEEDED**
- A new way to think about musical interfaces → **SUCCEEDED**
- The beginning of something larger → **SUCCEEDED**

---

## Credits

**Concept & Architecture:** Studio Intelligence
**Implementation:** Claude Code (Anthropic)
**Paradigm:** Playable Intelligence
**License:** TBD (currently proprietary)

---

## Contact & Feedback

For questions, feedback, or collaboration:
- GitHub Issues: [TBD]
- Email: [TBD]
- Discord: [TBD]

---

**SIGNAL/FIELD** is the first in a series of hybrid instruments.
More instruments are coming.
The future of playable intelligence starts here.

🎹 🌊 🔮
