/**
 * FLOW.MIND Shared State System
 *
 * This module provides real-time state synchronization between FLOW.MIND
 * and all connected instruments (FLOW.KIT, ÆTHER.KEY, SYNTHI).
 *
 * Uses localStorage + custom events for cross-tab communication.
 */

// ============ TYPES ============

export type Style = 'ambient' | 'techno' | 'broken' | 'cinematic' | 'minimal' | 'chaos';
export type Mood = 'dark' | 'light' | 'tense' | 'euphoric' | 'neutral';

export interface ModeState {
  style: Style;
  mood: Mood;
  energy: number;      // 0-1
  complexity: number;  // 0-1
}

export interface TransformState {
  chaos: number;       // 0-1
  warp: number;        // 0-1
  crush: number;       // 0-1
  morph: number;       // 0-1
}

export interface OutputState {
  intensity: number;   // 0-1
  width: number;       // 0-1
  direction: number;   // -1 to 1
  focus: number;       // 0-1
}

export interface FlowMindState {
  mode: ModeState;
  transform: TransformState;
  output: OutputState;
  timestamp: number;
  active: boolean;
}

// ============ DEFAULT STATE ============

export const DEFAULT_FLOW_STATE: FlowMindState = {
  mode: {
    style: 'ambient',
    mood: 'neutral',
    energy: 0.5,
    complexity: 0.4,
  },
  transform: {
    chaos: 0,
    warp: 0,
    crush: 0,
    morph: 0,
  },
  output: {
    intensity: 0.6,
    width: 0.5,
    direction: 0,
    focus: 0.5,
  },
  timestamp: Date.now(),
  active: false,
};

// ============ STORAGE KEY ============

const STORAGE_KEY = 'flow-mind-state';
const EVENT_KEY = 'flow-mind-update';

// ============ STATE MANAGEMENT ============

/**
 * Get current FLOW.MIND state from storage
 */
export function getFlowState(): FlowMindState {
  if (typeof window === 'undefined') return DEFAULT_FLOW_STATE;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Check if state is recent (within last 30 seconds)
      if (Date.now() - parsed.timestamp < 30000) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to read FLOW state:', e);
  }

  return DEFAULT_FLOW_STATE;
}

/**
 * Set FLOW.MIND state and broadcast to all instruments
 */
export function setFlowState(state: FlowMindState): void {
  if (typeof window === 'undefined') return;

  const stateWithTimestamp = {
    ...state,
    timestamp: Date.now(),
    active: true,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateWithTimestamp));

    // Dispatch custom event for same-tab listeners
    window.dispatchEvent(new CustomEvent(EVENT_KEY, { detail: stateWithTimestamp }));
  } catch (e) {
    console.warn('Failed to write FLOW state:', e);
  }
}

/**
 * Subscribe to FLOW.MIND state changes
 */
export function subscribeToFlowState(callback: (state: FlowMindState) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  // Listen for custom events (same tab)
  const handleEvent = (e: CustomEvent<FlowMindState>) => {
    callback(e.detail);
  };

  // Listen for storage events (cross-tab)
  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        const state = JSON.parse(e.newValue);
        callback(state);
      } catch (err) {
        console.warn('Failed to parse FLOW state:', err);
      }
    }
  };

  window.addEventListener(EVENT_KEY, handleEvent as EventListener);
  window.addEventListener('storage', handleStorage);

  // Return cleanup function
  return () => {
    window.removeEventListener(EVENT_KEY, handleEvent as EventListener);
    window.removeEventListener('storage', handleStorage);
  };
}

// ============ PARAMETER MAPPING ============

/**
 * Map FLOW.MIND state to FLOW.KIT parameters
 */
export function mapToFlowKit(state: FlowMindState) {
  const { mode, transform, output } = state;

  // BPM based on style and energy
  const baseBpm: Record<Style, number> = {
    ambient: 80,
    techno: 130,
    broken: 140,
    cinematic: 90,
    minimal: 120,
    chaos: 150,
  };

  const bpm = baseBpm[mode.style] + (mode.energy - 0.5) * 40;

  // Swing based on style
  const swingMap: Record<Style, number> = {
    ambient: 0,
    techno: 0.1,
    broken: 0.3,
    cinematic: 0.05,
    minimal: 0.15,
    chaos: Math.random() * 0.5,
  };

  return {
    bpm: Math.round(bpm),
    swing: swingMap[mode.style] + transform.warp * 0.2,
    energy: output.intensity,
    density: mode.complexity,
    chaos: transform.chaos,
    humanize: transform.morph * 0.3,
  };
}

/**
 * Map FLOW.MIND state to ÆTHER.KEY parameters
 */
export function mapToAetherKey(state: FlowMindState) {
  const { mode, transform, output } = state;

  // Tone mapping based on mood
  const toneMap: Record<Mood, { purity: number; richness: number; brightness: number }> = {
    dark: { purity: 0.3, richness: 0.7, brightness: 0.3 },
    light: { purity: 0.7, richness: 0.5, brightness: 0.8 },
    tense: { purity: 0.4, richness: 0.8, brightness: 0.5 },
    euphoric: { purity: 0.6, richness: 0.6, brightness: 0.7 },
    neutral: { purity: 0.5, richness: 0.5, brightness: 0.5 },
  };

  const baseTone = toneMap[mode.mood];

  return {
    tone: {
      purity: baseTone.purity + transform.morph * 0.2,
      richness: baseTone.richness + mode.complexity * 0.3,
      brightness: baseTone.brightness + mode.energy * 0.2,
    },
    excitation: {
      attack: 0.3 + mode.energy * 0.5,
      intensity: output.intensity,
    },
    resonance: {
      size: 0.4 + (1 - mode.energy) * 0.4,
      width: output.width,
      diffusion: output.focus,
    },
    modulation: {
      vibrato: transform.warp * 0.5,
      drift: transform.chaos * 0.3,
      instability: transform.chaos * 0.2,
    },
  };
}

/**
 * Map FLOW.MIND state to synth parameters
 */
export function mapToSynth(state: FlowMindState) {
  const { mode, transform, output } = state;

  return {
    filterCutoff: 200 + mode.energy * 3000,
    filterResonance: mode.complexity * 0.8,
    distortion: transform.crush * 0.8,
    reverbMix: output.width * 0.6,
    delayTime: transform.warp * 0.5,
    volume: output.intensity,
  };
}
