'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { VaporEngine, VaporParams } from '@/lib/vapor-engine';
import { LyriaStreamEngine } from '@/lib/lyria-stream-engine';

type RitualMode = 'IONIC' | 'RADIANT' | 'VORTEX' | 'ETHER';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  hue: number;
}

// Note mappings for keyboard (MIDI note numbers)
const keyToMidiNote: Record<string, number> = {
  'a': 60, // C4
  'w': 61, // C#4
  's': 62, // D4
  'e': 63, // D#4
  'd': 64, // E4
  'f': 65, // F4
  't': 66, // F#4
  'g': 67, // G4
  'y': 68, // G#4
  'h': 69, // A4
  'u': 70, // A#4
  'j': 71, // B4
  'k': 72, // C5
};

const RITUAL_COLORS: Record<RitualMode, string> = {
  IONIC: '#60A5FA',
  RADIANT: '#F59E0B',
  VORTEX: '#DC2626',
  ETHER: '#8B5CF6',
};

export default function VaporPage() {
  const vaporRef = useRef<VaporEngine | null>(null);
  const lyriaRef = useRef<LyriaStreamEngine | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const nextParticleId = useRef(0);

  const [isInitialized, setIsInitialized] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [params, setParams] = useState<VaporParams>({
    grainSize: 50,
    density: 20,
    pitchVariation: 5,
    spread: 0.3,
    baseFreq: 220,
  });

  const [currentMode, setCurrentMode] = useState<RitualMode>('IONIC');
  const [lyriaConnected, setLyriaConnected] = useState(false);
  const [activity, setActivity] = useState(0);
  const [activeNotes, setActiveNotes] = useState<Set<string>>(new Set());
  const activeNotesRef = useRef<Set<string>>(new Set());
  const [midiConnected, setMidiConnected] = useState(false);
  const [midiDevices, setMidiDevices] = useState<string[]>([]);

  // Initialize MIDI
  const initMIDI = async () => {
    try {
      const midiAccess = await navigator.requestMIDIAccess();
      const inputs = Array.from(midiAccess.inputs.values());

      if (inputs.length > 0) {
        const deviceNames = inputs.map(input => input.name || 'Unknown Device');
        setMidiDevices(deviceNames);
        console.log('[MIDI] Connected devices:', deviceNames);

        // Listen to all MIDI inputs
        inputs.forEach((input) => {
          input.onmidimessage = (event) => {
            if (!event.data) return;
            const [status, note, velocity] = event.data;
            const command = status & 0xf0;

            if (command === 0x90 && velocity > 0) {
              // Note On
              vaporRef.current?.noteOn(note, velocity);
              console.log(`[MIDI] Note ON: ${note} vel=${velocity}`);
            } else if (command === 0x80 || (command === 0x90 && velocity === 0)) {
              // Note Off
              vaporRef.current?.noteOff(note);
              console.log(`[MIDI] Note OFF: ${note}`);
            }
          };
        });

        setMidiConnected(true);
        console.log('[MIDI] Initialized successfully');
      } else {
        console.log('[MIDI] No MIDI devices found');
      }
    } catch (error) {
      console.error('[MIDI] Initialization failed:', error);
    }
  };

  // Initialize engines
  const initEngines = async () => {
    if (isInitialized) return;

    try {
      // Audio context
      const ctx = new AudioContext();
      audioContextRef.current = ctx;

      // VAPOR engine
      const vapor = new VaporEngine();
      await vapor.init();

      vapor.onGrainSpawn = (x, y, size, pitch) => {
        spawnParticle(x, y, size, pitch);
      };

      vapor.onActivityUpdate = (act) => {
        setActivity(act);
      };

      vaporRef.current = vapor;

      // Lyria engine
      const lyria = new LyriaStreamEngine();
      await lyria.init(ctx, {
        serverUrl: 'ws://localhost:3112/lyria-stream',
      });

      lyria.onConnectionStateChange = (state) => {
        setLyriaConnected(state === 'connected' || state === 'streaming');
      };

      lyriaRef.current = lyria;

      setIsInitialized(true);
      startAnimation();

      // Initialize MIDI after engines are ready
      await initMIDI();
    } catch (error) {
      console.error('[VAPOR] Init error:', error);
    }
  };

  // Spawn visual particle
  const spawnParticle = (x: number, y: number, size: number, pitch: number) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.warn('[Particle] Canvas not available');
      return;
    }

    const canvasWidth = canvas.width || 800;
    const canvasHeight = canvas.height || 500;

    const particle: Particle = {
      id: nextParticleId.current++,
      x: x * canvasWidth,
      y: y * canvasHeight,
      vx: (Math.random() - 0.5) * 3,
      vy: (Math.random() - 0.5) * 3,
      size: 30 + size * 50, // Even bigger particles: 30-80px
      opacity: 1.0,
      hue: 270 + pitch * 6, // More color variation
    };

    particlesRef.current.push(particle);
    console.log(`[Particle] Spawned #${particle.id} at (${Math.round(particle.x)}, ${Math.round(particle.y)}) size=${Math.round(particle.size)} hue=${Math.round(particle.hue)}`);

    // Limit particles
    if (particlesRef.current.length > 500) {
      particlesRef.current.shift();
    }
  };

  // Animation loop
  const startAnimation = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error('[VAPOR] Canvas ref not available');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('[VAPOR] Could not get 2D context');
      return;
    }

    // Set initial canvas dimensions explicitly
    canvas.width = 800;
    canvas.height = 500;
    console.log('[VAPOR] Canvas initialized:', canvas.width, 'x', canvas.height);

    // Draw test pattern to verify canvas is working
    ctx.fillStyle = 'rgba(255, 0, 255, 0.3)';
    ctx.fillRect(50, 50, 100, 100);
    console.log('[VAPOR] Test rectangle drawn at (50, 50)');

    const animate = () => {
      // Resize canvas if container size changed
      const targetWidth = canvas.offsetWidth || 800;
      const targetHeight = canvas.offsetHeight || 500;

      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        console.log('[VAPOR] Canvas resized:', canvas.width, 'x', canvas.height);
      }

      // Clear canvas completely first (for debugging)
      ctx.fillStyle = '#FAF8F2';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // DEBUG: Show particle count
      ctx.fillStyle = 'rgba(124, 92, 255, 0.8)';
      ctx.font = '14px monospace';
      ctx.fillText(`Particles: ${particlesRef.current.length}`, 10, 25);
      ctx.fillText(`Canvas: ${canvas.width}x${canvas.height}`, 10, 45);

      // Update and draw particles
      const particlesToRemove: number[] = [];
      particlesRef.current.forEach((p, index) => {
        // Update position
        p.x += p.vx;
        p.y += p.vy;
        p.opacity *= 0.99; // Slower fade
        p.size *= 0.995; // Slower shrink

        // Remove dead particles
        if (p.opacity < 0.01 || p.size < 1) {
          particlesToRemove.push(index);
          return;
        }

        // Bounce off edges
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        // Draw particle with solid color (simplified for debugging)
        ctx.fillStyle = `hsla(${p.hue}, 70%, 60%, ${p.opacity * 0.8})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Add a glow effect
        ctx.strokeStyle = `hsla(${p.hue}, 70%, 60%, ${p.opacity * 0.3})`;
        ctx.lineWidth = 3;
        ctx.stroke();
      });

      // Remove dead particles (in reverse order to avoid index issues)
      for (let i = particlesToRemove.length - 1; i >= 0; i--) {
        particlesRef.current.splice(particlesToRemove[i], 1);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();
  };

  // Toggle playback
  const togglePlayback = () => {
    if (!vaporRef.current) return;

    if (isPlaying) {
      vaporRef.current.stop();
      setIsPlaying(false);
    } else {
      vaporRef.current.start();
      setIsPlaying(true);

      // Spawn some initial particles for immediate visual feedback
      for (let i = 0; i < 10; i++) {
        setTimeout(() => {
          spawnParticle(Math.random(), Math.random(), Math.random(), (Math.random() - 0.5) * 10);
        }, i * 50);
      }
    }
  };

  // Connect to Lyria backend
  const connectLyria = async () => {
    if (!lyriaRef.current) return;
    await lyriaRef.current.connect();
  };

  // Change ritual mode
  const changeMode = (mode: RitualMode) => {
    setCurrentMode(mode);
    if (lyriaRef.current && lyriaConnected) {
      lyriaRef.current.setRitualMode(mode);
    }
  };

  // Update parameters
  const updateParam = <K extends keyof VaporParams>(key: K, value: VaporParams[K]) => {
    setParams(prev => ({ ...prev, [key]: value }));

    if (!vaporRef.current) return;

    switch (key) {
      case 'grainSize':
        vaporRef.current.setGrainSize(value as number);
        break;
      case 'density':
        vaporRef.current.setDensity(value as number);
        break;
      case 'pitchVariation':
        vaporRef.current.setPitchVariation(value as number);
        break;
      case 'spread':
        vaporRef.current.setSpread(value as number);
        break;
      case 'baseFreq':
        vaporRef.current.setBaseFreq(value as number);
        break;
    }

    // Send to Lyria
    if (lyriaRef.current && vaporRef.current && lyriaConnected) {
      const spectral = vaporRef.current.getSpectralSnapshot();
      lyriaRef.current.updateSteeringParams({
        density: (value as number) / 100,
        userActivity: activity,
      });
    }
  };

  // Keyboard handlers (polyphonic)
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!vaporRef.current || !isInitialized) return;

    const key = e.key.toLowerCase();
    const midiNote = keyToMidiNote[key];

    if (midiNote !== undefined && !activeNotesRef.current.has(key)) {
      e.preventDefault();
      activeNotesRef.current.add(key);
      setActiveNotes(new Set(activeNotesRef.current));

      // Play note polyphonically
      vaporRef.current.noteOn(midiNote, 100);

      if (!isPlaying) {
        setIsPlaying(true);
      }
    }
  }, [isInitialized, isPlaying]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (!vaporRef.current) return;

    const key = e.key.toLowerCase();
    const midiNote = keyToMidiNote[key];

    if (midiNote !== undefined && activeNotesRef.current.has(key)) {
      e.preventDefault();
      activeNotesRef.current.delete(key);
      setActiveNotes(new Set(activeNotesRef.current));

      // Release note
      vaporRef.current.noteOff(midiNote);

      // Update playing state
      if (activeNotesRef.current.size === 0) {
        setIsPlaying(false);
      }
    }
  }, []);

  // Keyboard event listeners
  useEffect(() => {
    if (!isInitialized) return;

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isInitialized, handleKeyDown, handleKeyUp]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (vaporRef.current) {
        vaporRef.current.dispose();
      }
      if (lyriaRef.current) {
        lyriaRef.current.dispose();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <main className="min-h-screen pt-14 flex" style={{ background: 'var(--background)' }}>
      {/* Instrument Area */}
      <div className="flex-1 relative flex items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="relative w-[800px] h-[500px]">
            {/* Title */}
            <div className="absolute top-0 left-0 z-10">
              <h1 className="text-3xl tracking-[0.3em] font-light uppercase" style={{
                color: 'rgba(124, 92, 255, 0.7)',
                textShadow: '0 0 40px rgba(124, 92, 255, 0.2)'
              }}>
                VAPOR
              </h1>
              <p className="mt-1 text-[10px] tracking-[0.25em] uppercase" style={{
                color: 'var(--foreground)',
                opacity: 0.3
              }}>
                Granular Cloud Synthesis
              </p>
            </div>

            {/* Keyboard & MIDI Hint */}
            {isInitialized && (
              <div className="absolute top-0 right-0 z-10 flex flex-col gap-2 items-end">
                <div className="inline-block px-4 py-2 rounded-full" style={{ background: 'rgba(124, 92, 255, 0.05)' }}>
                  <span className="text-[9px] tracking-[0.2em] uppercase" style={{
                    color: 'var(--foreground)',
                    opacity: 0.25
                  }}>
                    Play: A-K {midiConnected && '| MIDI'}
                  </span>
                </div>
                {midiConnected && midiDevices.length > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full" style={{ background: 'rgba(124, 92, 255, 0.05)' }}>
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'rgba(124, 92, 255, 0.8)' }} />
                    <span className="text-[8px] tracking-wider" style={{ color: 'var(--foreground)', opacity: 0.4 }}>
                      {midiDevices[0]}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Canvas */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full"
              style={{ background: 'var(--background)' }}
            />

            {/* Initialize Button */}
            {!isInitialized && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-[var(--background)]/90 backdrop-blur-sm">
                <button
                  onClick={initEngines}
                  className="group relative px-12 py-6 rounded-full transition-all duration-700 hover:scale-105"
                  style={{
                    background: 'linear-gradient(135deg, rgba(124, 92, 255, 0.15) 0%, rgba(124, 92, 255, 0.05) 100%)',
                    border: '1px solid rgba(124, 92, 255, 0.2)'
                  }}
                >
                  <div className="relative flex flex-col items-center gap-3">
                    <span className="text-2xl tracking-[0.2em] uppercase" style={{ color: 'var(--foreground)', opacity: 0.8 }}>
                      Initialize
                    </span>
                    <span className="text-xs tracking-[0.3em] uppercase" style={{ color: 'var(--foreground)', opacity: 0.4 }}>
                      Click to begin
                    </span>
                  </div>
                </button>
              </div>
            )}

            {/* Play Button */}
            {isInitialized && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-3">
                <button
                  onClick={togglePlayback}
                  className="w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
                  style={{
                    background: isPlaying ? 'rgba(124, 92, 255, 0.15)' : 'rgba(124, 92, 255, 0.08)',
                    border: '1px solid rgba(124, 92, 255, 0.2)',
                    boxShadow: isPlaying ? '0 0 20px rgba(124, 92, 255, 0.3)' : 'none',
                  }}
                >
                  {isPlaying ? (
                    <div className="w-5 h-5 rounded-sm" style={{ background: 'rgba(124, 92, 255, 0.7)' }} />
                  ) : (
                    <div
                      className="w-0 h-0 ml-1"
                      style={{
                        borderLeft: '10px solid rgba(124, 92, 255, 0.7)',
                        borderTop: '7px solid transparent',
                        borderBottom: '7px solid transparent',
                      }}
                    />
                  )}
                </button>
                <button
                  onClick={() => {
                    console.log('[DEBUG] Spawning 20 test particles');
                    for (let i = 0; i < 20; i++) {
                      spawnParticle(Math.random(), Math.random(), 0.5, (Math.random() - 0.5) * 10);
                    }
                  }}
                  className="px-3 py-2 rounded-full text-[10px] tracking-wider"
                  style={{
                    background: 'rgba(124, 92, 255, 0.1)',
                    border: '1px solid rgba(124, 92, 255, 0.3)',
                    color: 'rgba(124, 92, 255, 0.8)',
                  }}
                >
                  TEST
                </button>
              </div>
          )}
        </div>
      </div>

      {/* Control Panel */}
      <div className="w-80 flex flex-col border-l" style={{
        background: 'var(--background)',
        borderColor: 'rgba(124, 92, 255, 0.1)',
      }}>
          {/* Lyria Connection */}
          <div className="p-6 border-b" style={{ borderColor: 'rgba(124, 92, 255, 0.1)' }}>
            <div className="text-[9px] tracking-[0.2em] uppercase mb-3" style={{
              color: 'var(--foreground)',
              opacity: 0.35,
            }}>
              Lyria Bridge
            </div>
            {!lyriaConnected ? (
              <button
                onClick={connectLyria}
                disabled={!isInitialized}
                className="w-full h-10 rounded-full text-[10px] tracking-[0.15em] uppercase transition-all duration-300 hover:scale-[1.02]"
                style={{
                  background: 'rgba(124, 92, 255, 0.08)',
                  border: '1px solid rgba(124, 92, 255, 0.2)',
                  color: 'rgba(124, 92, 255, 0.8)',
                }}
              >
                Connect
              </button>
            ) : (
              <div className="flex items-center gap-2 text-xs" style={{
                color: 'var(--foreground)',
                opacity: 0.6
              }}>
                <div className="w-2 h-2 rounded-full animate-pulse" style={{
                  background: 'rgba(124, 92, 255, 0.8)',
                }} />
                <span className="tracking-wide">Connected</span>
              </div>
            )}
          </div>

          {/* Ritual Modes */}
          {lyriaConnected && (
            <div className="p-6 border-b" style={{ borderColor: 'rgba(124, 92, 255, 0.1)' }}>
              <div className="text-[9px] tracking-[0.2em] uppercase mb-3" style={{
                color: 'var(--foreground)',
                opacity: 0.35,
              }}>
                Ritual Mode
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(RITUAL_COLORS) as RitualMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => changeMode(mode)}
                    className="h-12 rounded-lg text-[9px] tracking-[0.15em] uppercase transition-all duration-300"
                    style={{
                      background: currentMode === mode ? 'rgba(124, 92, 255, 0.1)' : 'rgba(124, 92, 255, 0.03)',
                      border: currentMode === mode ? '1px solid rgba(124, 92, 255, 0.3)' : '1px solid rgba(124, 92, 255, 0.1)',
                      color: currentMode === mode ? 'rgba(124, 92, 255, 0.9)' : 'var(--foreground)',
                      opacity: currentMode === mode ? 1 : 0.5,
                    }}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Parameters */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Grain Size */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-[9px] tracking-[0.2em] uppercase" style={{
                  color: 'var(--foreground)',
                  opacity: 0.35,
                }}>
                  Grain Size
                </span>
                <span className="text-xs font-light" style={{
                  color: 'var(--foreground)',
                  opacity: 0.6,
                }}>
                  {params.grainSize}ms
                </span>
              </div>
              <input
                type="range"
                min="20"
                max="200"
                value={params.grainSize}
                onChange={(e) => updateParam('grainSize', Number(e.target.value))}
                disabled={!isInitialized}
                className="w-full"
              />
            </div>

            {/* Density */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-[9px] tracking-[0.2em] uppercase" style={{
                  color: 'var(--foreground)',
                  opacity: 0.35,
                }}>
                  Density
                </span>
                <span className="text-xs font-light" style={{
                  color: 'var(--foreground)',
                  opacity: 0.6,
                }}>
                  {params.density}/s
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                value={params.density}
                onChange={(e) => updateParam('density', Number(e.target.value))}
                disabled={!isInitialized}
                className="w-full"
              />
            </div>

            {/* Pitch Variation */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-[9px] tracking-[0.2em] uppercase" style={{
                  color: 'var(--foreground)',
                  opacity: 0.35,
                }}>
                  Pitch Var
                </span>
                <span className="text-xs font-light" style={{
                  color: 'var(--foreground)',
                  opacity: 0.6,
                }}>
                  ±{params.pitchVariation}st
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="12"
                value={params.pitchVariation}
                onChange={(e) => updateParam('pitchVariation', Number(e.target.value))}
                disabled={!isInitialized}
                className="w-full"
              />
            </div>

            {/* Spread */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-[9px] tracking-[0.2em] uppercase" style={{
                  color: 'var(--foreground)',
                  opacity: 0.35,
                }}>
                  Cloud Spread
                </span>
                <span className="text-xs font-light" style={{
                  color: 'var(--foreground)',
                  opacity: 0.6,
                }}>
                  {Math.round(params.spread * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={params.spread}
                onChange={(e) => updateParam('spread', Number(e.target.value))}
                disabled={!isInitialized}
                className="w-full"
              />
            </div>

            {/* Activity Meter */}
            <div className="pt-2">
              <div className="text-[9px] tracking-[0.2em] uppercase mb-2" style={{
                color: 'var(--foreground)',
                opacity: 0.35,
              }}>
                Activity
              </div>
              <div className="w-full h-2 rounded-full" style={{
                background: 'rgba(124, 92, 255, 0.1)',
              }}>
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: `${activity * 100}%`,
                    background: 'rgba(124, 92, 255, 0.6)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
  );
}
