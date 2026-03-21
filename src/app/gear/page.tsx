'use client';

import { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLanguage } from '@/components/LanguageProvider';
import { GearCard } from '@/components/GearCard';
import { gearRegistry, searchGear } from '@/data/gear';
import { GEAR_CATEGORY_LABELS, type GearCategory } from '@/types/studio';
import { Search, X } from 'lucide-react';

const categories: GearCategory[] = [
  'console',
  'tape_machine',
  'preamp',
  'compressor',
  'limiter',
  'eq',
  'saturation',
  'monitor_controller',
  'converter',
  'monitor',
  'di_box',
  'delay',
  'reverb',
  'interface',
];

function GearPageContent() {
  const { t, tr } = useLanguage();
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get('category') as GearCategory | null;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<GearCategory | null>(initialCategory);

  const filteredGear = useMemo(() => {
    let result = gearRegistry;

    // Filter by category
    if (selectedCategory) {
      result = result.filter(g => g.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      result = searchGear(searchQuery);
      if (selectedCategory) {
        result = result.filter(g => g.category === selectedCategory);
      }
    }

    return result;
  }, [searchQuery, selectedCategory]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t('nav_gear')}</h1>
        <p className="text-[var(--foreground-secondary)]">
          {tr({
            fr: `${gearRegistry.length} pièces d'équipement analogique haut de gamme`,
            en: `${gearRegistry.length} pieces of high-end analog equipment`,
          })}
        </p>
      </div>

      {/* Search & Filters */}
      <div className="mb-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--foreground-secondary)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('common_search')}
            className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-[var(--background-secondary)] border border-white/10 focus:border-[var(--accent)] focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-secondary)] hover:text-[var(--foreground)]"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
              selectedCategory === null
                ? 'bg-[var(--accent)] text-black'
                : 'bg-[var(--background-secondary)] hover:bg-white/10'
            }`}
          >
            {t('common_all')}
          </button>
          {categories.map((cat) => {
            const count = gearRegistry.filter(g => g.category === cat).length;
            if (count === 0) return null;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors flex items-center gap-2 ${
                  selectedCategory === cat
                    ? 'bg-[var(--accent)] text-black'
                    : 'bg-[var(--background-secondary)] hover:bg-white/10'
                }`}
              >
                <span>{tr(GEAR_CATEGORY_LABELS[cat])}</span>
                <span className="opacity-60">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-sm text-[var(--foreground-secondary)]">
        {filteredGear.length === gearRegistry.length ? (
          tr({ fr: 'Tout afficher', en: 'Showing all' })
        ) : (
          tr({
            fr: `${filteredGear.length} résultat${filteredGear.length > 1 ? 's' : ''}`,
            en: `${filteredGear.length} result${filteredGear.length > 1 ? 's' : ''}`,
          })
        )}
      </div>

      {/* Gear Grid */}
      {filteredGear.length === 0 ? (
        <div className="text-center py-12 text-[var(--foreground-secondary)]">
          {t('gear_no_results')}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredGear.map((gear) => (
            <GearCard key={gear.id} gear={gear} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function GearPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-8">Loading...</div>}>
      <GearPageContent />
    </Suspense>
  );
}
