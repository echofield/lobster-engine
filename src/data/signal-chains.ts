import type { SignalChain } from '@/types/studio';

export const signalChains: SignalChain[] = [
  // ============================================================
  // CHAIN 1: Record Vocals (Beginner)
  // ============================================================
  {
    id: 'record-vocals-basic',
    name: {
      fr: 'Enregistrer une voix (basique)',
      en: 'Record Vocals (Basic)',
    },
    description: {
      fr: 'Chemin simple pour enregistrer une voix via la console Studer vers Pro Tools. Idéal pour les débutants.',
      en: 'Simple path to record vocals via Studer console to Pro Tools. Ideal for beginners.',
    },
    category: 'recording',
    difficulty: 'beginner',
    tags: ['vocals', 'recording', 'beginner', 'studer'],
    steps: [
      {
        stepNumber: 1,
        gearId: 'studer-269',
        patchRequired: false,
        notes: {
          fr: "Branchez le micro en XLR sur l'entrée MIC du canal Studer. Sélectionnez MIC sur le switch MIC/LINE.",
          en: 'Connect the mic via XLR to the Studer channel MIC input. Select MIC on the MIC/LINE switch.',
        },
        settings: {
          'MIC/LINE': 'MIC',
          'EQ HIGH': '0',
          'EQ MID': '0',
          'EQ LOW': '0',
        },
      },
      {
        stepNumber: 2,
        gearId: 'studer-269',
        patchRequired: false,
        notes: {
          fr: "Ajustez le GAIN pour avoir un bon niveau (VU-mètre autour de 0). Réglez l'EQ au besoin.",
          en: 'Adjust GAIN for good level (VU meter around 0). Adjust EQ as needed.',
        },
      },
      {
        stepNumber: 3,
        gearId: 'studer-269',
        gearIOId: 'studer-line-out',
        patchRequired: true,
        patchFrom: 'bay3-row1-pos21',
        patchTo: 'bay7-row2-pos1',
        notes: {
          fr: 'Patcher STUDER LINE OUT vers PRISM AD/DA 8XR IN 1/2.',
          en: 'Patch STUDER LINE OUT to PRISM AD/DA 8XR IN 1/2.',
        },
      },
      {
        stepNumber: 4,
        gearId: 'prism-8xr',
        patchRequired: false,
        notes: {
          fr: "Le signal est converti en numérique par le Prism. Vérifiez que la fréquence d'échantillonnage correspond à votre session Pro Tools.",
          en: 'Signal is converted to digital by Prism. Verify sample rate matches your Pro Tools session.',
        },
      },
      {
        stepNumber: 5,
        gearId: 'avid-hd-native',
        patchRequired: false,
        notes: {
          fr: 'Dans Pro Tools, créez une piste audio et sélectionnez les entrées Prism 1/2. Armez la piste et enregistrez.',
          en: 'In Pro Tools, create an audio track and select Prism inputs 1/2. Arm the track and record.',
        },
      },
    ],
  },

  // ============================================================
  // CHAIN 2: Record with External Preamp
  // ============================================================
  {
    id: 'record-external-preamp',
    name: {
      fr: 'Enregistrer avec préampli externe',
      en: 'Record with External Preamp',
    },
    description: {
      fr: "Utilisez un préampli externe (API 3124 ou BAE) pour plus de caractère sonore. Ajoutez optionnellement un compresseur à l'enregistrement.",
      en: 'Use an external preamp (API 3124 or BAE) for more sonic character. Optionally add compression while recording.',
    },
    category: 'recording',
    difficulty: 'intermediate',
    tags: ['vocals', 'recording', 'preamp', 'api', 'bae'],
    steps: [
      {
        stepNumber: 1,
        gearId: 'api-3124',
        patchRequired: false,
        notes: {
          fr: 'Branchez le micro sur l\'entrée MIC de l\'API 3124. Activez le +48V si micro à condensateur.',
          en: 'Connect mic to API 3124 MIC input. Enable +48V if condenser mic.',
        },
        settings: {
          '+48V': 'ON',
        },
      },
      {
        stepNumber: 2,
        gearId: 'api-3124',
        gearIOId: 'api3124-out',
        patchRequired: true,
        patchFrom: 'bay2-row1-pos9',
        patchTo: 'bay7-row2-pos1',
        notes: {
          fr: 'Patcher API 3124 OUT vers PRISM AD/DA IN pour un chemin direct.',
          en: 'Patch API 3124 OUT to PRISM AD/DA IN for direct path.',
        },
      },
      {
        stepNumber: 3,
        gearId: 'prism-8xr',
        patchRequired: false,
        notes: {
          fr: 'Le signal est converti par le Prism vers Pro Tools.',
          en: 'Signal is converted by Prism to Pro Tools.',
        },
      },
    ],
  },

  // ============================================================
  // CHAIN 3: Mix Through Analog Bus
  // ============================================================
  {
    id: 'mix-analog-bus',
    name: {
      fr: 'Mixer via bus analogique',
      en: 'Mix Through Analog Bus',
    },
    description: {
      fr: 'Passez votre mix Pro Tools à travers la chaîne de mastering analogique avant de capturer le résultat.',
      en: 'Pass your Pro Tools mix through the analog mastering chain before capturing the result.',
    },
    category: 'mixing',
    difficulty: 'intermediate',
    tags: ['mixing', 'analog', 'bus', 'mastering'],
    steps: [
      {
        stepNumber: 1,
        gearId: 'prism-8xr',
        gearIOId: 'prism-da-1-8',
        patchRequired: true,
        patchFrom: 'bay7-row1-pos1',
        patchTo: 'bay5-row2-pos1',
        notes: {
          fr: 'Sortez de Pro Tools via PRISM DA OUT et entrez dans le Crookwood pour monitoring et inserts.',
          en: 'Output from Pro Tools via PRISM DA OUT and enter Crookwood for monitoring and inserts.',
        },
      },
      {
        stepNumber: 2,
        gearId: 'crookwood',
        patchRequired: false,
        notes: {
          fr: 'Activez les inserts analogiques sur le Crookwood. Le signal passera par la chaîne patchée.',
          en: 'Enable analog inserts on Crookwood. Signal will pass through the patched chain.',
        },
        settings: {
          'INSERT IN': 'ON',
        },
      },
      {
        stepNumber: 3,
        gearId: 'maselec-mea2',
        patchRequired: true,
        patchFrom: 'bay5-row1-pos1',
        patchTo: 'bay8-row2-pos1',
        notes: {
          fr: 'Du CW INSERT, patchez vers MEA-2 pour égalisation.',
          en: 'From CW INSERT, patch to MEA-2 for equalization.',
        },
      },
      {
        stepNumber: 4,
        gearId: 'manley-vari-mu',
        patchRequired: true,
        patchFrom: 'bay8-row1-pos1',
        patchTo: 'bay6-row2-pos11',
        notes: {
          fr: 'De la sortie MEA-2, patchez vers VARI MU pour compression douce.',
          en: 'From MEA-2 output, patch to VARI MU for gentle compression.',
        },
        settings: {
          'HP SC': 'ON',
          'LINK': 'ON',
          'RECOVERY': '3',
        },
      },
      {
        stepNumber: 5,
        gearId: 'manley-vari-mu',
        gearIOId: 'varimu-out-l',
        patchRequired: true,
        patchFrom: 'bay6-row1-pos11',
        patchTo: 'bay5-row2-pos1',
        notes: {
          fr: 'Retournez la sortie VARI MU vers CW RETURN pour fermer la boucle d\'insert.',
          en: 'Return VARI MU output to CW RETURN to close the insert loop.',
        },
      },
      {
        stepNumber: 6,
        gearId: 'prism-8xr',
        gearIOId: 'prism-ad-1-8',
        patchRequired: true,
        patchFrom: 'bay7-row1-pos9',
        patchTo: 'bay7-row2-pos1',
        notes: {
          fr: 'Patchez la sortie monitoring vers PRISM AD IN pour capturer le mix traité dans Pro Tools.',
          en: 'Patch monitoring output to PRISM AD IN to capture the processed mix in Pro Tools.',
        },
      },
    ],
  },

  // ============================================================
  // CHAIN 4: Full Mastering Chain
  // ============================================================
  {
    id: 'mastering-full',
    name: {
      fr: 'Chaîne de mastering complète',
      en: 'Full Mastering Chain',
    },
    description: {
      fr: 'Chaîne de mastering professionnelle: EQ → Compression → Limiting. Pour le traitement final avant distribution.',
      en: 'Professional mastering chain: EQ → Compression → Limiting. For final processing before distribution.',
    },
    category: 'mastering',
    difficulty: 'advanced',
    tags: ['mastering', 'professional', 'eq', 'compression', 'limiting'],
    steps: [
      {
        stepNumber: 1,
        gearId: 'prism-8xr',
        gearIOId: 'prism-da-1-8',
        patchRequired: true,
        patchFrom: 'bay7-row1-pos1',
        patchTo: 'bay8-row2-pos1',
        notes: {
          fr: 'Source depuis Pro Tools via PRISM DA OUT vers MEA-2 (premier maillon de la chaîne).',
          en: 'Source from Pro Tools via PRISM DA OUT to MEA-2 (first link in chain).',
        },
      },
      {
        stepNumber: 2,
        gearId: 'maselec-mea2',
        patchRequired: false,
        notes: {
          fr: 'MEA-2: EQ paramétrique de précision. Faites des corrections subtiles (0.5-1dB max).',
          en: 'MEA-2: Precision parametric EQ. Make subtle corrections (0.5-1dB max).',
        },
      },
      {
        stepNumber: 3,
        gearId: 'maselec-mea2',
        gearIOId: 'mea2-out-l',
        patchRequired: true,
        patchFrom: 'bay8-row1-pos1',
        patchTo: 'bay8-row2-pos3',
        notes: {
          fr: 'De MEA-2 vers CURVE BENDER pour coloration tonale.',
          en: 'From MEA-2 to CURVE BENDER for tonal coloring.',
        },
      },
      {
        stepNumber: 4,
        gearId: 'chandler-curve-bender',
        patchRequired: false,
        notes: {
          fr: 'Curve Bender: EQ large et musical. Utilisez les fréquences de présence pour ajouter de l\'air ou du corps.',
          en: 'Curve Bender: Broad, musical EQ. Use presence frequencies to add air or body.',
        },
      },
      {
        stepNumber: 5,
        gearId: 'chandler-curve-bender',
        gearIOId: 'curve-out-l',
        patchRequired: true,
        patchFrom: 'bay8-row1-pos3',
        patchTo: 'bay6-row2-pos11',
        notes: {
          fr: 'De CURVE BENDER vers VARI MU pour compression de bus.',
          en: 'From CURVE BENDER to VARI MU for bus compression.',
        },
      },
      {
        stepNumber: 6,
        gearId: 'manley-vari-mu',
        patchRequired: false,
        notes: {
          fr: 'VARI MU: Compression douce (1-2dB GR). HP SC ON pour éviter le pompage sur les basses.',
          en: 'VARI MU: Gentle compression (1-2dB GR). HP SC ON to avoid bass pumping.',
        },
        settings: {
          'HP SC': 'ON',
          'LINK': 'ON',
          'RECOVERY': '3',
          'ATTACK': 'SLOW',
        },
      },
      {
        stepNumber: 7,
        gearId: 'manley-vari-mu',
        gearIOId: 'varimu-out-l',
        patchRequired: true,
        patchFrom: 'bay6-row1-pos11',
        patchTo: 'bay3-row2-pos1',
        notes: {
          fr: 'De VARI MU vers API 2500 pour compression additionnelle (optionnel).',
          en: 'From VARI MU to API 2500 for additional compression (optional).',
        },
      },
      {
        stepNumber: 8,
        gearId: 'api-2500',
        patchRequired: false,
        notes: {
          fr: 'API 2500: Compression de bus pour plus de punch. Ratio modéré, attaque medium.',
          en: 'API 2500: Bus compression for more punch. Moderate ratio, medium attack.',
        },
        settings: {
          'RATIO': '2',
          'KNEE': 'MED',
          'TYPE': 'FEED FWD',
        },
      },
      {
        stepNumber: 9,
        gearId: 'api-2500',
        gearIOId: 'api2500-out-l',
        patchRequired: true,
        patchFrom: 'bay3-row1-pos1',
        patchTo: 'bay3-row2-pos3',
        notes: {
          fr: 'De API 2500 vers MPL-2 pour le limiting final.',
          en: 'From API 2500 to MPL-2 for final limiting.',
        },
      },
      {
        stepNumber: 10,
        gearId: 'maselec-mpl2',
        patchRequired: false,
        notes: {
          fr: 'MPL-2: Limiteur de crêtes transparent. Ne limitez que 1-2dB maximum.',
          en: 'MPL-2: Transparent peak limiter. Only limit 1-2dB maximum.',
        },
      },
      {
        stepNumber: 11,
        gearId: 'maselec-mpl2',
        gearIOId: 'mpl2-out-l',
        patchRequired: true,
        patchFrom: 'bay3-row1-pos3',
        patchTo: 'bay7-row2-pos1',
        notes: {
          fr: 'Retour du MPL-2 vers PRISM AD IN pour capturer le master.',
          en: 'Return from MPL-2 to PRISM AD IN to capture the master.',
        },
      },
    ],
  },

  // ============================================================
  // CHAIN 5: Print to Tape
  // ============================================================
  {
    id: 'print-to-tape',
    name: {
      fr: 'Imprimer sur bande',
      en: 'Print to Tape',
    },
    description: {
      fr: 'Enregistrez votre mix sur le Studer A82 pour la saturation et compression naturelle de la bande.',
      en: 'Record your mix to the Studer A82 for natural tape saturation and compression.',
    },
    category: 'mixing',
    difficulty: 'intermediate',
    tags: ['tape', 'saturation', 'analog', 'studer'],
    steps: [
      {
        stepNumber: 1,
        gearId: 'prism-8xr',
        gearIOId: 'prism-da-1-8',
        patchRequired: true,
        patchFrom: 'bay7-row1-pos1',
        patchTo: 'bay1-row2-pos11',
        notes: {
          fr: 'Sortie Pro Tools vers TO TAPE sur le patchbay.',
          en: 'Pro Tools output to TO TAPE on patchbay.',
        },
      },
      {
        stepNumber: 2,
        gearId: 'studer-a82',
        patchRequired: false,
        notes: {
          fr: 'Réglez les niveaux d\'enregistrement sur le Studer A82. Visez 0VU pour un niveau nominal, ou poussez légèrement pour plus de saturation.',
          en: 'Set record levels on Studer A82. Aim for 0VU for nominal level, or push slightly for more saturation.',
        },
        settings: {
          'SPEED': '15 ips',
        },
      },
      {
        stepNumber: 3,
        gearId: 'studer-a82',
        patchRequired: false,
        notes: {
          fr: 'Appuyez sur RECORD pour enregistrer. Surveillez les VU-mètres.',
          en: 'Press RECORD to record. Monitor the VU meters.',
        },
      },
      {
        stepNumber: 4,
        gearId: 'studer-a82',
        gearIOId: 'a82-from-tape',
        patchRequired: true,
        patchFrom: 'bay1-row1-pos9',
        patchTo: 'bay7-row2-pos1',
        notes: {
          fr: 'Pour capturer la lecture de bande, patchez FROM TAPE vers PRISM AD IN.',
          en: 'To capture tape playback, patch FROM TAPE to PRISM AD IN.',
        },
      },
      {
        stepNumber: 5,
        gearId: 'prism-8xr',
        patchRequired: false,
        notes: {
          fr: 'Rembobinez et relisez la bande. Enregistrez la lecture dans Pro Tools sur une nouvelle piste.',
          en: 'Rewind and play back the tape. Record playback in Pro Tools on a new track.',
        },
      },
    ],
  },

  // ============================================================
  // CHAIN 6: Monitoring Setup
  // ============================================================
  {
    id: 'monitoring-basic',
    name: {
      fr: 'Configuration monitoring',
      en: 'Monitoring Setup',
    },
    description: {
      fr: 'Comment configurer le monitoring via le Crookwood pour écouter différentes sources sur différentes enceintes.',
      en: 'How to configure monitoring via Crookwood to listen to different sources on different speakers.',
    },
    category: 'monitoring',
    difficulty: 'beginner',
    tags: ['monitoring', 'crookwood', 'speakers', 'setup'],
    steps: [
      {
        stepNumber: 1,
        gearId: 'crookwood',
        patchRequired: false,
        notes: {
          fr: 'Sur le panneau SOURCE SELECT, choisissez votre source (A1/A2 pour analogique, D1-D6 pour digital).',
          en: 'On SOURCE SELECT panel, choose your source (A1/A2 for analog, D1-D6 for digital).',
        },
      },
      {
        stepNumber: 2,
        gearId: 'crookwood',
        patchRequired: false,
        notes: {
          fr: 'Sur SPEAKER SELECT, choisissez les enceintes (MAIN, NEAR pour NS-10, MID, ou HP pour casque).',
          en: 'On SPEAKER SELECT, choose speakers (MAIN, NEAR for NS-10, MID, or HP for headphones).',
        },
      },
      {
        stepNumber: 3,
        gearId: 'crookwood',
        patchRequired: false,
        notes: {
          fr: 'Utilisez le LEVEL pour ajuster le volume. DIM pour baisser rapidement, MUTE pour couper.',
          en: 'Use LEVEL to adjust volume. DIM to quickly lower, MUTE to cut.',
        },
      },
      {
        stepNumber: 4,
        gearId: 'crookwood',
        patchRequired: false,
        notes: {
          fr: 'Utilisez MONO pour vérifier la compatibilité mono. L ONLY / R ONLY pour isoler les canaux.',
          en: 'Use MONO to check mono compatibility. L ONLY / R ONLY to isolate channels.',
        },
      },
    ],
  },

  // ============================================================
  // GENERATIVE SESSION CHAINS
  // ============================================================
  {
    id: 'generative-ambient',
    name: {
      fr: 'Session Générative — Ambient',
      en: 'Generative Session — Ambient',
    },
    description: {
      fr: "Configuration pour sessions génératives overnight. Tous les synthétiseurs routés vers la console puis vers les convertisseurs pour enregistrement multi-piste.",
      en: 'Configuration for overnight generative sessions. All synthesizers routed to console then to converters for multi-track recording.',
    },
    category: 'recording',
    difficulty: 'advanced',
    tags: ['generative', 'ambient', 'overnight', 'synthesizers', 'midi'],
    steps: [
      {
        stepNumber: 1,
        gearId: 'minimoog-model-d',
        patchRequired: true,
        patchFrom: 'bay6-row1-pos1',
        patchTo: 'bay3-row2-pos1',
        notes: {
          fr: 'Minimoog Audio Out vers Studer Ch 1. Le Minimoog jouera les lignes de basse ou drones.',
          en: 'Minimoog Audio Out to Studer Ch 1. Minimoog will play bass lines or drones.',
        },
      },
      {
        stepNumber: 2,
        gearId: 'korg-polysix',
        patchRequired: true,
        patchFrom: 'bay6-row1-pos3',
        patchTo: 'bay3-row2-pos2',
        notes: {
          fr: 'Polysix Audio Out vers Studer Ch 2. Arpèges et textures avec le chorus signature.',
          en: 'Polysix Audio Out to Studer Ch 2. Arpeggios and textures with signature chorus.',
        },
      },
      {
        stepNumber: 3,
        gearId: 'prophet-5',
        patchRequired: true,
        patchFrom: 'bay6-row1-pos5',
        patchTo: 'bay3-row2-pos3',
        notes: {
          fr: 'Prophet-5 Out vers Studer Ch 3. Pads expressifs et harmonies évolutives.',
          en: 'Prophet-5 Out to Studer Ch 3. Expressive pads and evolving harmonies.',
        },
      },
      {
        stepNumber: 4,
        gearId: 'juno-106',
        patchRequired: true,
        patchFrom: 'bay6-row1-pos7',
        patchTo: 'bay3-row2-pos4',
        notes: {
          fr: 'Juno-106 Out vers Studer Ch 4. Pads secondaires et basses avec chorus.',
          en: 'Juno-106 Out to Studer Ch 4. Secondary pads and bass with chorus.',
        },
      },
      {
        stepNumber: 5,
        gearId: 'nord-lead-a1',
        patchRequired: true,
        patchFrom: 'bay6-row1-pos9',
        patchTo: 'bay3-row2-pos5',
        notes: {
          fr: 'Nord Lead A1 L/R vers Studer Ch 5/6. Multi-timbral avec 4 slots MIDI indépendants.',
          en: 'Nord Lead A1 L/R to Studer Ch 5/6. Multi-timbral with 4 independent MIDI slots.',
        },
      },
      {
        stepNumber: 6,
        gearId: 'studer-269',
        gearIOId: 'studer-line-out',
        patchRequired: true,
        patchFrom: 'bay3-row1-pos21',
        patchTo: 'bay7-row2-pos1',
        notes: {
          fr: 'Studer Line Out vers Prism AD pour enregistrement. Vérifiez les niveaux avant de lancer la session overnight.',
          en: 'Studer Line Out to Prism AD for recording. Check levels before starting overnight session.',
        },
      },
    ],
  },
  {
    id: 'generative-single-synth',
    name: {
      fr: 'Génératif — Synthé Unique',
      en: 'Generative — Single Synth',
    },
    description: {
      fr: 'Un seul synthétiseur à travers la chaîne de mastering complète pour des textures riches et traitées.',
      en: 'Single synthesizer through full mastering chain for rich, processed textures.',
    },
    category: 'recording',
    difficulty: 'intermediate',
    tags: ['generative', 'mastering', 'synthesizer', 'processing'],
    steps: [
      {
        stepNumber: 1,
        gearId: 'prophet-5',
        patchRequired: true,
        patchFrom: 'bay6-row1-pos5',
        patchTo: 'bay9-row2-pos1',
        notes: {
          fr: 'Prophet-5 vers MEA-2 pour égalisation de mastering.',
          en: 'Prophet-5 to MEA-2 for mastering EQ.',
        },
      },
      {
        stepNumber: 2,
        gearId: 'mea-2',
        patchRequired: true,
        patchFrom: 'bay9-row1-pos1',
        patchTo: 'bay9-row2-pos3',
        notes: {
          fr: 'MEA-2 vers Vari-Mu pour compression tube.',
          en: 'MEA-2 to Vari-Mu for tube compression.',
        },
      },
      {
        stepNumber: 3,
        gearId: 'manley-vari-mu',
        patchRequired: true,
        patchFrom: 'bay9-row1-pos3',
        patchTo: 'bay7-row2-pos1',
        notes: {
          fr: 'Vari-Mu vers Prism AD. Compression douce, mode LINK pour cohérence stéréo.',
          en: 'Vari-Mu to Prism AD. Gentle compression, LINK mode for stereo coherence.',
        },
        settings: {
          'ATTACK': 'SLOW',
          'RECOVERY': '3',
          'LINK': 'ON',
        },
      },
    ],
  },
];

// Utility functions
export function getChainById(id: string): SignalChain | undefined {
  return signalChains.find(c => c.id === id);
}

export function getChainsByCategory(category: SignalChain['category']): SignalChain[] {
  return signalChains.filter(c => c.category === category);
}

export function getChainsByDifficulty(difficulty: SignalChain['difficulty']): SignalChain[] {
  return signalChains.filter(c => c.difficulty === difficulty);
}

export function getChainsByTag(tag: string): SignalChain[] {
  return signalChains.filter(c => c.tags.includes(tag));
}

export function searchChains(query: string): SignalChain[] {
  const q = query.toLowerCase();
  return signalChains.filter(c =>
    c.name.en.toLowerCase().includes(q) ||
    c.name.fr.toLowerCase().includes(q) ||
    c.tags.some(t => t.includes(q))
  );
}
