'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/components/LanguageProvider';

// Session preset definitions
const SESSION_PRESETS = {
  ambient_night: {
    id: 'ambient_night',
    name: { fr: 'Nuit Ambiante', en: 'Ambient Night' },
    duration: 8,
    bpm: 68,
    key: 'C',
    scale: 'major',
    color: '#7C5CFF',
    energy: [0.2, 0.4, 0.3, 0.5, 0.1],
    synths: ['prophet-5', 'juno-106', 'nord-lead-a1'],
    roles: ['pad', 'pad', 'texture'],
    tags: ['ambient', 'brian_eno', 'floating'],
  },
  jazz_exploration: {
    id: 'jazz_exploration',
    name: { fr: 'Exploration Jazz', en: 'Jazz Exploration' },
    duration: 6,
    bpm: 92,
    key: 'Db',
    scale: 'dorian',
    color: '#3b82f6',
    energy: [0.5, 0.7, 0.4, 0.8, 0.3],
    synths: ['prophet-5', 'minimoog-model-d', 'nord-lead-a1', 'juno-106'],
    roles: ['pad', 'bass', 'melody', 'pad'],
    tags: ['jazz', 'bill_evans', 'modal'],
  },
  hip_hop_textures: {
    id: 'hip_hop_textures',
    name: { fr: 'Textures Hip-Hop', en: 'Hip-Hop Textures' },
    duration: 4,
    bpm: 85,
    key: 'F',
    scale: 'natural_minor',
    color: '#f97316',
    energy: [0.6, 0.8, 0.5],
    synths: ['juno-106', 'minimoog-model-d', 'nord-lead-a1', 'korg-polysix'],
    roles: ['pad', 'bass', 'melody', 'arp'],
    tags: ['lo-fi', 'neo_soul', 'dilla'],
  },
  full_analog_drone: {
    id: 'full_analog_drone',
    name: { fr: 'Drone Analogique', en: 'Analog Drone' },
    duration: 10,
    bpm: 0,
    key: 'A',
    scale: 'pentatonic_minor',
    color: '#22c55e',
    energy: [0.1, 0.4, 0.1],
    synths: ['minimoog-model-d', 'prophet-5', 'korg-polysix'],
    roles: ['drone', 'pad', 'texture'],
    tags: ['drone', 'ambient', 'minimalist'],
  },
} as const;

type PresetId = keyof typeof SESSION_PRESETS;
type GenerativeState = 'void' | 'select' | 'configure' | 'running';

// Synth info for the field
const SYNTHS = {
  'minimoog-model-d': { name: 'Minimoog', color: '#ef4444', voices: 1, type: 'mono' },
  'korg-polysix': { name: 'Polysix', color: '#22c55e', voices: 6, type: 'poly' },
  'prophet-5': { name: 'Prophet-5', color: '#7C5CFF', voices: 5, type: 'poly' },
  'juno-106': { name: 'Juno-106', color: '#3b82f6', voices: 6, type: 'poly' },
  'nord-lead-a1': { name: 'Nord A1', color: '#f97316', voices: 26, type: 'va' },
} as const;

type SynthId = keyof typeof SYNTHS;

// Role colors
const ROLE_COLORS: Record<string, string> = {
  pad: '#7C5CFF',
  bass: '#ef4444',
  melody: '#3b82f6',
  arp: '#22c55e',
  texture: '#f97316',
  drone: '#06b6d4',
};

export default function GenerativePage() {
  const { language } = useLanguage();
  const [state, setState] = useState<GenerativeState>('void');
  const [selectedPreset, setSelectedPreset] = useState<PresetId | null>(null);
  const [hoveredPreset, setHoveredPreset] = useState<PresetId | null>(null);
  const [pulsePhase, setPulsePhase] = useState(0);
  const [energyCurve, setEnergyCurve] = useState<number[]>([0.2, 0.5, 0.8, 0.5, 0.2]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [runTime, setRunTime] = useState(0);

  const curveRef = useRef<SVGSVGElement>(null);

  // Breathing animation
  useEffect(() => {
    const interval = setInterval(() => {
      setPulsePhase(p => (p + 0.015) % (Math.PI * 2));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Wake from void
  useEffect(() => {
    const timer = setTimeout(() => setState('select'), 600);
    return () => clearTimeout(timer);
  }, []);

  // Running timer
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setRunTime(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  // Handle preset selection
  const selectPreset = (id: PresetId) => {
    setSelectedPreset(id);
    setEnergyCurve(SESSION_PRESETS[id].energy.slice());
    setState('configure');
  };

  // Handle energy curve drag
  const handleCurveDrag = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (dragIndex === null || !curveRef.current) return;
    const rect = curveRef.current.getBoundingClientRect();
    const y = 1 - Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    setEnergyCurve(prev => {
      const next = [...prev];
      next[dragIndex] = y;
      return next;
    });
  }, [dragIndex]);

  // Start session
  const startSession = () => {
    setIsRunning(true);
    setRunTime(0);
    setState('running');
  };

  // Stop session
  const stopSession = () => {
    setIsRunning(false);
    setState('configure');
  };

  // Format time
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const preset = selectedPreset ? SESSION_PRESETS[selectedPreset] : null;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[var(--background)] overflow-hidden relative">
      {/* Void overlay */}
      <div
        className={`absolute inset-0 bg-[var(--background)] transition-opacity duration-1000 pointer-events-none z-50 ${
          state === 'void' ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Header */}
      <div
        className={`absolute top-20 left-1/2 -translate-x-1/2 text-center z-20 transition-all duration-700 ${
          state === 'void' ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
        }`}
      >
        <span className="text-[9px] font-medium tracking-[0.3em] uppercase opacity-30">
          {language === 'fr' ? 'Moteur Génératif' : 'Generative Engine'}
        </span>
        {preset && state !== 'select' && (
          <div className="mt-2">
            <span
              className="text-[11px] font-medium tracking-[0.15em] uppercase"
              style={{ color: preset.color }}
            >
              {language === 'fr' ? preset.name.fr : preset.name.en}
            </span>
          </div>
        )}
      </div>

      {/* Session Presets - Orbital Selection */}
      {state === 'select' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-[600px] h-[600px]">
            {/* Central node */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <div
                className="w-6 h-6 bg-[var(--accent)] rounded-full"
                style={{
                  transform: `scale(${1 + Math.sin(pulsePhase) * 0.1})`,
                  opacity: 0.6,
                }}
              />
            </div>

            {/* Orbital ring */}
            <div className="absolute inset-0">
              <svg width="600" height="600" viewBox="0 0 600 600">
                <circle
                  cx={300}
                  cy={300}
                  r={200}
                  fill="none"
                  stroke="var(--foreground)"
                  strokeWidth={1}
                  opacity={0.08}
                />
              </svg>
            </div>

            {/* Preset nodes */}
            {Object.entries(SESSION_PRESETS).map(([id, p], i) => {
              const angle = (i / Object.keys(SESSION_PRESETS).length) * Math.PI * 2 - Math.PI / 2;
              const radius = 200;
              const x = 300 + Math.cos(angle) * radius;
              const y = 300 + Math.sin(angle) * radius;
              const isHovered = hoveredPreset === id;
              const breathOffset = Math.sin(pulsePhase + i) * 3;

              return (
                <button
                  key={id}
                  className="absolute flex flex-col items-center group"
                  style={{
                    left: x,
                    top: y + breathOffset,
                    transform: 'translate(-50%, -50%)',
                  }}
                  onClick={() => selectPreset(id as PresetId)}
                  onMouseEnter={() => setHoveredPreset(id as PresetId)}
                  onMouseLeave={() => setHoveredPreset(null)}
                >
                  {/* Preset signature - energy curve as radial */}
                  <svg
                    width={isHovered ? 100 : 80}
                    height={isHovered ? 100 : 80}
                    viewBox="0 0 100 100"
                    className="transition-all duration-300"
                  >
                    {/* Outer ring */}
                    <circle
                      cx={50}
                      cy={50}
                      r={40}
                      fill="none"
                      stroke={p.color}
                      strokeWidth={1}
                      opacity={isHovered ? 0.4 : 0.2}
                    />
                    {/* Energy signature */}
                    {p.energy.map((e, ei) => {
                      const a = (ei / p.energy.length) * Math.PI * 2 - Math.PI / 2;
                      const r = 15 + e * 25;
                      const px = 50 + Math.cos(a) * r;
                      const py = 50 + Math.sin(a) * r;
                      return (
                        <circle
                          key={ei}
                          cx={px}
                          cy={py}
                          r={3}
                          fill={p.color}
                          opacity={isHovered ? 0.9 : 0.5}
                        />
                      );
                    })}
                    {/* Center */}
                    <circle
                      cx={50}
                      cy={50}
                      r={isHovered ? 6 : 4}
                      fill={p.color}
                      opacity={isHovered ? 0.8 : 0.4}
                    />
                  </svg>
                  {/* Label */}
                  <span
                    className={`mt-2 text-[10px] tracking-[0.1em] uppercase transition-opacity ${
                      isHovered ? 'opacity-100' : 'opacity-40'
                    }`}
                    style={{ color: isHovered ? p.color : 'inherit' }}
                  >
                    {language === 'fr' ? p.name.fr : p.name.en}
                  </span>
                  {/* Duration */}
                  <span className="text-[9px] opacity-20 mt-0.5">{p.duration}h</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Configuration State */}
      {state === 'configure' && preset && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex gap-16">
            {/* Energy Curve Editor */}
            <div className="flex flex-col items-center">
              <span className="text-[9px] tracking-[0.2em] uppercase opacity-30 mb-4">
                {language === 'fr' ? 'Courbe d\'Énergie' : 'Energy Curve'}
              </span>
              <svg
                ref={curveRef}
                width={300}
                height={200}
                viewBox="0 0 300 200"
                className="cursor-crosshair"
                onMouseMove={handleCurveDrag}
                onMouseUp={() => setDragIndex(null)}
                onMouseLeave={() => setDragIndex(null)}
              >
                {/* Grid */}
                {[0, 0.25, 0.5, 0.75, 1].map(v => (
                  <line
                    key={v}
                    x1={0}
                    y1={200 - v * 200}
                    x2={300}
                    y2={200 - v * 200}
                    stroke="var(--foreground)"
                    strokeWidth={0.5}
                    opacity={0.1}
                  />
                ))}
                {/* Curve path */}
                <path
                  d={`M ${energyCurve.map((e, i) =>
                    `${(i / (energyCurve.length - 1)) * 300} ${200 - e * 200}`
                  ).join(' L ')}`}
                  fill="none"
                  stroke={preset.color}
                  strokeWidth={2}
                  opacity={0.6}
                />
                {/* Curve fill */}
                <path
                  d={`M 0 200 L ${energyCurve.map((e, i) =>
                    `${(i / (energyCurve.length - 1)) * 300} ${200 - e * 200}`
                  ).join(' L ')} L 300 200 Z`}
                  fill={preset.color}
                  opacity={0.1}
                />
                {/* Drag points */}
                {energyCurve.map((e, i) => (
                  <circle
                    key={i}
                    cx={(i / (energyCurve.length - 1)) * 300}
                    cy={200 - e * 200}
                    r={dragIndex === i ? 10 : 6}
                    fill={preset.color}
                    opacity={dragIndex === i ? 1 : 0.8}
                    className="cursor-grab active:cursor-grabbing"
                    onMouseDown={() => setDragIndex(i)}
                  />
                ))}
              </svg>
              <div className="flex justify-between w-full mt-2 text-[9px] opacity-20">
                <span>0h</span>
                <span>{preset.duration}h</span>
              </div>
            </div>

            {/* Synth Field */}
            <div className="flex flex-col items-center">
              <span className="text-[9px] tracking-[0.2em] uppercase opacity-30 mb-4">
                {language === 'fr' ? 'Synthétiseurs' : 'Synthesizers'}
              </span>
              <div className="relative w-[250px] h-[250px]">
                {/* Center node */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{
                      backgroundColor: preset.color,
                      transform: `scale(${1 + Math.sin(pulsePhase) * 0.2})`,
                      opacity: 0.5,
                    }}
                  />
                </div>
                {/* Role rings */}
                <svg width={250} height={250} viewBox="0 0 250 250" className="absolute inset-0">
                  {[60, 90, 120].map((r, i) => (
                    <circle
                      key={i}
                      cx={125}
                      cy={125}
                      r={r}
                      fill="none"
                      stroke="var(--foreground)"
                      strokeWidth={0.5}
                      opacity={0.08}
                    />
                  ))}
                </svg>
                {/* Synth nodes */}
                {preset.synths.map((synthId, i) => {
                  const synth = SYNTHS[synthId as SynthId];
                  const role = preset.roles[i];
                  const angle = (i / preset.synths.length) * Math.PI * 2 - Math.PI / 2;
                  const radius = 70 + i * 15;
                  const x = 125 + Math.cos(angle) * radius;
                  const y = 125 + Math.sin(angle) * radius;
                  const breathOffset = Math.sin(pulsePhase + i * 0.5) * 2;

                  return (
                    <div
                      key={synthId}
                      className="absolute flex flex-col items-center"
                      style={{
                        left: x,
                        top: y + breathOffset,
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      {/* Connection to center */}
                      <svg
                        className="absolute"
                        style={{
                          left: '50%',
                          top: '50%',
                          width: radius,
                          height: 2,
                          transform: `rotate(${(angle * 180) / Math.PI}deg)`,
                          transformOrigin: '0 50%',
                        }}
                      >
                        <line
                          x1={0}
                          y1={1}
                          x2={radius - 15}
                          y2={1}
                          stroke={ROLE_COLORS[role] || synth.color}
                          strokeWidth={1}
                          opacity={0.3}
                        />
                      </svg>
                      {/* Synth node */}
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center border-2"
                        style={{
                          borderColor: synth.color,
                          backgroundColor: `${synth.color}20`,
                        }}
                      >
                        <span className="text-[8px] font-mono" style={{ color: synth.color }}>
                          {synth.voices}
                        </span>
                      </div>
                      <span className="text-[8px] tracking-wide opacity-50 mt-1">
                        {synth.name}
                      </span>
                      <span
                        className="text-[7px] uppercase tracking-wider"
                        style={{ color: ROLE_COLORS[role] }}
                      >
                        {role}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Session Info */}
            <div className="flex flex-col items-center justify-center gap-6">
              <div className="text-center">
                <span className="text-[9px] tracking-[0.2em] uppercase opacity-30 block mb-1">BPM</span>
                <span className="font-mono text-2xl opacity-60">{preset.bpm || '—'}</span>
              </div>
              <div className="text-center">
                <span className="text-[9px] tracking-[0.2em] uppercase opacity-30 block mb-1">
                  {language === 'fr' ? 'Tonalité' : 'Key'}
                </span>
                <span className="font-mono text-lg opacity-60">{preset.key} {preset.scale}</span>
              </div>
              <div className="text-center">
                <span className="text-[9px] tracking-[0.2em] uppercase opacity-30 block mb-1">
                  {language === 'fr' ? 'Durée' : 'Duration'}
                </span>
                <span className="font-mono text-lg opacity-60">{preset.duration}h</span>
              </div>
              {/* Start button */}
              <button
                onClick={startSession}
                className="mt-4 w-16 h-16 rounded-full flex items-center justify-center transition-all hover:scale-110"
                style={{
                  backgroundColor: `${preset.color}20`,
                  border: `2px solid ${preset.color}`,
                }}
              >
                <svg width={24} height={24} viewBox="0 0 24 24" fill={preset.color}>
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Running State */}
      {state === 'running' && preset && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center">
            {/* Timer */}
            <div
              className="font-mono text-6xl mb-8"
              style={{ color: preset.color, opacity: 0.8 }}
            >
              {formatTime(runTime)}
            </div>

            {/* Progress ring */}
            <div className="relative w-[300px] h-[300px]">
              <svg width={300} height={300} viewBox="0 0 300 300">
                {/* Background ring */}
                <circle
                  cx={150}
                  cy={150}
                  r={140}
                  fill="none"
                  stroke="var(--foreground)"
                  strokeWidth={2}
                  opacity={0.1}
                />
                {/* Progress arc */}
                <circle
                  cx={150}
                  cy={150}
                  r={140}
                  fill="none"
                  stroke={preset.color}
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeDasharray={`${(runTime / (preset.duration * 3600)) * 879.6} 879.6`}
                  transform="rotate(-90 150 150)"
                  opacity={0.6}
                />
                {/* Energy indicator */}
                {(() => {
                  const progress = runTime / (preset.duration * 3600);
                  const energyIndex = Math.floor(progress * (energyCurve.length - 1));
                  const energy = energyCurve[Math.min(energyIndex, energyCurve.length - 1)];
                  const pulseSize = 20 + energy * 30;
                  return (
                    <circle
                      cx={150}
                      cy={150}
                      r={pulseSize + Math.sin(pulsePhase * 2) * 5}
                      fill={preset.color}
                      opacity={0.3 + energy * 0.3}
                    />
                  );
                })()}
              </svg>

              {/* Active synths */}
              {preset.synths.map((synthId, i) => {
                const synth = SYNTHS[synthId as SynthId];
                const angle = (i / preset.synths.length) * Math.PI * 2 - Math.PI / 2;
                const radius = 100;
                const x = 150 + Math.cos(angle) * radius;
                const y = 150 + Math.sin(angle) * radius;
                const isActive = Math.random() > 0.3; // Simulated activity

                return (
                  <div
                    key={synthId}
                    className="absolute"
                    style={{
                      left: x,
                      top: y,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    <div
                      className="w-4 h-4 rounded-full transition-all"
                      style={{
                        backgroundColor: synth.color,
                        opacity: isActive ? 0.9 : 0.3,
                        transform: `scale(${isActive ? 1 + Math.sin(pulsePhase * 3 + i) * 0.3 : 1})`,
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Stop button */}
            <button
              onClick={stopSession}
              className="mt-8 w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-110"
              style={{
                backgroundColor: '#ef444420',
                border: '2px solid #ef4444',
              }}
            >
              <div className="w-4 h-4 bg-[#ef4444]" />
            </button>
          </div>
        </div>
      )}

      {/* Back to presets */}
      {state !== 'select' && state !== 'void' && (
        <button
          onClick={() => {
            if (isRunning) stopSession();
            setState('select');
            setSelectedPreset(null);
          }}
          className="absolute top-20 left-8 text-[9px] tracking-[0.2em] uppercase opacity-30 hover:opacity-60 transition-opacity z-20"
        >
          {language === 'fr' ? 'Retour' : 'Back'}
        </button>
      )}

      {/* Link to patchbay */}
      <Link
        href="/patchbay"
        className="absolute bottom-8 left-8 text-[9px] tracking-[0.15em] uppercase opacity-20 hover:opacity-40 transition-opacity"
      >
        {language === 'fr' ? 'Voir le champ' : 'View field'}
      </Link>

      {/* Status */}
      <div className="absolute bottom-8 right-8 text-right">
        <span className="text-[9px] tracking-[0.15em] uppercase opacity-20">
          {language === 'fr' ? 'État' : 'Status'}
        </span>
        <div className="font-mono text-sm opacity-40">
          {state === 'running' ? (language === 'fr' ? 'Actif' : 'Active') : (language === 'fr' ? 'Veille' : 'Idle')}
        </div>
      </div>
    </div>
  );
}
