'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface AccessResponse {
  success: boolean;
  type?: 'password' | 'token';
  label?: string;
  expiresAt?: string;
  error?: string;
  proof?: {
    tokenId: string;
    usedAt: string;
    usedFrom: {
      ip: string | null;
      country: string | null;
      city: string | null;
    };
  };
}

// Instrument definitions
const INSTRUMENTS = [
  { id: 'sub', name: 'SUB', freq: 35, type: 'sine' as OscillatorType, color: '#7C5CFF' },
  { id: 'pad', name: 'PAD', freq: 110, type: 'sine' as OscillatorType, color: '#3b82f6' },
  { id: 'air', name: 'AIR', freq: 220, type: 'triangle' as OscillatorType, color: '#22c55e' },
  { id: 'hum', name: 'HUM', freq: 82, type: 'sawtooth' as OscillatorType, color: '#eab308' },
  { id: 'dust', name: 'DUST', freq: 0, type: 'sine' as OscillatorType, color: '#f97316' }, // noise
  { id: 'bell', name: 'BELL', freq: 440, type: 'sine' as OscillatorType, color: '#ef4444' },
];

// Constellation nodes - patchbay inspired
const CONSTELLATION_NODES = [
  { x: 15, y: 20, size: 3, type: 'jack' },
  { x: 25, y: 35, size: 2, type: 'pad' },
  { x: 35, y: 15, size: 4, type: 'jack' },
  { x: 45, y: 45, size: 3, type: 'pad' },
  { x: 55, y: 25, size: 2, type: 'jack' },
  { x: 65, y: 40, size: 3, type: 'pad' },
  { x: 75, y: 18, size: 4, type: 'jack' },
  { x: 85, y: 55, size: 2, type: 'pad' },
  { x: 20, y: 60, size: 3, type: 'jack' },
  { x: 40, y: 70, size: 2, type: 'pad' },
  { x: 60, y: 65, size: 3, type: 'jack' },
  { x: 80, y: 75, size: 4, type: 'pad' },
  { x: 30, y: 85, size: 2, type: 'jack' },
  { x: 50, y: 80, size: 3, type: 'pad' },
  { x: 70, y: 88, size: 2, type: 'jack' },
];

// Connections between nodes
const CONNECTIONS = [
  [0, 1], [1, 2], [2, 4], [3, 5], [4, 6], [5, 7],
  [8, 9], [9, 10], [10, 11], [12, 13], [13, 14],
  [1, 8], [3, 9], [5, 10], [6, 11], [2, 3], [4, 5],
];

// Audio engine hook for multiple instruments
function useAmbientSynth() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const instrumentsRef = useRef<Map<string, {
    osc: OscillatorNode | GainNode;
    gain: GainNode;
    filter: BiquadFilterNode;
  }>>(new Map());
  const masterGainRef = useRef<GainNode | null>(null);
  const isInitializedRef = useRef(false);

  const init = useCallback(() => {
    if (isInitializedRef.current) return;

    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      audioCtxRef.current = ctx;

      // Master gain
      const masterGain = ctx.createGain();
      masterGain.gain.value = 0.7;
      masterGain.connect(ctx.destination);
      masterGainRef.current = masterGain;

      // Create each instrument
      INSTRUMENTS.forEach(inst => {
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        filter.Q.value = 1;

        const gain = ctx.createGain();
        gain.gain.value = 0;

        if (inst.id === 'dust') {
          // Noise generator for dust/texture
          const bufferSize = 2 * ctx.sampleRate;
          const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const output = noiseBuffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
          }
          const noise = ctx.createBufferSource();
          noise.buffer = noiseBuffer;
          noise.loop = true;

          // Extra filter for noise
          const noiseFilter = ctx.createBiquadFilter();
          noiseFilter.type = 'bandpass';
          noiseFilter.frequency.value = 1000;
          noiseFilter.Q.value = 0.5;

          noise.connect(noiseFilter);
          noiseFilter.connect(filter);
          filter.connect(gain);
          gain.connect(masterGain);
          noise.start();

          instrumentsRef.current.set(inst.id, { osc: gain, gain, filter });
        } else {
          const osc = ctx.createOscillator();
          osc.type = inst.type;
          osc.frequency.value = inst.freq;

          // Add slight detune for richness
          if (inst.id === 'pad') {
            const osc2 = ctx.createOscillator();
            osc2.type = 'sine';
            osc2.frequency.value = inst.freq * 1.5; // Fifth
            osc2.detune.value = 5;
            osc2.connect(filter);
            osc2.start();

            const osc3 = ctx.createOscillator();
            osc3.type = 'sine';
            osc3.frequency.value = inst.freq * 2; // Octave
            osc3.detune.value = -3;
            osc3.connect(filter);
            osc3.start();
          }

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(masterGain);
          osc.start();

          instrumentsRef.current.set(inst.id, { osc, gain, filter });
        }
      });

      isInitializedRef.current = true;
    } catch {
      // Audio not supported
    }
  }, []);

  const updateInstrument = useCallback((id: string, volume: number) => {
    const inst = instrumentsRef.current.get(id);
    if (!inst || !audioCtxRef.current) return;

    const ctx = audioCtxRef.current;
    const now = ctx.currentTime;

    // Smooth volume transition
    inst.gain.gain.setTargetAtTime(volume * 0.3, now, 0.1);

    // Adjust filter based on volume
    const filterFreq = 200 + (volume * 2000);
    inst.filter.frequency.setTargetAtTime(filterFreq, now, 0.2);
  }, []);

  const stop = useCallback(() => {
    if (masterGainRef.current && audioCtxRef.current) {
      masterGainRef.current.gain.setTargetAtTime(0, audioCtxRef.current.currentTime, 0.3);
    }
    setTimeout(() => {
      audioCtxRef.current?.close();
      isInitializedRef.current = false;
    }, 500);
  }, []);

  return { init, updateInstrument, stop };
}

export default function AccessPage() {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<AccessResponse | null>(null);
  const [volumes, setVolumes] = useState<Record<string, number>>({
    sub: 0, pad: 0, air: 0, hum: 0, dust: 0, bell: 0
  });
  const [audioStarted, setAudioStarted] = useState(false);
  const [activeNodes, setActiveNodes] = useState<Set<number>>(new Set());
  const router = useRouter();
  const searchParams = useSearchParams();

  const synth = useAmbientSynth();

  const next = searchParams.get('next') || '/';

  // Calculate total energy for constellation animation
  const totalEnergy = Object.values(volumes).reduce((a, b) => a + b, 0) / INSTRUMENTS.length;

  // Handle fader change
  const handleVolumeChange = (id: string, value: number) => {
    if (!audioStarted) {
      synth.init();
      setAudioStarted(true);
    }

    setVolumes(prev => ({ ...prev, [id]: value }));
    synth.updateInstrument(id, value);

    // Activate random nodes based on volume
    if (value > 0.3) {
      const nodeIndex = Math.floor(Math.random() * CONSTELLATION_NODES.length);
      setActiveNodes(prev => new Set([...prev, nodeIndex]));
      setTimeout(() => {
        setActiveNodes(prev => {
          const next = new Set(prev);
          next.delete(nodeIndex);
          return next;
        });
      }, 1000 + Math.random() * 2000);
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (audioStarted) synth.stop();
    };
  }, [audioStarted, synth]);

  // Form handlers
  const formatAsToken = (value: string): string => {
    const clean = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const parts = clean.match(/.{1,4}/g) || [];
    return parts.slice(0, 4).join('-');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.includes('-') || (value.length > 0 && value === value.toUpperCase())) {
      setCode(formatAsToken(value));
    } else {
      setCode(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const response = await fetch('/api/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const data: AccessResponse = await response.json();

      if (response.ok && data.success) {
        setSuccess(data);
        setTimeout(() => {
          router.push(next);
          router.refresh();
        }, data.type === 'token' ? 1500 : 500);
      } else {
        setError(data.error || 'Key not recognized');
        setCode('');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const input = document.getElementById('access-code');
    if (input) input.focus();
  }, []);

  const formatExpiry = (expiresAt: string): string => {
    const diffMs = new Date(expiresAt).getTime() - Date.now();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (diffHours > 24) return `${Math.floor(diffHours / 24)} days`;
    if (diffHours > 0) return `${diffHours}h ${diffMins}m`;
    return `${diffMins} minutes`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 overflow-hidden">
      {/* Constellation Background */}
      <svg className="fixed inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.6 }}>
        {/* Connection lines */}
        {CONNECTIONS.map(([from, to], i) => {
          const n1 = CONSTELLATION_NODES[from];
          const n2 = CONSTELLATION_NODES[to];
          const isActive = activeNodes.has(from) || activeNodes.has(to);
          return (
            <line
              key={`conn-${i}`}
              x1={`${n1.x}%`}
              y1={`${n1.y}%`}
              x2={`${n2.x}%`}
              y2={`${n2.y}%`}
              stroke="var(--foreground)"
              strokeWidth={isActive ? 1.5 : 0.5}
              style={{
                opacity: 0.05 + (totalEnergy * 0.15) + (isActive ? 0.2 : 0),
                transition: 'opacity 0.5s, stroke-width 0.3s',
              }}
            />
          );
        })}

        {/* Nodes */}
        {CONSTELLATION_NODES.map((node, i) => {
          const isActive = activeNodes.has(i);
          const instIndex = i % INSTRUMENTS.length;
          const instVolume = volumes[INSTRUMENTS[instIndex].id];

          return (
            <g key={`node-${i}`}>
              {/* Glow */}
              {isActive && (
                <circle
                  cx={`${node.x}%`}
                  cy={`${node.y}%`}
                  r={node.size * 4}
                  fill={INSTRUMENTS[instIndex].color}
                  style={{ opacity: 0.1 }}
                />
              )}

              {/* Node */}
              {node.type === 'jack' ? (
                <circle
                  cx={`${node.x}%`}
                  cy={`${node.y}%`}
                  r={node.size + (instVolume * 2)}
                  fill="none"
                  stroke="var(--foreground)"
                  strokeWidth={isActive ? 1.5 : 0.5}
                  style={{
                    opacity: 0.1 + (instVolume * 0.4) + (isActive ? 0.3 : 0),
                    transition: 'all 0.3s',
                  }}
                />
              ) : (
                <rect
                  x={`${node.x - node.size / 2}%`}
                  y={`${node.y - node.size / 2}%`}
                  width={`${node.size + instVolume * 2}%`}
                  height={`${node.size + instVolume * 2}%`}
                  fill={isActive ? INSTRUMENTS[instIndex].color : 'var(--foreground)'}
                  style={{
                    opacity: 0.08 + (instVolume * 0.3) + (isActive ? 0.4 : 0),
                    transform: `rotate(45deg)`,
                    transformOrigin: `${node.x}% ${node.y}%`,
                    transition: 'all 0.3s',
                  }}
                />
              )}
            </g>
          );
        })}
      </svg>

      {/* Left Faders - 6 Instruments */}
      <div className="fixed left-6 top-1/2 -translate-y-1/2 flex flex-col gap-6">
        {INSTRUMENTS.map((inst) => (
          <div key={inst.id} className="flex items-center gap-3">
            {/* Fader */}
            <div className="relative h-20 w-1 bg-[var(--border)] rounded-full">
              <div
                className="absolute bottom-0 w-full rounded-full transition-all duration-100"
                style={{
                  height: `${volumes[inst.id] * 100}%`,
                  backgroundColor: inst.color,
                  opacity: 0.6,
                }}
              />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volumes[inst.id]}
                onChange={(e) => handleVolumeChange(inst.id, parseFloat(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
                aria-label={inst.name}
              />
            </div>
            {/* Label */}
            <span
              className="label-micro w-8"
              style={{
                color: volumes[inst.id] > 0 ? inst.color : 'var(--foreground)',
                opacity: 0.3 + (volumes[inst.id] * 0.7),
                transition: 'all 0.2s',
              }}
            >
              {inst.name}
            </span>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="relative w-full max-w-sm z-10">
        <div className="text-center mb-12">
          <div className="label-micro mb-2">Lobster Sound</div>
          <h1 className="text-xl font-light tracking-wide">Private Access</h1>
        </div>

        {success ? (
          <div className="text-center animate-fade-in space-y-4">
            <div className="w-12 h-12 mx-auto border border-[var(--accent)] rounded-full flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            {success.type === 'token' && (
              <div className="space-y-2">
                <p className="text-sm opacity-60">{success.label}</p>
                <p className="label-micro">Session expires in {formatExpiry(success.expiresAt!)}</p>
              </div>
            )}
            <p className="label-micro opacity-40 mt-4">Redirecting...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="access-code" className="sr-only">Access Code</label>
              <input
                id="access-code"
                type="text"
                value={code}
                onChange={handleInputChange}
                placeholder="Password or XXXX-XXXX-XXXX-XXXX"
                className="w-full h-12 px-4 bg-transparent border border-[var(--border)] text-center text-sm tracking-widest placeholder:text-[var(--muted-foreground)] placeholder:tracking-[0.1em] placeholder:text-xs focus:outline-none focus:border-[var(--border-strong)] transition-colors font-mono"
                disabled={loading}
                autoComplete="off"
                spellCheck={false}
                autoCapitalize="off"
              />
            </div>
            {error && (
              <div className="text-center text-sm opacity-60 animate-fade-in">{error}</div>
            )}
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="btn-primary w-full disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Enter'}
            </button>
          </form>
        )}

        {!success && (
          <div className="mt-16 text-center">
            <p className="label-micro">This app is currently in private preview.</p>
          </div>
        )}
      </div>

      {/* Corner marks */}
      <div className="corner-mark top-left fixed top-8 left-8" />
      <div className="corner-mark top-right fixed top-8 right-8" />
      <div className="corner-mark bottom-left fixed bottom-8 left-8" />
      <div className="corner-mark bottom-right fixed bottom-8 right-8" />
    </div>
  );
}
