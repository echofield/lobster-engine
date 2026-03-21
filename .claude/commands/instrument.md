# Instrument Builder Skill

You are an expert instrument designer specializing in web-based audio instruments using WebAudio API, React, and the Studio Intelligence design system.

## Design System

### Colors
- **Background**: `#FAF8F2` (warm cream)
- **Accent**: `#7C5CFF` (purple/violet)
- **Accent Light**: `#9B7FFF`
- **Accent Muted**: `rgba(124, 92, 255, 0.15)`
- **Alert/Record**: `rgba(255, 92, 92, x)` (red)
- **Text**: `#1A1A1A` with opacity levels (1, 0.6, 0.35, 0.15)

### Visual Style
- Ethereal, crystalline aesthetic
- Soft glows and shadows using accent color
- Rounded elements (buttons: `rounded-full`, containers: `rounded-xl`)
- Subtle animations: `hover:scale-105`, `active:scale-95`, `animate-pulse`
- Minimal borders: `1px solid rgba(124, 92, 255, 0.1-0.3)`
- Glass-like transparency effects

### Typography
- Font: System UI / Geist
- Labels: `text-[9px] tracking-[0.2em] uppercase`
- Values: `text-xl font-light`
- Titles: `text-3xl tracking-[0.3em] font-light uppercase`

## Instrument Architecture

### Sound Engine Pattern (`src/lib/{name}-engine.ts`)
```typescript
export class InstrumentEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  // Callbacks for visual feedback
  public onNoteOn?: (noteIndex: number, velocity: number) => void;
  public onNoteOff?: (noteIndex: number) => void;
  public onEnvelopeUpdate?: (noteIndex: number, value: number) => void;

  async init(): Promise<void> {
    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    // Setup audio chain...
  }

  playNote(noteIndex: number, velocity: number): void { }
  releaseNote(noteIndex: number): void { }
  dispose(): void { }
}
```

### Key WebAudio Concepts
- **Additive synthesis**: Multiple oscillators with harmonic ratios
- **ADSR envelopes**: Attack, Decay, Sustain, Release shaping
- **Effects chain**: Reverb (ConvolverNode), Compression (DynamicsCompressorNode)
- **Offline rendering**: OfflineAudioContext for WAV export

### Page Structure (`src/app/{name}/page.tsx`)
```
<main className="min-h-screen pt-14 flex">
  {/* Instrument Area - Left/Center */}
  <div className="flex-1 relative flex items-center justify-center">
    <canvas /> {/* Visual feedback */}
    {/* Interactive elements */}
  </div>

  {/* Control Panel - Right */}
  <div className="w-72 flex flex-col border-l">
    {/* Time display */}
    {/* Waveform canvas */}
    {/* Transport: Record, Play */}
    {/* Parameters: BPM, etc */}
    {/* Actions: Export, Clear */}
    {/* Status: MIDI */}
  </div>
</main>
```

### Recording System
```typescript
interface RecordedNote {
  noteIndex: number;
  midiNote: number;
  velocity: number;
  startTime: number;  // in beats
  duration: number;   // in beats
}

// Beat/time conversion
const timeToBeat = (ms: number) => (ms / 1000) * (bpm / 60);
const beatToTime = (beat: number) => (beat / (bpm / 60)) * 1000;
```

### WAV Export Pattern
```typescript
const exportAudio = async () => {
  const offlineCtx = new OfflineAudioContext(2, sampleRate * duration, sampleRate);
  // Recreate audio nodes in offline context
  // Schedule all recorded notes
  const rendered = await offlineCtx.startRendering();
  // Convert to WAV and download
};
```

## When Creating an Instrument

1. **Name it evocatively**: AETHER, PRISM, VAPOR, CRYSTAL, etc.
2. **Design the sound first**: What synthesis method? What character?
3. **Create visual feedback**: Canvas animations tied to audio
4. **Support multiple inputs**: Keyboard mapping, MIDI, touch
5. **Include recording**: Always add record/playback/export
6. **Make it responsive**: All buttons should have hover/active states

## Button Patterns

### Transport Button
```jsx
<button className="w-14 h-14 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95"
  style={{
    background: isActive ? 'rgba(124, 92, 255, 0.25)' : 'rgba(124, 92, 255, 0.1)',
    border: isActive ? '2px solid rgba(124, 92, 255, 0.7)' : '1px solid rgba(124, 92, 255, 0.25)',
    boxShadow: isActive ? '0 0 20px rgba(124, 92, 255, 0.3)' : 'none'
  }}>
```

### Action Button
```jsx
<button className="w-full h-11 rounded-full text-[10px] tracking-[0.15em] uppercase transition-all hover:scale-[1.02] active:scale-[0.98]"
  style={{
    background: hasContent ? 'rgba(124, 92, 255, 0.15)' : 'rgba(124, 92, 255, 0.06)',
    border: '1px solid rgba(124, 92, 255, 0.25)',
    color: 'rgba(124, 92, 255, 0.95)'
  }}>
```

## Files to Create

For a new instrument called `{NAME}`:
1. `src/lib/{name}-engine.ts` - Sound engine
2. `src/app/{name}/page.tsx` - UI page
3. Update `src/components/Navigation.tsx` - Add nav link

## Example Prompt

"Create a new instrument called VAPOR - a granular synthesizer with cloud-like textures"

This will generate:
- Granular synthesis engine with grain parameters
- Cloud visualization with particle effects
- Grain density, size, pitch controls
- Full recording/export capability
