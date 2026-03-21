'use client';

import { useLanguage } from './LanguageProvider';
import { Globe } from 'lucide-react';

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <button
      onClick={() => setLanguage(language === 'fr' ? 'en' : 'fr')}
      className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[var(--background-secondary)] hover:bg-[var(--accent)] hover:text-black transition-colors text-sm font-mono"
      title={language === 'fr' ? 'Switch to English' : 'Passer en français'}
    >
      <Globe className="w-4 h-4" />
      <span className="uppercase">{language}</span>
    </button>
  );
}
