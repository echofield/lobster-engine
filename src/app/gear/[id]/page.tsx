'use client';

import { use } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { useLanguage } from '@/components/LanguageProvider';
import { getGearById } from '@/data/gear';
import { getPointsByGear } from '@/data/patchbay';
import { GEAR_CATEGORY_LABELS } from '@/types/studio';
import {
  ArrowLeft,
  ArrowRight,
  ArrowDown,
  Cable,
  Lightbulb,
  Settings,
  Info,
} from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function GearDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const { t, tr } = useLanguage();

  const gear = getGearById(id);

  if (!gear) {
    notFound();
  }

  const patchbayPoints = getPointsByGear(gear.id);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back Link */}
      <Link
        href="/gear"
        className="inline-flex items-center gap-2 text-sm text-[var(--foreground-secondary)] hover:text-[var(--foreground)] mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('common_back')}
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-[var(--accent)] mb-1">
              {gear.manufacturer}
            </p>
            <h1 className="text-3xl font-bold mb-2">{gear.name}</h1>
            <p className="text-[var(--foreground-secondary)]">
              {tr(gear.description)}
            </p>
          </div>
          <span className="px-3 py-1 rounded-md bg-[var(--accent)]/20 text-[var(--accent)] text-sm">
            {tr(GEAR_CATEGORY_LABELS[gear.category])}
          </span>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-3 mt-4">
          {gear.stereo !== undefined && (
            <span className="px-3 py-1 rounded-md bg-[var(--background-secondary)] text-sm">
              {gear.stereo ? t('gear_stereo') : t('gear_mono')}
            </span>
          )}
          {gear.rackUnits && (
            <span className="px-3 py-1 rounded-md bg-[var(--background-secondary)] text-sm">
              {gear.rackUnits}U
            </span>
          )}
          <span className="px-3 py-1 rounded-md bg-[var(--background-secondary)] text-sm">
            {gear.signalType === 'analog'
              ? t('gear_analog')
              : gear.signalType === 'digital'
              ? t('gear_digital')
              : t('gear_both')}
          </span>
        </div>
      </div>

      {/* I/O Section */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Cable className="w-5 h-5" />
          {t('gear_io')}
        </h2>
        <div className="bg-[var(--background-secondary)] rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Inputs */}
            <div>
              <h3 className="text-sm font-medium text-[var(--foreground-secondary)] mb-2 flex items-center gap-2">
                <ArrowRight className="w-4 h-4" />
                {t('gear_input')}s
              </h3>
              <ul className="space-y-2">
                {gear.io
                  .filter(io => io.type === 'input' || io.type === 'insert_return' || io.type === 'sidechain')
                  .map(io => (
                    <li key={io.id} className="flex items-center justify-between p-2 rounded bg-black/20">
                      <span className="font-mono text-sm">{io.label}</span>
                      <span className="text-xs text-[var(--foreground-secondary)]">
                        {io.connector.toUpperCase()} · {io.channels}ch
                      </span>
                    </li>
                  ))}
                {gear.io.filter(io => io.type === 'input' || io.type === 'insert_return' || io.type === 'sidechain').length === 0 && (
                  <li className="text-sm text-[var(--foreground-secondary)]">-</li>
                )}
              </ul>
            </div>

            {/* Outputs */}
            <div>
              <h3 className="text-sm font-medium text-[var(--foreground-secondary)] mb-2 flex items-center gap-2">
                <ArrowDown className="w-4 h-4 rotate-[-90deg]" />
                {t('gear_output')}s
              </h3>
              <ul className="space-y-2">
                {gear.io
                  .filter(io => io.type === 'output' || io.type === 'insert_send')
                  .map(io => (
                    <li key={io.id} className="flex items-center justify-between p-2 rounded bg-black/20">
                      <span className="font-mono text-sm">{io.label}</span>
                      <span className="text-xs text-[var(--foreground-secondary)]">
                        {io.connector.toUpperCase()} · {io.channels}ch
                      </span>
                    </li>
                  ))}
                {gear.io.filter(io => io.type === 'output' || io.type === 'insert_send').length === 0 && (
                  <li className="text-sm text-[var(--foreground-secondary)]">-</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Controls Section */}
      {gear.controls.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            {t('gear_controls')}
          </h2>
          <div className="bg-[var(--background-secondary)] rounded-lg p-4">
            <div className="space-y-3">
              {gear.controls.map((control, idx) => (
                <div key={idx} className="p-3 rounded bg-black/20">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="font-mono text-sm font-medium">{control.name}</span>
                      <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-white/10 text-[var(--foreground-secondary)]">
                        {control.type}
                      </span>
                    </div>
                    {control.range && (
                      <span className="text-xs text-[var(--foreground-secondary)]">{control.range}</span>
                    )}
                  </div>
                  <p className="text-sm text-[var(--foreground-secondary)] mt-1">
                    {tr(control.description)}
                  </p>
                  {control.positions && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {control.positions.map(pos => (
                        <span key={pos} className="text-xs px-2 py-0.5 rounded bg-white/5">
                          {pos}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Patchbay Location */}
      {patchbayPoints.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Info className="w-5 h-5" />
            {t('gear_patchbay_location')}
          </h2>
          <div className="bg-[var(--background-patchbay)] rounded-lg p-4">
            <div className="space-y-2">
              {patchbayPoints.filter(p => p.label).map(point => (
                <div key={point.id} className="flex items-center justify-between p-2 rounded bg-black/30">
                  <div>
                    <span className="font-mono text-sm">{point.label}</span>
                    <span className="ml-2 text-xs text-[var(--foreground-secondary)]">
                      {point.type === 'send' ? '(out)' : '(in)'}
                    </span>
                  </div>
                  <span className="text-xs text-[var(--foreground-secondary)]">
                    {t('patchbay_bay')} {point.bay}, {t('patchbay_row')} {point.row}, {t('patchbay_position')} {point.position}
                  </span>
                </div>
              ))}
            </div>
            <Link
              href="/patchbay"
              className="mt-4 inline-flex items-center gap-2 text-sm text-[var(--accent)] hover:underline"
            >
              {tr({ fr: 'Voir sur le patchbay', en: 'View on patchbay' })}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      )}

      {/* Tips Section */}
      {gear.tips.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            {t('gear_tips')}
          </h2>
          <div className="space-y-3">
            {gear.tips.map((tip, idx) => (
              <div key={idx} className="p-4 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/20">
                <p className="text-sm">{tr(tip)}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
