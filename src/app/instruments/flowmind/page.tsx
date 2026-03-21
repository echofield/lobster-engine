'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

// ============ TYPES ============

type Style = 'ambient' | 'techno' | 'broken' | 'cinematic' | 'minimal' | 'chaos';
type Mood = 'dark' | 'light' | 'tense' | 'euphoric' | 'neutral';

interface ModeState {
  style: Style;
  mood: Mood;
  energy: number;      // 0-1
  complexity: number;  // 0-1
}

interface TransformState {
  chaos: number;       // 0-1: randomness injection
  warp: number;        // 0-1: time stretching
  crush: number;       // 0-1: bit crush / distortion
  morph: number;       // 0-1: harmonic morphing
}

interface OutputState {
  intensity: number;   // 0-1: overall power
  width: number;       // 0-1: stereo spread
  direction: number;   // -1 to 1: backward to forward
  focus: number;       // 0-1: narrow to wide
}

interface ListeningState {
  rhythm: number;      // detected rhythm density
  harmony: number;     // detected harmonic content
  density: number;     // overall audio density
  variation: number;   // how much change is happening
}

// ============ COMPONENT ============

export default function FlowMindPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  // Core states
  const [mode, setMode] = useState<ModeState>({
    style: 'ambient',
    mood: 'neutral',
    energy: 0.5,
    complexity: 0.4,
  });

  const [transform, setTransform] = useState<TransformState>({
    chaos: 0,
    warp: 0,
    crush: 0,
    morph: 0,
  });

  const [output, setOutput] = useState<OutputState>({
    intensity: 0.6,
    width: 0.5,
    direction: 0,
    focus: 0.5,
  });

  const [listening, setListening] = useState<ListeningState>({
    rhythm: 0,
    harmony: 0,
    density: 0,
    variation: 0,
  });

  // UI state
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [pulsePhase, setPulsePhase] = useState(0);

  const accentColor = '#7C5CFF';
  const chaosColor = '#ff3366';
  const outputColor = '#00ffaa';

  // Simulate listening data (in real implementation, this would analyze audio)
  useEffect(() => {
    const interval = setInterval(() => {
      setListening(prev => ({
        rhythm: Math.min(1, Math.max(0, prev.rhythm + (Math.random() - 0.5) * 0.1)),
        harmony: Math.min(1, Math.max(0, prev.harmony + (Math.random() - 0.5) * 0.05)),
        density: mode.energy * 0.5 + transform.chaos * 0.3 + Math.random() * 0.2,
        variation: transform.chaos * 0.5 + Math.random() * 0.3,
      }));
      setPulsePhase(p => (p + 0.05) % (Math.PI * 2));
    }, 100);
    return () => clearInterval(interval);
  }, [mode.energy, transform.chaos]);

  // ============ CANVAS VISUALIZATION ============

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;

      // Clear
      ctx.fillStyle = '#050508';
      ctx.fillRect(0, 0, width, height);

      // Connection lines between modules
      ctx.strokeStyle = `rgba(124, 92, 255, ${0.1 + listening.density * 0.2})`;
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 10]);

      // Mode Oracle to Center
      ctx.beginPath();
      ctx.moveTo(width * 0.2, height * 0.5);
      ctx.lineTo(width * 0.5, height * 0.5);
      ctx.stroke();

      // Center to Transform
      ctx.beginPath();
      ctx.moveTo(width * 0.5, height * 0.35);
      ctx.lineTo(width * 0.5, height * 0.15);
      ctx.stroke();

      // Center to Output
      ctx.beginPath();
      ctx.moveTo(width * 0.6, height * 0.55);
      ctx.lineTo(width * 0.8, height * 0.65);
      ctx.stroke();

      ctx.setLineDash([]);

      // Draw energy flow particles
      const numParticles = Math.floor(listening.density * 20);
      for (let i = 0; i < numParticles; i++) {
        const t = (time * 0.02 + i * 0.1) % 1;
        const x = width * 0.2 + t * width * 0.3;
        const y = height * 0.5 + Math.sin(t * Math.PI * 4 + i) * 20;
        const alpha = Math.sin(t * Math.PI) * listening.density;

        ctx.beginPath();
        ctx.fillStyle = `rgba(124, 92, 255, ${alpha})`;
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Transform zone particles (chaos)
      if (transform.chaos > 0.1) {
        for (let i = 0; i < transform.chaos * 15; i++) {
          const x = width * 0.35 + Math.random() * width * 0.3;
          const y = height * 0.05 + Math.random() * height * 0.2;
          ctx.beginPath();
          ctx.fillStyle = `rgba(255, 51, 102, ${transform.chaos * 0.5})`;
          ctx.arc(x, y, 1 + Math.random() * 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      time++;
      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(animationRef.current);
  }, [listening, transform.chaos]);

  // ============ STYLE PRESETS ============

  const STYLES: { value: Style; label: string; color: string }[] = [
    { value: 'ambient', label: 'AMB', color: '#4488ff' },
    { value: 'techno', label: 'TCH', color: '#ff4444' },
    { value: 'broken', label: 'BRK', color: '#ff8800' },
    { value: 'cinematic', label: 'CIN', color: '#aa44ff' },
    { value: 'minimal', label: 'MIN', color: '#888888' },
    { value: 'chaos', label: 'CHS', color: '#ff0066' },
  ];

  const MOODS: { value: Mood; label: string }[] = [
    { value: 'dark', label: 'DARK' },
    { value: 'light', label: 'LIGHT' },
    { value: 'tense', label: 'TENSE' },
    { value: 'euphoric', label: 'EUPHORIC' },
    { value: 'neutral', label: 'NEUTRAL' },
  ];

  // ============ RENDER ============

  return (
    <div className="h-screen w-full bg-[#050508] text-white relative overflow-hidden">
      {/* Background Canvas */}
      <canvas
        ref={canvasRef}
        width={1200}
        height={800}
        className="absolute inset-0 w-full h-full"
      />

      {/* Header */}
      <div className="absolute top-6 left-8 z-20">
        <a href="/" className="text-xs uppercase tracking-widest text-white/40 hover:text-white/80">
          ← Exit
        </a>
        <h1 className="text-2xl font-light mt-2 tracking-[0.2em]">FLOW.MIND</h1>
        <p className="text-[10px] text-white/30 uppercase tracking-[0.2em]">Meta Control Layer</p>
      </div>

      {/* System Status */}
      <div className="absolute top-6 right-8 z-20 text-right">
        <div className="text-[10px] uppercase tracking-widest text-white/40">System Active</div>
        <div className="flex items-center gap-2 justify-end mt-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[9px] text-white/30">LISTENING</span>
        </div>
      </div>

      {/* ============ MODE ORACLE (Top-Left Capsule) ============ */}
      <div
        className="absolute left-12 top-1/2 -translate-y-1/2 w-64"
        onMouseEnter={() => setActiveModule('mode')}
        onMouseLeave={() => setActiveModule(null)}
      >
        <svg viewBox="0 0 200 180" className="w-full">
          {/* Capsule body */}
          <ellipse
            cx="100"
            cy="90"
            rx="90"
            ry="80"
            fill={activeModule === 'mode' ? 'rgba(124, 92, 255, 0.1)' : 'transparent'}
            stroke={accentColor}
            strokeWidth="2"
            opacity={0.6 + (activeModule === 'mode' ? 0.4 : 0)}
          />

          {/* Star */}
          <g transform="translate(40, 60)">
            <polygon
              points="0,-12 3,-4 12,-4 5,2 8,12 0,6 -8,12 -5,2 -12,-4 -3,-4"
              fill={mode.energy > 0.5 ? accentColor : 'none'}
              stroke={accentColor}
              strokeWidth="1"
            />
          </g>

          {/* Sliders representation */}
          <g transform="translate(80, 50)">
            {[0, 1, 2, 3].map((i) => (
              <rect
                key={i}
                x={i * 15}
                y={0}
                width="8"
                height={30 + mode.energy * 30 + i * 5}
                fill={accentColor}
                opacity={0.3 + i * 0.15}
                rx="2"
              />
            ))}
          </g>

          {/* Small circles */}
          <g transform="translate(50, 130)">
            {[0, 1, 2].map((i) => (
              <circle
                key={i}
                cx={i * 25}
                cy={0}
                r="6"
                fill={i === 0 ? accentColor : 'none'}
                stroke={accentColor}
                strokeWidth="1"
                opacity={0.5}
              />
            ))}
          </g>
        </svg>

        {/* Controls */}
        <div className="mt-4 space-y-4 px-4">
          <div className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Mode Oracle</div>

          {/* Style selector */}
          <div className="flex flex-wrap gap-1">
            {STYLES.map((s) => (
              <button
                key={s.value}
                onClick={() => setMode(m => ({ ...m, style: s.value }))}
                className="px-2 py-1 text-[9px] uppercase tracking-widest border transition-all"
                style={{
                  borderColor: mode.style === s.value ? s.color : '#333',
                  background: mode.style === s.value ? `${s.color}20` : 'transparent',
                  color: mode.style === s.value ? s.color : '#666',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Mood selector */}
          <div className="flex flex-wrap gap-1">
            {MOODS.map((m) => (
              <button
                key={m.value}
                onClick={() => setMode(md => ({ ...md, mood: m.value }))}
                className="px-2 py-1 text-[8px] uppercase tracking-widest border transition-all"
                style={{
                  borderColor: mode.mood === m.value ? accentColor : '#222',
                  color: mode.mood === m.value ? accentColor : '#444',
                }}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Energy & Complexity */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[8px] text-white/30 w-16 uppercase">Energy</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={mode.energy}
                onChange={(e) => setMode(m => ({ ...m, energy: Number(e.target.value) }))}
                className="flex-1"
                style={{ accentColor }}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[8px] text-white/30 w-16 uppercase">Complex</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={mode.complexity}
                onChange={(e) => setMode(m => ({ ...m, complexity: Number(e.target.value) }))}
                className="flex-1"
                style={{ accentColor }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ============ TRANSFORMATION ENGINE (Top - Jagged Shape) ============ */}
      <div
        className="absolute top-8 left-1/2 -translate-x-1/2"
        onMouseEnter={() => setActiveModule('transform')}
        onMouseLeave={() => setActiveModule(null)}
      >
        <svg viewBox="0 0 400 120" className="w-96">
          {/* Jagged W/M shape */}
          <path
            d="M 50 100
               L 100 20
               L 150 80
               L 200 30
               L 250 80
               L 300 20
               L 350 100"
            fill="none"
            stroke={chaosColor}
            strokeWidth={2 + transform.chaos * 3}
            opacity={0.4 + transform.chaos * 0.6}
            style={{
              filter: transform.chaos > 0.5 ? `drop-shadow(0 0 ${transform.chaos * 20}px ${chaosColor})` : 'none',
            }}
          />
        </svg>

        <div className="text-center mt-2">
          <div className="text-[10px] uppercase tracking-widest text-white/40 mb-3">Transformation</div>
          <div className="flex justify-center gap-4">
            {[
              { key: 'chaos', label: 'CHAOS', color: chaosColor },
              { key: 'warp', label: 'WARP', color: '#ff8800' },
              { key: 'crush', label: 'CRUSH', color: '#ff4444' },
              { key: 'morph', label: 'MORPH', color: '#aa44ff' },
            ].map((ctrl) => (
              <div key={ctrl.key} className="text-center">
                <div
                  className="w-12 h-12 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all hover:scale-110"
                  style={{
                    borderColor: ctrl.color,
                    background: `${ctrl.color}${Math.round(transform[ctrl.key as keyof TransformState] * 40).toString(16).padStart(2, '0')}`,
                  }}
                  onClick={() => setTransform(t => ({
                    ...t,
                    [ctrl.key]: t[ctrl.key as keyof TransformState] > 0.5 ? 0 : 0.8,
                  }))}
                >
                  <span className="text-[10px]">{Math.round(transform[ctrl.key as keyof TransformState] * 100)}</span>
                </div>
                <span className="text-[8px] text-white/30 mt-1 block">{ctrl.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ============ LISTENING CORE (Center Circle) ============ */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        onMouseEnter={() => setActiveModule('core')}
        onMouseLeave={() => setActiveModule(null)}
      >
        <div
          className="w-40 h-40 rounded-full border-2 flex items-center justify-center transition-all"
          style={{
            borderColor: accentColor,
            boxShadow: `0 0 ${20 + listening.density * 60}px rgba(124, 92, 255, ${0.2 + listening.density * 0.4})`,
            transform: `scale(${1 + Math.sin(pulsePhase) * 0.05 * listening.density})`,
          }}
        >
          <div
            className="w-32 h-32 rounded-full border flex items-center justify-center"
            style={{ borderColor: `${accentColor}40` }}
          >
            <div
              className="w-20 h-20 rounded-full"
              style={{
                background: `radial-gradient(circle, ${accentColor}30 0%, transparent 70%)`,
              }}
            />
          </div>
        </div>

        {/* Listening metrics */}
        <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex gap-6">
          {[
            { label: 'RHY', value: listening.rhythm },
            { label: 'HAR', value: listening.harmony },
            { label: 'DEN', value: listening.density },
            { label: 'VAR', value: listening.variation },
          ].map((m) => (
            <div key={m.label} className="text-center">
              <div className="text-[10px] font-mono" style={{ color: accentColor }}>
                {Math.round(m.value * 100)}
              </div>
              <div className="text-[8px] text-white/30">{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ============ OUTPUT VECTOR (Bottom-Right) ============ */}
      <div
        className="absolute right-16 bottom-32"
        onMouseEnter={() => setActiveModule('output')}
        onMouseLeave={() => setActiveModule(null)}
      >
        <svg viewBox="0 0 160 120" className="w-48">
          {/* Organic base with spike */}
          <ellipse
            cx="60"
            cy="70"
            rx="50"
            ry="40"
            fill={activeModule === 'output' ? `${outputColor}10` : 'transparent'}
            stroke={outputColor}
            strokeWidth="2"
            opacity="0.6"
          />
          <ellipse
            cx="45"
            cy="85"
            rx="30"
            ry="25"
            fill="none"
            stroke={outputColor}
            strokeWidth="1"
            opacity="0.4"
          />
          {/* Spike / direction */}
          <polygon
            points="110,70 150,60 150,80"
            fill={output.intensity > 0.5 ? outputColor : 'none'}
            stroke={outputColor}
            strokeWidth="2"
            opacity={0.4 + output.intensity * 0.6}
            style={{
              transform: `translateX(${output.direction * 10}px)`,
            }}
          />
        </svg>

        <div className="mt-4 space-y-2">
          <div className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Output Vector</div>
          {[
            { key: 'intensity', label: 'INTENSITY' },
            { key: 'width', label: 'WIDTH' },
            { key: 'focus', label: 'FOCUS' },
          ].map((ctrl) => (
            <div key={ctrl.key} className="flex items-center gap-2">
              <span className="text-[8px] text-white/30 w-16 uppercase">{ctrl.label}</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={output[ctrl.key as keyof OutputState]}
                onChange={(e) => setOutput(o => ({ ...o, [ctrl.key]: Number(e.target.value) }))}
                className="w-20"
                style={{ accentColor: outputColor }}
              />
            </div>
          ))}
          <div className="flex items-center gap-2">
            <span className="text-[8px] text-white/30 w-16 uppercase">DIRECTION</span>
            <input
              type="range"
              min={-1}
              max={1}
              step={0.01}
              value={output.direction}
              onChange={(e) => setOutput(o => ({ ...o, direction: Number(e.target.value) }))}
              className="w-20"
              style={{ accentColor: outputColor }}
            />
          </div>
        </div>
      </div>

      {/* ============ CONNECTED INSTRUMENTS STATUS ============ */}
      <div className="absolute bottom-8 left-8 z-20">
        <div className="text-[10px] uppercase tracking-widest text-white/40 mb-3">Connected Engines</div>
        <div className="flex gap-4">
          {[
            { name: 'FLOW.KIT', color: '#ff6b6b', active: true },
            { name: 'SYNTHI', color: '#4ecdc4', active: true },
            { name: 'ÆTHER.KEY', color: '#ffe66d', active: true },
          ].map((engine) => (
            <div
              key={engine.name}
              className="px-3 py-2 border text-[9px] uppercase tracking-widest"
              style={{
                borderColor: engine.active ? engine.color : '#333',
                color: engine.active ? engine.color : '#666',
                background: engine.active ? `${engine.color}10` : 'transparent',
              }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: engine.active ? engine.color : '#666' }}
                />
                {engine.name}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 right-8 text-[9px] uppercase tracking-widest text-white/15">
        FLOW.MIND-0321
      </div>
    </div>
  );
}
