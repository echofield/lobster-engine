'use client';

import Link from 'next/link';
import { useLanguage } from '@/components/LanguageProvider';
import { gearRegistry } from '@/data/gear';
import { signalChains } from '@/data/signal-chains';
import { workflows } from '@/data/workflows';

export default function Dashboard() {
  const { t } = useLanguage();

  return (
    <div className="min-h-[calc(100vh-3.5rem)] relative overflow-hidden">
      {/* Corner Marks */}
      <div className="corner-mark top-left" style={{ top: 24, left: 24 }} />
      <div className="corner-mark top-right" style={{ top: 24, right: 24 }} />
      <div className="corner-mark bottom-left" style={{ bottom: 24, left: 24 }} />
      <div className="corner-mark bottom-right" style={{ bottom: 24, right: 24 }} />

      {/* Build Label */}
      <div className="fixed bottom-6 left-6 build-label">
        BUILD-0318-A
      </div>

      {/* Main Content - Centered */}
      <div className="content-center">
        <div className="relative">
          {/* Orbit Circles */}
          <div
            className="orbit-circle animate-orbit animate-pulse-soft"
            style={{ width: 500, height: 500, top: '50%', left: '50%', marginTop: -250, marginLeft: -250 }}
          />
          <div
            className="orbit-circle animate-orbit-reverse"
            style={{ width: 380, height: 380, top: '50%', left: '50%', marginTop: -190, marginLeft: -190 }}
          />
          <div
            className="orbit-circle orbit-inner"
            style={{ width: 260, height: 260, top: '50%', left: '50%', marginTop: -130, marginLeft: -130 }}
          />

          {/* Central Card */}
          <div className="relative z-10 w-[280px] animate-fade-up text-center">
            {/* Diamond Icon */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="w-20 h-20 border border-[var(--border)] rotate-45 flex items-center justify-center">
                  <div className="w-3 h-3 bg-[var(--accent)] rotate-0" />
                </div>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-lg font-medium tracking-wide mb-2">
              Studio Intelligence
            </h1>
            <p className="text-xs uppercase tracking-[0.2em] opacity-30 mb-8">
              Signal Routing
            </p>

            {/* Stats */}
            <div className="flex justify-center gap-8 mb-10 opacity-40">
              <div className="text-center">
                <span className="block font-mono text-sm">{gearRegistry.length}</span>
                <span className="label-micro">gear</span>
              </div>
              <div className="text-center">
                <span className="block font-mono text-sm">{signalChains.length}</span>
                <span className="label-micro">chains</span>
              </div>
              <div className="text-center">
                <span className="block font-mono text-sm">{workflows.length}</span>
                <span className="label-micro">flows</span>
              </div>
            </div>

            {/* CTA Button */}
            <Link href="/guide" className="btn-primary">
              {t('dashboard_quick_start')}
            </Link>
          </div>

          {/* Side markers */}
          <div className="absolute left-[-60px] top-1/2 -translate-y-1/2">
            <div className="diamond" />
          </div>
          <div className="absolute right-[-60px] top-1/2 -translate-y-1/2">
            <div className="diamond" />
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-12">
        <Link href="/gear" className="nav-link">
          {t('nav_gear')}
        </Link>
        <Link href="/chains" className="nav-link">
          {t('nav_chains')}
        </Link>
        <Link href="/instruments" className="nav-link">
          Instrument
        </Link>
        <Link href="/patchbay" className="nav-link">
          {t('nav_patchbay')}
        </Link>
      </div>
    </div>
  );
}
