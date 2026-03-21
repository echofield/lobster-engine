'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/components/LanguageProvider';
import { signalChains } from '@/data/signal-chains';
import type { ChainCategory, SignalChain } from '@/types/studio';

// Pattern signature colors
const CATEGORY_COLORS: Record<ChainCategory, string> = {
  recording: '#22c55e',
  mixing: '#3b82f6',
  mastering: '#7C5CFF',
  monitoring: '#06b6d4',
};

// Generate a radial signature for a chain based on its steps
function generateSignature(chain: SignalChain): number[] {
  const points = chain.steps.length;
  return chain.steps.map((step, i) => {
    // Each step contributes to the radial shape
    const baseRadius = 0.4 + (step.patchRequired ? 0.2 : 0.1);
    const variation = Math.sin(i * 2.5) * 0.15;
    return baseRadius + variation;
  });
}

// Render a radial pattern signature
function PatternSignature({
  chain,
  size = 120,
  breathing = false,
  pulsePhase = 0,
}: {
  chain: SignalChain;
  size?: number;
  breathing?: boolean;
  pulsePhase?: number;
}) {
  const signature = generateSignature(chain);
  const color = CATEGORY_COLORS[chain.category];
  const center = size / 2;
  const maxRadius = (size / 2) * 0.8;

  // Generate path for the radial signature
  const points = signature.map((r, i) => {
    const angle = (i / signature.length) * Math.PI * 2 - Math.PI / 2;
    const breathOffset = breathing ? Math.sin(pulsePhase + i * 0.5) * 0.05 : 0;
    const radius = maxRadius * (r + breathOffset);
    return {
      x: center + Math.cos(angle) * radius,
      y: center + Math.sin(angle) * radius,
    };
  });

  // Close the path by adding the first point at the end
  const pathPoints = [...points, points[0]];

  // Create smooth curve through points
  let path = `M ${pathPoints[0].x} ${pathPoints[0].y}`;
  for (let i = 0; i < pathPoints.length - 1; i++) {
    const curr = pathPoints[i];
    const next = pathPoints[i + 1];
    const midX = (curr.x + next.x) / 2;
    const midY = (curr.y + next.y) / 2;
    path += ` Q ${curr.x} ${curr.y} ${midX} ${midY}`;
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Outer ring */}
      <circle
        cx={center}
        cy={center}
        r={maxRadius}
        fill="none"
        stroke={color}
        strokeWidth={0.5}
        opacity={0.15}
      />

      {/* Inner ring */}
      <circle
        cx={center}
        cy={center}
        r={maxRadius * 0.5}
        fill="none"
        stroke={color}
        strokeWidth={0.5}
        opacity={0.1}
      />

      {/* Signature shape */}
      <path
        d={path}
        fill={color}
        fillOpacity={0.1}
        stroke={color}
        strokeWidth={1.5}
        opacity={0.6}
      />

      {/* Step nodes */}
      {points.map((point, i) => (
        <circle
          key={i}
          cx={point.x}
          cy={point.y}
          r={3}
          fill={color}
          opacity={chain.steps[i]?.patchRequired ? 0.9 : 0.4}
        />
      ))}

      {/* Center node */}
      <circle
        cx={center}
        cy={center}
        r={4 + (breathing ? Math.sin(pulsePhase) * 1 : 0)}
        fill={color}
        opacity={0.6}
      />
    </svg>
  );
}

export default function ChainsPage() {
  const { tr, language } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<ChainCategory | null>(null);
  const [hoveredChain, setHoveredChain] = useState<string | null>(null);
  const [pulsePhase, setPulsePhase] = useState(0);
  const [isReady, setIsReady] = useState(false);

  // Breathing animation
  useEffect(() => {
    const interval = setInterval(() => {
      setPulsePhase(p => (p + 0.02) % (Math.PI * 2));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Wake animation
  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const filteredChains = signalChains.filter(
    chain => !activeCategory || chain.category === activeCategory
  );

  const categories: ChainCategory[] = ['recording', 'mixing', 'mastering', 'monitoring'];
  const categoryLabels: Record<ChainCategory, { fr: string; en: string }> = {
    recording: { fr: 'Enregistrement', en: 'Recording' },
    mixing: { fr: 'Mixage', en: 'Mixing' },
    mastering: { fr: 'Mastering', en: 'Mastering' },
    monitoring: { fr: 'Écoute', en: 'Monitoring' },
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[var(--background)] overflow-hidden">
      {/* Header - centered, minimal */}
      <div
        className={`pt-20 text-center transition-all duration-700 ${
          isReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <span className="text-[9px] font-medium tracking-[0.3em] uppercase opacity-30">
          {language === 'fr' ? 'Motifs Rituels' : 'Ritual Patterns'}
        </span>
      </div>

      {/* Category filter - orbital */}
      <div
        className={`flex justify-center gap-8 mt-12 transition-all duration-700 delay-100 ${
          isReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <button
          onClick={() => setActiveCategory(null)}
          className={`text-[10px] tracking-[0.2em] uppercase transition-opacity ${
            activeCategory === null ? 'opacity-100' : 'opacity-30 hover:opacity-60'
          }`}
        >
          {language === 'fr' ? 'Tous' : 'All'}
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
            className="flex items-center gap-2 group"
          >
            <div
              className="w-2 h-2 rounded-full transition-transform group-hover:scale-125"
              style={{
                backgroundColor: CATEGORY_COLORS[cat],
                opacity: activeCategory === cat ? 1 : 0.4,
              }}
            />
            <span
              className={`text-[10px] tracking-[0.15em] uppercase transition-opacity ${
                activeCategory === cat ? 'opacity-100' : 'opacity-40 group-hover:opacity-70'
              }`}
            >
              {language === 'fr' ? categoryLabels[cat].fr : categoryLabels[cat].en}
            </span>
          </button>
        ))}
      </div>

      {/* Patterns grid - orbital arrangement */}
      <div
        className={`mt-16 px-8 pb-20 transition-all duration-700 delay-200 ${
          isReady ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {filteredChains.map((chain, idx) => {
              const isHovered = hoveredChain === chain.id;
              const color = CATEGORY_COLORS[chain.category];

              return (
                <Link
                  key={chain.id}
                  href={`/patchbay?chain=${chain.id}`}
                  className="group relative flex flex-col items-center"
                  style={{
                    animationDelay: `${idx * 50}ms`,
                  }}
                  onMouseEnter={() => setHoveredChain(chain.id)}
                  onMouseLeave={() => setHoveredChain(null)}
                >
                  {/* Pattern signature */}
                  <div
                    className={`transition-all duration-500 ${
                      isHovered ? 'scale-110' : 'scale-100'
                    }`}
                  >
                    <PatternSignature
                      chain={chain}
                      size={140}
                      breathing={isHovered}
                      pulsePhase={pulsePhase}
                    />
                  </div>

                  {/* Pattern name */}
                  <div className="mt-4 text-center">
                    <h3
                      className={`text-[11px] font-medium tracking-[0.1em] uppercase transition-all duration-300 ${
                        isHovered ? 'opacity-100' : 'opacity-50'
                      }`}
                      style={{ color: isHovered ? color : 'inherit' }}
                    >
                      {tr(chain.name)}
                    </h3>

                    {/* Step count - subtle */}
                    <div className="mt-1 opacity-0 group-hover:opacity-40 transition-opacity text-[9px] tracking-[0.15em] uppercase">
                      {chain.steps.length} {language === 'fr' ? 'étapes' : 'steps'}
                    </div>
                  </div>

                  {/* Hover glow */}
                  <div
                    className={`absolute inset-0 rounded-full transition-opacity duration-500 pointer-events-none ${
                      isHovered ? 'opacity-100' : 'opacity-0'
                    }`}
                    style={{
                      background: `radial-gradient(circle at center, ${color}10 0%, transparent 70%)`,
                    }}
                  />
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Empty state */}
      {filteredChains.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64">
          <div className="w-12 h-12 border border-[var(--border)] rounded-full flex items-center justify-center mb-4">
            <div className="w-2 h-2 bg-[var(--foreground)] opacity-20" />
          </div>
          <p className="text-[10px] tracking-[0.2em] uppercase opacity-30">
            {language === 'fr' ? 'Aucun motif' : 'No patterns'}
          </p>
        </div>
      )}

      {/* Pattern count */}
      <div className="fixed bottom-8 right-8 text-right">
        <span className="text-[9px] tracking-[0.15em] uppercase opacity-20">
          {language === 'fr' ? 'Motifs' : 'Patterns'}
        </span>
        <div className="font-mono text-lg opacity-40">{filteredChains.length}</div>
      </div>

      {/* Link to guide */}
      <Link
        href="/guide"
        className="fixed bottom-8 left-8 text-[9px] tracking-[0.15em] uppercase opacity-20 hover:opacity-40 transition-opacity"
      >
        {language === 'fr' ? 'Créer un motif' : 'Create pattern'}
      </Link>
    </div>
  );
}
