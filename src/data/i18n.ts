import type { I18nStrings, Language, Translatable } from '@/types/studio';

export const strings: I18nStrings = {
  // Navigation
  nav_dashboard: { fr: 'Tableau de bord', en: 'Dashboard' },
  nav_patchbay: { fr: 'Patchbay', en: 'Patchbay' },
  nav_guide: { fr: 'Guide', en: 'Guide' },
  nav_gear: { fr: 'Équipement', en: 'Gear' },
  nav_chains: { fr: 'Chaînes', en: 'Chains' },
  nav_assistant: { fr: 'Assistant', en: 'Assistant' },

  // Common
  common_search: { fr: 'Rechercher...', en: 'Search...' },
  common_filter: { fr: 'Filtrer', en: 'Filter' },
  common_back: { fr: 'Retour', en: 'Back' },
  common_next: { fr: 'Suivant', en: 'Next' },
  common_cancel: { fr: 'Annuler', en: 'Cancel' },
  common_save: { fr: 'Enregistrer', en: 'Save' },
  common_reset: { fr: 'Réinitialiser', en: 'Reset' },
  common_loading: { fr: 'Chargement...', en: 'Loading...' },
  common_all: { fr: 'Tout', en: 'All' },
  common_none: { fr: 'Aucun', en: 'None' },
  common_yes: { fr: 'Oui', en: 'Yes' },
  common_no: { fr: 'Non', en: 'No' },
  common_or: { fr: 'ou', en: 'or' },
  common_and: { fr: 'et', en: 'and' },
  common_close: { fr: 'Fermer', en: 'Close' },
  common_open: { fr: 'Ouvrir', en: 'Open' },
  common_copy: { fr: 'Copier', en: 'Copy' },
  common_copied: { fr: 'Copié !', en: 'Copied!' },

  // Gear
  gear_specs: { fr: 'Spécifications', en: 'Specifications' },
  gear_io: { fr: 'Entrées/Sorties', en: 'Inputs/Outputs' },
  gear_controls: { fr: 'Contrôles', en: 'Controls' },
  gear_tips: { fr: 'Conseils', en: 'Tips' },
  gear_patchbay_location: { fr: 'Position sur le patchbay', en: 'Patchbay Location' },
  gear_manufacturer: { fr: 'Fabricant', en: 'Manufacturer' },
  gear_model: { fr: 'Modèle', en: 'Model' },
  gear_category: { fr: 'Catégorie', en: 'Category' },
  gear_signal_type: { fr: 'Type de signal', en: 'Signal Type' },
  gear_rack_units: { fr: 'Unités rack', en: 'Rack Units' },
  gear_stereo: { fr: 'Stéréo', en: 'Stereo' },
  gear_mono: { fr: 'Mono', en: 'Mono' },
  gear_analog: { fr: 'Analogique', en: 'Analog' },
  gear_digital: { fr: 'Numérique', en: 'Digital' },
  gear_both: { fr: 'Les deux', en: 'Both' },
  gear_input: { fr: 'Entrée', en: 'Input' },
  gear_output: { fr: 'Sortie', en: 'Output' },
  gear_insert_send: { fr: 'Insert envoi', en: 'Insert Send' },
  gear_insert_return: { fr: 'Insert retour', en: 'Insert Return' },
  gear_sidechain: { fr: 'Sidechain', en: 'Sidechain' },
  gear_view_details: { fr: 'Voir les détails', en: 'View Details' },
  gear_no_results: { fr: 'Aucun équipement trouvé', en: 'No gear found' },

  // Patchbay
  patchbay_click_to_patch: { fr: 'Cliquez pour patcher', en: 'Click to patch' },
  patchbay_clear_all: { fr: 'Effacer tout', en: 'Clear All' },
  patchbay_load_chain: { fr: 'Charger une chaîne', en: 'Load Chain' },
  patchbay_verify_mode: { fr: 'Mode vérification', en: 'Verify Mode' },
  patchbay_select_source: { fr: 'Sélectionnez une source', en: 'Select a source' },
  patchbay_select_destination: { fr: 'Sélectionnez une destination', en: 'Select a destination' },
  patchbay_cable_added: { fr: 'Câble ajouté', en: 'Cable added' },
  patchbay_cable_removed: { fr: 'Câble retiré', en: 'Cable removed' },
  patchbay_bay: { fr: 'Baie', en: 'Bay' },
  patchbay_row: { fr: 'Rangée', en: 'Row' },
  patchbay_position: { fr: 'Position', en: 'Position' },
  patchbay_normalled_to: { fr: 'Normallé vers', en: 'Normalled to' },
  patchbay_not_verified: { fr: 'Non vérifié', en: 'Not verified' },
  patchbay_verified: { fr: 'Vérifié', en: 'Verified' },
  patchbay_zoom_in: { fr: 'Zoomer', en: 'Zoom In' },
  patchbay_zoom_out: { fr: 'Dézoomer', en: 'Zoom Out' },
  patchbay_reset_view: { fr: 'Réinitialiser la vue', en: 'Reset View' },

  // Guide
  guide_start: { fr: 'Commencer', en: 'Start' },
  guide_restart: { fr: 'Recommencer', en: 'Restart' },
  guide_result: { fr: 'Résultat', en: 'Result' },
  guide_open_in_patchbay: { fr: 'Voir sur le patchbay', en: 'Open in Patchbay' },
  guide_select_workflow: { fr: 'Que voulez-vous faire ?', en: 'What do you want to do?' },
  guide_back_to_workflows: { fr: 'Retour aux guides', en: 'Back to guides' },
  guide_step: { fr: 'Étape', en: 'Step' },
  guide_of: { fr: 'sur', en: 'of' },

  // Chains
  chain_difficulty: { fr: 'Difficulté', en: 'Difficulty' },
  chain_steps: { fr: 'Étapes', en: 'Steps' },
  chain_tags: { fr: 'Tags', en: 'Tags' },
  chain_beginner: { fr: 'Débutant', en: 'Beginner' },
  chain_intermediate: { fr: 'Intermédiaire', en: 'Intermediate' },
  chain_advanced: { fr: 'Avancé', en: 'Advanced' },
  chain_recording: { fr: 'Enregistrement', en: 'Recording' },
  chain_mixing: { fr: 'Mixage', en: 'Mixing' },
  chain_mastering: { fr: 'Mastering', en: 'Mastering' },
  chain_monitoring: { fr: 'Monitoring', en: 'Monitoring' },
  chain_patch_required: { fr: 'Câble requis', en: 'Patch required' },
  chain_no_patch: { fr: 'Pas de câblage', en: 'No patching' },
  chain_view_chain: { fr: 'Voir la chaîne', en: 'View Chain' },
  chain_use_chain: { fr: 'Utiliser', en: 'Use Chain' },

  // Dashboard
  dashboard_welcome: { fr: 'Bienvenue au Studio', en: 'Welcome to the Studio' },
  dashboard_quick_start: { fr: 'Démarrage rapide', en: 'Quick Start' },
  dashboard_recent_chains: { fr: 'Chaînes récentes', en: 'Recent Chains' },
  dashboard_gear_overview: { fr: 'Aperçu équipement', en: 'Gear Overview' },
  dashboard_record_vocals: { fr: 'Enregistrer une voix', en: 'Record Vocals' },
  dashboard_mix_session: { fr: 'Mixer une session', en: 'Mix a Session' },
  dashboard_master_track: { fr: 'Masteriser un morceau', en: 'Master a Track' },
  dashboard_explore_gear: { fr: 'Explorer l\'équipement', en: 'Explore Gear' },
  dashboard_help_text: {
    fr: 'Ce studio est équipé de matériel analogique haut de gamme. Utilisez ce guide pour configurer vos sessions.',
    en: 'This studio is equipped with high-end analog gear. Use this guide to set up your sessions.',
  },

  // Assistant
  assistant_placeholder: { fr: 'Posez votre question...', en: 'Ask your question...' },
  assistant_api_key_required: { fr: 'Clé API requise', en: 'API key required' },
  assistant_enable: { fr: 'Activer l\'assistant IA', en: 'Enable AI assistant' },
  assistant_settings: { fr: 'Paramètres', en: 'Settings' },
  assistant_provider: { fr: 'Fournisseur', en: 'Provider' },
  assistant_model: { fr: 'Modèle', en: 'Model' },

  // Errors
  error_not_found: { fr: 'Non trouvé', en: 'Not found' },
  error_loading: { fr: 'Erreur de chargement', en: 'Loading error' },
  error_generic: { fr: 'Une erreur est survenue', en: 'An error occurred' },

  // Categories (duplicated for easy access)
  category_console: { fr: 'Console', en: 'Console' },
  category_tape_machine: { fr: 'Magnétophone', en: 'Tape Machine' },
  category_compressor: { fr: 'Compresseur', en: 'Compressor' },
  category_eq: { fr: 'Égaliseur', en: 'Equalizer' },
  category_limiter: { fr: 'Limiteur', en: 'Limiter' },
  category_monitor_controller: { fr: 'Contrôleur de monitoring', en: 'Monitor Controller' },
  category_converter: { fr: 'Convertisseur', en: 'Converter' },
  category_preamp: { fr: 'Préamplificateur', en: 'Preamp' },
  category_di_box: { fr: 'Boîte de direct', en: 'DI Box' },
  category_reverb: { fr: 'Réverbe', en: 'Reverb' },
  category_delay: { fr: 'Délai', en: 'Delay' },
  category_saturation: { fr: 'Saturation', en: 'Saturation' },
  category_monitor: { fr: 'Enceinte', en: 'Monitor' },
  category_interface: { fr: 'Interface', en: 'Interface' },
};

// Language context helper
export function getTranslation(key: keyof I18nStrings, language: Language): string {
  const entry = strings[key];
  if (!entry) return String(key);
  return entry[language];
}

// Translate a Translatable object
export function translate(obj: Translatable, language: Language): string {
  return obj[language];
}

// Get all available languages
export const availableLanguages: { code: Language; name: string; nativeName: string }[] = [
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'en', name: 'English', nativeName: 'English' },
];

// Default language
export const defaultLanguage: Language = 'fr';
