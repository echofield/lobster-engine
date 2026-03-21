/**
 * SYNTHI ENGINE
 *
 * EMS-inspired geometric sound engine
 * Matrix-based routing, analog-style oscillators, modern hybrid capability
 * Supports both monophonic and polyphonic modes
 */

export interface SynthiParams {
  // Oscillators (relative settings per voice)
  osc1Wave: OscillatorType;
  osc1Level: number;
  osc1Detune: number;
  osc2Wave: OscillatorType;
  osc2Level: number;
  osc2Detune: number;
  osc3Wave: OscillatorType;
  osc3Level: number;
  osc3Octave: number; // -2, -1, 0, 1, 2

  // Filter
  filterFreq: number;
  filterQ: number;
  filterType: BiquadFilterType;

  // Envelope
  attack: number;
  decay: number;
  sustain: number;
  release: number;

  // LFOs
  lfo1Rate: number;
  lfo1Depth: number;
  lfo2Rate: number;
  lfo2Depth: number;

  // Matrix routing (source -> destination -> amount)
  matrix: MatrixConnection[];

  // Master
  masterGain: number;

  // Mode
  polyphonic: boolean;
  maxVoices: number;
}

export interface MatrixConnection {
  source: MatrixSource;
  destination: MatrixDestination;
  amount: number;
}

export type MatrixSource =
  | 'osc1' | 'osc2' | 'osc3' | 'noise'
  | 'lfo1' | 'lfo2' | 'env'
  | 'input';

export type MatrixDestination =
  | 'osc1Freq' | 'osc2Freq' | 'osc3Freq'
  | 'osc1Level' | 'osc2Level' | 'osc3Level'
  | 'filterFreq' | 'filterQ'
  | 'lfo1Rate' | 'lfo2Rate'
  | 'output';

interface Voice {
  id: number;
  midiNote: number;
  osc1: OscillatorNode;
  osc2: OscillatorNode;
  osc3: OscillatorNode;
  osc1Gain: GainNode;
  osc2Gain: GainNode;
  osc3Gain: GainNode;
  voiceGain: GainNode;
  startTime: number;
  released: boolean;
}

export class SynthiEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;

  // Shared filter
  private filter: BiquadFilterNode | null = null;

  // Noise (shared)
  private noiseNode: AudioBufferSourceNode | null = null;
  private noiseGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  // LFOs (shared)
  private lfo1: OscillatorNode | null = null;
  private lfo2: OscillatorNode | null = null;
  private lfo1Gain: GainNode | null = null;
  private lfo2Gain: GainNode | null = null;

  // Voice management
  private voices: Map<number, Voice> = new Map();
  private voiceIdCounter = 0;
  private activeVoiceCount = 0;

  // Mono mode oscillators (for backward compatibility)
  private monoOsc1: OscillatorNode | null = null;
  private monoOsc2: OscillatorNode | null = null;
  private monoOsc3: OscillatorNode | null = null;
  private monoOsc1Gain: GainNode | null = null;
  private monoOsc2Gain: GainNode | null = null;
  private monoOsc3Gain: GainNode | null = null;

  // State
  private isPlaying = false;
  private params: SynthiParams = this.getDefaultParams();

  // Callbacks
  public onAnalysis?: (data: { frequency: Uint8Array; waveform: Uint8Array }) => void;
  public onVoiceChange?: (count: number) => void;

  private getDefaultParams(): SynthiParams {
    return {
      osc1Wave: 'sawtooth',
      osc1Level: 0.4,
      osc1Detune: 0,
      osc2Wave: 'sawtooth',
      osc2Level: 0.4,
      osc2Detune: 5, // Slight detune for richness
      osc3Wave: 'square',
      osc3Level: 0.25,
      osc3Octave: -1,
      filterFreq: 2000,
      filterQ: 5,
      filterType: 'lowpass',
      attack: 0.05,
      decay: 0.2,
      sustain: 0.7,
      release: 0.4,
      lfo1Rate: 0.5,
      lfo1Depth: 50,
      lfo2Rate: 2,
      lfo2Depth: 0.3,
      matrix: [],
      masterGain: 0.5,
      polyphonic: true,
      maxVoices: 8,
    };
  }

  async init(): Promise<void> {
    this.ctx = new AudioContext();

    // Master chain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.params.masterGain;

    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 2048;

    // Filter
    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = this.params.filterType;
    this.filter.frequency.value = this.params.filterFreq;
    this.filter.Q.value = this.params.filterQ;

    // Noise
    this.noiseGain = this.ctx.createGain();
    this.noiseGain.gain.value = 0;
    this.noiseBuffer = this.createNoiseBuffer();

    // LFOs
    this.lfo1 = this.ctx.createOscillator();
    this.lfo1.type = 'sine';
    this.lfo1.frequency.value = this.params.lfo1Rate;
    this.lfo1Gain = this.ctx.createGain();
    this.lfo1Gain.gain.value = this.params.lfo1Depth;

    this.lfo2 = this.ctx.createOscillator();
    this.lfo2.type = 'triangle';
    this.lfo2.frequency.value = this.params.lfo2Rate;
    this.lfo2Gain = this.ctx.createGain();
    this.lfo2Gain.gain.value = this.params.lfo2Depth;

    // Connect chain
    this.noiseGain.connect(this.filter);
    this.filter.connect(this.masterGain);
    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    // LFO routing (default: LFO1 -> filter)
    this.lfo1.connect(this.lfo1Gain);
    this.lfo1Gain.connect(this.filter.frequency);

    this.lfo2.connect(this.lfo2Gain);

    // Start LFOs
    this.lfo1.start();
    this.lfo2.start();

    // Setup mono oscillator gains for backward compatibility
    this.monoOsc1Gain = this.ctx.createGain();
    this.monoOsc2Gain = this.ctx.createGain();
    this.monoOsc3Gain = this.ctx.createGain();
    this.monoOsc1Gain.gain.value = 0;
    this.monoOsc2Gain.gain.value = 0;
    this.monoOsc3Gain.gain.value = 0;
    this.monoOsc1Gain.connect(this.filter);
    this.monoOsc2Gain.connect(this.filter);
    this.monoOsc3Gain.connect(this.filter);

    // Start analysis loop
    this.startAnalysisLoop();
  }

  private createNoiseBuffer(): AudioBuffer {
    const bufferSize = this.ctx!.sampleRate * 2;
    const buffer = this.ctx!.createBuffer(1, bufferSize, this.ctx!.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  private startAnalysisLoop(): void {
    const analyze = () => {
      if (!this.analyser) return;

      const frequency = new Uint8Array(this.analyser.frequencyBinCount);
      const waveform = new Uint8Array(this.analyser.frequencyBinCount);

      this.analyser.getByteFrequencyData(frequency);
      this.analyser.getByteTimeDomainData(waveform);

      this.onAnalysis?.({ frequency, waveform });

      requestAnimationFrame(analyze);
    };
    analyze();
  }

  private midiToFreq(midiNote: number): number {
    return 440 * Math.pow(2, (midiNote - 69) / 12);
  }

  // Polyphonic note on
  noteOn(midiNote: number, velocity: number = 0.8): number {
    if (!this.ctx || !this.params.polyphonic) {
      // Mono mode - use old play behavior
      const freq = this.midiToFreq(midiNote);
      this.setMonoFrequency(1, freq);
      this.setMonoFrequency(2, freq * 1.002);
      this.setMonoFrequency(3, freq / 2);
      if (!this.isPlaying) this.play();
      return -1;
    }

    // Voice stealing if at max
    if (this.voices.size >= this.params.maxVoices) {
      // Find oldest voice
      let oldestVoice: Voice | null = null;
      let oldestTime = Infinity;
      this.voices.forEach(voice => {
        if (voice.startTime < oldestTime) {
          oldestTime = voice.startTime;
          oldestVoice = voice;
        }
      });
      if (oldestVoice) {
        this.noteOff((oldestVoice as Voice).midiNote);
      }
    }

    const now = this.ctx.currentTime;
    const freq = this.midiToFreq(midiNote);
    const voiceId = this.voiceIdCounter++;

    // Create voice gain (per-voice envelope)
    const voiceGain = this.ctx.createGain();
    voiceGain.gain.value = 0;
    voiceGain.connect(this.filter!);

    // Create oscillators for this voice
    const osc1 = this.ctx.createOscillator();
    osc1.type = this.params.osc1Wave;
    osc1.frequency.value = freq;
    osc1.detune.value = this.params.osc1Detune;

    const osc2 = this.ctx.createOscillator();
    osc2.type = this.params.osc2Wave;
    osc2.frequency.value = freq;
    osc2.detune.value = this.params.osc2Detune;

    const osc3 = this.ctx.createOscillator();
    osc3.type = this.params.osc3Wave;
    osc3.frequency.value = freq * Math.pow(2, this.params.osc3Octave);
    osc3.detune.value = 0;

    // Individual oscillator gains
    const osc1Gain = this.ctx.createGain();
    osc1Gain.gain.value = this.params.osc1Level * velocity;

    const osc2Gain = this.ctx.createGain();
    osc2Gain.gain.value = this.params.osc2Level * velocity;

    const osc3Gain = this.ctx.createGain();
    osc3Gain.gain.value = this.params.osc3Level * velocity;

    // Connect oscillators to their gains, then to voice gain
    osc1.connect(osc1Gain);
    osc2.connect(osc2Gain);
    osc3.connect(osc3Gain);
    osc1Gain.connect(voiceGain);
    osc2Gain.connect(voiceGain);
    osc3Gain.connect(voiceGain);

    // Start oscillators
    osc1.start(now);
    osc2.start(now);
    osc3.start(now);

    // Apply envelope to voice gain
    voiceGain.gain.setValueAtTime(0, now);
    voiceGain.gain.linearRampToValueAtTime(1, now + this.params.attack);
    voiceGain.gain.linearRampToValueAtTime(this.params.sustain, now + this.params.attack + this.params.decay);

    // Store voice
    const voice: Voice = {
      id: voiceId,
      midiNote,
      osc1, osc2, osc3,
      osc1Gain, osc2Gain, osc3Gain,
      voiceGain,
      startTime: now,
      released: false,
    };
    this.voices.set(midiNote, voice);
    this.activeVoiceCount = this.voices.size;
    this.isPlaying = true;
    this.onVoiceChange?.(this.activeVoiceCount);

    return voiceId;
  }

  // Polyphonic note off
  noteOff(midiNote: number): void {
    if (!this.ctx) return;

    const voice = this.voices.get(midiNote);
    if (!voice || voice.released) return;

    voice.released = true;
    const now = this.ctx.currentTime;

    // Release envelope
    voice.voiceGain.gain.cancelScheduledValues(now);
    voice.voiceGain.gain.setValueAtTime(voice.voiceGain.gain.value, now);
    voice.voiceGain.gain.linearRampToValueAtTime(0, now + this.params.release);

    // Schedule cleanup
    setTimeout(() => {
      try {
        voice.osc1.stop();
        voice.osc2.stop();
        voice.osc3.stop();
        voice.osc1.disconnect();
        voice.osc2.disconnect();
        voice.osc3.disconnect();
        voice.osc1Gain.disconnect();
        voice.osc2Gain.disconnect();
        voice.osc3Gain.disconnect();
        voice.voiceGain.disconnect();
      } catch (e) {
        // Ignore if already stopped
      }
      this.voices.delete(midiNote);
      this.activeVoiceCount = this.voices.size;
      if (this.voices.size === 0) {
        this.isPlaying = false;
      }
      this.onVoiceChange?.(this.activeVoiceCount);
    }, this.params.release * 1000 + 50);
  }

  // Release all voices
  allNotesOff(): void {
    this.voices.forEach((_, midiNote) => {
      this.noteOff(midiNote);
    });
  }

  // Mono mode play (backward compatible)
  play(): void {
    if (!this.ctx || this.isPlaying) return;

    // Create oscillators
    this.monoOsc1 = this.ctx.createOscillator();
    this.monoOsc1.type = this.params.osc1Wave;
    this.monoOsc1.frequency.value = 220;
    this.monoOsc1.connect(this.monoOsc1Gain!);

    this.monoOsc2 = this.ctx.createOscillator();
    this.monoOsc2.type = this.params.osc2Wave;
    this.monoOsc2.frequency.value = 220.5;
    this.monoOsc2.connect(this.monoOsc2Gain!);

    this.monoOsc3 = this.ctx.createOscillator();
    this.monoOsc3.type = this.params.osc3Wave;
    this.monoOsc3.frequency.value = 110;
    this.monoOsc3.connect(this.monoOsc3Gain!);

    // Start noise
    this.noiseNode = this.ctx.createBufferSource();
    this.noiseNode.buffer = this.noiseBuffer;
    this.noiseNode.loop = true;
    this.noiseNode.connect(this.noiseGain!);

    // Start all
    const now = this.ctx.currentTime;
    this.monoOsc1.start();
    this.monoOsc2.start();
    this.monoOsc3.start();
    this.noiseNode.start();

    // Apply envelope
    this.monoOsc1Gain!.gain.setValueAtTime(0, now);
    this.monoOsc1Gain!.gain.linearRampToValueAtTime(this.params.osc1Level, now + this.params.attack);
    this.monoOsc1Gain!.gain.linearRampToValueAtTime(this.params.osc1Level * this.params.sustain, now + this.params.attack + this.params.decay);

    this.monoOsc2Gain!.gain.setValueAtTime(0, now);
    this.monoOsc2Gain!.gain.linearRampToValueAtTime(this.params.osc2Level, now + this.params.attack);
    this.monoOsc2Gain!.gain.linearRampToValueAtTime(this.params.osc2Level * this.params.sustain, now + this.params.attack + this.params.decay);

    this.monoOsc3Gain!.gain.setValueAtTime(0, now);
    this.monoOsc3Gain!.gain.linearRampToValueAtTime(this.params.osc3Level, now + this.params.attack);
    this.monoOsc3Gain!.gain.linearRampToValueAtTime(this.params.osc3Level * this.params.sustain, now + this.params.attack + this.params.decay);

    this.isPlaying = true;
  }

  stop(): void {
    if (!this.ctx) return;

    // Stop all polyphonic voices
    this.allNotesOff();

    // Stop mono oscillators if playing
    if (this.monoOsc1) {
      const now = this.ctx.currentTime;

      // Release envelope
      this.monoOsc1Gain!.gain.linearRampToValueAtTime(0, now + this.params.release);
      this.monoOsc2Gain!.gain.linearRampToValueAtTime(0, now + this.params.release);
      this.monoOsc3Gain!.gain.linearRampToValueAtTime(0, now + this.params.release);

      // Stop after release
      setTimeout(() => {
        this.monoOsc1?.stop();
        this.monoOsc2?.stop();
        this.monoOsc3?.stop();
        this.noiseNode?.stop();
        this.monoOsc1 = null;
        this.monoOsc2 = null;
        this.monoOsc3 = null;
        this.noiseNode = null;
      }, this.params.release * 1000 + 50);
    }

    this.isPlaying = false;
  }

  // Gesture-based control
  gesture(x: number, y: number, pressure: number): void {
    if (!this.ctx) return;

    // X controls filter frequency (200 - 8000 Hz)
    const filterFreq = 200 + (x * 7800);
    this.filter!.frequency.setTargetAtTime(filterFreq, this.ctx.currentTime, 0.05);

    // Y controls oscillator detune for all voices
    const detune = (y - 0.5) * 100;
    this.voices.forEach(voice => {
      voice.osc2.detune.setTargetAtTime(this.params.osc2Detune + detune, this.ctx!.currentTime, 0.05);
    });
    if (this.monoOsc2) {
      this.monoOsc2.detune.setTargetAtTime(detune, this.ctx.currentTime, 0.05);
    }

    // Pressure controls filter resonance
    const q = 1 + (pressure * 20);
    this.filter!.Q.setTargetAtTime(q, this.ctx.currentTime, 0.05);
  }

  setParam<K extends keyof SynthiParams>(param: K, value: SynthiParams[K]): void {
    this.params[param] = value;

    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Handle each param type
    if (param === 'filterFreq') {
      this.filter?.frequency.setTargetAtTime(value as number, now, 0.05);
    } else if (param === 'filterQ') {
      this.filter?.Q.setTargetAtTime(value as number, now, 0.05);
    } else if (param === 'lfo1Rate') {
      this.lfo1?.frequency.setTargetAtTime(value as number, now, 0.05);
    } else if (param === 'lfo1Depth') {
      this.lfo1Gain?.gain.setTargetAtTime(value as number, now, 0.05);
    } else if (param === 'masterGain') {
      this.masterGain?.gain.setTargetAtTime(value as number, now, 0.05);
    } else if (param === 'polyphonic') {
      // Mode switch - stop all voices first
      if (!value) {
        this.allNotesOff();
      }
    }
  }

  // Direct frequency control for mono mode backward compatibility
  setMonoFrequency(osc: 1 | 2 | 3, freq: number): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (osc === 1) this.monoOsc1?.frequency.setTargetAtTime(freq, now, 0.05);
    if (osc === 2) this.monoOsc2?.frequency.setTargetAtTime(freq, now, 0.05);
    if (osc === 3) this.monoOsc3?.frequency.setTargetAtTime(freq, now, 0.05);
  }

  getParams(): SynthiParams {
    return { ...this.params };
  }

  isReady(): boolean {
    return this.ctx !== null;
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  getActiveVoiceCount(): number {
    return this.activeVoiceCount;
  }

  setPolyphonic(enabled: boolean): void {
    this.setParam('polyphonic', enabled);
  }

  dispose(): void {
    this.stop();
    this.lfo1?.stop();
    this.lfo2?.stop();
    this.ctx?.close();
    this.ctx = null;
  }
}
