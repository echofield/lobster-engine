import type { Workflow, WorkflowNode } from '@/types/studio';

export const workflows: Workflow[] = [
  // ============================================================
  // WORKFLOW 1: "I Want to Record"
  // ============================================================
  {
    id: 'record',
    name: {
      fr: 'Je veux enregistrer',
      en: 'I Want to Record',
    },
    description: {
      fr: 'Guide pas-à-pas pour configurer un enregistrement dans le studio.',
      en: 'Step-by-step guide to set up a recording in the studio.',
    },
    icon: 'mic',
    entryNodeId: 'record-what',
    nodes: [
      {
        id: 'record-what',
        question: {
          fr: "Qu'est-ce que vous voulez enregistrer ?",
          en: 'What do you want to record?',
        },
        options: [
          {
            id: 'vocals',
            label: { fr: 'Voix', en: 'Vocals' },
            icon: 'mic',
            nextNodeId: 'record-setup',
          },
          {
            id: 'guitar-electric',
            label: { fr: 'Guitare électrique', en: 'Electric Guitar' },
            icon: 'guitar',
            nextNodeId: 'record-guitar',
          },
          {
            id: 'guitar-acoustic',
            label: { fr: 'Guitare acoustique', en: 'Acoustic Guitar' },
            icon: 'music',
            nextNodeId: 'record-setup',
          },
          {
            id: 'synth',
            label: { fr: 'Synthé / Clavier', en: 'Synth / Keyboard' },
            icon: 'piano',
            nextNodeId: 'record-synth',
          },
        ],
      },
      {
        id: 'record-guitar',
        question: {
          fr: 'Comment voulez-vous enregistrer la guitare ?',
          en: 'How do you want to record the guitar?',
        },
        helpText: {
          fr: "L'ampli donne un son plus organique, la DI permet de reamper plus tard.",
          en: 'Amp gives more organic sound, DI allows reamping later.',
        },
        options: [
          {
            id: 'amp',
            label: { fr: 'Via ampli (micro)', en: 'Via amp (mic)' },
            icon: 'speaker',
            nextNodeId: 'record-setup',
          },
          {
            id: 'di',
            label: { fr: 'Direct (DI)', en: 'Direct (DI)' },
            icon: 'plug',
            resultMessage: {
              fr: "Branchez la guitare dans la Palmer Audionomix. Utilisez le PAD si le niveau est trop fort. Patchbay: DI OUT vers PRISM IN.",
              en: 'Connect guitar to Palmer Audionomix. Use PAD if level is too hot. Patchbay: DI OUT to PRISM IN.',
            },
          },
        ],
      },
      {
        id: 'record-synth',
        question: {
          fr: 'Votre synthé a quel type de sortie ?',
          en: 'What output type does your synth have?',
        },
        options: [
          {
            id: 'line',
            label: { fr: 'Ligne (jack/XLR)', en: 'Line (jack/XLR)' },
            icon: 'cable',
            resultMessage: {
              fr: "Branchez directement sur la console Studer (entrée LINE) ou via la DI Palmer. Patchbay: STUDER LINE OUT vers PRISM IN.",
              en: 'Connect directly to Studer console (LINE input) or via Palmer DI. Patchbay: STUDER LINE OUT to PRISM IN.',
            },
          },
          {
            id: 'usb',
            label: { fr: 'USB/MIDI', en: 'USB/MIDI' },
            icon: 'usb',
            resultMessage: {
              fr: "Connectez en USB au Mac du studio et enregistrez directement dans Pro Tools via les instruments virtuels.",
              en: 'Connect USB to studio Mac and record directly in Pro Tools via virtual instruments.',
            },
          },
        ],
      },
      {
        id: 'record-setup',
        question: {
          fr: 'Quelle est votre configuration ?',
          en: "What's your setup?",
        },
        options: [
          {
            id: 'protools',
            label: { fr: 'Mac avec Pro Tools', en: 'Mac with Pro Tools' },
            icon: 'laptop',
            nextNodeId: 'record-preamp',
          },
          {
            id: 'other-daw',
            label: { fr: 'Mac avec autre DAW', en: 'Mac with other DAW' },
            icon: 'laptop',
            nextNodeId: 'record-preamp',
          },
          {
            id: 'tape',
            label: { fr: 'Direct sur bande', en: 'Direct to tape' },
            icon: 'disc',
            resultChainId: 'print-to-tape',
          },
          {
            id: 'no-computer',
            label: { fr: "Je n'ai pas d'ordinateur", en: "I don't have a computer" },
            icon: 'help-circle',
            resultMessage: {
              fr: "Utilisez le Mac du studio avec Pro Tools. Demandez à l'assistant si vous avez besoin d'aide.",
              en: 'Use the studio Mac with Pro Tools. Ask the assistant if you need help.',
            },
          },
        ],
      },
      {
        id: 'record-preamp',
        question: {
          fr: 'Voulez-vous utiliser un préampli externe ?',
          en: 'Do you want to use an external preamp?',
        },
        helpText: {
          fr: "Les préamplis externes ajoutent du caractère sonore. La console Studer est excellente aussi.",
          en: 'External preamps add sonic character. The Studer console is excellent too.',
        },
        options: [
          {
            id: 'api',
            label: { fr: 'Oui, API 3124 (punchy)', en: 'Yes, API 3124 (punchy)' },
            icon: 'zap',
            nextNodeId: 'record-compression',
          },
          {
            id: 'bae',
            label: { fr: 'Oui, BAE (Neve sound)', en: 'Yes, BAE (Neve sound)' },
            icon: 'waves',
            nextNodeId: 'record-compression',
          },
          {
            id: 'studer',
            label: { fr: 'Non, la console suffit', en: 'No, console is fine' },
            icon: 'sliders',
            resultChainId: 'record-vocals-basic',
          },
          {
            id: 'dunno',
            label: { fr: 'Je ne sais pas', en: "I don't know" },
            icon: 'help-circle',
            resultChainId: 'record-vocals-basic',
            resultMessage: {
              fr: "La console Studer est un excellent point de départ. Ses préamplis sont chauds et musicaux.",
              en: 'The Studer console is an excellent starting point. Its preamps are warm and musical.',
            },
          },
        ],
      },
      {
        id: 'record-compression',
        question: {
          fr: "Voulez-vous de la compression à l'enregistrement ?",
          en: 'Do you want compression while recording?',
        },
        helpText: {
          fr: "La compression pendant l'enregistrement est irréversible mais peut donner un son plus fini.",
          en: 'Compression while recording is irreversible but can give a more finished sound.',
        },
        options: [
          {
            id: 'yes-1176',
            label: { fr: 'Oui, 1176 (rapide)', en: 'Yes, 1176 (fast)' },
            icon: 'gauge',
            resultChainId: 'record-external-preamp',
          },
          {
            id: 'yes-la3a',
            label: { fr: 'Oui, Mo3a (doux)', en: 'Yes, Mo3a (smooth)' },
            icon: 'feather',
            resultChainId: 'record-external-preamp',
          },
          {
            id: 'no',
            label: { fr: 'Non, je compresserai après', en: "No, I'll compress later" },
            icon: 'x',
            resultChainId: 'record-external-preamp',
          },
          {
            id: 'what',
            label: { fr: "C'est quoi la compression ?", en: 'What is compression?' },
            icon: 'help-circle',
            resultChainId: 'record-external-preamp',
            resultMessage: {
              fr: "La compression réduit la dynamique du signal. Pour commencer, enregistrez sans - vous pourrez toujours en ajouter après dans Pro Tools.",
              en: 'Compression reduces signal dynamics. To start, record without - you can always add it later in Pro Tools.',
            },
          },
        ],
      },
    ],
  },

  // ============================================================
  // WORKFLOW 2: "I Want to Mix"
  // ============================================================
  {
    id: 'mix',
    name: {
      fr: 'Je veux mixer',
      en: 'I Want to Mix',
    },
    description: {
      fr: 'Guide pour configurer le mixage avec ou sans traitement analogique.',
      en: 'Guide to set up mixing with or without analog processing.',
    },
    icon: 'sliders-horizontal',
    entryNodeId: 'mix-source',
    nodes: [
      {
        id: 'mix-source',
        question: {
          fr: 'Où est votre session ?',
          en: 'Where is your session?',
        },
        options: [
          {
            id: 'studio-mac',
            label: { fr: 'Mac du studio', en: 'Studio Mac' },
            icon: 'monitor',
            nextNodeId: 'mix-analog',
          },
          {
            id: 'my-laptop',
            label: { fr: 'Mon laptop', en: 'My laptop' },
            icon: 'laptop',
            resultMessage: {
              fr: "Transférez votre session sur le Mac du studio via USB ou réseau, puis revenez ici.",
              en: 'Transfer your session to the studio Mac via USB or network, then come back here.',
            },
          },
          {
            id: 'stems',
            label: { fr: 'Stems sur clé USB', en: 'Stems on USB drive' },
            icon: 'hard-drive',
            resultMessage: {
              fr: "Importez vos stems dans une nouvelle session Pro Tools sur le Mac du studio.",
              en: 'Import your stems into a new Pro Tools session on the studio Mac.',
            },
          },
        ],
      },
      {
        id: 'mix-analog',
        question: {
          fr: 'Voulez-vous passer par du matériel analogique ?',
          en: 'Do you want to use analog hardware?',
        },
        helpText: {
          fr: "Le traitement analogique ajoute de la chaleur et du caractère mais prend plus de temps à configurer.",
          en: 'Analog processing adds warmth and character but takes more time to set up.',
        },
        options: [
          {
            id: 'full-analog',
            label: { fr: 'Oui, chaîne complète', en: 'Yes, full chain' },
            icon: 'zap',
            resultChainId: 'mix-analog-bus',
          },
          {
            id: 'bus-only',
            label: { fr: 'Juste le bus stéréo', en: 'Just stereo bus' },
            icon: 'git-merge',
            nextNodeId: 'mix-bus-processing',
          },
          {
            id: 'itb',
            label: { fr: 'Non, tout dans la boîte', en: 'No, all in the box' },
            icon: 'laptop',
            resultMessage: {
              fr: "Mixez entièrement dans Pro Tools. Utilisez le Crookwood pour le monitoring (source D1-D6).",
              en: 'Mix entirely in Pro Tools. Use Crookwood for monitoring (source D1-D6).',
            },
          },
        ],
      },
      {
        id: 'mix-bus-processing',
        question: {
          fr: 'Quel traitement sur le bus stéréo ?',
          en: 'What processing on stereo bus?',
        },
        options: [
          {
            id: 'eq',
            label: { fr: 'EQ seulement', en: 'EQ only' },
            icon: 'sliders',
            resultMessage: {
              fr: "Patchbay: PRISM DA OUT → MEA-2 ou CURVE BENDER → PRISM AD IN",
              en: 'Patchbay: PRISM DA OUT → MEA-2 or CURVE BENDER → PRISM AD IN',
            },
          },
          {
            id: 'comp',
            label: { fr: 'Compression seulement', en: 'Compression only' },
            icon: 'gauge',
            resultMessage: {
              fr: "Patchbay: PRISM DA OUT → VARI MU ou API 2500 → PRISM AD IN",
              en: 'Patchbay: PRISM DA OUT → VARI MU or API 2500 → PRISM AD IN',
            },
          },
          {
            id: 'both',
            label: { fr: 'EQ + Compression', en: 'EQ + Compression' },
            icon: 'layers',
            resultChainId: 'mix-analog-bus',
          },
          {
            id: 'saturation',
            label: { fr: 'Saturation (Fatso)', en: 'Saturation (Fatso)' },
            icon: 'flame',
            resultMessage: {
              fr: "Patchbay: PRISM DA OUT → FATSO → PRISM AD IN. WARMTH à 2-3 pour subtilité.",
              en: 'Patchbay: PRISM DA OUT → FATSO → PRISM AD IN. WARMTH at 2-3 for subtlety.',
            },
          },
        ],
      },
    ],
  },

  // ============================================================
  // WORKFLOW 3: "I Want to Master"
  // ============================================================
  {
    id: 'master',
    name: {
      fr: 'Je veux masteriser',
      en: 'I Want to Master',
    },
    description: {
      fr: 'Configuration pour le mastering avec chaîne analogique professionnelle.',
      en: 'Setup for mastering with professional analog chain.',
    },
    icon: 'crown',
    entryNodeId: 'master-source',
    nodes: [
      {
        id: 'master-source',
        question: {
          fr: 'Format de la source ?',
          en: 'Source format?',
        },
        options: [
          {
            id: 'digital',
            label: { fr: 'Fichier digital (WAV)', en: 'Digital file (WAV)' },
            icon: 'file-audio',
            nextNodeId: 'master-genre',
          },
          {
            id: 'tape',
            label: { fr: 'Bande magnétique', en: 'Tape' },
            icon: 'disc',
            resultMessage: {
              fr: "Patchbay: FROM TAPE → MEA-2 (début de chaîne mastering). Alignez d'abord la bande.",
              en: 'Patchbay: FROM TAPE → MEA-2 (start of mastering chain). Align tape first.',
            },
          },
        ],
      },
      {
        id: 'master-genre',
        question: {
          fr: 'Quel genre musical ?',
          en: 'What music genre?',
        },
        helpText: {
          fr: 'Le genre influence les réglages recommandés.',
          en: 'Genre influences recommended settings.',
        },
        options: [
          {
            id: 'hiphop',
            label: { fr: 'Hip-hop / Électro', en: 'Hip-hop / Electronic' },
            icon: 'volume-2',
            resultChainId: 'mastering-full',
            resultMessage: {
              fr: "Conseil: Plus de compression sur VARI MU (3-4dB GR), HP SC obligatoire. API 2500 avec THRUST pour plus de punch.",
              en: 'Tip: More compression on VARI MU (3-4dB GR), HP SC mandatory. API 2500 with THRUST for more punch.',
            },
          },
          {
            id: 'rock',
            label: { fr: 'Rock / Pop', en: 'Rock / Pop' },
            icon: 'guitar',
            resultChainId: 'mastering-full',
            resultMessage: {
              fr: "Conseil: Compression modérée, attention à ne pas écraser les transitoires de batterie.",
              en: 'Tip: Moderate compression, careful not to crush drum transients.',
            },
          },
          {
            id: 'jazz',
            label: { fr: 'Jazz / Classique', en: 'Jazz / Classical' },
            icon: 'music',
            resultChainId: 'mastering-full',
            resultMessage: {
              fr: "Conseil: Compression très légère (1dB max), préservez la dynamique. MEA-2 pour corrections précises.",
              en: 'Tip: Very light compression (1dB max), preserve dynamics. MEA-2 for precise corrections.',
            },
          },
          {
            id: 'other',
            label: { fr: 'Autre', en: 'Other' },
            icon: 'music-2',
            resultChainId: 'mastering-full',
          },
        ],
      },
    ],
  },

  // ============================================================
  // WORKFLOW 4: "I Just Want to Listen"
  // ============================================================
  {
    id: 'monitor',
    name: {
      fr: 'Je veux juste écouter',
      en: 'I Just Want to Listen',
    },
    description: {
      fr: 'Configuration du monitoring pour écouter différentes sources.',
      en: 'Monitoring setup to listen to different sources.',
    },
    icon: 'headphones',
    entryNodeId: 'monitor-source',
    nodes: [
      {
        id: 'monitor-source',
        question: {
          fr: 'Quelle source voulez-vous écouter ?',
          en: 'What source do you want to listen to?',
        },
        options: [
          {
            id: 'protools',
            label: { fr: 'Pro Tools', en: 'Pro Tools' },
            icon: 'laptop',
            nextNodeId: 'monitor-speakers',
          },
          {
            id: 'external',
            label: { fr: 'Lecteur externe', en: 'External player' },
            icon: 'smartphone',
            resultMessage: {
              fr: "Branchez votre lecteur sur une entrée Crookwood disponible (A1/A2 pour analog, ou via un convertisseur sur D1-D6).",
              en: 'Connect your player to an available Crookwood input (A1/A2 for analog, or via converter on D1-D6).',
            },
          },
          {
            id: 'tape',
            label: { fr: 'Magnétophone', en: 'Tape machine' },
            icon: 'disc',
            resultMessage: {
              fr: "Patchbay: FROM TAPE → CW S1. Sur Crookwood, sélectionnez la source correspondante.",
              en: 'Patchbay: FROM TAPE → CW S1. On Crookwood, select the corresponding source.',
            },
          },
        ],
      },
      {
        id: 'monitor-speakers',
        question: {
          fr: 'Sur quelles enceintes ?',
          en: 'On which speakers?',
        },
        options: [
          {
            id: 'main',
            label: { fr: 'Enceintes principales', en: 'Main speakers' },
            icon: 'speaker',
            resultChainId: 'monitoring-basic',
          },
          {
            id: 'ns10',
            label: { fr: 'NS-10 (nearfields)', en: 'NS-10 (nearfields)' },
            icon: 'volume-1',
            resultChainId: 'monitoring-basic',
            resultMessage: {
              fr: "Sur Crookwood: SPEAKER SELECT → NEAR. Les NS-10 sont exigeantes - si ça sonne bien dessus, ça sonnera bien partout.",
              en: 'On Crookwood: SPEAKER SELECT → NEAR. NS-10s are demanding - if it sounds good on these, it will sound good anywhere.',
            },
          },
          {
            id: 'headphones',
            label: { fr: 'Casque', en: 'Headphones' },
            icon: 'headphones',
            resultChainId: 'monitoring-basic',
            resultMessage: {
              fr: "Sur Crookwood: SPEAKER SELECT → HP. Branchez votre casque sur la sortie casque du rack.",
              en: 'On Crookwood: SPEAKER SELECT → HP. Plug your headphones into the headphone output on the rack.',
            },
          },
        ],
      },
    ],
  },
];

// Utility functions
export function getWorkflowById(id: string): Workflow | undefined {
  return workflows.find(w => w.id === id);
}

export function getNodeById(workflow: Workflow, nodeId: string): WorkflowNode | undefined {
  return workflow.nodes.find(n => n.id === nodeId);
}

export function getNextNode(workflow: Workflow, currentNodeId: string, optionId: string): WorkflowNode | undefined {
  const currentNode = getNodeById(workflow, currentNodeId);
  if (!currentNode) return undefined;

  const option = currentNode.options.find(o => o.id === optionId);
  if (!option || !option.nextNodeId) return undefined;

  return getNodeById(workflow, option.nextNodeId);
}
