'use client';

import { use } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { useLanguage } from '@/components/LanguageProvider';
import { getChainById } from '@/data/signal-chains';
import { getGearById } from '@/data/gear';
import { getPointById } from '@/data/patchbay';
import {
  ArrowLeft,
  ArrowDown,
  Cable,
  Settings,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

const difficultyColors = {
  beginner: 'bg-green-500/20 text-green-400',
  intermediate: 'bg-yellow-500/20 text-yellow-400',
  advanced: 'bg-red-500/20 text-red-400',
};

export default function ChainDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const { t, tr } = useLanguage();

  const chain = getChainById(id);

  if (!chain) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back Link */}
      <Link
        href="/chains"
        className="inline-flex items-center gap-2 text-sm text-[var(--foreground-secondary)] hover:text-[var(--foreground)] mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('common_back')}
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold mb-2">{tr(chain.name)}</h1>
            <p className="text-[var(--foreground-secondary)]">
              {tr(chain.description)}
            </p>
          </div>
          <div className="flex gap-2">
            <span className={`px-3 py-1 rounded-md text-sm ${difficultyColors[chain.difficulty]}`}>
              {t(`chain_${chain.difficulty}` as 'chain_beginner' | 'chain_intermediate' | 'chain_advanced')}
            </span>
            <span className="px-3 py-1 rounded-md bg-[var(--background-secondary)] text-sm">
              {t(`chain_${chain.category}` as 'chain_recording' | 'chain_mixing' | 'chain_mastering' | 'chain_monitoring')}
            </span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mt-4">
          {chain.tags.map(tag => (
            <span key={tag} className="text-xs px-2 py-1 rounded bg-[var(--background-secondary)]">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Steps */}
      <section>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          {t('chain_steps')} ({chain.steps.length})
        </h2>

        <div className="space-y-4">
          {chain.steps.map((step, idx) => {
            const gear = getGearById(step.gearId);
            const patchFromPoint = step.patchFrom ? getPointById(step.patchFrom) : null;
            const patchToPoint = step.patchTo ? getPointById(step.patchTo) : null;

            return (
              <div key={idx} className="relative">
                {/* Connector Line */}
                {idx < chain.steps.length - 1 && (
                  <div className="absolute left-[1.375rem] top-[4rem] bottom-[-1rem] w-0.5 bg-[var(--accent)]/30" />
                )}

                <div className="flex gap-4">
                  {/* Step Number */}
                  <div className="w-11 h-11 rounded-full bg-[var(--accent)] text-black font-bold flex items-center justify-center flex-shrink-0 z-10">
                    {step.stepNumber}
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 p-4 rounded-lg bg-[var(--background-secondary)] border border-white/5">
                    {/* Gear Info */}
                    {gear && (
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <Link
                            href={`/gear/${gear.id}`}
                            className="font-medium hover:text-[var(--accent)] transition-colors"
                          >
                            {gear.name}
                          </Link>
                          <p className="text-sm text-[var(--foreground-secondary)]">
                            {gear.manufacturer}
                          </p>
                        </div>
                        <Link
                          href={`/gear/${gear.id}`}
                          className="text-xs text-[var(--accent)] hover:underline flex items-center gap-1"
                        >
                          {t('gear_view_details')}
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    )}

                    {/* Notes */}
                    <p className="text-sm mb-3">{tr(step.notes)}</p>

                    {/* Patch Required */}
                    {step.patchRequired && (
                      <div className="p-3 rounded-md bg-[var(--background-patchbay)] border border-[var(--accent)]/30">
                        <div className="flex items-center gap-2 text-sm font-medium text-[var(--accent)] mb-2">
                          <Cable className="w-4 h-4" />
                          {t('chain_patch_required')}
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          {patchFromPoint && (
                            <span className="font-mono px-2 py-1 rounded bg-black/30">
                              {patchFromPoint.label}
                            </span>
                          )}
                          <ArrowRight className="w-4 h-4 text-[var(--accent)]" />
                          {patchToPoint && (
                            <span className="font-mono px-2 py-1 rounded bg-black/30">
                              {patchToPoint.label}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Settings */}
                    {step.settings && Object.keys(step.settings).length > 0 && (
                      <div className="mt-3 p-3 rounded-md bg-black/20">
                        <div className="flex items-center gap-2 text-sm text-[var(--foreground-secondary)] mb-2">
                          <Settings className="w-4 h-4" />
                          {tr({ fr: 'Réglages suggérés', en: 'Suggested settings' })}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(step.settings).map(([key, value]) => (
                            <span key={key} className="text-xs font-mono px-2 py-1 rounded bg-white/5">
                              {key}: {String(value)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Open in Patchbay CTA */}
      <div className="mt-8 p-4 rounded-lg bg-[var(--background-patchbay)] border border-white/10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">{t('guide_open_in_patchbay')}</h3>
            <p className="text-sm text-[var(--foreground-secondary)]">
              {tr({
                fr: 'Visualisez cette chaîne sur le patchbay interactif',
                en: 'Visualize this chain on the interactive patchbay',
              })}
            </p>
          </div>
          <Link
            href={`/patchbay?chain=${chain.id}`}
            className="px-4 py-2 rounded-md bg-[var(--accent)] text-black font-medium hover:bg-[var(--accent-hover)] transition-colors flex items-center gap-2"
          >
            <Cable className="w-4 h-4" />
            {t('nav_patchbay')}
          </Link>
        </div>
      </div>
    </div>
  );
}
