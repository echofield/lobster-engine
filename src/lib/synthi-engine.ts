/**
 * SYNTHI ENGINE
 *
 * EMS-inspired geometric sound engine
 * Matrix-based routing, analog-style oscillators, modern hybrid capability
 */

export interface SynthiParams {
  // Oscillators
  osc1Freq: number;
  osc1Wave: OscillatorType;
  osc1Level: number;
  osc2Freq: number;
  osc2Wave: OscillatorType;
  osc2Level: number;
  osc3Freq: number;
  osc3Wave: OscillatorType;
  osc3Level: number;

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

export class SynthiEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;

  // Oscillators
  private osc1: OscillatorNode | null = null;
  private osc2: OscillatorNode | null = null;
  private osc3: OscillatorNode | null = null;
  private osc1Gain: GainNode | null = null;
  private osc2Gain: GainNode | null = null;
  private osc3Gain: GainNode | null = null;

  // Noise
  private noiseNode: AudioBufferSourceNode | null = null;
  private noiseGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  // Filter
  private filter: BiquadFilterNode | null = null;

  // LFOs
  private lfo1: OscillatorNode | null = null;
  private lfo2: OscillatorNode | null = null;
  private lfo1Gain: GainNode | null = null;
  private lfo2Gain: GainNode | null = null;

  // State
  private isPlaying = false;
  private params: SynthiParams = this.getDefaultParams();

  // Callbacks
  public onAnalysis?: (data: { frequency: Uint8Array; waveform: Uint8Array }) => void;

  private getDefaultParams(): SynthiParams {
    return {
      osc1Freq: 220,
      osc1Wave: 'sawtooth',
      osc1Level: 0.5,
      osc2Freq: 220.5,
      osc2Wave: 'sawtooth',
      osc2Level: 0.5,
      osc3Freq: 110,
      osc3Wave: 'square',
      osc3Level: 0.3,
      filterFreq: 2000,
      filterQ: 5,
      filterType: 'lowpass',
      attack: 0.1,
      decay: 0.3,
      sustain: 0.7,
      release: 0.5,
      lfo1Rate: 0.5,
      lfo1Depth: 50,
      lfo2Rate: 2,
      lfo2Depth: 0.3,
      matrix: [],
      masterGain: 0.5,
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

    // Oscillator gains
    this.osc1Gain = this.ctx.createGain();
    this.osc2Gain = this.ctx.createGain();
    this.osc3Gain = this.ctx.createGain();
    this.osc1Gain.gain.value = 0;
    this.osc2Gain.gain.value = 0;
    this.osc3Gain.gain.value = 0;

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
    this.osc1Gain.connect(this.filter);
    this.osc2Gain.connect(this.filter);
    this.osc3Gain.connect(this.filter);
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

  play(): void {
    if (!this.ctx || this.isPlaying) return;

    // Create oscillators
    this.osc1 = this.ctx.createOscillator();
    this.osc1.type = this.params.osc1Wave;
    this.osc1.frequency.value = this.params.osc1Freq;
    this.osc1.connect(this.osc1Gain!);

    this.osc2 = this.ctx.createOscillator();
    this.osc2.type = this.params.osc2Wave;
    this.osc2.frequency.value = this.params.osc2Freq;
    this.osc2.connect(this.osc2Gain!);

    this.osc3 = this.ctx.createOscillator();
    this.osc3.type = this.params.osc3Wave;
    this.osc3.frequency.value = this.params.osc3Freq;
    this.osc3.connect(this.osc3Gain!);

    // Start noise
    this.noiseNode = this.ctx.createBufferSource();
    this.noiseNode.buffer = this.noiseBuffer;
    this.noiseNode.loop = true;
    this.noiseNode.connect(this.noiseGain!);

    // Start all
    const now = this.ctx.currentTime;
    this.osc1.start();
    this.osc2.start();
    this.osc3.start();
    this.noiseNode.start();

    // Apply envelope
    this.osc1Gain!.gain.setValueAtTime(0, now);
    this.osc1Gain!.gain.linearRampToValueAtTime(this.params.osc1Level, now + this.params.attack);
    this.osc1Gain!.gain.linearRampToValueAtTime(this.params.osc1Level * this.params.sustain, now + this.params.attack + this.params.decay);

    this.osc2Gain!.gain.setValueAtTime(0, now);
    this.osc2Gain!.gain.linearRampToValueAtTime(this.params.osc2Level, now + this.params.attack);
    this.osc2Gain!.gain.linearRampToValueAtTime(this.params.osc2Level * this.params.sustain, now + this.params.attack + this.params.decay);

    this.osc3Gain!.gain.setValueAtTime(0, now);
    this.osc3Gain!.gain.linearRampToValueAtTime(this.params.osc3Level, now + this.params.attack);
    this.osc3Gain!.gain.linearRampToValueAtTime(this.params.osc3Level * this.params.sustain, now + this.params.attack + this.params.decay);

    this.isPlaying = true;
  }

  stop(): void {
    if (!this.ctx || !this.isPlaying) return;

    const now = this.ctx.currentTime;

    // Release envelope
    this.osc1Gain!.gain.linearRampToValueAtTime(0, now + this.params.release);
    this.osc2Gain!.gain.linearRampToValueAtTime(0, now + this.params.release);
    this.osc3Gain!.gain.linearRampToValueAtTime(0, now + this.params.release);

    // Stop after release
    setTimeout(() => {
      this.osc1?.stop();
      this.osc2?.stop();
      this.osc3?.stop();
      this.noiseNode?.stop();
      this.osc1 = null;
      this.osc2 = null;
      this.osc3 = null;
      this.noiseNode = null;
    }, this.params.release * 1000 + 50);

    this.isPlaying = false;
  }

  // Gesture-based control
  gesture(x: number, y: number, pressure: number): void {
    if (!this.ctx) return;

    // X controls filter frequency (200 - 8000 Hz)
    const filterFreq = 200 + (x * 7800);
    this.filter!.frequency.setTargetAtTime(filterFreq, this.ctx.currentTime, 0.05);

    // Y controls oscillator detune
    const detune = (y - 0.5) * 100;
    if (this.osc2) this.osc2.detune.setTargetAtTime(detune, this.ctx.currentTime, 0.05);

    // Pressure controls filter resonance
    const q = 1 + (pressure * 20);
    this.filter!.Q.setTargetAtTime(q, this.ctx.currentTime, 0.05);
  }

  setParam<K extends keyof SynthiParams>(param: K, value: SynthiParams[K]): void {
    this.params[param] = value;

    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    switch (param) {
      case 'osc1Freq':
        this.osc1?.frequency.setTargetAtTime(value as number, now, 0.05);
        break;
      case 'osc2Freq':
        this.osc2?.frequency.setTargetAtTime(value as number, now, 0.05);
        break;
      case 'osc3Freq':
        this.osc3?.frequency.setTargetAtTime(value as number, now, 0.05);
        break;
      case 'filterFreq':
        this.filter?.frequency.setTargetAtTime(value as number, now, 0.05);
        break;
      case 'filterQ':
        this.filter?.Q.setTargetAtTime(value as number, now, 0.05);
        break;
      case 'lfo1Rate':
        this.lfo1?.frequency.setTargetAtTime(value as number, now, 0.05);
        break;
      case 'lfo1Depth':
        this.lfo1Gain?.gain.setTargetAtTime(value as number, now, 0.05);
        break;
      case 'masterGain':
        this.masterGain?.gain.setTargetAtTime(value as number, now, 0.05);
        break;
    }
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

  dispose(): void {
    this.stop();
    this.lfo1?.stop();
    this.lfo2?.stop();
    this.ctx?.close();
    this.ctx = null;
  }
}
