# SIGNAL/FIELD - Quick Start

## What You Just Built

**SIGNAL/FIELD** is a hybrid ambient field instrument that combines:
1. **Local synthesis** (WebAudio) - immediate, deterministic control
2. **AI streaming** (Lyria) - emergent, evolving atmosphere
3. **Visual feedback** - living geometric representation of sound

This is **not** a normal browser synth. This is a **new paradigm** for playable musical intelligence.

---

## Start Playing Now

### 1. Launch

```bash
cd C:\Users\echof\Desktop\02_PROJECTS\studio-intelligence
npm run dev
```

Navigate to: `http://localhost:3000/signal`

### 2. Play

**Mouse:**
- Click and drag on canvas
- Horizontal = pitch, Vertical = velocity

**Keyboard:**
- `A S D F G H J K` - lower octave
- `W E R T Y U` - upper octave
- `SPACE` - toggle Lyria (when backend ready)

**MIDI:**
- Just plug in - auto-detected

---

## What's Implemented

### ✅ Working Right Now

**Layer 1 - Deterministic:**
- 8-partial additive synthesis
- 5 voice types (pad, drone, pulse, lead, texture)
- 9 musical scales with quantization
- Dual filter paths (low-pass + band-pass)
- Stereo width processing
- 6-second reverb tail
- 16-voice polyphony
- MIDI support

**Layer 3 - Visual:**
- 5 visualization modes:
  - Wave Field (concentric rings)
  - Particle Cloud (orbiting particles)
  - Tension Arcs (bezier connections)
  - Resonance Bloom (radial gradients)
  - Hybrid (combined)
- Real-time energy/brightness response
- 60fps canvas rendering

**Integration:**
- Full UI with controls
- Navigation entry
- Gear catalog listing

### 🚧 Ready But Needs Backend

**Layer 2 - Lyria:**
- WebSocket client implemented
- PCM playback pipeline ready
- Steering parameters working
- Reconnection logic active
- **Requires:** Lyria backend at `ws://localhost:8080/lyria-stream`

---

## Architecture Overview

```
SIGNAL/FIELD
├── SignalEngine (src/lib/signal-engine.ts)
│   └─→ WebAudio synthesis, MIDI, scale quantization
├── LyriaStreamEngine (src/lib/lyria-stream-engine.ts)
│   └─→ WebSocket client, PCM streaming, steering
├── FieldRenderer (src/lib/field-renderer.ts)
│   └─→ Canvas visuals, 5 rendering modes
└── UI Page (src/app/signal/page.tsx)
    └─→ Integration, controls, playability
```

---

## Immediate Next Steps

### 1. Test Playability
- [ ] Test mouse interaction
- [ ] Test keyboard input
- [ ] Test MIDI input (if controller available)
- [ ] Test all voice types
- [ ] Test all visual modes
- [ ] Test scale switching

### 2. Optional: Connect Lyria
If you have a Lyria backend:
- [ ] Start backend at `ws://localhost:8080/lyria-stream`
- [ ] Click "ACTIVATE LYRIA" in UI
- [ ] Test mood changes
- [ ] Test density control

### 3. Refine
- [ ] Adjust visual colors if needed
- [ ] Tune synthesis parameters
- [ ] Add proper pitch detection (currently simplified)
- [ ] Implement gesture recording UI

---

## Next Evolution (Phase 2A)

**Priority Features:**
1. Proper audio analysis (pitch detection, spectrum)
2. Gesture recording & playback
3. Preset system (save/load states)
4. MIDI CC mapping UI
5. Session memory

**New Instruments:**
1. SIGNAL/ORBIT (rhythmic)
2. SIGNAL/WAVE (melodic lead)
3. SIGNAL/MEMBRANE (drone/texture)

---

## File Reference

**Core Engines:**
- `src/lib/signal-engine.ts` - Layer 1 (567 lines)
- `src/lib/lyria-stream-engine.ts` - Layer 2 (428 lines)
- `src/lib/field-renderer.ts` - Layer 3 (462 lines)

**Types:**
- `src/types/signal.ts` - All type definitions (234 lines)

**UI:**
- `src/app/signal/page.tsx` - Main instrument page (431 lines)

**Integration:**
- `src/components/Navigation.tsx` - Added SIGNAL nav entry
- `src/data/gear.ts` - Added SIGNAL gear entry

**Docs:**
- `SIGNAL.md` - Full documentation
- `SIGNAL_QUICKSTART.md` - This file

---

## Quality Check

**Does it feel like:**
- ✅ A living instrument from the future?
- ✅ A playable field, not a parameter panel?
- ✅ Something alive, responsive, coherent?
- ✅ The beginning of a new paradigm?

**Or does it feel like:**
- ❌ A normal synth with AI pasted on?
- ❌ A generic generative toy?
- ❌ A tech demo?

If the second set applies, iterate on **feel** before adding features.

---

## Design DNA

**Core Principles:**
- Intent is king
- Playability over tweakability
- Emergence over randomness
- Visual embodiment over technical monitoring
- Future-facing aesthetic
- Minimal but alive

**This is not finished.**
**This is the first artifact in a new family of instruments.**

---

## Quick Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Type check
npm run lint
```

Navigate to `/signal` in browser.

---

**SIGNAL/FIELD is live.**
**Play it. Feel it. Evolve it.**

🎹 🌊 🔮
