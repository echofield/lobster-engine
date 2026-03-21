/**
 * SIGNAL Engine
 *
 * Hybrid deterministic synthesis engine for SIGNAL/FIELD
 * Designed for ambient field instruments where precision meets emergence
 *
 * Sound character: Crystalline pads meet warm analog drones. Glass meets wood. Precision meets breath.
 */

import type {
  Scale,
  SignalVoiceType,
  SynthVoice,
  DeterministicLayerConfig,
  DeterministicLayerState,
  MusicalContext,
} from '@/types/signal';

// === SCALES ===

export const SCALES: Record<Scale, readonly number[]> = {
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

// Enhanced harmonic series for richer timbre (8 partials vs Aether's 6)
const PARTIALS = [
  { ratio: 1, gain: 1.0 },      // Fundamental
  { ratio: 2, gain: 0.6 },      // Octave
  { ratio: 3, gain: 0.35 },     // Fifth above octave
  { ratio: 4, gain: 0.2 },      // Two octaves
  { ratio: 5, gain: 0.12 },     // Major third above two octaves
  { ratio: 6, gain: 0.08 },     // Perfect fifth above two octaves
  { ratio: 7, gain: 0.05 },     // Minor seventh above two octaves (slightly dissonant)
  { ratio: 8, gain: 0.03 },     // Three octaves
];

// Voice-specific envelope configurations
const VOICE_ENVELOPES: Record<SignalVoiceType, { attack: number; decay: number; sustain: number; release: number }> = {
  pad: { attack: 0.3, decay: 0.5, sustain: 0.7, release: 3.5 },
  drone: { attack: 1.0, decay: 1.5, sustain: 0.9, release: 5.0 },
  pulse: { attack: 0.01, decay: 0.2, sustain: 0.0, release: 0.5 },
  lead: { attack: 0.05, decay: 0.3, sustain: 0.6, release: 1.5 },
  texture: { attack: 0.8, decay: 1.0, sustain: 0.5, release: 4.0 },
};

// === SIGNAL ENGINE ===

export class SignalEngine {
  private ctx: AudioContext | null = null;

  // Audio nodes
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private reverb: ConvolverNode | null = null;
  private reverbGain: GainNode | null = null;
  private dryGain: GainNode | null = null;

  // Dual filter paths for richer tone shaping
  private lowpassFilter: BiquadFilterNode | null = null;
  private bandpassFilter: BiquadFilterNode | null = null;
  private filterMix: GainNode | null = null;

  // Stereo processing
  private stereoSplitter: ChannelSplitterNode | null = null;
  private stereoMerger: ChannelMergerNode | null = null;
  private leftDelay: DelayNode | null = null;
  private rightDelay: DelayNode | null = null;

  // Voice management
  private voices: Map<string, SynthVoice> = new Map();
  private maxPolyphony = 16; // Increased from Aether's 12

  // Musical state
  private musicalContext: MusicalContext = {
    root: 60,           // Middle C
    scale: 'pentatonic',
    octave: 4,
    chordMemory: [],
    harmonicField: [],
  };

  // Configuration
  private config: DeterministicLayerConfig = {
    voiceLimit: 16,
    harmonicPartials: 8,
    filterCutoff: 2000,
    filterResonance: 0.7,
    reverbMix: 0.4,
    reverbDecay: 6.0,
    stereoWidth: 0.5,
    compressorThreshold: -24,
    outputGain: 0.7,
  };

  // Callbacks
  public onVoiceStart?: (voice: SynthVoice) => void;
  public onVoiceEnd?: (voiceId: string) => void;
  public onMusicalContextChange?: (context: MusicalContext) => void;

  // === INITIALIZATION ===

  async init(): Promise<void> {
    if (this.ctx) return;

    this.ctx = new AudioContext();

    // Master output
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.config.outputGain;

    // Compressor
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.value = this.config.compressorThreshold;
    this.compressor.knee.value = 30;
    this.compressor.ratio.value = 4;
    this.compressor.attack.value = 0.003;
    this.compressor.release.value = 0.25;

    // Dual filter paths for hybrid tone
    this.lowpassFilter = this.ctx.createBiquadFilter();
    this.lowpassFilter.type = 'lowpass';
    this.lowpassFilter.frequency.value = this.config.filterCutoff;
    this.lowpassFilter.Q.value = this.config.filterResonance;

    this.bandpassFilter = this.ctx.createBiquadFilter();
    this.bandpassFilter.type = 'bandpass';
    this.bandpassFilter.frequency.value = this.config.filterCutoff * 0.5;
    this.bandpassFilter.Q.value = 1.5;

    this.filterMix = this.ctx.createGain();
    this.filterMix.gain.value = 1;

    // Stereo width processing
    this.stereoSplitter = this.ctx.createChannelSplitter(2);
    this.stereoMerger = this.ctx.createChannelMerger(2);
    this.leftDelay = this.ctx.createDelay(0.05);
    this.rightDelay = this.ctx.createDelay(0.05);
    this.leftDelay.delayTime.value = 0.005 * this.config.stereoWidth;
    this.rightDelay.delayTime.value = 0.007 * this.config.stereoWidth;

    // Reverb (6-second tail for deep ambient space)
    this.reverb = this.ctx.createConvolver();
    this.reverbGain = this.ctx.createGain();
    this.reverbGain.gain.value = this.config.reverbMix * 0.5;

    this.dryGain = this.ctx.createGain();
    this.dryGain.gain.value = 1 - this.config.reverbMix * 0.3;

    await this.createReverbImpulse();

    // Connect the signal chain
    // Dual filter path
    this.masterGain.connect(this.lowpassFilter);
    this.masterGain.connect(this.bandpassFilter);
    this.lowpassFilter.connect(this.filterMix);
    this.bandpassFilter.connect(this.filterMix);

    // Stereo widening
    this.filterMix.connect(this.stereoSplitter);
    this.stereoSplitter.connect(this.leftDelay, 0);
    this.stereoSplitter.connect(this.rightDelay, 1);
    this.leftDelay.connect(this.stereoMerger, 0, 0);
    this.rightDelay.connect(this.stereoMerger, 0, 1);

    // Reverb path
    this.stereoMerger.connect(this.dryGain);
    this.stereoMerger.connect(this.reverb);
    this.reverb.connect(this.reverbGain);

    // Final output
    this.dryGain.connect(this.compressor);
    this.reverbGain.connect(this.compressor);
    this.compressor.connect(this.ctx.destination);
  }

  private async createReverbImpulse(): Promise<void> {
    if (!this.ctx || !this.reverb) return;

    const duration = this.config.reverbDecay;
    const sampleRate = this.ctx.sampleRate;
    const length = duration * sampleRate;
    const impulse = this.ctx.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;

        // Exponential decay
        const decay = Math.exp(-2.5 * t);

        // Modulation for richness
        const modulation = 1 + 0.15 * Math.sin(t * 2 * Math.PI * 0.3);

        // Noise shaped by decay
        channelData[i] = (Math.random() * 2 - 1) * decay * modulation;

        // Early reflections
        if (t < 0.15) {
          const earlyGain = Math.exp(-18 * t);
          channelData[i] += (Math.random() * 2 - 1) * earlyGain * 0.6;
        }

        // Late diffusion
        if (t > 0.5) {
          const lateModulation = Math.sin(t * 7) * Math.sin(t * 13) * 0.1;
          channelData[i] += (Math.random() * 2 - 1) * decay * lateModulation;
        }
      }
    }

    this.reverb.buffer = impulse;
  }

  // === VOICE MANAGEMENT ===

  private midiToFrequency(midiNote: number): number {
    return 440 * Math.pow(2, (midiNote - 69) / 12);
  }

  playNote(
    note: number,
    velocity: number = 0.8,
    voiceType: SignalVoiceType = 'pad'
  ): string {
    if (!this.ctx || !this.masterGain) return '';

    // Voice stealing if needed
    if (this.voices.size >= this.maxPolyphony) {
      const oldestVoice = Array.from(this.voices.entries())
        .sort((a, b) => a[1].startTime - b[1].startTime)[0];
      if (oldestVoice) {
        this.releaseNote(oldestVoice[0]);
      }
    }

    const voiceId = `${voiceType}-${note}-${Date.now()}`;
    const frequency = this.midiToFrequency(note);
    const now = this.ctx.currentTime;
    const envelope = VOICE_ENVELOPES[voiceType];

    // Create voice nodes
    const gainNode = this.ctx.createGain();
    gainNode.gain.value = 0;

    const filterNode = this.ctx.createBiquadFilter();
    filterNode.type = 'lowpass';
    filterNode.frequency.value = 1000 + velocity * 6000;
    filterNode.Q.value = 0.5 + velocity * 0.5;

    const oscillators: OscillatorNode[] = [];

    // Create harmonic partials
    for (const partial of PARTIALS) {
      const osc = this.ctx.createOscillator();
      const partialGain = this.ctx.createGain();

      osc.type = 'sine';

      // Slight detuning for warmth (± 5 cents random)
      const detune = (Math.random() - 0.5) * 10;
      osc.frequency.value = frequency * partial.ratio;
      osc.detune.value = detune;

      partialGain.gain.value = partial.gain * velocity * 0.25;

      osc.connect(partialGain);
      partialGain.connect(filterNode);

      oscillators.push(osc);
      osc.start(now);
    }

    // Connect voice to master
    filterNode.connect(gainNode);
    gainNode.connect(this.masterGain);

    // Apply envelope
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(velocity, now + envelope.attack);
    gainNode.gain.linearRampToValueAtTime(
      velocity * envelope.sustain,
      now + envelope.attack + envelope.decay
    );

    // Create voice record
    const voice: SynthVoice = {
      id: voiceId,
      type: voiceType,
      note,
      frequency,
      velocity,
      startTime: now,
      gainNode,
      filterNode,
      oscillators,
      envelope,
    };

    this.voices.set(voiceId, voice);

    // Update chord memory
    this.updateChordMemory(note);

    this.onVoiceStart?.(voice);

    return voiceId;
  }

  releaseNote(voiceId: string): void {
    const voice = this.voices.get(voiceId);
    if (!voice || !this.ctx) return;

    const now = this.ctx.currentTime;
    const currentGain = voice.gainNode.gain.value;

    // Apply release envelope
    voice.gainNode.gain.cancelScheduledValues(now);
    voice.gainNode.gain.setValueAtTime(currentGain, now);
    voice.gainNode.gain.exponentialRampToValueAtTime(0.001, now + voice.envelope.release);

    // Schedule cleanup
    setTimeout(() => {
      this.cleanupVoice(voiceId);
    }, voice.envelope.release * 1000 + 100);

    this.onVoiceEnd?.(voiceId);
  }

  private cleanupVoice(voiceId: string): void {
    const voice = this.voices.get(voiceId);
    if (!voice) return;

    for (const osc of voice.oscillators) {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) {
        // Already stopped
      }
    }

    voice.filterNode.disconnect();
    voice.gainNode.disconnect();

    this.voices.delete(voiceId);
  }

  // === MUSICAL CONTEXT ===

  private updateChordMemory(note: number): void {
    this.musicalContext.chordMemory.push(note);
    if (this.musicalContext.chordMemory.length > 3) {
      this.musicalContext.chordMemory.shift();
    }

    // Update harmonic field (root + 5th + octave)
    const root = this.musicalContext.chordMemory[0];
    this.musicalContext.harmonicField = [
      root,
      root + 7,   // Perfect fifth
      root + 12,  // Octave
    ];

    this.onMusicalContextChange?.(this.musicalContext);
  }

  setScale(scale: Scale): void {
    this.musicalContext.scale = scale;
    this.onMusicalContextChange?.(this.musicalContext);
  }

  setRoot(root: number): void {
    this.musicalContext.root = root;
    this.onMusicalContextChange?.(this.musicalContext);
  }

  setOctave(octave: number): void {
    this.musicalContext.octave = octave;
    this.onMusicalContextChange?.(this.musicalContext);
  }

  getMusicalContext(): MusicalContext {
    return { ...this.musicalContext };
  }

  getScaleNotes(): number[] {
    const scale = SCALES[this.musicalContext.scale];
    const notes: number[] = [];

    for (let octave = 0; octave < 2; octave++) {
      for (const interval of scale) {
        notes.push(this.musicalContext.root + interval + (octave * 12));
      }
    }

    return notes;
  }

  // === CONFIGURATION ===

  setConfig(config: Partial<DeterministicLayerConfig>): void {
    this.config = { ...this.config, ...config };

    if (this.lowpassFilter) {
      this.lowpassFilter.frequency.value = this.config.filterCutoff;
      this.lowpassFilter.Q.value = this.config.filterResonance;
    }

    if (this.bandpassFilter) {
      this.bandpassFilter.frequency.value = this.config.filterCutoff * 0.5;
    }

    if (this.reverbGain && this.dryGain) {
      this.reverbGain.gain.value = this.config.reverbMix * 0.5;
      this.dryGain.gain.value = 1 - this.config.reverbMix * 0.3;
    }

    if (this.leftDelay && this.rightDelay) {
      this.leftDelay.delayTime.value = 0.005 * this.config.stereoWidth;
      this.rightDelay.delayTime.value = 0.007 * this.config.stereoWidth;
    }

    if (this.masterGain) {
      this.masterGain.gain.value = this.config.outputGain;
    }
  }

  getConfig(): DeterministicLayerConfig {
    return { ...this.config };
  }

  // === STATE MANAGEMENT ===

  getState(): DeterministicLayerState {
    return {
      activeVoices: Array.from(this.voices.values()),
      context: this.getMusicalContext(),
      config: this.getConfig(),
      isPlaying: this.voices.size > 0,
      lastNoteTime: this.ctx?.currentTime || 0,
    };
  }

  resume(): void {
    this.ctx?.resume();
  }

  suspend(): void {
    this.ctx?.suspend();
  }

  dispose(): void {
    // Release all voices
    for (const voiceId of this.voices.keys()) {
      this.cleanupVoice(voiceId);
    }

    this.ctx?.close();
    this.ctx = null;
  }

  isReady(): boolean {
    return this.ctx !== null && this.ctx.state === 'running';
  }

  getActiveVoiceCount(): number {
    return this.voices.size;
  }
}
