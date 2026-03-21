'use client';

import { useEffect, useRef, useState } from 'react';
import { LyriaStreamEngine } from '@/lib/lyria-stream-engine';
import { AetherEngine } from '@/lib/aether-engine';

type RitualMode = 'IONIC' | 'RADIANT' | 'VORTEX' | 'ETHER';

interface ModulationParams {
  mode: RitualMode;
  density: number;
  jitter_ms: number;
  harmonic_bias: 'odd' | 'even' | 'all' | 'spectral';
  wet_pct: number;
}

const RITUAL_DESCRIPTIONS: Record<RitualMode, { title: string; desc: string; color: string }> = {
  IONIC: {
    title: 'IONIC',
    desc: 'Cold, analytical. Sparse harmonics, 1176 all-buttons character. 0.1% wet.',
    color: '#60A5FA', // Blue
  },
  RADIANT: {
    title: 'RADIANT',
    desc: 'Warm, golden. Tube-like even-order harmonics. Low frequency presence. 25% wet.',
    color: '#F59E0B', // Amber
  },
  VORTEX: {
    title: 'VORTEX',
    desc: 'Chaotic, distorted. Feedback loops, digital grit, analog clipping. 60% wet.',
    color: '#DC2626', // Red
  },
  ETHER: {
    title: 'ETHER',
    desc: 'Infinite, ambient. Long decay, spectral blur, 0-20kHz drift over 60 minutes. 80% wet.',
    color: '#8B5CF6', // Purple
  },
};

export default function RitualInstrumentPage() {
  const aetherRef = useRef<AetherEngine | null>(null);
  const lyriaRef = useRef<LyriaStreamEngine | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const [isInitialized, setIsInitialized] = useState(false);
  const [currentMode, setCurrentMode] = useState<RitualMode>('IONIC');
  const [modulationParams, setModulationParams] = useState<ModulationParams | null>(null);
  const [connectionState, setConnectionState] = useState<'disconnected' | 'connecting' | 'connected' | 'streaming' | 'error'>('disconnected');
  const [bufferHealth, setBufferHealth] = useState(0);

  // Initialize audio engines
  const initEngines = async () => {
    if (isInitialized) return;

    try {
      // Initialize AudioContext
      const ctx = new AudioContext();
      audioContextRef.current = ctx;

      // Initialize Aether (carrier signal)
      const aether = new AetherEngine();
      await aether.init();
      aether.setScale('pentatonic');
      aether.setRoot(60);
      aetherRef.current = aether;

      // Initialize Lyria Stream
      const lyria = new LyriaStreamEngine();
      await lyria.init(ctx, {
        serverUrl: 'ws://localhost:3112/lyria-stream',
        outputGain: 0.6,
      });

      // Set up callbacks
      lyria.onConnectionStateChange = (state) => {
        setConnectionState(state);
      };

      lyria.onBufferHealth = (health) => {
        setBufferHealth(health);
      };

      lyria.onError = (error) => {
        console.error('[Ritual] Lyria error:', error);
      };

      lyriaRef.current = lyria;

      setIsInitialized(true);
      console.log('[Ritual] Engines initialized');
    } catch (error) {
      console.error('[Ritual] Initialization error:', error);
    }
  };

  // Connect to backend
  const connectToBackend = async () => {
    if (!lyriaRef.current) return;

    try {
      await lyriaRef.current.connect();
    } catch (error) {
      console.error('[Ritual] Connection error:', error);
    }
  };

  // Change ritual mode
  const changeMode = (mode: RitualMode) => {
    if (!lyriaRef.current) return;

    setCurrentMode(mode);
    lyriaRef.current.setMood(mode.toLowerCase() as any);
  };

  // Play a test note
  const playTestNote = (noteIndex: number) => {
    if (!aetherRef.current || !lyriaRef.current) return;

    // Play note on Aether
    aetherRef.current.playNote(noteIndex, 0.8);

    // Send carrier signal to Lyria
    const scaleNotes = aetherRef.current.getScaleNotes();
    const midiNote = scaleNotes[noteIndex]?.midiNote || 60;

    // This would trigger modulation response from backend
    lyriaRef.current.updateSteeringParams({
      harmonicField: [midiNote],
      userActivity: 0.8,
    });
  };

  const releaseTestNote = (noteIndex: number) => {
    if (!aetherRef.current) return;
    aetherRef.current.releaseNote(noteIndex);
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (aetherRef.current) {
        aetherRef.current.dispose();
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
    <div className="min-h-screen bg-gray-950 text-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-12">
          <h1 className="text-4xl font-bold mb-2 font-mono">RITUAL MODES</h1>
          <p className="text-gray-400">
            Four sonic characters for Lyria steering. Each mode is a distinct aesthetic personality.
          </p>
        </header>

        {/* Initialize Button */}
        {!isInitialized && (
          <button
            onClick={initEngines}
            className="mb-8 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-mono text-sm transition-colors"
          >
            INITIALIZE AUDIO
          </button>
        )}

        {/* Connection Status */}
        {isInitialized && (
          <div className="mb-8 p-4 bg-gray-900 rounded-lg border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  connectionState === 'streaming' ? 'bg-green-500' :
                  connectionState === 'connected' ? 'bg-blue-500' :
                  connectionState === 'connecting' ? 'bg-yellow-500' :
                  connectionState === 'error' ? 'bg-red-500' :
                  'bg-gray-500'
                }`} />
                <span className="font-mono text-sm uppercase">{connectionState}</span>
              </div>

              {connectionState === 'disconnected' && (
                <button
                  onClick={connectToBackend}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded font-mono text-xs transition-colors"
                >
                  CONNECT TO BACKEND
                </button>
              )}
            </div>

            {connectionState === 'streaming' && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-400 font-mono">
                  <span>BUFFER HEALTH</span>
                  <span>{Math.round(bufferHealth * 100)}%</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-1.5">
                  <div
                    className="bg-green-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${bufferHealth * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Ritual Mode Selector */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          {(Object.keys(RITUAL_DESCRIPTIONS) as RitualMode[]).map((mode) => {
            const info = RITUAL_DESCRIPTIONS[mode];
            const isActive = currentMode === mode;

            return (
              <button
                key={mode}
                onClick={() => changeMode(mode)}
                disabled={!isInitialized}
                className={`
                  p-6 rounded-lg border-2 transition-all text-left
                  ${isActive
                    ? 'border-current shadow-lg scale-[1.02]'
                    : 'border-gray-800 hover:border-gray-700'}
                  ${!isInitialized && 'opacity-50 cursor-not-allowed'}
                `}
                style={{
                  borderColor: isActive ? info.color : undefined,
                  backgroundColor: isActive ? `${info.color}10` : 'rgb(17, 24, 39)',
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3
                    className="text-xl font-bold font-mono"
                    style={{ color: isActive ? info.color : '#fff' }}
                  >
                    {info.title}
                  </h3>
                  {isActive && (
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: info.color }}
                    />
                  )}
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {info.desc}
                </p>
              </button>
            );
          })}
        </div>

        {/* Test Keyboard */}
        {isInitialized && (
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
            <h3 className="text-lg font-mono mb-4">TEST KEYBOARD</h3>
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: 10 }, (_, i) => (
                <button
                  key={i}
                  onMouseDown={() => playTestNote(i)}
                  onMouseUp={() => releaseTestNote(i)}
                  onMouseLeave={() => releaseTestNote(i)}
                  className="
                    h-16 bg-gray-800 hover:bg-gray-700 border border-gray-700
                    rounded font-mono text-sm transition-colors active:bg-gray-600
                  "
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-4 font-mono">
              Click and hold keys to trigger notes
            </p>
          </div>
        )}

        {/* Modulation Parameters Display */}
        {modulationParams && (
          <div className="mt-8 bg-gray-900 rounded-lg border border-gray-800 p-6">
            <h3 className="text-lg font-mono mb-4">CURRENT MODULATION</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm font-mono">
              <div>
                <div className="text-gray-500 text-xs mb-1">DENSITY</div>
                <div className="text-lg">{(modulationParams.density * 100).toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs mb-1">JITTER</div>
                <div className="text-lg">{modulationParams.jitter_ms.toFixed(1)}ms</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs mb-1">HARMONIC BIAS</div>
                <div className="text-lg uppercase">{modulationParams.harmonic_bias}</div>
              </div>
              <div>
                <div className="text-gray-500 text-xs mb-1">WET/DRY</div>
                <div className="text-lg">{(modulationParams.wet_pct * 100).toFixed(1)}%</div>
              </div>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="mt-12 p-6 bg-gray-900/50 rounded-lg border border-gray-800">
          <h3 className="font-mono text-sm mb-2 text-gray-400">ABOUT RITUAL MODES</h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            Each ritual mode represents a crystallized aesthetic with specific parameter ranges.
            The backend Lyria bridge applies these modes to incoming carrier signals (MIDI notes, spectral snapshots)
            and returns modulation parameters for real-time audio processing.
          </p>
        </div>
      </div>
    </div>
  );
}
