// === CORE TYPES ===

export type Language = 'fr' | 'en';

export interface Translatable {
  fr: string;
  en: string;
}

// Helper to get translated string
export function t(obj: Translatable, lang: Language): string {
  return obj[lang];
}

// === GEAR ===

export type GearCategory =
  | 'console'
  | 'tape_machine'
  | 'compressor'
  | 'eq'
  | 'limiter'
  | 'monitor_controller'
  | 'converter'
  | 'preamp'
  | 'di_box'
  | 'reverb'
  | 'delay'
  | 'saturation'
  | 'monitor'
  | 'interface'
  | 'synthesizer';

export const GEAR_CATEGORY_LABELS: Record<GearCategory, Translatable> = {
  console: { fr: 'Console', en: 'Console' },
  tape_machine: { fr: 'Magnétophone', en: 'Tape Machine' },
  compressor: { fr: 'Compresseur', en: 'Compressor' },
  eq: { fr: 'Égaliseur', en: 'Equalizer' },
  limiter: { fr: 'Limiteur', en: 'Limiter' },
  monitor_controller: { fr: 'Contrôleur de monitoring', en: 'Monitor Controller' },
  converter: { fr: 'Convertisseur', en: 'Converter' },
  preamp: { fr: 'Préamplificateur', en: 'Preamp' },
  di_box: { fr: 'Boîte de direct', en: 'DI Box' },
  reverb: { fr: 'Réverbe', en: 'Reverb' },
  delay: { fr: 'Délai', en: 'Delay' },
  saturation: { fr: 'Saturation', en: 'Saturation' },
  monitor: { fr: 'Enceinte', en: 'Monitor' },
  interface: { fr: 'Interface', en: 'Interface' },
  synthesizer: { fr: 'Synthétiseur', en: 'Synthesizer' },
};

export type SignalType = 'analog' | 'digital' | 'both';

export type ConnectorType =
  | 'xlr'
  | 'trs'
  | 'bantam_tt'
  | 'db25'
  | 'aes_ebu'
  | 'spdif'
  | 'madi'
  | 'usb'
  | 'thunderbolt'
  | 'pcie';

export interface GearIO {
  id: string;
  label: string;
  type: 'input' | 'output' | 'insert_send' | 'insert_return' | 'sidechain';
  connector: ConnectorType;
  signal: SignalType;
  channels: number; // 1 = mono, 2 = stereo, 8 = 8-channel, etc.
  patchbayPoint?: string; // reference to PatchbayPoint.id
}

export interface GearControl {
  name: string;
  type: 'knob' | 'switch' | 'fader' | 'button' | 'selector';
  description: Translatable;
  range?: string; // e.g. "-20dB to +10dB"
  positions?: string[]; // for switches/selectors
}

export interface GearUnit {
  id: string;
  name: string;
  manufacturer: string;
  model: string;
  category: GearCategory;
  description: Translatable;
  quickDescription: Translatable; // one-line for cards
  io: GearIO[];
  controls: GearControl[];
  defaultSettings?: Record<string, string | number>;
  tips: Translatable[];
  signalType: SignalType;
  rackUnits?: number; // height in U
  stereo: boolean;
  imageUrl?: string;
}

// === PATCHBAY ===

export type PatchbayLabelColor =
  | 'pink'
  | 'green'
  | 'yellow'
  | 'orange'
  | 'red'
  | 'white'
  | 'purple'
  | 'blue';

export const LABEL_COLOR_HEX: Record<PatchbayLabelColor, string> = {
  pink: '#f4a0b0',
  green: '#a8d8a0',
  yellow: '#f0e060',
  orange: '#f0a040',
  red: '#e04040',
  white: '#e0e0e0',
  purple: '#b080d0',
  blue: '#80b0e0',
};

export type NormallingType = 'full' | 'half' | 'none';

export interface PatchbayPoint {
  id: string; // unique identifier: "bay1-row1-pos3"
  label: string; // as printed on the patchbay: "STUDER LINE OUT"
  bay: number; // 1-6
  row: number; // 1-6 per bay (top to bottom, pairs: row1=top of normalled pair, row2=bottom)
  position: number; // 1-24 left to right
  type: 'send' | 'return'; // top row of pair = send, bottom = return
  gearId?: string; // reference to GearUnit.id
  gearIOId?: string; // reference to GearIO.id
  labelColor: PatchbayLabelColor;
  normalledTo?: string; // ID of the point this is normalled to
  normallingType: NormallingType;
  verified: boolean; // true if label confirmed, false if uncertain from photos
}

export interface PatchbayRow {
  bayId: number;
  rowNumber: number;
  label: string; // e.g. "STUDER LINE OUT", "CW INSERT"
  labelColor: PatchbayLabelColor;
  points: PatchbayPoint[];
}

export interface PatchbayBay {
  id: number;
  brand: 'Signex' | 'Isopatch';
  label?: string; // optional bay-level label
  rows: PatchbayRow[];
}

// === SIGNAL CHAINS ===

export interface SignalChainStep {
  stepNumber: number;
  gearId: string;
  gearIOId?: string; // specific I/O on the gear
  fromOutput?: string; // PatchbayPoint.id or GearIO id
  toInput?: string;
  patchRequired: boolean; // true if user needs to patch a cable
  patchFrom?: string; // PatchbayPoint.id
  patchTo?: string; // PatchbayPoint.id
  settings?: Record<string, string | number>;
  notes: Translatable;
}

export type ChainCategory = 'recording' | 'mixing' | 'mastering' | 'monitoring';
export type ChainDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface SignalChain {
  id: string;
  name: Translatable;
  description: Translatable;
  category: ChainCategory;
  difficulty: ChainDifficulty;
  steps: SignalChainStep[];
  tags: string[]; // "vocals", "guitar", "mastering", "stereo_bus"
}

// === WORKFLOWS (Decision Engine) ===

export interface WorkflowOption {
  id: string;
  label: Translatable;
  icon?: string; // emoji or lucide icon name
  nextNodeId?: string; // next question
  resultChainId?: string; // terminal → show this signal chain
  resultMessage?: Translatable; // terminal → show this message
}

export interface WorkflowNode {
  id: string;
  question: Translatable;
  helpText?: Translatable; // optional explanation
  options: WorkflowOption[];
}

export interface Workflow {
  id: string;
  name: Translatable;
  description: Translatable;
  icon: string;
  entryNodeId: string;
  nodes: WorkflowNode[];
}

// === VIRTUAL PATCH STATE ===

export type CableColor =
  | 'blue'
  | 'red'
  | 'green'
  | 'yellow'
  | 'purple'
  | 'orange'
  | 'white';

export interface VirtualCable {
  id: string;
  from: string; // PatchbayPoint.id
  to: string; // PatchbayPoint.id
  color: CableColor;
  label?: string; // optional step number or description
}

export interface PatchbayState {
  cables: VirtualCable[];
  selectedPoint?: string; // currently selected jack
  activeChainId?: string; // SignalChain.id being visualized
  highlightedPoints: string[]; // points to highlight
  zoomLevel: number;
  panX: number;
  panY: number;
}

// === I18N ===

export interface I18nStrings {
  // Navigation
  nav_dashboard: Translatable;
  nav_patchbay: Translatable;
  nav_guide: Translatable;
  nav_gear: Translatable;
  nav_chains: Translatable;
  nav_assistant: Translatable;

  // Common
  common_search: Translatable;
  common_filter: Translatable;
  common_back: Translatable;
  common_next: Translatable;
  common_cancel: Translatable;
  common_save: Translatable;
  common_reset: Translatable;
  common_loading: Translatable;

  // Gear
  gear_specs: Translatable;
  gear_io: Translatable;
  gear_controls: Translatable;
  gear_tips: Translatable;
  gear_patchbay_location: Translatable;

  // Patchbay
  patchbay_click_to_patch: Translatable;
  patchbay_clear_all: Translatable;
  patchbay_load_chain: Translatable;
  patchbay_verify_mode: Translatable;

  // Guide
  guide_start: Translatable;
  guide_restart: Translatable;
  guide_result: Translatable;
  guide_open_in_patchbay: Translatable;

  // Chains
  chain_difficulty: Translatable;
  chain_steps: Translatable;
  chain_tags: Translatable;

  // Categories
  [key: string]: Translatable;
}

// === CONTEXT ===

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof I18nStrings) => string;
  tr: (obj: Translatable) => string;
}
