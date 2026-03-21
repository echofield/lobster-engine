import type { GearUnit, GearCategory } from '@/types/studio';

export const gearRegistry: GearUnit[] = [
  // ============================================================
  // CONSOLE
  // ============================================================
  {
    id: 'studer-269',
    name: 'Studer 269',
    manufacturer: 'Studer',
    model: '269',
    category: 'console',
    description: {
      fr: "Console de mixage portable Studer 6-8 canaux. Le cœur analogique du studio, utilisée pour tous les enregistrements et routages. Préamplis micro de qualité broadcast, EQ 3 bandes musical, et section de monitoring complète.",
      en: "Studer 6-8 channel portable mixing console. The analog heart of the studio, used for all recordings and routing. Broadcast-quality mic preamps, musical 3-band EQ, and complete monitoring section."
    },
    quickDescription: {
      fr: 'Console analogique Studer - cœur du studio',
      en: 'Studer analog console - studio heart'
    },
    io: [
      { id: 'studer-mic-1', label: 'MIC 1', type: 'input', connector: 'xlr', signal: 'analog', channels: 1 },
      { id: 'studer-mic-2', label: 'MIC 2', type: 'input', connector: 'xlr', signal: 'analog', channels: 1 },
      { id: 'studer-mic-3', label: 'MIC 3', type: 'input', connector: 'xlr', signal: 'analog', channels: 1 },
      { id: 'studer-mic-4', label: 'MIC 4', type: 'input', connector: 'xlr', signal: 'analog', channels: 1 },
      { id: 'studer-mic-5', label: 'MIC 5', type: 'input', connector: 'xlr', signal: 'analog', channels: 1 },
      { id: 'studer-mic-6', label: 'MIC 6', type: 'input', connector: 'xlr', signal: 'analog', channels: 1 },
      { id: 'studer-line-in', label: 'LINE IN', type: 'input', connector: 'bantam_tt', signal: 'analog', channels: 2, patchbayPoint: 'studer-line-in' },
      { id: 'studer-line-out', label: 'LINE OUT', type: 'output', connector: 'bantam_tt', signal: 'analog', channels: 2, patchbayPoint: 'studer-line-out' },
      { id: 'studer-monitor-out', label: 'MONITOR OUT', type: 'output', connector: 'xlr', signal: 'analog', channels: 2 },
    ],
    controls: [
      { name: 'MIC GAIN', type: 'knob', description: { fr: 'Gain du préampli micro', en: 'Mic preamp gain' }, range: '0 to +60dB' },
      { name: 'MIC/LINE', type: 'switch', description: { fr: 'Sélection entrée micro ou ligne', en: 'Mic or line input select' }, positions: ['MIC', 'LINE'] },
      { name: 'EQ HIGH', type: 'knob', description: { fr: 'Égaliseur aigu (shelf)', en: 'High frequency EQ (shelf)' }, range: '±15dB @ 10kHz' },
      { name: 'EQ MID', type: 'knob', description: { fr: 'Égaliseur médium', en: 'Mid frequency EQ' }, range: '±15dB' },
      { name: 'EQ LOW', type: 'knob', description: { fr: 'Égaliseur grave (shelf)', en: 'Low frequency EQ (shelf)' }, range: '±15dB @ 100Hz' },
      { name: 'AUX 1', type: 'knob', description: { fr: "Départ auxiliaire 1", en: 'Aux send 1' } },
      { name: 'AUX 2', type: 'knob', description: { fr: "Départ auxiliaire 2", en: 'Aux send 2' } },
      { name: 'PAN', type: 'knob', description: { fr: 'Panoramique gauche/droite', en: 'Left/right pan' } },
      { name: 'FADER', type: 'fader', description: { fr: 'Niveau de sortie du canal', en: 'Channel output level' }, range: '-∞ to +10dB' },
    ],
    tips: [
      { fr: "Les préamplis Studer sont réputés pour leur son chaud et musical. N'hésitez pas à pousser le gain pour plus de saturation harmonique.", en: "Studer preamps are known for their warm, musical sound. Don't hesitate to push the gain for more harmonic saturation." },
      { fr: "L'EQ est très musical - des petits ajustements font beaucoup.", en: "The EQ is very musical - small adjustments go a long way." },
    ],
    signalType: 'analog',
    rackUnits: undefined,
    stereo: false,
  },

  // ============================================================
  // TAPE MACHINE
  // ============================================================
  {
    id: 'studer-a82',
    name: 'Studer A82',
    manufacturer: 'Studer',
    model: 'A82',
    category: 'tape_machine',
    description: {
      fr: "Magnétophone 2 pistes Studer A82. Machine de référence pour l'enregistrement et le mastering sur bande. Apporte la compression naturelle et la saturation caractéristique de la bande analogique.",
      en: "Studer A82 2-track tape recorder. Reference machine for tape recording and mastering. Provides natural compression and characteristic analog tape saturation."
    },
    quickDescription: {
      fr: 'Magnétophone 2 pistes - son bande',
      en: '2-track tape recorder - tape sound'
    },
    io: [
      { id: 'a82-input-l', label: 'INPUT L', type: 'input', connector: 'xlr', signal: 'analog', channels: 1 },
      { id: 'a82-input-r', label: 'INPUT R', type: 'input', connector: 'xlr', signal: 'analog', channels: 1 },
      { id: 'a82-output-l', label: 'OUTPUT L', type: 'output', connector: 'xlr', signal: 'analog', channels: 1 },
      { id: 'a82-output-r', label: 'OUTPUT R', type: 'output', connector: 'xlr', signal: 'analog', channels: 1 },
      { id: 'a82-to-tape', label: 'TO TAPE', type: 'input', connector: 'bantam_tt', signal: 'analog', channels: 2, patchbayPoint: 'to-tape' },
      { id: 'a82-from-tape', label: 'FROM TAPE', type: 'output', connector: 'bantam_tt', signal: 'analog', channels: 2, patchbayPoint: 'from-tape' },
    ],
    controls: [
      { name: 'REC LEVEL L', type: 'knob', description: { fr: 'Niveau d\'enregistrement canal gauche', en: 'Left channel record level' } },
      { name: 'REC LEVEL R', type: 'knob', description: { fr: 'Niveau d\'enregistrement canal droit', en: 'Right channel record level' } },
      { name: 'REPRO LEVEL L', type: 'knob', description: { fr: 'Niveau de lecture canal gauche', en: 'Left channel playback level' } },
      { name: 'REPRO LEVEL R', type: 'knob', description: { fr: 'Niveau de lecture canal droit', en: 'Right channel playback level' } },
      { name: 'SPEED', type: 'selector', description: { fr: 'Vitesse de bande', en: 'Tape speed' }, positions: ['7.5 ips', '15 ips', '30 ips'] },
      { name: 'PLAY', type: 'button', description: { fr: 'Lecture', en: 'Play' } },
      { name: 'RECORD', type: 'button', description: { fr: 'Enregistrement', en: 'Record' } },
      { name: 'STOP', type: 'button', description: { fr: 'Arrêt', en: 'Stop' } },
      { name: 'FF', type: 'button', description: { fr: 'Avance rapide', en: 'Fast forward' } },
      { name: 'REW', type: 'button', description: { fr: 'Rembobinage', en: 'Rewind' } },
    ],
    tips: [
      { fr: "Pour un son vintage, utilisez 15 ips avec une légère saturation. Pour plus de définition, 30 ips.", en: "For vintage sound, use 15 ips with slight saturation. For more definition, 30 ips." },
      { fr: "Le monitoring 'Input' permet d'entendre le signal avant la bande, 'Repro' après l'enregistrement sur bande.", en: "'Input' monitoring lets you hear signal before tape, 'Repro' after tape recording." },
    ],
    signalType: 'analog',
    stereo: true,
  },

  // ============================================================
  // COMPRESSORS / LIMITERS
  // ============================================================
  {
    id: 'manley-vari-mu',
    name: 'Manley Variable Mu',
    manufacturer: 'Manley',
    model: 'Variable Mu Limiter Compressor',
    category: 'compressor',
    description: {
      fr: "Compresseur/limiteur stéréo à lampes Manley Variable Mu. Légendaire pour le bus stéréo et le mastering. Compression douce et musicale avec ce son \"glue\" caractéristique.",
      en: "Manley Variable Mu stereo tube limiter/compressor. Legendary for stereo bus and mastering. Smooth, musical compression with characteristic 'glue' sound."
    },
    quickDescription: {
      fr: 'Compresseur à lampes - glue du mix',
      en: 'Tube compressor - mix glue'
    },
    io: [
      { id: 'varimu-in-l', label: 'INPUT L', type: 'input', connector: 'xlr', signal: 'analog', channels: 1 },
      { id: 'varimu-in-r', label: 'INPUT R', type: 'input', connector: 'xlr', signal: 'analog', channels: 1 },
      { id: 'varimu-out-l', label: 'OUTPUT L', type: 'output', connector: 'xlr', signal: 'analog', channels: 1 },
      { id: 'varimu-out-r', label: 'OUTPUT R', type: 'output', connector: 'xlr', signal: 'analog', channels: 1 },
      { id: 'varimu-sc-l', label: 'SIDECHAIN L', type: 'sidechain', connector: 'trs', signal: 'analog', channels: 1 },
      { id: 'varimu-sc-r', label: 'SIDECHAIN R', type: 'sidechain', connector: 'trs', signal: 'analog', channels: 1 },
      { id: 'varimu-patch', label: 'VARI MU', type: 'input', connector: 'bantam_tt', signal: 'analog', channels: 2, patchbayPoint: 'vari-mu' },
    ],
    controls: [
      { name: 'INPUT', type: 'knob', description: { fr: 'Niveau d\'entrée / seuil', en: 'Input level / threshold' } },
      { name: 'OUTPUT', type: 'knob', description: { fr: 'Niveau de sortie (make-up gain)', en: 'Output level (make-up gain)' } },
      { name: 'ATTACK', type: 'switch', description: { fr: 'Temps d\'attaque', en: 'Attack time' }, positions: ['FAST', 'SLOW'] },
      { name: 'RECOVERY', type: 'selector', description: { fr: 'Temps de release', en: 'Release time' }, positions: ['1', '2', '3', '4', '5'] },
      { name: 'HP SC', type: 'switch', description: { fr: 'Filtre passe-haut sur sidechain', en: 'High-pass filter on sidechain' }, positions: ['OFF', 'ON'] },
      { name: 'LINK', type: 'switch', description: { fr: 'Liaison stéréo', en: 'Stereo link' }, positions: ['OFF', 'ON'] },
      { name: 'LIMIT/COMPRESS', type: 'switch', description: { fr: 'Mode limiteur ou compresseur', en: 'Limiter or compressor mode' }, positions: ['LIMIT', 'COMPRESS'] },
      { name: 'BYPASS', type: 'button', description: { fr: 'Contournement', en: 'Bypass' } },
    ],
    defaultSettings: {
      'ATTACK': 'SLOW',
      'RECOVERY': '3',
      'HP SC': 'ON',
      'LINK': 'ON',
    },
    tips: [
      { fr: "Pour le bus stéréo, commencez avec 1-2dB de réduction de gain, recovery sur 3, et HP SC activé pour éviter le pompage sur les basses.", en: "For stereo bus, start with 1-2dB gain reduction, recovery on 3, and HP SC on to avoid bass pumping." },
      { fr: "Le mode LIMIT a un ratio plus élevé et une attaque plus rapide. COMPRESS est plus doux.", en: "LIMIT mode has higher ratio and faster attack. COMPRESS is gentler." },
    ],
    signalType: 'analog',
    rackUnits: 3,
    stereo: true,
  },

  {
    id: 'api-2500',
    name: 'API 2500',
    manufacturer: 'API',
    model: '2500',
    category: 'compressor',
    description: {
      fr: "Compresseur de bus stéréo API 2500. Le son punchy caractéristique d'API, parfait pour le bus de batterie et le mix. Contrôle de tone unique et options de knee Old/New.",
      en: "API 2500 stereo bus compressor. Characteristic punchy API sound, perfect for drum bus and mix. Unique tone control and Old/New knee options."
    },
    quickDescription: {
      fr: 'Compresseur de bus - punch API',
      en: 'Bus compressor - API punch'
    },
    io: [
      { id: 'api2500-in-l', label: 'INPUT L', type: 'input', connector: 'xlr', signal: 'analog', channels: 1 },
      { id: 'api2500-in-r', label: 'INPUT R', type: 'input', connector: 'xlr', signal: 'analog', channels: 1 },
      { id: 'api2500-out-l', label: 'OUTPUT L', type: 'output', connector: 'xlr', signal: 'analog', channels: 1 },
      { id: 'api2500-out-r', label: 'OUTPUT R', type: 'output', connector: 'xlr', signal: 'analog', channels: 1 },
      { id: 'api2500-patch', label: 'API 2500', type: 'input', connector: 'bantam_tt', signal: 'analog', channels: 2, patchbayPoint: 'api-2500' },
    ],
    controls: [
      { name: 'THRESHOLD', type: 'knob', description: { fr: 'Seuil de compression', en: 'Compression threshold' }, range: '-20dB to +10dB' },
      { name: 'ATTACK', type: 'knob', description: { fr: 'Temps d\'attaque', en: 'Attack time' }, range: '0.03ms to 30ms' },
      { name: 'RELEASE', type: 'knob', description: { fr: 'Temps de release', en: 'Release time' }, range: '0.05s to 3s' },
      { name: 'RATIO', type: 'selector', description: { fr: 'Taux de compression', en: 'Compression ratio' }, positions: ['1.5', '2', '3', '4', '6', '10', '∞'] },
      { name: 'KNEE', type: 'switch', description: { fr: 'Type de knee (caractère)', en: 'Knee type (character)' }, positions: ['OLD', 'MED', 'NEW'] },
      { name: 'TYPE', type: 'switch', description: { fr: 'Type de détection', en: 'Detection type' }, positions: ['FEEDBACK', 'FEED FWD'] },
      { name: 'TONE', type: 'knob', description: { fr: 'Contour tonal (grave/aigu)', en: 'Tonal contour (low/high)' }, positions: ['THRUST', 'NORMAL', 'LOUD'] },
      { name: 'OUTPUT', type: 'knob', description: { fr: 'Niveau de sortie', en: 'Output level' }, range: '-12dB to +12dB' },
      { name: 'LINK', type: 'switch', description: { fr: 'Mode de liaison stéréo', en: 'Stereo link mode' }, positions: ['1', '2', '3'] },
    ],
    defaultSettings: {
      'RATIO': '4',
      'KNEE': 'MED',
      'TYPE': 'FEED FWD',
    },
    tips: [
      { fr: "Pour les drums, essayez OLD knee avec FEEDBACK pour un son plus agressif, punchy.", en: "For drums, try OLD knee with FEEDBACK for a more aggressive, punchy sound." },
      { fr: "TONE sur THRUST ajoute de la présence sans perdre de corps.", en: "TONE on THRUST adds presence without losing body." },
    ],
    signalType: 'analog',
    rackUnits: 2,
    stereo: true,
  },

  {
    id: 'dbx-165',
    name: 'DBX 165',
    manufacturer: 'DBX',
    model: '165 Over Easy',
    category: 'compressor',
    description: {
      fr: "Compresseur/limiteur mono DBX 165 Over Easy. Compression VCA classique avec le fameux knee Over Easy pour une compression transparente ou plus agressive.",
      en: "DBX 165 Over Easy mono compressor/limiter. Classic VCA compression with the famous Over Easy knee for transparent or more aggressive compression."
    },
    quickDescription: {
      fr: 'Compresseur VCA mono - polyvalent',
      en: 'Mono VCA compressor - versatile'
    },
    io: [
      { id: 'dbx165-in', label: 'INPUT', type: 'input', connector: 'xlr', signal: 'analog', channels: 1 },
      { id: 'dbx165-out', label: 'OUTPUT', type: 'output', connector: 'xlr', signal: 'analog', channels: 1 },
      { id: 'dbx165-patch', label: '165', type: 'input', connector: 'bantam_tt', signal: 'analog', channels: 1, patchbayPoint: 'dbx-165' },
    ],
    controls: [
      { name: 'THRESHOLD', type: 'knob', description: { fr: 'Seuil de compression', en: 'Compression threshold' }, range: '-40dB to +20dB' },
      { name: 'COMPRESSION', type: 'knob', description: { fr: 'Taux de compression', en: 'Compression ratio' }, range: '1:1 to ∞:1' },
      { name: 'ATTACK/RELEASE', type: 'knob', description: { fr: 'Temps d\'attaque et release (programme)', en: 'Attack and release time (program)' } },
      { name: 'OUTPUT', type: 'knob', description: { fr: 'Niveau de sortie', en: 'Output level' }, range: '-20dB to +20dB' },
      { name: 'OVER EASY', type: 'switch', description: { fr: 'Mode Over Easy (knee souple)', en: 'Over Easy mode (soft knee)' }, positions: ['OFF', 'ON'] },
      { name: 'AUTO', type: 'switch', description: { fr: 'Attack/Release automatique', en: 'Automatic attack/release' }, positions: ['OFF', 'ON'] },
    ],
    tips: [
      { fr: "OVER EASY rend la compression plus transparente - idéal pour les voix.", en: "OVER EASY makes compression more transparent - ideal for vocals." },
      { fr: "En mode AUTO, le compresseur adapte automatiquement les temps - pratique pour débuter.", en: "In AUTO mode, the compressor adapts timing automatically - handy for beginners." },
    ],
    signalType: 'analog',
    rackUnits: 1,
    stereo: false,
  },

  {
    id: 'mohog-mofet76',
    name: 'MoFET 76',
    manufacturer: 'Mohog Audio',
    model: 'MoFET76',
    category: 'compressor',
    description: {
      fr: "Compresseur FET style 1176 par Mohog Audio. Clone boutique avec sélection de transformateurs Carnhill/Edcor. Attaque ultra-rapide, parfait pour drums, basse, voix.",
      en: "1176-style FET compressor by Mohog Audio. Boutique clone with Carnhill/Edcor transformer selection. Ultra-fast attack, perfect for drums, bass, vocals."
    },
    quickDescription: {
      fr: 'Clone 1176 - attaque rapide',
      en: '1176 clone - fast attack'
    },
    io: [
      { id: 'mofet76-in', label: 'INPUT', type: 'input', connector: 'xlr', signal: 'analog', channels: 1 },
      { id: 'mofet76-out', label: 'OUTPUT', type: 'output', connector: 'xlr', signal: 'analog', channels: 1 },
      { id: 'mofet76-patch', label: '1176', type: 'input', connector: 'bantam_tt', signal: 'analog', channels: 1, patchbayPoint: 'mofet-1176' },
    ],
    controls: [
      { name: 'INPUT', type: 'knob', description: { fr: 'Niveau d\'entrée (drive le compresseur)', en: 'Input level (drives the compressor)' } },
      { name: 'OUTPUT', type: 'knob', description: { fr: 'Niveau de sortie', en: 'Output level' } },
      { name: 'ATTACK', type: 'knob', description: { fr: 'Temps d\'attaque (sens inverse)', en: 'Attack time (reversed direction)' }, range: '20µs to 800µs' },
      { name: 'RELEASE', type: 'knob', description: { fr: 'Temps de release (sens inverse)', en: 'Release time (reversed direction)' }, range: '50ms to 1.1s' },
      { name: 'RATIO', type: 'selector', description: { fr: 'Taux de compression', en: 'Compression ratio' }, positions: ['4', '8', '12', '20', 'OFF'] },
      { name: 'TRANSFORMER', type: 'switch', description: { fr: 'Sélection du transformateur de sortie', en: 'Output transformer selection' }, positions: ['CARNHILL', 'EDCOR'] },
      { name: 'METER', type: 'selector', description: { fr: 'Mode du VU-mètre', en: 'VU meter mode' }, positions: ['GR', 'OUT', '+4', '+8'] },
    ],
    tips: [
      { fr: "Les contrôles ATTACK et RELEASE sont inversés - tourner vers la droite = plus rapide.", en: "ATTACK and RELEASE controls are reversed - clockwise = faster." },
      { fr: "Le mode 'All buttons in' (tous les ratios) donne une distortion agressive - essayez sur les drums!", en: "The 'All buttons in' mode (all ratios) gives aggressive distortion - try on drums!" },
    ],
    signalType: 'analog',
    rackUnits: 2,
    stereo: false,
  },

  {
    id: 'mohog-mo3a-l',
    name: 'Mo3a (Left)',
    manufacturer: 'Mohog Audio',
    model: 'Mo3a',
    category: 'compressor',
    description: {
      fr: "Compresseur opto style LA-3A par Mohog Audio (canal gauche). Compression douce et lente, parfait pour lisser les voix et la basse.",
      en: "LA-3A style opto compressor by Mohog Audio (left channel). Gentle, slow compression, perfect for smoothing vocals and bass."
    },
    quickDescription: {
      fr: 'Clone LA-3A L - compression douce',
      en: 'LA-3A clone L - smooth compression'
    },
    io: [
      { id: 'mo3a-l-in', label: 'INPUT', type: 'input', connector: 'xlr', signal: 'analog', channels: 1 },
      { id: 'mo3a-l-out', label: 'OUTPUT', type: 'output', connector: 'xlr', signal: 'analog', channels: 1 },
      { id: 'mo3a-l-patch', label: 'Mo3a L', type: 'input', connector: 'bantam_tt', signal: 'analog', channels: 1, patchbayPoint: 'mo3a-l' },
    ],
    controls: [
      { name: 'GAIN', type: 'knob', description: { fr: 'Niveau de sortie', en: 'Output level' } },
      { name: 'PEAK REDUCTION', type: 'knob', description: { fr: 'Quantité de réduction de crêtes (compression)', en: 'Amount of peak reduction (compression)' } },
      { name: 'LIMIT/COMPRESS', type: 'switch', description: { fr: 'Mode limiteur ou compresseur', en: 'Limiter or compressor mode' }, positions: ['LIMIT', 'COMPRESS'] },
    ],
    tips: [
      { fr: "L'opto a un temps de réponse naturellement lent - laissez-le travailler doucement.", en: "The opto has a naturally slow response time - let it work gently." },
      { fr: "Mode LIMIT pour plus de contrôle sur les crêtes, COMPRESS pour un effet plus subtil.", en: "LIMIT mode for more peak control, COMPRESS for a subtler effect." },
    ],
    signalType: 'analog',
    rackUnits: 2,
    stereo: false,
  },

  {
    id: 'mohog-mo3a-r',
    name: 'Mo3a (Right)',
    manufacturer: 'Mohog Audio',
    model: 'Mo3a',
    category: 'compressor',
    description: {
      fr: "Compresseur opto style LA-3A par Mohog Audio (canal droit). Paire stéréo avec le Mo3a Left pour le bus ou le mastering.",
      en: "LA-3A style opto compressor by Mohog Audio (right channel). Stereo pair with Mo3a Left for bus or mastering."
    },
    quickDescription: {
      fr: 'Clone LA-3A R - paire stéréo',
      en: 'LA-3A clone R - stereo pair'
    },
    io: [
      { id: 'mo3a-r-in', label: 'INPUT', type: 'input', connector: 'xlr', signal: 'analog', channels: 1 },
      { id: 'mo3a-r-out', label: 'OUTPUT', type: 'output', connector: 'xlr', signal: 'analog', channels: 1 },
      { id: 'mo3a-r-patch', label: 'Mo3a R', type: 'input', connector: 'bantam_tt', signal: 'analog', channels: 1, patchbayPoint: 'mo3a-r' },
    ],
    controls: [
      { name: 'GAIN', type: 'knob', description: { fr: 'Niveau de sortie', en: 'Output level' } },
      { name: 'PEAK REDUCTION', type: 'knob', description: { fr: 'Quantité de réduction de crêtes', en: 'Amount of peak reduction' } },
      { name: 'LIMIT/COMPRESS', type: 'switch', description: { fr: 'Mode limiteur ou compresseur', en: 'Limiter or compressor mode' }, positions: ['LIMIT', 'COMPRESS'] },
    ],
    tips: [
      { fr: "Assortir les réglages avec le canal gauche pour un traitement stéréo cohérent.", en: "Match settings with left channel for consistent stereo processing." },
    ],
    signalType: 'analog',
    rackUnits: 2,
    stereo: false,
  },

  {
    id: 'urei-1178',
    name: 'UREI 1178',
    manufacturer: 'UREI',
    model: '1178',
    category: 'compressor',
    description: {
      fr: "Limiteur de crêtes stéréo UREI 1178. Version stéréo du légendaire 1176. Compression FET ultra-rapide avec le son caractéristique UREI.",
      en: "UREI 1178 dual peak limiter. Stereo version of the legendary 1176. Ultra-fast FET compression with characteristic UREI sound."
    },
    quickDescription: {
      fr: 'Double 1176 original UREI',
      en: 'Original UREI dual 1176'
    },
    io: [
      { id: '1178-in-l', label: 'INPUT L', type: 'input', connector: 'xlr', signal: 'analog', channels: 1 },
      { id: '1178-in-r', label: 'INPUT R', type: 'input', connector: 'xlr', signal: 'analog', channels: 1 },
      { id: '1178-out-l', label: 'OUTPUT L', type: 'output', connector: 'xlr', signal: 'analog', channels: 1 },
      { id: '1178-out-r', label: 'OUTPUT R', type: 'output', connector: 'xlr', signal: 'analog', channels: 1 },
      { id: '1178-patch', label: '1178', type: 'input', connector: 'bantam_tt', signal: 'analog', channels: 2, patchbayPoint: 'urei-1178' },
    ],
    controls: [
      { name: 'INPUT (per ch)', type: 'knob', description: { fr: 'Niveau d\'entrée par canal', en: 'Input level per channel' } },
      { name: 'OUTPUT (per ch)', type: 'knob', description: { fr: 'Niveau de sortie par canal', en: 'Output level per channel' } },
      { name: 'ATTACK (per ch)', type: 'knob', description: { fr: 'Temps d\'attaque (sens inverse)', en: 'Attack time (reversed)' } },
      { name: 'RELEASE (per ch)', type: 'knob', description: { fr: 'Temps de release (sens inverse)', en: 'Release time (reversed)' } },
      { name: 'RATIO (per ch)', type: 'selector', description: { fr: 'Taux de compression', en: 'Compression ratio' }, positions: ['4', '8', '12', '20'] },
      { name: 'LINK', type: 'switch', description: { fr: 'Liaison stéréo', en: 'Stereo link' }, positions: ['OFF', 'ON'] },
    ],
    tips: [
      { fr: "C'est un vrai UREI vintage - le son est légèrement différent des reissues modernes.", en: "This is a real vintage UREI - the sound is slightly different from modern reissues." },
      { fr: "En mode LINK, les deux canaux sont contrôlés par le sidechain combiné.", en: "In LINK mode, both channels are controlled by the combined sidechain." },
    ],
    signalType: 'analog',
    rackUnits: 2,
    stereo: true,
  },

  {
    id: 'retro-sta-level',
    name: 'Retro Sta-Level',
    manufacturer: 'Retro Instruments',
    model: 'Sta-Level Gold Edition',
    category: 'compressor',
    description: {
      fr: "Compresseur à lampes Retro Instruments Sta-Level. Compression variable-mu avec modes Single/Double/Triple pour différents caractères de compression.",
      en: "Retro Instruments Sta-Level tube compressor. Variable-mu compression with Single/Double/Triple modes for different compression characters."
    },
    quickDescription: {
      fr: 'Compresseur à lampes - caractère vintage',
      en: 'Tube compressor - vintage character'
    },
    io: [
      { id: 'sta-in', label: 'INPUT', type: 'input', connector: 'xlr', signal: 'analog', channels: 1 },
      { id: 'sta-out', label: 'OUTPUT', type: 'output', connector: 'xlr', signal: 'analog', channels: 1 },
      { id: 'sta-patch', label: 'STA', type: 'input', connector: 'bantam_tt', signal: 'analog', channels: 1, patchbayPoint: 'sta-level' },
    ],
    controls: [
      { name: 'INPUT', type: 'knob', description: { fr: 'Niveau d\'entrée', en: 'Input level' } },
      { name: 'OUTPUT', type: 'knob', description: { fr: 'Niveau de sortie', en: 'Output level' } },
      { name: 'RECOVERY', type: 'knob', description: { fr: 'Temps de recovery (release)', en: 'Recovery time (release)' }, range: 'Slow to Fast' },
      { name: 'MODE', type: 'selector', description: { fr: 'Mode de compression', en: 'Compression mode' }, positions: ['SINGLE', 'DOUBLE', 'TRIPLE'] },
    ],
    tips: [
      { fr: "SINGLE = plus subtil, DOUBLE = compression standard, TRIPLE = plus agressif avec harmonic content.", en: "SINGLE = more subtle, DOUBLE = standard compression, TRIPLE = more aggressive with harmonic content." },
      { fr: "Excellent sur les voix pour ajouter de la chaleur tout en contrôlant la dynamique.", en: "Excellent on vocals to add warmth while controlling dynamics." },
    ],
    signalType: 'analog',
    rackUnits: 2,
    stereo: false,
  },

  // ============================================================
  // EQ
  // ============================================================
  {
    id: 'chandler-curve-bender',
    name: 'Chandler TG12345 Curve Bender',
    manufacturer: 'Chandler Limited',
    model: 'TG12345 Curve Bender',
    category: 'eq',
    description: {
      fr: "EQ de mastering Chandler Limited style EMI/Abbey Road. Basé sur les égaliseurs des consoles TG utilisées aux studios Abbey Road. Égalisation musicale et large.",
      en: "Chandler Limited mastering EQ, EMI/Abbey Road style. Based on EQs from TG consoles used at Abbey Road Studios. Musical, broad equalization."
    },
    quickDescription: {
      fr: 'EQ mastering style Abbey Road',
      en: 'Abbey Road style mastering EQ'
    },
    io: [
      { id: 'curve-in-l', label: 'INPUT L', type: 'input', connector: 'xlr', signal: 'analog', channels: 1 },
      { id: 'curve-in-r', label: 'INPUT R', type: 'input', connector: 'xlr', signal: 'analog', channels: 1 },
      { id: 'curve-out-l', label: 'OUTPUT L', type: 'output', connector: 'xlr', signal: 'analog', channels: 1 },
      { id: 'curve-out-r', label: 'OUTPUT R', type: 'output', connector: 'xlr', signal: 'analog', channels: 1 },
      { id: 'curve-patch', label: 'CURVE B', type: 'input', connector: 'bantam_tt', signal: 'analog', channels: 2, patchbayPoint: 'curve-bender' },
    ],
    controls: [
      { name: 'BASS (per ch)', type: 'knob', description: { fr: 'Égaliseur grave', en: 'Bass EQ' }, range: '±10dB' },
      { name: 'BASS FREQ', type: 'selector', description: { fr: 'Fréquence du grave', en: 'Bass frequency' }, positions: ['50Hz', '100Hz', '200Hz'] },
      { name: 'PRESENCE 1', type: 'knob', description: { fr: 'Égaliseur présence bande 1', en: 'Presence EQ band 1' }, range: '±10dB' },
      { name: 'PRESENCE 1 FREQ', type: 'selector', description: { fr: 'Fréquence présence 1', en: 'Presence 1 frequency' }, positions: ['0.7k', '1.5k', '2.5k', '3.5k'] },
      { name: 'PRESENCE 2', type: 'knob', description: { fr: 'Égaliseur présence bande 2', en: 'Presence EQ band 2' }, range: '±10dB' },
      { name: 'PRESENCE 2 FREQ', type: 'selector', description: { fr: 'Fréquence présence 2', en: 'Presence 2 frequency' }, positions: ['2.5k', '5k', '7k', '10k'] },
      { name: 'TREBLE', type: 'knob', description: { fr: 'Égaliseur aigu', en: 'Treble EQ' }, range: '±10dB' },
      { name: 'TREBLE FREQ', type: 'selector', description: { fr: 'Fréquence aigu', en: 'Treble frequency' }, positions: ['5kHz', '10kHz', '15kHz'] },
      { name: 'L/R or M/S', type: 'switch', description: { fr: 'Mode Left/Right ou Mid/Side', en: 'Left/Right or Mid/Side mode' }, positions: ['L/R', 'M/S'] },
    ],
    tips: [
      { fr: "Le mode M/S permet de traiter le centre et les côtés séparément - puissant pour le mastering.", en: "M/S mode allows processing center and sides separately - powerful for mastering." },
      { fr: "Les courbes sont très larges et musicales - des ajustements subtils font beaucoup.", en: "The curves are very broad and musical - subtle adjustments go a long way." },
    ],
    signalType: 'analog',
    rackUnits: 3,
    stereo: true,
  },

  {
    id: 'maselec-mea2',
    name: 'Prism Sound Maselec MEA-2',
    manufacturer: 'Prism Sound',
    model: 'Maselec MEA-2',
    category: 'eq',
    description: {
      fr: "EQ paramétrique de mastering Maselec MEA-2. 4 bandes par canal avec Q variable. La référence pour le mastering avec une précision chirurgicale.",
      en: "Maselec MEA-2 mastering parametric EQ. 4 bands per channel with variable Q. The reference for mastering with surgical precision."
    },
    quickDescription: {
      fr: 'EQ mastering paramétrique précis',
      en: 'Precise parametric mastering EQ'
    },
    io: [
      { id: 'mea2-in-l', label: 'INPUT L', type: 'input', connector: 'xlr', signal: 'analog', channels: 1 },
      { id: 'mea2-in-r', label: 'INPUT R', type: 'input', connector: 'xlr', signal: 'analog', channels: 1 },
      { id: 'mea2-out-l', label: 'OUTPUT L', type: 'output', connector: 'xlr', signal: 'analog', channels: 1 },
      { id: 'mea2-out-r', label: 'OUTPUT R', type: 'output', connector: 'xlr', signal: 'analog', channels: 1 },
      { id: 'mea2-patch', label: 'MEA2', type: 'input', connector: 'bantam_tt', signal: 'analog', channels: 2, patchbayPoint: 'mea2' },
    ],
    controls: [
      { name: 'BAND 1-4 FREQ', type: 'knob', description: { fr: 'Fréquence par bande', en: 'Frequency per band' } },
      { name: 'BAND 1-4 GAIN', type: 'knob', description: { fr: 'Gain par bande', en: 'Gain per band' }, range: '±8dB' },
      { name: 'BAND 1-4 Q', type: 'knob', description: { fr: 'Largeur de bande (Q)', en: 'Bandwidth (Q)' } },
      { name: 'BAND 1 TYPE', type: 'switch', description: { fr: 'Type bande 1 (shelf/bell)', en: 'Band 1 type (shelf/bell)' }, positions: ['SHELF', 'BELL'] },
      { name: 'BAND 4 TYPE', type: 'switch', description: { fr: 'Type bande 4 (shelf/bell)', en: 'Band 4 type (shelf/bell)' }, positions: ['SHELF', 'BELL'] },
      { name: 'BYPASS', type: 'button', description: { fr: 'Contournement', en: 'Bypass' } },
    ],
    tips: [
      { fr: "Utilisez de petits ajustements (0.5-1dB) pour le mastering. La précision du MEA-2 le permet.", en: "Use small adjustments (0.5-1dB) for mastering. The MEA-2's precision allows it." },
      { fr: "Les shelfs sont excellents pour de larges ajustements tonaux.", en: "The shelves are excellent for broad tonal adjustments." },
    ],
    signalType: 'analog',
    rackUnits: 2,
    stereo: true,
  },

  // ============================================================
  // LIMITERS (Mastering)
  // ============================================================
  {
    id: 'maselec-mpl2',
    name: 'Maselec MPL-2',
    manufacturer: 'Prism Sound',
    model: 'Maselec MPL-2',
    category: 'limiter',
    description: {
      fr: "Limiteur de crêtes et HF Maselec MPL-2. Limiteur de mastering de référence avec limiteur HF séparé pour contrôler les sibilances et les hautes fréquences agressives.",
      en: "Maselec MPL-2 peak and HF limiter. Reference mastering limiter with separate HF limiter to control sibilance and aggressive high frequencies."
    },
    quickDescription: {
      fr: 'Limiteur mastering avec HF limiter',
      en: 'Mastering limiter with HF limiter'
    },
    io: [
      { id: 'mpl2-in-l', label: 'INPUT L', type: 'input', connector: 'xlr', signal: 'analog', channels: 1 },
      { id: 'mpl2-in-r', label: 'INPUT R', type: 'input', connector: 'xlr', signal: 'analog', channels: 1 },
      { id: 'mpl2-out-l', label: 'OUTPUT L', type: 'output', connector: 'xlr', signal: 'analog', channels: 1 },
      { id: 'mpl2-out-r', label: 'OUTPUT R', type: 'output', connector: 'xlr', signal: 'analog', channels: 1 },
      { id: 'mpl2-patch', label: 'MPL-2', type: 'input', connector: 'bantam_tt', signal: 'analog', channels: 2, patchbayPoint: 'mpl2' },
    ],
    controls: [
      { name: 'INPUT GAIN', type: 'knob', description: { fr: 'Gain d\'entrée', en: 'Input gain' } },
      { name: 'THRESHOLD', type: 'knob', description: { fr: 'Seuil du limiteur', en: 'Limiter threshold' } },
      { name: 'HF THRESHOLD', type: 'knob', description: { fr: 'Seuil du limiteur HF', en: 'HF limiter threshold' } },
      { name: 'HF FREQ', type: 'selector', description: { fr: 'Fréquence du limiteur HF', en: 'HF limiter frequency' }, positions: ['4kHz', '6kHz', '8kHz', '10kHz', '12kHz'] },
      { name: 'BYPASS', type: 'button', description: { fr: 'Contournement', en: 'Bypass' } },
    ],
    tips: [
      { fr: "Le limiteur HF est excellent pour dompter les mix trop brillants sans affecter le corps.", en: "The HF limiter is excellent for taming overly bright mixes without affecting body." },
      { fr: "Utilisez avec parcimonie - 1-2dB de réduction de crête maximum pour rester transparent.", en: "Use sparingly - 1-2dB peak reduction maximum to stay transparent." },
    ],
    signalType: 'analog',
    rackUnits: 2,
    stereo: true,
  },

  // ============================================================
  // SATURATION
  // ============================================================
  {
    id: 'empirical-labs-fatso',
    name: 'Empirical Labs Fatso',
    manufacturer: 'Empirical Labs',
    model: 'UBK Fatso',
    category: 'saturation',
    description: {
      fr: "Processeur de saturation/compression Empirical Labs Fatso. Émule la saturation de bande et ajoute du caractère. Modes multiples pour différents effets de \"glue\" et chaleur.",
      en: "Empirical Labs Fatso saturation/compression processor. Emulates tape saturation and adds character. Multiple modes for different 'glue' and warmth effects."
    },
    quickDescription: {
      fr: 'Saturation bande et compression',
      en: 'Tape saturation and compression'
    },
    io: [
      { id: 'fatso-in-l', label: 'INPUT L', type: 'input', connector: 'xlr', signal: 'analog', channels: 1 },
      { id: 'fatso-in-r', label: 'INPUT R', type: 'input', connector: 'xlr', signal: 'analog', channels: 1 },
      { id: 'fatso-out-l', label: 'OUTPUT L', type: 'output', connector: 'xlr', signal: 'analog', channels: 1 },
      { id: 'fatso-out-r', label: 'OUTPUT R', type: 'output', connector: 'xlr', signal: 'analog', channels: 1 },
      { id: 'fatso-patch', label: 'FATSO', type: 'input', connector: 'bantam_tt', signal: 'analog', channels: 2, patchbayPoint: 'fatso' },
    ],
    controls: [
      { name: 'COMP', type: 'selector', description: { fr: 'Type de compression', en: 'Compression type' }, positions: ['SPLAT', 'SMOOTH', 'SPANK', 'BUS', 'GP', 'TRACK', '12'] },
      { name: 'WARMTH', type: 'knob', description: { fr: 'Quantité de saturation harmonique', en: 'Amount of harmonic saturation' } },
      { name: 'TRANNY', type: 'switch', description: { fr: 'Saturation transformateur', en: 'Transformer saturation' }, positions: ['OFF', 'ON'] },
      { name: 'OUTPUT', type: 'knob', description: { fr: 'Niveau de sortie', en: 'Output level' } },
      { name: 'LINK', type: 'switch', description: { fr: 'Liaison stéréo', en: 'Stereo link' }, positions: ['OFF', 'ON'] },
      { name: 'BYPASS', type: 'button', description: { fr: 'Contournement par canal', en: 'Per-channel bypass' } },
    ],
    tips: [
      { fr: "WARMTH à 2-3 pour une subtile chaleur de bande, plus haut pour un effet plus évident.", en: "WARMTH at 2-3 for subtle tape warmth, higher for a more obvious effect." },
      { fr: "BUS mode est excellent sur le mix bus pour coller le mix.", en: "BUS mode is excellent on the mix bus to glue the mix together." },
    ],
    signalType: 'analog',
    rackUnits: 2,
    stereo: true,
  },

  // ============================================================
  // MONITOR CONTROLLER
  // ============================================================
  {
    id: 'crookwood',
    name: 'Crookwood Monitor Controller',
    manufacturer: 'Crookwood Modular Audio Engineering',
    model: 'Custom Modular System',
    category: 'monitor_controller',
    description: {
      fr: "Système de monitoring modulaire Crookwood. Le hub central de routing du studio. Sélection de sources multiples (analogiques et digitales), inserts de mastering, et contrôle d'écoute précis.",
      en: "Crookwood modular monitoring system. The studio's central routing hub. Multiple source selection (analog and digital), mastering inserts, and precise listening control."
    },
    quickDescription: {
      fr: 'Contrôleur de monitoring central',
      en: 'Central monitor controller'
    },
    io: [
      { id: 'cw-a1', label: 'A1 Analog', type: 'input', connector: 'xlr', signal: 'analog', channels: 2 },
      { id: 'cw-a2', label: 'A2 Analog', type: 'input', connector: 'xlr', signal: 'analog', channels: 2 },
      { id: 'cw-d1', label: 'D1 Digital', type: 'input', connector: 'aes_ebu', signal: 'digital', channels: 2 },
      { id: 'cw-d2', label: 'D2 Digital', type: 'input', connector: 'aes_ebu', signal: 'digital', channels: 2 },
      { id: 'cw-d3', label: 'D3 Digital', type: 'input', connector: 'aes_ebu', signal: 'digital', channels: 2 },
      { id: 'cw-d4', label: 'D4 Digital', type: 'input', connector: 'aes_ebu', signal: 'digital', channels: 2 },
      { id: 'cw-d5', label: 'D5 Digital', type: 'input', connector: 'aes_ebu', signal: 'digital', channels: 2 },
      { id: 'cw-d6', label: 'D6 Digital', type: 'input', connector: 'aes_ebu', signal: 'digital', channels: 2 },
      { id: 'cw-insert-send', label: 'INSERT SEND', type: 'insert_send', connector: 'bantam_tt', signal: 'analog', channels: 2, patchbayPoint: 'cw-insert' },
      { id: 'cw-insert-return', label: 'INSERT RETURN', type: 'insert_return', connector: 'bantam_tt', signal: 'analog', channels: 2, patchbayPoint: 'cw-return' },
      { id: 'cw-main-out', label: 'MAIN OUT', type: 'output', connector: 'xlr', signal: 'analog', channels: 2 },
      { id: 'cw-near-out', label: 'NEAR OUT', type: 'output', connector: 'xlr', signal: 'analog', channels: 2 },
      { id: 'cw-mid-out', label: 'MID OUT', type: 'output', connector: 'xlr', signal: 'analog', channels: 2 },
      { id: 'cw-hp-out', label: 'HEADPHONES', type: 'output', connector: 'trs', signal: 'analog', channels: 2 },
      { id: 'cw-s1', label: 'CW S1', type: 'input', connector: 'bantam_tt', signal: 'analog', channels: 2, patchbayPoint: 'cw-s1' },
      { id: 'cw-s2', label: 'CW S2', type: 'input', connector: 'bantam_tt', signal: 'analog', channels: 2, patchbayPoint: 'cw-s2' },
      { id: 'cw-s3', label: 'CW S3', type: 'input', connector: 'bantam_tt', signal: 'analog', channels: 2, patchbayPoint: 'cw-s3' },
    ],
    controls: [
      { name: 'SOURCE SELECT', type: 'selector', description: { fr: 'Sélection de la source d\'écoute', en: 'Listening source selection' }, positions: ['A1', 'A2', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6'] },
      { name: 'SPEAKER SELECT', type: 'selector', description: { fr: 'Sélection des enceintes', en: 'Speaker selection' }, positions: ['MAIN', 'NEAR', 'MID', 'HP'] },
      { name: 'LEVEL', type: 'knob', description: { fr: 'Niveau d\'écoute principal', en: 'Main listening level' } },
      { name: 'DIM', type: 'button', description: { fr: 'Atténuation rapide du niveau', en: 'Quick level attenuation' } },
      { name: 'MUTE', type: 'button', description: { fr: 'Couper le son', en: 'Mute' } },
      { name: 'MONO', type: 'button', description: { fr: 'Écoute mono (L+R)', en: 'Mono listening (L+R)' } },
      { name: 'L ONLY', type: 'button', description: { fr: 'Écoute canal gauche seul', en: 'Left channel only' } },
      { name: 'R ONLY', type: 'button', description: { fr: 'Écoute canal droit seul', en: 'Right channel only' } },
      { name: 'SWAP L/R', type: 'button', description: { fr: 'Inverser les canaux', en: 'Swap channels' } },
      { name: 'TRIM A/B', type: 'knob', description: { fr: 'Ajustement de niveau par source', en: 'Level trim per source' } },
      { name: 'INSERT IN', type: 'switch', description: { fr: 'Activer les inserts analogiques', en: 'Enable analog inserts' }, positions: ['OFF', 'ON'] },
    ],
    tips: [
      { fr: "Utilisez DIM pour baisser rapidement le volume pendant une conversation.", en: "Use DIM to quickly lower volume during conversation." },
      { fr: "MONO est essentiel pour vérifier la compatibilité mono de votre mix.", en: "MONO is essential to check mono compatibility of your mix." },
      { fr: "Les inserts permettent de passer par la chaîne de mastering pour l'écoute.", en: "The inserts allow passing through the mastering chain for monitoring." },
    ],
    signalType: 'both',
    rackUnits: undefined,
    stereo: true,
  },

  // ============================================================
  // CONVERTERS
  // ============================================================
  {
    id: 'prism-8xr',
    name: 'Prism Sound AD/DA 8XR',
    manufacturer: 'Prism Sound',
    model: 'ADA-8XR',
    category: 'converter',
    description: {
      fr: "Convertisseur 8 canaux AD/DA Prism Sound. Conversion de référence pour le mastering. Son transparent et précis avec excellente horloge.",
      en: "Prism Sound 8-channel AD/DA converter. Reference conversion for mastering. Transparent, precise sound with excellent clocking."
    },
    quickDescription: {
      fr: 'Convertisseur 8 canaux référence',
      en: 'Reference 8-channel converter'
    },
    io: [
      { id: 'prism-ad-1-8', label: 'AD IN 1-8', type: 'input', connector: 'db25', signal: 'analog', channels: 8, patchbayPoint: 'prism-ad' },
      { id: 'prism-da-1-8', label: 'DA OUT 1-8', type: 'output', connector: 'db25', signal: 'analog', channels: 8, patchbayPoint: 'prism-da' },
      { id: 'prism-aes', label: 'AES I/O', type: 'input', connector: 'aes_ebu', signal: 'digital', channels: 8 },
    ],
    controls: [
      { name: 'SAMPLE RATE', type: 'selector', description: { fr: 'Fréquence d\'échantillonnage', en: 'Sample rate' }, positions: ['44.1k', '48k', '88.2k', '96k', '176.4k', '192k'] },
      { name: 'CLOCK SOURCE', type: 'selector', description: { fr: 'Source d\'horloge', en: 'Clock source' }, positions: ['INTERNAL', 'AES', 'WORDCLOCK'] },
    ],
    tips: [
      { fr: "Toujours vérifier que la fréquence d'échantillonnage correspond à celle de Pro Tools.", en: "Always verify sample rate matches Pro Tools." },
    ],
    signalType: 'both',
    rackUnits: 2,
    stereo: false,
  },

  {
    id: 'lynx-aurora',
    name: 'Lynx Aurora',
    manufacturer: 'Lynx',
    model: 'Aurora',
    category: 'converter',
    description: {
      fr: "Convertisseur multi-canal Lynx Aurora. Conversion AD/DA de haute qualité pour l'enregistrement et le mixage.",
      en: "Lynx Aurora multi-channel converter. High-quality AD/DA conversion for recording and mixing."
    },
    quickDescription: {
      fr: 'Convertisseur multi-canal Lynx',
      en: 'Lynx multi-channel converter'
    },
    io: [
      { id: 'lynx-ad', label: 'AD IN', type: 'input', connector: 'db25', signal: 'analog', channels: 8, patchbayPoint: 'lynx-in' },
      { id: 'lynx-da', label: 'DA OUT', type: 'output', connector: 'db25', signal: 'analog', channels: 8, patchbayPoint: 'lynx-out' },
    ],
    controls: [
      { name: 'SAMPLE RATE', type: 'selector', description: { fr: 'Fréquence d\'échantillonnage', en: 'Sample rate' } },
      { name: 'CLOCK', type: 'selector', description: { fr: 'Source d\'horloge', en: 'Clock source' } },
    ],
    tips: [
      { fr: "Utilisé principalement pour les pistes d'enregistrement, le Prism étant réservé au mastering.", en: "Used mainly for recording tracks, with the Prism reserved for mastering." },
    ],
    signalType: 'both',
    rackUnits: 2,
    stereo: false,
  },

  {
    id: 'burl-converter',
    name: 'Burl Audio Converter',
    manufacturer: 'Burl Audio',
    model: 'Converter',
    category: 'converter',
    description: {
      fr: "Convertisseur Burl Audio. Connu pour son caractère sonore plus \"musical\" et analogique que les convertisseurs transparents.",
      en: "Burl Audio converter. Known for its more 'musical' and analog-like sonic character than transparent converters."
    },
    quickDescription: {
      fr: 'Convertisseur au son analogique',
      en: 'Analog-sounding converter'
    },
    io: [
      { id: 'burl-in', label: 'INPUT', type: 'input', connector: 'db25', signal: 'analog', channels: 8, patchbayPoint: 'burl-in' },
    ],
    controls: [],
    tips: [
      { fr: "Le Burl ajoute un peu de couleur - idéal quand on veut un son plus chaud.", en: "The Burl adds some color - ideal when you want a warmer sound." },
    ],
    signalType: 'both',
    rackUnits: 2,
    stereo: false,
  },

  // ============================================================
  // PREAMPS
  // ============================================================
  {
    id: 'api-3124',
    name: 'API 3124',
    manufacturer: 'API',
    model: '3124',
    category: 'preamp',
    description: {
      fr: "Préamplificateur micro 4 canaux API 3124. Le son caractéristique API - punchy et présent. Transformateurs de sortie pour une couleur sonore distincte.",
      en: "API 3124 4-channel mic preamp. The characteristic API sound - punchy and present. Output transformers for distinct sonic color."
    },
    quickDescription: {
      fr: 'Préampli 4 canaux - son API',
      en: '4-channel preamp - API sound'
    },
    io: [
      { id: 'api3124-mic-1', label: 'MIC 1', type: 'input', connector: 'xlr', signal: 'analog', channels: 1 },
      { id: 'api3124-mic-2', label: 'MIC 2', type: 'input', connector: 'xlr', signal: 'analog', channels: 1 },
      { id: 'api3124-mic-3', label: 'MIC 3', type: 'input', connector: 'xlr', signal: 'analog', channels: 1 },
      { id: 'api3124-mic-4', label: 'MIC 4', type: 'input', connector: 'xlr', signal: 'analog', channels: 1 },
      { id: 'api3124-out', label: 'OUTPUT', type: 'output', connector: 'bantam_tt', signal: 'analog', channels: 4, patchbayPoint: 'api-3124' },
    ],
    controls: [
      { name: 'GAIN', type: 'knob', description: { fr: 'Gain du préampli', en: 'Preamp gain' }, range: '+20dB to +65dB' },
      { name: 'OUTPUT', type: 'knob', description: { fr: 'Niveau de sortie', en: 'Output level' } },
      { name: '+48V', type: 'switch', description: { fr: 'Alimentation fantôme', en: 'Phantom power' }, positions: ['OFF', 'ON'] },
      { name: 'POLARITY', type: 'switch', description: { fr: 'Inversion de polarité', en: 'Polarity invert' }, positions: ['NORMAL', 'INVERT'] },
    ],
    tips: [
      { fr: "Poussez un peu le gain pour obtenir la saturation caractéristique des transformateurs API.", en: "Push the gain a bit to get the characteristic API transformer saturation." },
      { fr: "Excellent sur les drums et tout ce qui a besoin de punch.", en: "Excellent on drums and anything that needs punch." },
    ],
    signalType: 'analog',
    rackUnits: 2,
    stereo: false,
  },

  {
    id: 'bae-preamp',
    name: 'BAE Preamp',
    manufacturer: 'BAE',
    model: 'Preamp',
    category: 'preamp',
    description: {
      fr: "Préamplificateur BAE. Réplique des préamplis Neve vintage avec transformateurs de haute qualité.",
      en: "BAE preamp. Replica of vintage Neve preamps with high-quality transformers."
    },
    quickDescription: {
      fr: 'Préampli style Neve',
      en: 'Neve-style preamp'
    },
    io: [
      { id: 'bae-mic', label: 'MIC', type: 'input', connector: 'xlr', signal: 'analog', channels: 1 },
      { id: 'bae-out', label: 'OUTPUT', type: 'output', connector: 'bantam_tt', signal: 'analog', channels: 1, patchbayPoint: 'bae' },
    ],
    controls: [
      { name: 'GAIN', type: 'selector', description: { fr: 'Gain par pas', en: 'Stepped gain' } },
      { name: '+48V', type: 'switch', description: { fr: 'Alimentation fantôme', en: 'Phantom power' } },
    ],
    tips: [
      { fr: "Le son Neve/BAE est plus rond et épais que l'API - parfait pour les voix.", en: "The Neve/BAE sound is rounder and thicker than API - perfect for vocals." },
    ],
    signalType: 'analog',
    rackUnits: 1,
    stereo: false,
  },

  // ============================================================
  // DI BOX
  // ============================================================
  {
    id: 'palmer-audionomix',
    name: 'Palmer Audionomix',
    manufacturer: 'Palmer',
    model: 'Audionomix',
    category: 'di_box',
    description: {
      fr: "Boîte de direct passive 4 canaux Palmer Audionomix. Pour connecter des instruments ligne (claviers, guitares avec pédalier) directement à la console.",
      en: "Palmer Audionomix 4-channel passive DI box. For connecting line instruments (keyboards, guitars with pedalboards) directly to the console."
    },
    quickDescription: {
      fr: 'DI passive 4 canaux',
      en: '4-channel passive DI'
    },
    io: [
      { id: 'di-in-a', label: 'INPUT A', type: 'input', connector: 'trs', signal: 'analog', channels: 1 },
      { id: 'di-in-b', label: 'INPUT B', type: 'input', connector: 'trs', signal: 'analog', channels: 1 },
      { id: 'di-in-c', label: 'INPUT C', type: 'input', connector: 'trs', signal: 'analog', channels: 1 },
      { id: 'di-in-d', label: 'INPUT D', type: 'input', connector: 'trs', signal: 'analog', channels: 1 },
      { id: 'di-out', label: 'OUTPUT', type: 'output', connector: 'xlr', signal: 'analog', channels: 4 },
      { id: 'di-patch', label: 'DI OUT', type: 'output', connector: 'bantam_tt', signal: 'analog', channels: 4, patchbayPoint: 'di-out' },
    ],
    controls: [
      { name: 'PAD 30dB', type: 'switch', description: { fr: 'Atténuateur 30dB par canal', en: '30dB pad per channel' }, positions: ['OFF', 'ON'] },
      { name: 'GND LIFT', type: 'switch', description: { fr: 'Coupure de masse', en: 'Ground lift' }, positions: ['OFF', 'ON'] },
      { name: 'LINK', type: 'switch', description: { fr: 'Link du signal vers le suivant', en: 'Signal link to next channel' }, positions: ['OFF', 'ON'] },
    ],
    tips: [
      { fr: "Utilisez GND LIFT si vous avez des problèmes de buzz ou de ronflette.", en: "Use GND LIFT if you have buzz or hum issues." },
      { fr: "Le PAD est utile pour les sorties de niveau élevé comme les claviers.", en: "The PAD is useful for high-level outputs like keyboards." },
    ],
    signalType: 'analog',
    rackUnits: 1,
    stereo: false,
  },

  // ============================================================
  // EFFECTS
  // ============================================================
  {
    id: 'line6-echo-pro',
    name: 'Line 6 Echo Pro',
    manufacturer: 'Line 6',
    model: 'Echo Pro',
    category: 'delay',
    description: {
      fr: "Processeur de delay digital Line 6 Echo Pro. Émulations de delays classiques (tape, analog, digital) avec interface simple.",
      en: "Line 6 Echo Pro digital delay processor. Classic delay emulations (tape, analog, digital) with simple interface."
    },
    quickDescription: {
      fr: 'Multi-delay digital',
      en: 'Digital multi-delay'
    },
    io: [
      { id: 'echo-in-l', label: 'INPUT L', type: 'input', connector: 'trs', signal: 'analog', channels: 1 },
      { id: 'echo-in-r', label: 'INPUT R', type: 'input', connector: 'trs', signal: 'analog', channels: 1 },
      { id: 'echo-out-l', label: 'OUTPUT L', type: 'output', connector: 'trs', signal: 'analog', channels: 1 },
      { id: 'echo-out-r', label: 'OUTPUT R', type: 'output', connector: 'trs', signal: 'analog', channels: 1 },
    ],
    controls: [
      { name: 'PROGRAM', type: 'selector', description: { fr: 'Sélection du type de delay', en: 'Delay type selection' } },
      { name: 'TIME', type: 'knob', description: { fr: 'Temps de delay', en: 'Delay time' } },
      { name: 'FEEDBACK', type: 'knob', description: { fr: 'Quantité de répétitions', en: 'Amount of repeats' } },
      { name: 'MIX', type: 'knob', description: { fr: 'Balance dry/wet', en: 'Dry/wet balance' } },
    ],
    tips: [
      { fr: "Les émulations de tape delay ajoutent une légère dégradation naturelle aux répétitions.", en: "Tape delay emulations add natural degradation to the repeats." },
    ],
    signalType: 'analog',
    rackUnits: 1,
    stereo: true,
  },

  // ============================================================
  // MONITORS
  // ============================================================
  {
    id: 'yamaha-ns10m',
    name: 'Yamaha NS-10M Studio',
    manufacturer: 'Yamaha',
    model: 'NS-10M Studio',
    category: 'monitor',
    description: {
      fr: "Enceintes de monitoring de référence Yamaha NS-10M. Les nearfields les plus utilisées au monde. Si ça sonne bien sur les NS-10, ça sonnera bien partout.",
      en: "Yamaha NS-10M reference monitors. The world's most used nearfields. If it sounds good on NS-10s, it will sound good everywhere."
    },
    quickDescription: {
      fr: 'Nearfields de référence',
      en: 'Reference nearfields'
    },
    io: [
      { id: 'ns10-in-l', label: 'INPUT L', type: 'input', connector: 'trs', signal: 'analog', channels: 1 },
      { id: 'ns10-in-r', label: 'INPUT R', type: 'input', connector: 'trs', signal: 'analog', channels: 1 },
    ],
    controls: [],
    tips: [
      { fr: "Les NS-10 sont exigeantes mais honnêtes. Ne les écoutez pas trop fort.", en: "NS-10s are demanding but honest. Don't listen too loud." },
      { fr: "Certains ingénieurs mettent du papier toilette sur les tweeters pour adoucir les aigus.", en: "Some engineers put tissue paper on the tweeters to soften the highs." },
    ],
    signalType: 'analog',
    stereo: true,
  },

  // ============================================================
  // INTERFACE
  // ============================================================
  {
    id: 'avid-hd-native',
    name: 'Avid Pro Tools HD Native',
    manufacturer: 'Avid',
    model: 'Pro Tools HD Native',
    category: 'interface',
    description: {
      fr: "Interface Pro Tools HD Native PCIe. La connexion entre les convertisseurs et Pro Tools. Permet un monitoring à faible latence.",
      en: "Pro Tools HD Native PCIe interface. The connection between converters and Pro Tools. Enables low-latency monitoring."
    },
    quickDescription: {
      fr: 'Interface Pro Tools HDX',
      en: 'Pro Tools HDX interface'
    },
    io: [
      { id: 'hd-diglink-1', label: 'DigiLink 1', type: 'input', connector: 'pcie', signal: 'digital', channels: 32 },
      { id: 'hd-diglink-2', label: 'DigiLink 2', type: 'input', connector: 'pcie', signal: 'digital', channels: 32 },
    ],
    controls: [],
    tips: [
      { fr: "L'interface est connectée via PCIe - pas de latence USB.", en: "The interface is connected via PCIe - no USB latency." },
    ],
    signalType: 'digital',
    rackUnits: undefined,
    stereo: false,
  },

  // ============================================================
  // SYNTHESIZERS
  // ============================================================
  {
    id: 'minimoog-model-d',
    name: 'Minimoog Model D',
    manufacturer: 'Moog',
    model: 'Model D',
    category: 'synthesizer',
    description: {
      fr: "Synthétiseur analogique monophonique légendaire. Trois oscillateurs, filtre ladder Moog caractéristique. Le son de basse et de lead par excellence. Nécessite retrofit MIDI ou interface CV/Gate.",
      en: "Legendary monophonic analog synthesizer. Three oscillators, characteristic Moog ladder filter. The quintessential bass and lead sound. Requires MIDI retrofit or CV/Gate interface."
    },
    quickDescription: {
      fr: 'Mono analogique - basses et leads',
      en: 'Analog mono - bass and leads'
    },
    io: [
      { id: 'mini-audio-out', label: 'AUDIO OUT', type: 'output', connector: 'trs', signal: 'analog', channels: 1 },
      { id: 'mini-cv-in', label: 'CV IN', type: 'input', connector: 'trs', signal: 'analog', channels: 1 },
      { id: 'mini-gate-in', label: 'GATE IN', type: 'input', connector: 'trs', signal: 'analog', channels: 1 },
    ],
    controls: [
      { name: 'OSC 1 RANGE', type: 'selector', description: { fr: "Octave de l'oscillateur 1", en: 'Oscillator 1 octave range' }, positions: ["LO", "32'", "16'", "8'", "4'", "2'"] },
      { name: 'OSC 1 WAVEFORM', type: 'selector', description: { fr: "Forme d'onde oscillateur 1", en: 'Oscillator 1 waveform' }, positions: ['Triangle', 'Saw 1', 'Saw 2', 'Square', 'Pulse', 'Pulse 2'] },
      { name: 'FILTER CUTOFF', type: 'knob', description: { fr: 'Fréquence de coupure du filtre', en: 'Filter cutoff frequency' } },
      { name: 'FILTER EMPHASIS', type: 'knob', description: { fr: 'Résonance du filtre', en: 'Filter resonance' } },
      { name: 'FILTER CONTOUR', type: 'knob', description: { fr: "Modulation du filtre par l'enveloppe", en: 'Filter envelope modulation' } },
      { name: 'ATTACK', type: 'knob', description: { fr: 'Temps d\'attaque', en: 'Attack time' } },
      { name: 'DECAY', type: 'knob', description: { fr: 'Temps de déclin', en: 'Decay time' } },
      { name: 'SUSTAIN', type: 'knob', description: { fr: 'Niveau de sustain', en: 'Sustain level' } },
    ],
    tips: [
      { fr: "Pour des basses profondes, utilisez OSC 1 en triangle + OSC 3 une octave plus bas. Coupure du filtre basse avec légère résonance.", en: "For deep bass, use OSC 1 triangle + OSC 3 one octave below. Low filter cutoff with slight resonance." },
      { fr: "Le Minimoog n'a pas de mémoire de patch - notez vos réglages.", en: "The Minimoog has no patch memory - note your settings." },
    ],
    signalType: 'analog',
    rackUnits: undefined,
    stereo: false,
  },
  {
    id: 'korg-polysix',
    name: 'Korg Polysix',
    manufacturer: 'Korg',
    model: 'Polysix',
    category: 'synthesizer',
    description: {
      fr: "Synthétiseur polyphonique analogique 6 voix avec arpégiateur et mémoire de chord. Excellent pour les nappes, textures arpégées et pads. L'arpégiateur se synchronise au MIDI clock.",
      en: "6-voice analog polyphonic synthesizer with arpeggiator and chord memory. Excellent for pads, arpeggiated textures. Arpeggiator syncs to MIDI clock."
    },
    quickDescription: {
      fr: 'Poly 6 voix - pads et arpèges',
      en: '6-voice poly - pads and arps'
    },
    io: [
      { id: 'polysix-audio-out', label: 'AUDIO OUT', type: 'output', connector: 'trs', signal: 'analog', channels: 1 },
      { id: 'polysix-midi-in', label: 'MIDI IN', type: 'input', connector: 'xlr', signal: 'digital', channels: 1 },
    ],
    controls: [
      { name: 'VCO OCTAVE', type: 'selector', description: { fr: 'Octave du VCO', en: 'VCO octave' }, positions: ["16'", "8'", "4'"] },
      { name: 'VCO WAVEFORM', type: 'selector', description: { fr: "Forme d'onde", en: 'Waveform' }, positions: ['Saw', 'Pulse', 'PWM'] },
      { name: 'VCF CUTOFF', type: 'knob', description: { fr: 'Fréquence de coupure', en: 'Cutoff frequency' } },
      { name: 'VCF RESONANCE', type: 'knob', description: { fr: 'Résonance', en: 'Resonance' } },
      { name: 'VCF EG INTENSITY', type: 'knob', description: { fr: "Intensité de l'enveloppe sur le filtre", en: 'Filter envelope intensity' } },
      { name: 'CHORUS', type: 'selector', description: { fr: 'Mode de chorus', en: 'Chorus mode' }, positions: ['OFF', 'I', 'II', 'PHASE'] },
      { name: 'ARPEGGIATOR', type: 'selector', description: { fr: 'Mode arpégiateur', en: 'Arpeggiator mode' }, positions: ['OFF', 'UP', 'DOWN', 'UP/DOWN'] },
    ],
    tips: [
      { fr: "Le chorus est la signature sonore du Polysix - essayez le mode II pour les pads larges.", en: "The chorus is the Polysix signature - try mode II for wide pads." },
      { fr: "L'arpégiateur se synchronise au MIDI clock pour des sessions génératives.", en: "The arpeggiator syncs to MIDI clock for generative sessions." },
    ],
    signalType: 'analog',
    rackUnits: undefined,
    stereo: false,
  },
  {
    id: 'prophet-5',
    name: 'Sequential Prophet-5',
    manufacturer: 'Sequential',
    model: 'Prophet-5',
    category: 'synthesizer',
    description: {
      fr: "Synthétiseur polyphonique analogique 5 voix. Le plus expressif des polyphoniques vintage. 40-120 patches en mémoire selon la révision. Parfait pour les pads, leads et cuivres.",
      en: "5-voice analog polyphonic synthesizer. The most expressive vintage poly. 40-120 patch memory depending on revision. Perfect for pads, leads, and brass."
    },
    quickDescription: {
      fr: 'Poly 5 voix - expressivité maximale',
      en: '5-voice poly - maximum expression'
    },
    io: [
      { id: 'prophet-audio-out-l', label: 'AUDIO OUT L', type: 'output', connector: 'trs', signal: 'analog', channels: 1 },
      { id: 'prophet-audio-out-r', label: 'AUDIO OUT R', type: 'output', connector: 'trs', signal: 'analog', channels: 1 },
      { id: 'prophet-midi-in', label: 'MIDI IN', type: 'input', connector: 'xlr', signal: 'digital', channels: 1 },
    ],
    controls: [
      { name: 'OSC A FREQ', type: 'knob', description: { fr: 'Fréquence oscillateur A', en: 'Oscillator A frequency' } },
      { name: 'OSC A SHAPE', type: 'selector', description: { fr: "Forme d'onde A", en: 'Waveform A' }, positions: ['Saw', 'Square', 'Pulse'] },
      { name: 'OSC B FREQ', type: 'knob', description: { fr: 'Fréquence oscillateur B', en: 'Oscillator B frequency' } },
      { name: 'FILTER CUTOFF', type: 'knob', description: { fr: 'Fréquence de coupure', en: 'Cutoff frequency' } },
      { name: 'FILTER RESONANCE', type: 'knob', description: { fr: 'Résonance', en: 'Resonance' } },
      { name: 'POLY-MOD', type: 'knob', description: { fr: 'Modulation polyphonique', en: 'Polyphonic modulation' } },
      { name: 'UNISON', type: 'switch', description: { fr: 'Mode unisson (5 voix empilées)', en: 'Unison mode (5 stacked voices)' }, positions: ['OFF', 'ON'] },
    ],
    tips: [
      { fr: "Le mode Unison empile les 5 voix pour un son massif de lead.", en: "Unison mode stacks all 5 voices for massive lead sounds." },
      { fr: "La Poly-Mod est unique au Prophet - elle permet des timbres complexes et évolutifs.", en: "Poly-Mod is unique to Prophet - it enables complex, evolving timbres." },
    ],
    signalType: 'analog',
    rackUnits: undefined,
    stereo: true,
  },
  {
    id: 'juno-106',
    name: 'Roland Juno-106',
    manufacturer: 'Roland',
    model: 'Juno-106',
    category: 'synthesizer',
    description: {
      fr: "Synthétiseur polyphonique analogique 6 voix (DCO). 128 patches en mémoire. MIDI natif très stable. Parfait pour les pads, basses et textures avec chorus.",
      en: "6-voice analog polyphonic synthesizer (DCO). 128 patch memory. Very stable native MIDI. Perfect for pads, bass, and chorus textures."
    },
    quickDescription: {
      fr: 'Poly 6 voix - fiabilité MIDI',
      en: '6-voice poly - MIDI reliability'
    },
    io: [
      { id: 'juno-audio-out', label: 'AUDIO OUT', type: 'output', connector: 'trs', signal: 'analog', channels: 1 },
      { id: 'juno-midi-in', label: 'MIDI IN', type: 'input', connector: 'xlr', signal: 'digital', channels: 1 },
    ],
    controls: [
      { name: 'DCO RANGE', type: 'selector', description: { fr: 'Octave', en: 'Octave range' }, positions: ["16'", "8'", "4'"] },
      { name: 'DCO LFO', type: 'knob', description: { fr: 'Modulation LFO du DCO', en: 'DCO LFO modulation' } },
      { name: 'DCO PWM', type: 'knob', description: { fr: 'Modulation de largeur d\'impulsion', en: 'Pulse width modulation' } },
      { name: 'VCF FREQ', type: 'knob', description: { fr: 'Fréquence du filtre', en: 'Filter frequency' } },
      { name: 'VCF RES', type: 'knob', description: { fr: 'Résonance', en: 'Resonance' } },
      { name: 'CHORUS', type: 'selector', description: { fr: 'Mode chorus', en: 'Chorus mode' }, positions: ['OFF', 'I', 'II'] },
      { name: 'HPF', type: 'knob', description: { fr: 'Filtre passe-haut', en: 'High-pass filter' } },
    ],
    tips: [
      { fr: "Le chorus du Juno est légendaire. Mode I pour subtil, mode II pour le son Juno classique.", en: "The Juno chorus is legendary. Mode I for subtle, mode II for classic Juno sound." },
      { fr: "Le HPF est excellent pour nettoyer les basses fréquences des pads.", en: "The HPF is excellent for cleaning low frequencies from pads." },
    ],
    signalType: 'analog',
    rackUnits: undefined,
    stereo: false,
  },
  {
    id: 'nord-lead-a1',
    name: 'Nord Lead A1',
    manufacturer: 'Nord',
    model: 'Lead A1',
    category: 'synthesizer',
    description: {
      fr: "Synthétiseur virtuel analogique multi-timbral à 4 slots. 4-26 voix selon le mode. Le plus capable pour l'automatisation MIDI. Program changes et contrôle CC complet.",
      en: "4-slot multi-timbral virtual analog synthesizer. 4-26 voices depending on mode. Most capable for MIDI automation. Program changes and full CC control."
    },
    quickDescription: {
      fr: 'VA multi-timbral - workhorse MIDI',
      en: 'Multi-timbral VA - MIDI workhorse'
    },
    io: [
      { id: 'nord-audio-out-l', label: 'AUDIO OUT L', type: 'output', connector: 'trs', signal: 'analog', channels: 1 },
      { id: 'nord-audio-out-r', label: 'AUDIO OUT R', type: 'output', connector: 'trs', signal: 'analog', channels: 1 },
      { id: 'nord-midi-in', label: 'MIDI IN', type: 'input', connector: 'xlr', signal: 'digital', channels: 1 },
    ],
    controls: [
      { name: 'OSC CONFIG', type: 'selector', description: { fr: "Configuration d'oscillateur", en: 'Oscillator configuration' }, positions: ['Pitch', 'Shape', 'Sync', 'Detune', 'Noise'] },
      { name: 'OSC WAVE', type: 'selector', description: { fr: "Type d'onde", en: 'Wave type' }, positions: ['Square', 'Saw', 'Triangle', 'Sine', 'Wavetable'] },
      { name: 'FILTER TYPE', type: 'selector', description: { fr: 'Type de filtre', en: 'Filter type' }, positions: ['LP', 'HP', 'BP', 'Notch', 'Comb'] },
      { name: 'FILTER FREQ', type: 'knob', description: { fr: 'Fréquence du filtre', en: 'Filter frequency' } },
      { name: 'SLOT SELECT', type: 'selector', description: { fr: 'Slot actif (1-4)', en: 'Active slot (1-4)' }, positions: ['1', '2', '3', '4'] },
      { name: 'MUTATOR', type: 'knob', description: { fr: 'Mutateur de timbre', en: 'Timbre mutator' } },
    ],
    tips: [
      { fr: "Utilisez les 4 slots pour 4 timbres indépendants sur 4 canaux MIDI - parfait pour les sessions génératives.", en: "Use 4 slots for 4 independent timbres on 4 MIDI channels - perfect for generative sessions." },
      { fr: "Le Mutator permet des évolutions de timbre sans changer de patch.", en: "The Mutator enables timbre evolution without changing patches." },
    ],
    signalType: 'analog',
    rackUnits: 2,
    stereo: true,
  },
  {
    id: 'signal-field',
    name: 'SIGNAL/FIELD',
    manufacturer: 'Studio Intelligence',
    model: 'FIELD-01',
    category: 'synthesizer',
    description: {
      fr: "Instrument hybride de champ ambiant. Combine trois couches : moteur de synthèse déterministe local (WebAudio), streaming IA en temps réel via Lyria, et membrane de rétroaction visuelle. Ce n'est pas une application musicale normale, c'est un paradigme d'ambiance jouable où le contrôle déterministe rencontre l'émergence générative.",
      en: "Hybrid ambient field instrument. Combines three layers: local deterministic synthesis engine (WebAudio), real-time AI streaming via Lyria, and visual feedback membrane. Not a normal music app, but a playable ambiance paradigm where deterministic control meets generative emergence."
    },
    quickDescription: {
      fr: 'Instrument de champ hybride - intelligence jouable',
      en: 'Hybrid field instrument - playable intelligence'
    },
    io: [
      { id: 'signal-audio-out-l', label: 'AUDIO OUT L', type: 'output', connector: 'trs', signal: 'digital', channels: 1 },
      { id: 'signal-audio-out-r', label: 'AUDIO OUT R', type: 'output', connector: 'trs', signal: 'digital', channels: 1 },
      { id: 'signal-midi-in', label: 'MIDI IN', type: 'input', connector: 'usb', signal: 'digital', channels: 16 },
      { id: 'signal-lyria-ws', label: 'LYRIA STREAM', type: 'input', connector: 'usb', signal: 'digital', channels: 2 },
    ],
    controls: [
      { name: 'VOICE TYPE', type: 'selector', description: { fr: 'Type de voix (pad, drone, pulse, lead, texture)', en: 'Voice type (pad, drone, pulse, lead, texture)' }, positions: ['Pad', 'Drone', 'Pulse', 'Lead', 'Texture'] },
      { name: 'SCALE', type: 'selector', description: { fr: 'Gamme musicale', en: 'Musical scale' }, positions: ['Pentatonic', 'Major', 'Minor', 'Dorian', 'Phrygian', 'Lydian', 'Mixolydian', 'Whole Tone', 'Harmonic Minor'] },
      { name: 'ROOT', type: 'knob', description: { fr: 'Note fondamentale (MIDI 36-84)', en: 'Root note (MIDI 36-84)' }, range: '36-84' },
      { name: 'LYRIA MOOD', type: 'selector', description: { fr: 'Humeur générative (ambient, tension, drift, pulse)', en: 'Generative mood (ambient, tension, drift, pulse)' }, positions: ['Ambient', 'Tension', 'Drift', 'Pulse'] },
      { name: 'LYRIA DENSITY', type: 'knob', description: { fr: 'Densité de la couche IA (sparse à dense)', en: 'AI layer density (sparse to dense)' }, range: '0-100%' },
      { name: 'VISUAL MODE', type: 'selector', description: { fr: 'Mode de visualisation', en: 'Visualization mode' }, positions: ['Wave Field', 'Particle Cloud', 'Tension Arcs', 'Resonance Bloom', 'Hybrid'] },
    ],
    tips: [
      { fr: "SIGNAL n'est pas un générateur de musique IA. Traitez-le comme un champ musical réactif, une couche d'intelligence, un co-performeur ambiant.", en: "SIGNAL is not an AI music generator. Treat it as a responsive musical field, an intelligence layer, an ambient co-performer." },
      { fr: "Le mode Drone avec Lyria en mode 'ambient' crée des nappes évolutives parfaites pour le fond sonore.", en: "Drone mode with Lyria in 'ambient' creates evolving pads perfect for background ambiance." },
      { fr: "Utilisez la souris pour contrôler la vélocité (axe Y) et le choix des notes (axe X). Le clavier ASDFGHJK/WERTYU fournit un contrôle direct.", en: "Use mouse to control velocity (Y axis) and note choice (X axis). ASDFGHJK/WERTYU keyboard provides direct control." },
    ],
    signalType: 'digital',
    rackUnits: undefined,
    stereo: true,
  },
];

// Utility functions
export function getGearById(id: string): GearUnit | undefined {
  return gearRegistry.find(g => g.id === id);
}

export function getGearByCategory(category: GearCategory): GearUnit[] {
  return gearRegistry.filter(g => g.category === category);
}

export function searchGear(query: string): GearUnit[] {
  const q = query.toLowerCase();
  return gearRegistry.filter(g =>
    g.name.toLowerCase().includes(q) ||
    g.manufacturer.toLowerCase().includes(q) ||
    g.model.toLowerCase().includes(q) ||
    g.description.en.toLowerCase().includes(q) ||
    g.description.fr.toLowerCase().includes(q)
  );
}
