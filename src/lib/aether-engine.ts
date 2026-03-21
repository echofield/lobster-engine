/**
 * AETHER Sound Engine
 *
 * A crystalline synthesis engine designed for ethereal, resonant sound.
 * Based on additive synthesis with harmonic partials, subtle detuning,
 * and organic envelope shaping.
 *
 * Sound character: Glass harmonica meets singing bowls meets celestial pads.
 */

// Scale definitions (intervals from root)
export const SCALES = {
  pentatonic: [0, 2, 4, 7, 9],
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  whole_tone: [0, 2, 4, 6, 8, 10],
  harmonic_minor: [0, 2, 3, 5, 7, 8, 11],
} as const;

export type ScaleName = keyof typeof SCALES;

// Note names for display
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Harmonic partial configuration for rich, crystalline sound
const PARTIALS = [
  { ratio: 1, gain: 1.0 },      // Fundamental
  { ratio: 2, gain: 0.5 },      // Octave
  { ratio: 3, gain: 0.25 },     // Fifth above octave
  { ratio: 4, gain: 0.125 },    // Two octaves
  { ratio: 5, gain: 0.08 },     // Major third above two octaves
  { ratio: 6, gain: 0.05 },     // Perfect fifth above two octaves
];

interface Voice {
  oscillators: OscillatorNode[];
  gains: GainNode[];
  masterGain: GainNode;
  filter: BiquadFilterNode;
  noteIndex: number;
  midiNote: number;
  startTime: number;
  released: boolean;
  releaseTime?: number;
}

interface EnvelopeParams {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

export class AetherEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private reverb: ConvolverNode | null = null;
  private reverbGain: GainNode | null = null;
  private dryGain: GainNode | null = null;
  private voices: Map<number, Voice> = new Map();
  private scale: readonly number[] = SCALES.pentatonic;
  private rootNote: number = 60; // Middle C
  private octaveRange: number = 2;

  // Callbacks for visual feedback
  public onNoteOn?: (noteIndex: number, midiNote: number, velocity: number) => void;
  public onNoteOff?: (noteIndex: number) => void;
  public onEnvelopeUpdate?: (noteIndex: number, value: number) => void;

  private envelope: EnvelopeParams = {
    attack: 0.15,    // Soft attack for crystalline feel
    decay: 0.3,
    sustain: 0.6,
    release: 2.5,    // Long release for resonance
  };

  private maxPolyphony = 12;
  private animationFrameId: number | null = null;
  private isRunning = false;

  async init(): Promise<void> {
    if (this.ctx) return;

    this.ctx = new AudioContext();

    // Master output chain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.7;

    // Compressor for smooth dynamics
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -24;
    this.compressor.knee.value = 30;
    this.compressor.ratio.value = 4;
    this.compressor.attack.value = 0.003;
    this.compressor.release.value = 0.25;

    // Reverb for space
    this.reverb = this.ctx.createConvolver();
    this.reverbGain = this.ctx.createGain();
    this.reverbGain.gain.value = 0.35;

    this.dryGain = this.ctx.createGain();
    this.dryGain.gain.value = 0.7;

    // Create impulse response for reverb
    await this.createReverbImpulse();

    // Connect the chain
    this.masterGain.connect(this.dryGain);
    this.masterGain.connect(this.reverb);
    this.reverb.connect(this.reverbGain);
    this.dryGain.connect(this.compressor);
    this.reverbGain.connect(this.compressor);
    this.compressor.connect(this.ctx.destination);

    // Start envelope tracking
    this.startEnvelopeTracking();
  }

  private async createReverbImpulse(): Promise<void> {
    if (!this.ctx || !this.reverb) return;

    // Create a beautiful algorithmic reverb impulse
    const duration = 4;
    const sampleRate = this.ctx.sampleRate;
    const length = duration * sampleRate;
    const impulse = this.ctx.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        // Exponential decay with some early reflections
        const decay = Math.exp(-3 * t);
        // Add some modulation for richness
        const modulation = 1 + 0.1 * Math.sin(t * 2 * Math.PI * 0.5);
        // Random noise shaped by decay
        channelData[i] = (Math.random() * 2 - 1) * decay * modulation;

        // Early reflections
        if (t < 0.1) {
          const earlyGain = Math.exp(-20 * t);
          channelData[i] += (Math.random() * 2 - 1) * earlyGain * 0.5;
        }
      }
    }

    this.reverb.buffer = impulse;
  }

  private startEnvelopeTracking(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    const track = () => {
      if (!this.isRunning || !this.ctx) return;

      const now = this.ctx.currentTime;

      this.voices.forEach((voice, noteIndex) => {
        let envelopeValue: number;

        if (!voice.released) {
          // Attack/decay/sustain phase
          const elapsed = now - voice.startTime;
          if (elapsed < this.envelope.attack) {
            envelopeValue = elapsed / this.envelope.attack;
          } else if (elapsed < this.envelope.attack + this.envelope.decay) {
            const decayElapsed = elapsed - this.envelope.attack;
            const decayProgress = decayElapsed / this.envelope.decay;
            envelopeValue = 1 - (1 - this.envelope.sustain) * decayProgress;
          } else {
            envelopeValue = this.envelope.sustain;
          }
        } else {
          // Release phase
          const releaseElapsed = now - (voice.releaseTime || now);
          const releaseProgress = releaseElapsed / this.envelope.release;
          if (releaseProgress >= 1) {
            this.cleanupVoice(noteIndex);
            return;
          }
          envelopeValue = this.envelope.sustain * (1 - releaseProgress);
        }

        this.onEnvelopeUpdate?.(noteIndex, Math.max(0, Math.min(1, envelopeValue)));
      });

      this.animationFrameId = requestAnimationFrame(track);
    };

    track();
  }

  private stopEnvelopeTracking(): void {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  setScale(scaleName: ScaleName): void {
    this.scale = SCALES[scaleName];
  }

  setRoot(midiNote: number): void {
    this.rootNote = midiNote;
  }

  getScaleNotes(): { midiNote: number; name: string; octave: number }[] {
    const notes: { midiNote: number; name: string; octave: number }[] = [];

    for (let octave = 0; octave < this.octaveRange; octave++) {
      for (let i = 0; i < this.scale.length; i++) {
        const midiNote = this.rootNote + this.scale[i] + (octave * 12);
        const noteName = NOTE_NAMES[midiNote % 12];
        const noteOctave = Math.floor(midiNote / 12) - 1;
        notes.push({ midiNote, name: noteName, octave: noteOctave });
      }
    }

    return notes;
  }

  private midiToFrequency(midiNote: number): number {
    return 440 * Math.pow(2, (midiNote - 69) / 12);
  }

  playNote(noteIndex: number, velocity: number = 0.8): void {
    if (!this.ctx || !this.masterGain) return;

    // Voice stealing if needed
    if (this.voices.size >= this.maxPolyphony) {
      const oldestVoice = Array.from(this.voices.entries())
        .sort((a, b) => a[1].startTime - b[1].startTime)[0];
      if (oldestVoice) {
        this.releaseNote(oldestVoice[0]);
      }
    }

    // If this note is already playing, release it first
    if (this.voices.has(noteIndex)) {
      this.releaseNote(noteIndex);
    }

    const scaleNotes = this.getScaleNotes();
    if (noteIndex < 0 || noteIndex >= scaleNotes.length) return;

    const { midiNote } = scaleNotes[noteIndex];
    const frequency = this.midiToFrequency(midiNote);
    const now = this.ctx.currentTime;

    // Create voice
    const voice: Voice = {
      oscillators: [],
      gains: [],
      masterGain: this.ctx.createGain(),
      filter: this.ctx.createBiquadFilter(),
      noteIndex,
      midiNote,
      startTime: now,
      released: false,
    };

    // Configure filter for warmth
    voice.filter.type = 'lowpass';
    voice.filter.frequency.value = 2000 + velocity * 4000;
    voice.filter.Q.value = 0.7;

    // Create partials for rich harmonic content
    for (const partial of PARTIALS) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      // Slight detuning for chorus effect (± 3 cents random)
      const detune = (Math.random() - 0.5) * 6;
      osc.frequency.value = frequency * partial.ratio;
      osc.detune.value = detune;

      gain.gain.value = 0;

      osc.connect(gain);
      gain.connect(voice.filter);

      voice.oscillators.push(osc);
      voice.gains.push(gain);

      osc.start(now);

      // Apply envelope to this partial
      const targetGain = partial.gain * velocity * 0.3;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(targetGain, now + this.envelope.attack);
      gain.gain.linearRampToValueAtTime(
        targetGain * this.envelope.sustain,
        now + this.envelope.attack + this.envelope.decay
      );
    }

    // Connect voice to master
    voice.filter.connect(voice.masterGain);
    voice.masterGain.gain.value = 1;
    voice.masterGain.connect(this.masterGain);

    this.voices.set(noteIndex, voice);

    // Callback for visuals
    this.onNoteOn?.(noteIndex, midiNote, velocity);
  }

  releaseNote(noteIndex: number): void {
    const voice = this.voices.get(noteIndex);
    if (!voice || voice.released || !this.ctx) return;

    voice.released = true;
    voice.releaseTime = this.ctx.currentTime;
    const now = this.ctx.currentTime;

    // Apply release envelope to all partials
    for (const gain of voice.gains) {
      const currentGain = gain.gain.value;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(currentGain, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + this.envelope.release);
    }

    // Schedule cleanup
    setTimeout(() => {
      this.cleanupVoice(noteIndex);
    }, this.envelope.release * 1000 + 100);

    this.onNoteOff?.(noteIndex);
  }

  private cleanupVoice(noteIndex: number): void {
    const voice = this.voices.get(noteIndex);
    if (!voice) return;

    for (const osc of voice.oscillators) {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) {
        // Oscillator may already be stopped
      }
    }

    for (const gain of voice.gains) {
      gain.disconnect();
    }

    voice.filter.disconnect();
    voice.masterGain.disconnect();

    this.voices.delete(noteIndex);
  }

  // MIDI input handling
  handleMIDINote(midiNote: number, velocity: number, isNoteOn: boolean): void {
    // Map MIDI note to scale degree
    const scaleNotes = this.getScaleNotes();
    const noteIndex = scaleNotes.findIndex(n => n.midiNote === midiNote);

    if (noteIndex === -1) {
      // Note not in current scale, find closest
      const closest = scaleNotes.reduce((prev, curr, idx) => {
        const prevDist = Math.abs(scaleNotes[prev].midiNote - midiNote);
        const currDist = Math.abs(curr.midiNote - midiNote);
        return currDist < prevDist ? idx : prev;
      }, 0);

      if (isNoteOn && velocity > 0) {
        this.playNote(closest, velocity / 127);
      } else {
        this.releaseNote(closest);
      }
    } else {
      if (isNoteOn && velocity > 0) {
        this.playNote(noteIndex, velocity / 127);
      } else {
        this.releaseNote(noteIndex);
      }
    }
  }

  setMasterVolume(volume: number): void {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  setReverbMix(mix: number): void {
    if (this.reverbGain && this.dryGain) {
      this.reverbGain.gain.value = mix * 0.5;
      this.dryGain.gain.value = 1 - mix * 0.3;
    }
  }

  setEnvelope(params: Partial<EnvelopeParams>): void {
    this.envelope = { ...this.envelope, ...params };
  }

  resume(): void {
    this.ctx?.resume();
  }

  suspend(): void {
    this.ctx?.suspend();
  }

  dispose(): void {
    this.stopEnvelopeTracking();

    // Release all voices
    for (const noteIndex of this.voices.keys()) {
      this.cleanupVoice(noteIndex);
    }

    this.ctx?.close();
    this.ctx = null;
  }

  getActiveNotes(): number[] {
    return Array.from(this.voices.keys());
  }

  isReady(): boolean {
    return this.ctx !== null && this.ctx.state === 'running';
  }
}

// MIDI Manager
export class MIDIManager {
  private midiAccess: MIDIAccess | null = null;
  private engine: AetherEngine | null = null;
  private activeInputs: Set<string> = new Set();

  async init(engine: AetherEngine): Promise<boolean> {
    this.engine = engine;

    if (!navigator.requestMIDIAccess) {
      console.log('Web MIDI not supported');
      return false;
    }

    try {
      this.midiAccess = await navigator.requestMIDIAccess();
      this.setupInputs();

      this.midiAccess.onstatechange = () => {
        this.setupInputs();
      };

      return true;
    } catch (e) {
      console.log('MIDI access denied:', e);
      return false;
    }
  }

  private setupInputs(): void {
    if (!this.midiAccess) return;

    // Disconnect old inputs
    this.midiAccess.inputs.forEach((input) => {
      input.onmidimessage = null;
    });

    this.activeInputs.clear();

    // Connect to all inputs
    this.midiAccess.inputs.forEach((input) => {
      this.activeInputs.add(input.id);
      input.onmidimessage = this.handleMIDIMessage.bind(this);
    });
  }

  private handleMIDIMessage(event: MIDIMessageEvent): void {
    if (!this.engine || !event.data) return;

    const [status, note, velocity] = event.data;
    const command = status >> 4;

    // Note on
    if (command === 9 && velocity > 0) {
      this.engine.handleMIDINote(note, velocity, true);
    }
    // Note off (or note on with velocity 0)
    else if (command === 8 || (command === 9 && velocity === 0)) {
      this.engine.handleMIDINote(note, velocity, false);
    }
  }

  getInputCount(): number {
    return this.activeInputs.size;
  }

  dispose(): void {
    if (this.midiAccess) {
      this.midiAccess.inputs.forEach((input) => {
        input.onmidimessage = null;
      });
    }
    this.midiAccess = null;
    this.engine = null;
  }
}
