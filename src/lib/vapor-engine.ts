/**
 * VAPOR - Granular Synthesis Engine
 *
 * Cloud-like textures through granular synthesis.
 * Integrates with Lyria for ritual mode modulation.
 *
 * Granular synthesis: Play many small "grains" of audio
 * - Grain size: 20-200ms
 * - Grain density: 1-100 grains/second
 * - Pitch variation: ±12 semitones
 * - Position randomness: Cloud spread
 */

interface Grain {
  source: AudioBufferSourceNode;
  gain: GainNode;
  startTime: number;
  duration: number;
  pitch: number;
  position: number;
}

export interface VaporParams {
  grainSize: number;      // 20-200ms
  density: number;        // 1-100 grains/sec
  pitchVariation: number; // 0-12 semitones
  spread: number;         // 0-1 position randomness
  baseFreq: number;       // Base frequency in Hz
}

interface Voice {
  freq: number;
  buffer: AudioBuffer;
  grains: Grain[];
  lastGrainTime: number;
  isActive: boolean;
}

export class VaporEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private reverb: ConvolverNode | null = null;
  private reverbGain: GainNode | null = null;
  private dryGain: GainNode | null = null;

  // Polyphonic voices (max 8 simultaneous notes)
  private voices: Map<number, Voice> = new Map();
  private maxVoices = 8;

  // Main grain scheduler
  private grainScheduler: number | null = null;

  // Parameters
  private params: VaporParams = {
    grainSize: 50,        // ms
    density: 20,          // grains/sec
    pitchVariation: 5,    // semitones
    spread: 0.3,          // 30% randomness
    baseFreq: 220,        // A3
  };

  private isPlaying = false;

  // Callbacks for visual feedback
  public onGrainSpawn?: (x: number, y: number, size: number, pitch: number) => void;
  public onActivityUpdate?: (activity: number) => void;

  async init(): Promise<void> {
    if (this.ctx) return;

    this.ctx = new AudioContext();

    // Master output chain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.4;

    // Compressor for smooth dynamics
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -20;
    this.compressor.knee.value = 30;
    this.compressor.ratio.value = 6;
    this.compressor.attack.value = 0.001;
    this.compressor.release.value = 0.1;

    // Reverb for space
    this.reverb = this.ctx.createConvolver();
    this.reverbGain = this.ctx.createGain();
    this.reverbGain.gain.value = 0.4;

    this.dryGain = this.ctx.createGain();
    this.dryGain.gain.value = 0.6;

    // Create reverb impulse
    await this.createReverbImpulse();

    // Connect chain
    this.masterGain.connect(this.dryGain);
    this.masterGain.connect(this.reverb);
    this.reverb.connect(this.reverbGain);
    this.dryGain.connect(this.compressor);
    this.reverbGain.connect(this.compressor);
    this.compressor.connect(this.ctx.destination);

    // Start grain scheduler
    this.scheduleGrains();
  }

  private async createReverbImpulse(): Promise<void> {
    if (!this.ctx || !this.reverb) return;

    const duration = 3;
    const sampleRate = this.ctx.sampleRate;
    const length = duration * sampleRate;
    const impulse = this.ctx.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const decay = Math.exp(-2.5 * t);
        const modulation = 1 + 0.15 * Math.sin(t * Math.PI * 0.7);
        channelData[i] = (Math.random() * 2 - 1) * decay * modulation;
      }
    }

    this.reverb.buffer = impulse;
  }

  // Create a grain buffer for a specific frequency
  private createVoiceBuffer(freq: number): AudioBuffer {
    if (!this.ctx) throw new Error('AudioContext not initialized');

    const duration = 0.5;
    const sampleRate = this.ctx.sampleRate;
    const length = duration * sampleRate;

    const buffer = this.ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    // Fill with rich harmonic content
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;

      // Rich harmonic series
      data[i] =
        Math.sin(2 * Math.PI * freq * t) * 0.4 +           // Fundamental
        Math.sin(2 * Math.PI * freq * 2 * t) * 0.25 +      // 2nd harmonic
        Math.sin(2 * Math.PI * freq * 3 * t) * 0.15 +      // 3rd harmonic
        Math.sin(2 * Math.PI * freq * 4 * t) * 0.1 +       // 4th harmonic
        Math.sin(2 * Math.PI * freq * 5 * t) * 0.06 +      // 5th harmonic
        Math.sin(2 * Math.PI * freq * 7 * t) * 0.04 +      // 7th harmonic
        Math.sin(2 * Math.PI * freq * 1.5 * t) * 0.08;     // Sub-harmonic for warmth
    }

    return buffer;
  }

  // Add a note (polyphonic)
  noteOn(midiNote: number, velocity: number = 100): void {
    if (!this.ctx) return;

    // Convert MIDI note to frequency
    const freq = 440 * Math.pow(2, (midiNote - 69) / 12);

    // Reuse existing voice or create new one
    let voice = this.voices.get(midiNote);

    if (!voice) {
      // Remove oldest voice if at max capacity
      if (this.voices.size >= this.maxVoices) {
        const oldestNote = Array.from(this.voices.keys())[0];
        this.noteOff(oldestNote);
      }

      // Create new voice
      voice = {
        freq,
        buffer: this.createVoiceBuffer(freq),
        grains: [],
        lastGrainTime: this.ctx.currentTime,
        isActive: true,
      };

      this.voices.set(midiNote, voice);
      console.log(`[VAPOR] Note ON: ${midiNote} (${Math.round(freq)}Hz) - Active voices: ${this.voices.size}`);
    }

    voice.isActive = true;

    if (!this.isPlaying) {
      this.isPlaying = true;
    }
  }

  // Remove a note (polyphonic)
  noteOff(midiNote: number): void {
    const voice = this.voices.get(midiNote);
    if (voice) {
      voice.isActive = false;
      console.log(`[VAPOR] Note OFF: ${midiNote}`);

      // Remove voice after a short fade
      setTimeout(() => {
        this.voices.delete(midiNote);
        console.log(`[VAPOR] Voice removed: ${midiNote} - Active voices: ${this.voices.size}`);

        // Stop playing if no active voices
        if (this.voices.size === 0) {
          this.isPlaying = false;
        }
      }, 500);
    }
  }

  // Legacy start/stop methods (for compatibility)
  start(): void {
    // For backward compatibility - now we use noteOn/noteOff
    // Start a single note at base frequency
    const midiNote = Math.round(69 + 12 * Math.log2(this.params.baseFreq / 440));
    this.noteOn(midiNote);
  }

  stop(): void {
    // Stop all voices
    for (const midiNote of Array.from(this.voices.keys())) {
      this.noteOff(midiNote);
    }
  }

  // Stop all notes immediately (panic button)
  stopAll(): void {
    this.voices.clear();
    this.isPlaying = false;
  }

  private scheduleGrains(): void {
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const interval = 1 / this.params.density; // Time between grains

    // Schedule grains for each active voice
    for (const [midiNote, voice] of this.voices.entries()) {
      if (!voice.isActive) continue;

      if (now - voice.lastGrainTime >= interval) {
        this.spawnGrainForVoice(voice, midiNote);
        voice.lastGrainTime = now;
      }

      // Cleanup old grains for this voice
      voice.grains = voice.grains.filter(
        g => now < g.startTime + g.duration
      );
    }

    // Update activity callback
    const totalGrains = Array.from(this.voices.values()).reduce((sum, v) => sum + v.grains.length, 0);
    const activity = Math.min(1, totalGrains / 50);
    this.onActivityUpdate?.(activity);

    // Always schedule next check
    this.grainScheduler = setTimeout(() => this.scheduleGrains(), 10) as unknown as number;
  }

  private spawnGrainForVoice(voice: Voice, midiNote: number): void {
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;

    // Random grain parameters
    const grainDuration = (this.params.grainSize / 1000) * (0.8 + Math.random() * 0.4);
    const pitchOffset = (Math.random() - 0.5) * 2 * this.params.pitchVariation;
    const playbackRate = Math.pow(2, pitchOffset / 12);
    const position = Math.random() * this.params.spread;
    const pan = (Math.random() - 0.5) * 2;

    // Create grain
    const source = this.ctx.createBufferSource();
    source.buffer = voice.buffer;
    source.playbackRate.value = playbackRate;

    const gainNode = this.ctx.createGain();
    const panNode = this.ctx.createStereoPanner();
    panNode.pan.value = pan;

    // Grain envelope (triangular)
    const peakTime = now + grainDuration * 0.3;
    const voiceGain = voice.isActive ? 0.3 : 0.1; // Fade out if note released
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(voiceGain, peakTime);
    gainNode.gain.linearRampToValueAtTime(0, now + grainDuration);

    // Connect
    source.connect(gainNode);
    gainNode.connect(panNode);
    panNode.connect(this.masterGain);

    // Play
    const offset = position * voice.buffer.duration;
    source.start(now, offset, grainDuration);

    // Store grain
    const grain: Grain = {
      source,
      gain: gainNode,
      startTime: now,
      duration: grainDuration,
      pitch: pitchOffset,
      position,
    };

    voice.grains.push(grain);

    // Visual callback with MIDI note info for color variation
    const x = Math.random();
    const y = Math.random();
    const size = this.params.grainSize / 200;
    const colorOffset = (midiNote - 60) / 2; // MIDI note affects color
    this.onGrainSpawn?.(x, y, size, colorOffset);
  }

  // Parameter setters
  setGrainSize(size: number): void {
    this.params.grainSize = Math.max(20, Math.min(200, size));
  }

  setDensity(density: number): void {
    this.params.density = Math.max(1, Math.min(100, density));
  }

  setPitchVariation(variation: number): void {
    this.params.pitchVariation = Math.max(0, Math.min(12, variation));
  }

  setSpread(spread: number): void {
    this.params.spread = Math.max(0, Math.min(1, spread));
  }

  setBaseFreq(freq: number): void {
    this.params.baseFreq = freq;
  }

  getParams(): VaporParams {
    return { ...this.params };
  }

  // Get current spectral snapshot for Lyria
  getSpectralSnapshot(): number[] {
    // Return grain distribution across all voices as spectral data
    const bins = 8;
    const snapshot = new Array(bins).fill(0);

    for (const voice of this.voices.values()) {
      for (const grain of voice.grains) {
        const bin = Math.floor((grain.pitch + 12) / 24 * bins);
        if (bin >= 0 && bin < bins) {
          snapshot[bin] += 1;
        }
      }
    }

    // Normalize
    const max = Math.max(...snapshot, 1);
    return snapshot.map(v => v / max);
  }

  setMasterVolume(volume: number): void {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  setReverbMix(mix: number): void {
    if (this.reverbGain && this.dryGain) {
      this.reverbGain.gain.value = mix * 0.6;
      this.dryGain.gain.value = 1 - mix * 0.4;
    }
  }

  resume(): void {
    this.ctx?.resume();
  }

  suspend(): void {
    this.ctx?.suspend();
  }

  dispose(): void {
    this.stopAll();

    // Stop grain scheduler
    if (this.grainScheduler !== null) {
      clearTimeout(this.grainScheduler);
      this.grainScheduler = null;
    }

    // Clean up all voices
    for (const voice of this.voices.values()) {
      for (const grain of voice.grains) {
        try {
          grain.source.stop();
          grain.source.disconnect();
          grain.gain.disconnect();
        } catch (e) {
          // Already stopped
        }
      }
    }

    this.voices.clear();
    this.ctx?.close();
    this.ctx = null;
  }

  isReady(): boolean {
    return this.ctx !== null && this.ctx.state === 'running';
  }

  isActive(): boolean {
    return this.isPlaying;
  }
}
