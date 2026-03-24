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

// Sound types for constellation nodes
type SoundType = 'sub' | 'pad' | 'air' | 'hum' | 'dust' | 'bell' | 'drone' | 'chime';

const SOUND_CONFIG: Record<SoundType, { freq: number; type: OscillatorType; color: string; name: string }> = {
  sub: { freq: 40, type: 'sine', color: '#7C5CFF', name: 'SUB' },
  pad: { freq: 110, type: 'sine', color: '#3b82f6', name: 'PAD' },
  air: { freq: 220, type: 'triangle', color: '#22c55e', name: 'AIR' },
  hum: { freq: 82, type: 'sawtooth', color: '#eab308', name: 'HUM' },
  dust: { freq: 0, type: 'sine', color: '#f97316', name: 'DUST' },
  bell: { freq: 440, type: 'sine', color: '#ef4444', name: 'BELL' },
  drone: { freq: 55, type: 'triangle', color: '#8b5cf6', name: 'DRONE' },
  chime: { freq: 880, type: 'sine', color: '#06b6d4', name: 'CHIME' },
};

// Constellation nodes - each linked to a sound
interface ConstellationNode {
  x: number;
  y: number;
  size: number;
  sound: SoundType;
}

const CONSTELLATION_NODES: ConstellationNode[] = [
  { x: 12, y: 18, size: 22, sound: 'sub' },
  { x: 28, y: 35, size: 18, sound: 'pad' },
  { x: 18, y: 58, size: 20, sound: 'air' },
  { x: 38, y: 78, size: 17, sound: 'hum' },
  { x: 72, y: 20, size: 21, sound: 'drone' },
  { x: 85, y: 42, size: 18, sound: 'bell' },
  { x: 70, y: 65, size: 19, sound: 'chime' },
  { x: 88, y: 80, size: 16, sound: 'dust' },
];

// Connections between nodes
const CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3],
  [4, 5], [5, 6], [6, 7],
  [1, 4], [2, 6],
];

// Audio engine for constellation - toggle sounds on/off
function useConstellationAudio() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const soundsRef = useRef<Map<SoundType, {
    source: OscillatorNode | AudioBufferSourceNode;
    gain: GainNode;
    filter: BiquadFilterNode;
    extra?: OscillatorNode[];
  }>>(new Map());
  const masterGainRef = useRef<GainNode | null>(null);
  const noiseBufferRef = useRef<AudioBuffer | null>(null);

  const init = useCallback(() => {
    if (audioCtxRef.current) return audioCtxRef.current;

    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    audioCtxRef.current = ctx;

    // Master gain
    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.5;
    masterGain.connect(ctx.destination);
    masterGainRef.current = masterGain;

    // Create noise buffer for dust sound
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    noiseBufferRef.current = noiseBuffer;

    return ctx;
  }, []);

  const toggleSound = useCallback((soundType: SoundType, active: boolean) => {
    const ctx = init();
    if (!ctx || !masterGainRef.current) return;

    const config = SOUND_CONFIG[soundType];
    const existing = soundsRef.current.get(soundType);

    if (active && !existing) {
      // Create new sound
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1200;
      filter.Q.value = 0.7;

      const gain = ctx.createGain();
      gain.gain.value = 0;

      let source: OscillatorNode | AudioBufferSourceNode;
      const extra: OscillatorNode[] = [];

      if (soundType === 'dust' && noiseBufferRef.current) {
        // Noise for dust
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBufferRef.current;
        noise.loop = true;

        const bandpass = ctx.createBiquadFilter();
        bandpass.type = 'bandpass';
        bandpass.frequency.value = 800;
        bandpass.Q.value = 0.3;

        noise.connect(bandpass);
        bandpass.connect(filter);
        noise.start();
        source = noise;
      } else {
        // Oscillator sounds
        const osc = ctx.createOscillator();
        osc.type = config.type;
        osc.frequency.value = config.freq;

        // Add richness for pads and drones
        if (soundType === 'pad' || soundType === 'drone') {
          const osc2 = ctx.createOscillator();
          osc2.type = 'sine';
          osc2.frequency.value = config.freq * 1.5;
          osc2.detune.value = 7;
          const gain2 = ctx.createGain();
          gain2.gain.value = 0.3;
          osc2.connect(gain2);
          gain2.connect(filter);
          osc2.start();
          extra.push(osc2);
        }

        // Bells and chimes get higher cutoff
        if (soundType === 'bell' || soundType === 'chime') {
          filter.frequency.value = 3000;
        }

        osc.connect(filter);
        osc.start();
        source = osc;
      }

      filter.connect(gain);
      gain.connect(masterGainRef.current);

      // Fade in
      gain.gain.setTargetAtTime(0.3, ctx.currentTime, 0.1);

      soundsRef.current.set(soundType, { source, gain, filter, extra });
    } else if (!active && existing) {
      // Fade out and stop
      const now = ctx.currentTime;
      existing.gain.gain.setTargetAtTime(0, now, 0.15);

      setTimeout(() => {
        try {
          if ('stop' in existing.source) {
            existing.source.stop();
          }
          existing.source.disconnect();
          existing.gain.disconnect();
          existing.filter.disconnect();
          existing.extra?.forEach(osc => {
            osc.stop();
            osc.disconnect();
          });
        } catch {
          // Already stopped
        }
        soundsRef.current.delete(soundType);
      }, 300);
    }
  }, [init]);

  const cleanup = useCallback(() => {
    soundsRef.current.forEach((sound) => {
      try {
        if ('stop' in sound.source) {
          sound.source.stop();
        }
        sound.source.disconnect();
        sound.extra?.forEach(osc => {
          osc.stop();
          osc.disconnect();
        });
      } catch {
        // Already stopped
      }
    });
    soundsRef.current.clear();
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
  }, []);

  return { toggleSound, cleanup };
}

export default function AccessPage() {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<AccessResponse | null>(null);
  const [activeNodes, setActiveNodes] = useState<Set<number>>(new Set());
  const router = useRouter();
  const searchParams = useSearchParams();

  const audio = useConstellationAudio();

  const next = searchParams.get('next') || '/';

  // Toggle a node's sound when clicked
  const handleNodeClick = (nodeIndex: number) => {
    const node = CONSTELLATION_NODES[nodeIndex];
    const isActive = activeNodes.has(nodeIndex);

    setActiveNodes(prev => {
      const next = new Set(prev);
      if (isActive) {
        next.delete(nodeIndex);
      } else {
        next.add(nodeIndex);
      }
      return next;
    });

    audio.toggleSound(node.sound, !isActive);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audio.cleanup();
    };
  }, [audio]);

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
      {/* Constellation - Clickable Nodes */}
      <svg className="fixed inset-0 w-full h-full" style={{ zIndex: 0 }}>
        {/* Connection lines */}
        {CONNECTIONS.map(([from, to], i) => {
          const n1 = CONSTELLATION_NODES[from];
          const n2 = CONSTELLATION_NODES[to];
          const isActive = activeNodes.has(from) || activeNodes.has(to);
          const color1 = SOUND_CONFIG[n1.sound].color;
          const color2 = SOUND_CONFIG[n2.sound].color;

          return (
            <line
              key={`conn-${i}`}
              x1={`${n1.x}%`}
              y1={`${n1.y}%`}
              x2={`${n2.x}%`}
              y2={`${n2.y}%`}
              stroke={isActive ? (activeNodes.has(from) ? color1 : color2) : 'var(--foreground)'}
              strokeWidth={isActive ? 2 : 0.5}
              style={{
                opacity: isActive ? 0.5 : 0.1,
                transition: 'all 0.3s ease',
              }}
            />
          );
        })}

        {/* Clickable Nodes */}
        {CONSTELLATION_NODES.map((node, i) => {
          const isActive = activeNodes.has(i);
          const config = SOUND_CONFIG[node.sound];

          return (
            <g
              key={`node-${i}`}
              onClick={() => handleNodeClick(i)}
              style={{ cursor: 'pointer' }}
            >
              {/* Outer glow when active */}
              {isActive && (
                <>
                  <circle
                    cx={`${node.x}%`}
                    cy={`${node.y}%`}
                    r={node.size * 2.5}
                    fill={config.color}
                    style={{ opacity: 0.1 }}
                  />
                  <circle
                    cx={`${node.x}%`}
                    cy={`${node.y}%`}
                    r={node.size * 1.8}
                    fill={config.color}
                    style={{ opacity: 0.2 }}
                  />
                </>
              )}

              {/* Main circle */}
              <circle
                cx={`${node.x}%`}
                cy={`${node.y}%`}
                r={node.size}
                fill={isActive ? config.color : 'transparent'}
                stroke={isActive ? config.color : 'var(--foreground)'}
                strokeWidth={isActive ? 2 : 1}
                style={{
                  opacity: isActive ? 0.9 : 0.2,
                  transition: 'all 0.2s ease',
                }}
              />

              {/* Inner dot */}
              <circle
                cx={`${node.x}%`}
                cy={`${node.y}%`}
                r={isActive ? 5 : 3}
                fill={isActive ? '#fff' : 'var(--foreground)'}
                style={{
                  opacity: isActive ? 1 : 0.4,
                  transition: 'all 0.2s ease',
                }}
              />

              {/* Label */}
              <text
                x={`${node.x}%`}
                y={`${node.y + 5}%`}
                textAnchor="middle"
                fill={isActive ? config.color : 'var(--foreground)'}
                fontSize="10"
                fontFamily="var(--font-mono)"
                style={{
                  opacity: isActive ? 0.9 : 0.25,
                  transition: 'opacity 0.2s ease',
                  textTransform: 'uppercase',
                  letterSpacing: '0.15em',
                }}
              >
                {config.name}
              </text>

              {/* Invisible larger hit area for easier clicking */}
              <circle
                cx={`${node.x}%`}
                cy={`${node.y}%`}
                r={node.size + 20}
                fill="transparent"
              />
            </g>
          );
        })}

        {/* Pulsing ring for active nodes */}
        {Array.from(activeNodes).map(nodeIndex => {
          const node = CONSTELLATION_NODES[nodeIndex];
          const config = SOUND_CONFIG[node.sound];
          return (
            <circle
              key={`pulse-${nodeIndex}`}
              cx={`${node.x}%`}
              cy={`${node.y}%`}
              r={node.size}
              fill="none"
              stroke={config.color}
              strokeWidth="1.5"
              className="animate-pulse-ring"
            />
          );
        })}
      </svg>

      {/* Pulse animation */}
      <style jsx global>{`
        @keyframes pulse-ring {
          0%, 100% {
            transform: scale(1);
            opacity: 0.5;
          }
          50% {
            transform: scale(1.6);
            opacity: 0;
          }
        }
        .animate-pulse-ring {
          animation: pulse-ring 2s ease-out infinite;
          transform-origin: center;
          transform-box: fill-box;
        }
      `}</style>

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
