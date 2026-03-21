# VAPOR - Granular Synthesis × Lyria

A new instrument combining **granular synthesis** with **Lyria ritual mode modulation**.

## What It Is

VAPOR generates cloud-like textures by playing many tiny "grains" of audio simultaneously. Each grain is a short snippet (20-200ms) with randomized pitch, position, and timing. When combined with Lyria's ritual modes, the granular parameters become carrier signals for AI-driven modulation.

## How It Works

### Granular Synthesis Engine
- **Grains**: Tiny audio snippets played continuously
- **Grain Size**: 20-200ms (controls texture density)
- **Density**: 1-100 grains/second (controls cloud thickness)
- **Pitch Variation**: ±12 semitones (creates harmonic spread)
- **Cloud Spread**: 0-100% (spatial randomness)

### Visual Feedback
- Particle cloud visualization
- Each grain spawns a glowing particle
- Particles drift, fade, and bounce
- Color varies with pitch (purple hues)

### Lyria Integration
- Connects to backend WebSocket server
- Sends granular parameters as carrier signals
- Receives ritual mode modulation
- Real-time activity monitoring

## Files Created

```
src/lib/vapor-engine.ts       # Granular synthesis engine
src/app/vapor/page.tsx         # Full UI with Lyria integration
src/components/Navigation.tsx  # Updated with VAPOR + Ritual links
```

## How to Use

1. **Navigate to** `http://localhost:3000/vapor`

2. **Initialize Audio**
   - Click "Initialize Audio" button
   - Grants Web Audio API permission

3. **Start the Cloud**
   - Click the large play button
   - Grains begin spawning continuously
   - Watch particles drift across the canvas

4. **Adjust Parameters**
   - **Grain Size**: Smaller = more articulate, larger = smoother
   - **Density**: More grains = thicker texture
   - **Pitch Variation**: Higher = more harmonic chaos
   - **Cloud Spread**: Higher = wider spatial distribution

5. **Connect to Lyria** (Optional)
   - Click "Connect" in Lyria Connection panel
   - Backend must be running on `localhost:3111`
   - Select a Ritual Mode (IONIC, RADIANT, VORTEX, ETHER)
   - Granular parameters now modulate via Lyria

## Ritual Mode Effects

### IONIC - Cold, Analytical
- Tightens grain timing
- Reduces density slightly
- Creates precise, crystalline clouds

### RADIANT - Warm, Golden
- Increases harmonic richness
- Adds warmth to grain envelope
- Creates glowing, sustained textures

### VORTEX - Chaotic, Distorted
- Maximum instability
- Wild pitch variation
- Dense, turbulent clouds

### ETHER - Infinite, Ambient
- Long grain decay
- Spectral blur
- Slow-evolving drones

## Architecture

```
┌─────────────────────────────────────────┐
│           VAPOR Page (UI)               │
│  ┌────────────────┐  ┌────────────────┐ │
│  │  Canvas        │  │  Controls      │ │
│  │  (Particles)   │  │  - Grain Size  │ │
│  │                │  │  - Density     │ │
│  │                │  │  - Pitch Var   │ │
│  │                │  │  - Spread      │ │
│  └────────────────┘  └────────────────┘ │
└───────────┬─────────────────────────────┘
            │
            ├──> VaporEngine (Granular Synthesis)
            │    - Grain scheduling
            │    - Audio buffer playback
            │    - Reverb/compression chain
            │
            └──> LyriaStreamEngine (WebSocket)
                 - Backend connection
                 - Ritual mode selection
                 - Parameter modulation
```

## Integration with Backend

### Carrier Signals Sent to Lyria
```json
{
  "type": "steering_update",
  "params": {
    "density": 0.45,          // Grain density normalized
    "userActivity": 0.8,      // Active grain count
    "spectralSnapshot": [...] // Pitch distribution
  }
}
```

### Modulation Received from Lyria
```json
{
  "type": "modulation",
  "mode": "VORTEX",
  "density": 0.85,
  "jitter_ms": 8.5,
  "harmonic_bias": "all",
  "wet_pct": 0.6
}
```

## Key Features

✅ **Granular Synthesis** - Real-time grain generation
✅ **Visual Feedback** - Particle cloud visualization
✅ **Lyria Integration** - Four ritual mode support
✅ **Real-time Parameters** - Smooth parameter updates
✅ **AETHER Design System** - Consistent visual language
✅ **Activity Monitoring** - Live grain count display

## Comparison with Other Instruments

| Feature | AETHER | VAPOR | Ritual Modes |
|---------|--------|-------|--------------|
| Synthesis | Additive | Granular | None (UI only) |
| Visual | Ripples | Particle cloud | Mode selector |
| Lyria | No | Yes | Yes |
| Recording | Yes | Planned | No |
| MIDI | Yes | Planned | No |
| Playable | Keyboard | Continuous | Test keyboard |

## Future Enhancements

- **Recording & Export**: Capture granular clouds as WAV
- **MIDI Control**: Map MIDI CC to grain parameters
- **Sample Buffer**: Load audio files for grain source
- **Freeze Mode**: Capture and loop grain cloud
- **Envelope Control**: Custom grain ADSR

## Technical Details

### Audio Chain
```
GrainBuffer → BufferSourceNode → GainNode (envelope)
                                      ↓
                              StereoPannerNode (spatial)
                                      ↓
                                 MasterGain
                                 ↓       ↓
                              DryGain  Reverb
                                 ↓       ↓
                              Compressor ← ReverbGain
                                      ↓
                                 Destination
```

### Grain Scheduling
- Scheduled via `setTimeout` at 10ms intervals
- Grain rate: `1 / density` seconds
- Each grain: `20-200ms` duration
- Envelope: Triangular (fast attack, slow decay)
- Pitch: `playbackRate = 2^(semitones/12)`

### Performance
- Max active grains: ~200
- Particle limit: 200 (oldest removed)
- Canvas: `requestAnimationFrame` at 60fps
- Grain cleanup: Automatic on completion

## Credits

- **Design System**: AETHER aesthetic (warm cream, purple)
- **Synthesis Method**: Granular (classic technique)
- **Lyria Integration**: Based on LYRIA_MASTER_PLAN.md
- **Visual Style**: Particle physics simulation

---

**Created**: 2026-03-19
**Route**: `/vapor`
**Status**: Ready to use
