// === SIGNAL: HYBRID INSTRUMENT SYSTEM ===
// Playable Intelligence - where deterministic control meets generative emergence

import { Translatable } from './studio';

// === INSTRUMENT CATEGORIES ===

export type SignalInstrumentType =
  | 'field'      // ambient field instrument
  | 'orbit'      // rhythmic field instrument
  | 'wave'       // melodic lead instrument
  | 'membrane';  // drone and texture instrument

export type SignalVoiceType =
  | 'pad'        // sustained, warm
  | 'drone'      // continuous, evolving
  | 'pulse'      // rhythmic, percussive
  | 'lead'       // melodic, expressive
  | 'texture';   // granular, atmospheric

// === MUSICAL PARAMETERS ===

export type Scale =
  | 'pentatonic'
  | 'major'
  | 'minor'
  | 'dorian'
  | 'phrygian'
  | 'lydian'
  | 'mixolydian'
  | 'whole_tone'
  | 'harmonic_minor';

export interface MusicalContext {
  root: number;           // MIDI note number (0-127)
  scale: Scale;
  octave: number;         // base octave (0-8)
  chordMemory: number[];  // last 3 notes held
  harmonicField: number[]; // active harmonic series
}

// === LAYER 1: DETERMINISTIC ENGINE ===

export interface SynthVoice {
  id: string;
  type: SignalVoiceType;
  note: number;           // MIDI note
  frequency: number;      // Hz
  velocity: number;       // 0-1
  startTime: number;      // AudioContext.currentTime
  gainNode: GainNode;
  filterNode: BiquadFilterNode;
  oscillators: OscillatorNode[];
  envelope: {
    attack: number;
    decay: number;
    sustain: number;
    release: number;
  };
}

export interface DeterministicLayerConfig {
  voiceLimit: number;           // max simultaneous voices
  harmonicPartials: number;     // number of partials per voice
  filterCutoff: number;         // Hz
  filterResonance: number;      // Q
  reverbMix: number;            // 0-1
  reverbDecay: number;          // seconds
  stereoWidth: number;          // 0-1
  compressorThreshold: number;  // dB
  outputGain: number;           // 0-1
}

export interface DeterministicLayerState {
  activeVoices: SynthVoice[];
  context: MusicalContext;
  config: DeterministicLayerConfig;
  isPlaying: boolean;
  lastNoteTime: number;
}

// === LAYER 2: LYRIA REALTIME STREAM ===

export type LyriaMood =
  | 'ambient'    // sparse, floating
  | 'tension'    // dense, building
  | 'drift'      // wandering, evolving
  | 'pulse';     // rhythmic, grounded

export interface LyriaSteeringParams {
  mood: LyriaMood;
  density: number;             // 0-1 (sparse to dense)
  harmonicField: number[];     // MIDI notes to center around
  userActivity: number;        // 0-1 (silence to active)
  gestureEnergy: number;       // 0-1 (calm to intense)
  sessionDuration: number;     // seconds since start
  evolutionRate: number;       // 0-1 (static to rapidly evolving)
}

export type LyriaConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'streaming'
  | 'error';

export interface LyriaStreamConfig {
  serverUrl: string;           // WebSocket endpoint
  sampleRate: number;          // 44100 or 48000
  bufferSize: number;          // samples
  reconnectAttempts: number;
  reconnectDelay: number;      // ms
  crossfadeDuration: number;   // seconds
  outputGain: number;          // 0-1
}

export interface LyriaStreamState {
  connectionState: LyriaConnectionState;
  steeringParams: LyriaSteeringParams;
  config: LyriaStreamConfig;
  isStreaming: boolean;
  bufferHealth: number;        // 0-1 (empty to full)
  lastPacketTime: number;
  errorMessage?: string;
}

// === LAYER 3: VISUAL FEEDBACK MEMBRANE ===

export type VisualizationMode =
  | 'wave_field'      // concentric rings
  | 'particle_cloud'  // orbiting particles
  | 'tension_arcs'    // bezier curves
  | 'resonance_bloom' // radial gradients
  | 'hybrid';         // combination

export interface AnalysisData {
  pitch: number;              // detected fundamental (Hz)
  energy: number;             // RMS 0-1
  brightness: number;         // spectral centroid
  onsets: number[];           // timestamps of detected onsets
  frequencyBands: Float32Array; // energy per band
  waveform: Float32Array;     // time-domain signal
}

export interface VisualConfig {
  mode: VisualizationMode;
  color: string;              // base color (hex)
  accentColor: string;        // accent color (hex)
  particleCount: number;      // number of particles
  bloomIntensity: number;     // 0-1
  motionSpeed: number;        // 0-1
  responseTime: number;       // ms (smoothing)
  opacity: number;            // 0-1
}

export interface VisualState {
  config: VisualConfig;
  analysisData: AnalysisData;
  particlePositions: { x: number; y: number; velocity: { x: number; y: number } }[];
  fieldRadius: number;        // current radius of wave field
  time: number;               // animation time
}

// === INTEGRATED SIGNAL SYSTEM ===

export interface SignalInstrument {
  id: string;
  type: SignalInstrumentType;
  name: Translatable;
  description: Translatable;
  sonicIdentity: Translatable; // character description

  // Layer states
  deterministic: DeterministicLayerState;
  lyria: LyriaStreamState;
  visual: VisualState;

  // Routing
  masterGain: number;           // final output level
  lyriaBalance: number;         // 0=all local, 1=all AI
  crossfadeTime: number;        // seconds

  // Session
  sessionStartTime: number;
  isActive: boolean;
  recordedGestures: RecordedGesture[];
}

export interface RecordedGesture {
  timestamp: number;            // relative to session start
  type: 'note_on' | 'note_off' | 'cc' | 'mouse_move';
  note?: number;
  velocity?: number;
  ccNumber?: number;
  ccValue?: number;
  mouseX?: number;
  mouseY?: number;
}

// === MIDI INTEGRATION ===

export interface MIDIConfig {
  inputDeviceId?: string;
  channel: number;              // 1-16
  velocityCurve: 'linear' | 'logarithmic' | 'exponential';
  ccMappings: CCMapping[];
}

export interface CCMapping {
  ccNumber: number;             // 0-127
  parameter: string;            // which param to control
  min: number;                  // min value
  max: number;                  // max value
  curve: 'linear' | 'log' | 'exp';
}

// === PRESET SYSTEM ===

export interface SignalPreset {
  id: string;
  name: Translatable;
  instrumentType: SignalInstrumentType;
  description: Translatable;

  // Snapshot of all parameters
  deterministicConfig: DeterministicLayerConfig;
  lyriaParams: LyriaSteeringParams;
  visualConfig: VisualConfig;
  musicalContext: MusicalContext;

  tags: string[];
  author?: string;
  createdAt: number;
}

// === FUTURE: COLLABORATION ===

export interface CollaborativeSession {
  id: string;
  name: string;
  participants: Participant[];
  instrument: SignalInstrument;
  startTime: number;
  isLive: boolean;
}

export interface Participant {
  id: string;
  name: string;
  color: string;              // visual identifier
  instrument: SignalInstrumentType;
  isActive: boolean;
  lastGestureTime: number;
}
