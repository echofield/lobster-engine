'use client';

import Link from 'next/link';
import { useLanguage } from './LanguageProvider';
import type { GearUnit } from '@/types/studio';
import { GEAR_CATEGORY_LABELS } from '@/types/studio';
import { ArrowRight } from 'lucide-react';

interface GearCardProps {
  gear: GearUnit;
}

export function GearCard({ gear }: GearCardProps) {
  const { tr } = useLanguage();

  return (
    <Link
      href={`/gear/${gear.id}`}
      className="card group block p-5"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm group-hover:text-[var(--accent)] transition-colors truncate">
            {gear.name}
          </h3>
          <p className="text-xs opacity-40 mt-0.5">
            {gear.manufacturer}
          </p>
        </div>
        <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-40 transition-opacity flex-shrink-0 mt-1" />
      </div>

      {/* Description */}
      <p className="text-xs opacity-50 line-clamp-2 mb-4">
        {tr(gear.quickDescription)}
      </p>

      {/* Meta Row */}
      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <span className="label-micro">
          {tr(GEAR_CATEGORY_LABELS[gear.category])}
        </span>
        <div className="flex items-center gap-2">
          {gear.stereo && (
            <span className="text-[8px] uppercase tracking-wider opacity-30">Stereo</span>
          )}
          {gear.rackUnits && (
            <span className="text-[8px] uppercase tracking-wider opacity-30">{gear.rackUnits}U</span>
          )}
        </div>
      </div>
    </Link>
  );
}
