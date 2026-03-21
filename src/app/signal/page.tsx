'use client';

/**
 * SIGNAL/FIELD
 *
 * Hybrid ambient field instrument
 * Part deterministic, part generative, part visual, part alive
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { SignalEngine } from '@/lib/signal-engine';
import { LyriaStreamEngine } from '@/lib/lyria-stream-engine';
import { FieldRenderer } from '@/lib/field-renderer';
import type { Scale, SignalVoiceType, LyriaMood, VisualizationMode } from '@/types/signal';

export default function SignalFieldPage() {
  // Canvas ref
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Engine instances
  const signalEngineRef = useRef<SignalEngine | null>(null);
  const lyriaEngineRef = useRef<LyriaStreamEngine | null>(null);
  const rendererRef = useRef<FieldRenderer | null>(null);

  // State
  const [isInitialized, setIsInitialized] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeVoiceCount, setActiveVoiceCount] = useState(0);

  // Musical parameters
  const [scale, setScale] = useState<Scale>('pentatonic');
  const [root, setRoot] = useState(60); // Middle C
  const [voiceType, setVoiceType] = useState<SignalVoiceType>('pad');

  // Lyria parameters
  const [lyriaEnabled, setLyriaEnabled] = useState(false);
  const [lyriaConnected, setLyriaConnected] = useState(false);
  const [lyriaMood, setLyriaMood] = useState<LyriaMood>('ambient');
  const [lyriaDensity, setLyriaDensity] = useState(0.3);

  // Visual parameters
  const [visualMode, setVisualMode] = useState<VisualizationMode>('wave_field');

  // Mouse state
  const [mouseDown, setMouseDown] = useState(false);
  const [mouseEnergy, setMouseEnergy] = useState(0);

  // === INITIALIZATION ===

  useEffect(() => {
    const init = async () => {
      if (!canvasRef.current) return;

      try {
        // Initialize SignalEngine (deterministic layer)
        const signalEngine = new SignalEngine();
        await signalEngine.init();

        signalEngine.onVoiceStart = () => {
          setActiveVoiceCount(signalEngine.getActiveVoiceCount());
          setIsPlaying(true);
        };

        signalEngine.onVoiceEnd = () => {
          setActiveVoiceCount(signalEngine.getActiveVoiceCount());
          if (signalEngine.getActiveVoiceCount() === 0) {
            setIsPlaying(false);
          }
        };

        signalEngine.onMusicalContextChange = (context) => {
          // Update Lyria with new harmonic field
          if (lyriaEngineRef.current && lyriaEnabled) {
            lyriaEngineRef.current.updateFromMusicalContext(
              context,
              activeVoiceCount / 16
            );
          }
        };

        signalEngineRef.current = signalEngine;

        // Initialize FieldRenderer (visual layer)
        const renderer = new FieldRenderer(canvasRef.current, {
          mode: visualMode,
          color: '#7C5CFF',
          accentColor: '#9B7FFF',
        });

        renderer.start();
        rendererRef.current = renderer;

        // Initialize LyriaStreamEngine (AI layer)
        const lyriaEngine = new LyriaStreamEngine();
        await lyriaEngine.init(signalEngine.isReady() ? signalEngine['ctx']! : new AudioContext());

        lyriaEngine.onConnectionStateChange = (state) => {
          setLyriaConnected(state === 'connected' || state === 'streaming');
        };

        lyriaEngineRef.current = lyriaEngine;

        setIsInitialized(true);

        console.log('[SIGNAL/FIELD] Initialized');
      } catch (error) {
        console.error('[SIGNAL/FIELD] Initialization failed:', error);
      }
    };

    init();

    return () => {
      // Cleanup
      signalEngineRef.current?.dispose();
      lyriaEngineRef.current?.dispose();
      rendererRef.current?.dispose();
    };
  }, []);

  // === ANALYSIS LOOP ===

  useEffect(() => {
    if (!isInitialized) return;

    const interval = setInterval(() => {
      // Simple energy analysis (in production, use proper audio analysis)
      const energy = activeVoiceCount / 16;
      const brightness = mouseEnergy;

      rendererRef.current?.updateAnalysisData({
        energy,
        brightness,
        pitch: root,
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isInitialized, activeVoiceCount, root, mouseEnergy]);

  // === INTERACTION HANDLERS ===

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isInitialized || !canvasRef.current) return;

    setMouseDown(true);

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Map mouse position to musical parameters
    const velocity = Math.min(1, Math.max(0.3, y / rect.height));
    const noteOffset = Math.floor((x / rect.width) * 12);

    const note = root + noteOffset;

    signalEngineRef.current?.playNote(note, velocity, voiceType);

    // Update energy for visuals
    setMouseEnergy(velocity);
  }, [isInitialized, root, voiceType]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!mouseDown || !isInitialized || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const velocity = Math.min(1, Math.max(0.3, y / rect.height));
    const noteOffset = Math.floor((x / rect.width) * 12);

    const note = root + noteOffset;

    signalEngineRef.current?.playNote(note, velocity, voiceType);

    setMouseEnergy(velocity);

    // Update Lyria gesture energy
    if (lyriaEngineRef.current && lyriaEnabled) {
      lyriaEngineRef.current.setGestureEnergy(velocity);
    }
  }, [mouseDown, isInitialized, root, voiceType, lyriaEnabled]);

  const handleCanvasMouseUp = useCallback(() => {
    setMouseDown(false);
    setMouseEnergy(0);
  }, []);

  // === LYRIA CONTROL ===

  const toggleLyria = useCallback(async () => {
    if (!lyriaEngineRef.current) return;

    if (lyriaEnabled) {
      lyriaEngineRef.current.disconnect();
      setLyriaEnabled(false);
    } else {
      await lyriaEngineRef.current.connect();
      setLyriaEnabled(true);
    }
  }, [lyriaEnabled]);

  // === KEYBOARD SHORTCUTS ===

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isInitialized) return;

      // Number keys 1-9 for scale degrees
      const keyMap: Record<string, number> = {
        'a': 0, 's': 1, 'd': 2, 'f': 3, 'g': 4, 'h': 5, 'j': 6, 'k': 7,
        'w': 8, 'e': 9, 'r': 10, 't': 11, 'y': 12, 'u': 13,
      };

      const offset = keyMap[e.key];
      if (offset !== undefined) {
        const note = root + offset;
        signalEngineRef.current?.playNote(note, 0.7, voiceType);
      }

      // Space to toggle Lyria
      if (e.key === ' ') {
        e.preventDefault();
        toggleLyria();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isInitialized, root, voiceType, toggleLyria]);

  // === RENDER ===

  return (
    <div className="min-h-screen text-white flex flex-col relative overflow-hidden">
      {/* Material gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0f0e16] via-[#14121c] to-[#1a1825]" />

      {/* Ambient glow overlay */}
      <div className="absolute inset-0 bg-gradient-radial from-purple-900/10 via-transparent to-transparent opacity-40" />

      {/* Header */}
      <header className="relative border-b border-white/5 backdrop-blur-sm bg-black/10 px-8 py-6">
        <div className="flex items-baseline justify-between">
          <div>
            <h1 className="text-3xl font-light tracking-wider bg-gradient-to-r from-white via-purple-100 to-purple-200 bg-clip-text text-transparent">
              SIGNAL/FIELD
            </h1>
            <p className="text-sm text-white/50 mt-1 tracking-wide">
              Playable Intelligence — Hybrid Ambient Field Instrument
            </p>
          </div>
          <div className="flex items-center gap-6 text-xs font-mono">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 backdrop-blur-sm">
              <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'bg-white/20'}`} />
              <span className="text-white/70">
                {activeVoiceCount} voice{activeVoiceCount !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 backdrop-blur-sm">
              <div className={`w-2 h-2 rounded-full ${lyriaConnected ? 'bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.5)]' : 'bg-white/20'}`} />
              <span className="text-white/70">
                {lyriaConnected ? 'LYRIA STREAMING' : 'LYRIA OFFLINE'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Field */}
      <div className="flex-1 flex relative">
        {/* Canvas */}
        <div className="flex-1 relative">
          <canvas
            ref={canvasRef}
            className="w-full h-full cursor-crosshair"
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
          />

          {/* Overlay instructions with glass effect */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center px-8 py-6 rounded-2xl backdrop-blur-md bg-white/5 border border-white/10 shadow-2xl">
                <p className="text-white/40 text-sm font-mono tracking-wider">
                  CLICK OR DRAG TO PLAY
                </p>
                <p className="text-white/25 text-xs font-mono mt-3">
                  ASDFGHJK / WERTYU keys • SPACE for Lyria
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Control Panel with glass morphism */}
        <div className="w-80 border-l border-white/5 backdrop-blur-xl bg-gradient-to-b from-black/20 via-black/30 to-black/40 p-6 flex flex-col gap-6 overflow-y-auto relative">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 via-transparent to-blue-500/5 pointer-events-none" />
          {/* Layer 1: Deterministic */}
          <section className="relative">
            <h3 className="text-xs font-mono text-white/50 tracking-wider mb-4 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-400/50" />
              LAYER 1 / DETERMINISTIC
            </h3>

            <div className="space-y-4">
              {/* Voice Type */}
              <div>
                <label className="text-xs text-white/70 mb-2 block font-medium">Voice Type</label>
                <select
                  value={voiceType}
                  onChange={(e) => setVoiceType(e.target.value as SignalVoiceType)}
                  className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-purple-400/50 focus:bg-white/10 transition-all"
                >
                  <option value="pad">Pad</option>
                  <option value="drone">Drone</option>
                  <option value="pulse">Pulse</option>
                  <option value="lead">Lead</option>
                  <option value="texture">Texture</option>
                </select>
              </div>

              {/* Scale */}
              <div>
                <label className="text-xs text-white/70 mb-2 block font-medium">Scale</label>
                <select
                  value={scale}
                  onChange={(e) => {
                    const newScale = e.target.value as Scale;
                    setScale(newScale);
                    signalEngineRef.current?.setScale(newScale);
                  }}
                  className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-purple-400/50 focus:bg-white/10 transition-all"
                >
                  <option value="pentatonic">Pentatonic</option>
                  <option value="major">Major</option>
                  <option value="minor">Minor</option>
                  <option value="dorian">Dorian</option>
                  <option value="phrygian">Phrygian</option>
                  <option value="lydian">Lydian</option>
                  <option value="mixolydian">Mixolydian</option>
                  <option value="whole_tone">Whole Tone</option>
                  <option value="harmonic_minor">Harmonic Minor</option>
                </select>
              </div>

              {/* Root Note */}
              <div>
                <label className="text-xs text-white/70 mb-2 block font-medium">Root Note</label>
                <input
                  type="range"
                  min="36"
                  max="84"
                  value={root}
                  onChange={(e) => {
                    const newRoot = parseInt(e.target.value);
                    setRoot(newRoot);
                    signalEngineRef.current?.setRoot(newRoot);
                  }}
                  className="w-full accent-purple-400"
                />
                <p className="text-xs text-white/50 mt-2 font-mono bg-white/5 rounded px-2 py-1 inline-block">MIDI {root}</p>
              </div>
            </div>
          </section>

          {/* Layer 2: Lyria */}
          <section className="relative">
            <h3 className="text-xs font-mono text-white/50 tracking-wider mb-4 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400/50" />
              LAYER 2 / LYRIA REALTIME
            </h3>

            <div className="space-y-4">
              {/* Enable */}
              <button
                onClick={toggleLyria}
                className={`w-full px-4 py-3 rounded-lg text-sm font-mono tracking-wider transition-all ${
                  lyriaEnabled
                    ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-400/40 text-purple-200 shadow-[0_0_20px_rgba(168,85,247,0.2)]'
                    : 'bg-white/5 backdrop-blur-sm border border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                {lyriaEnabled ? 'LYRIA ACTIVE' : 'ACTIVATE LYRIA'}
              </button>

              {lyriaEnabled && (
                <>
                  {/* Mood */}
                  <div>
                    <label className="text-xs text-white/70 mb-2 block font-medium">Mood</label>
                    <select
                      value={lyriaMood}
                      onChange={(e) => {
                        const mood = e.target.value as LyriaMood;
                        setLyriaMood(mood);
                        lyriaEngineRef.current?.setMood(mood);
                      }}
                      className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400/50 focus:bg-white/10 transition-all"
                    >
                      <option value="ambient">Ambient</option>
                      <option value="tension">Tension</option>
                      <option value="drift">Drift</option>
                      <option value="pulse">Pulse</option>
                    </select>
                  </div>

                  {/* Density */}
                  <div>
                    <label className="text-xs text-white/70 mb-2 block font-medium">Density</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={lyriaDensity}
                      onChange={(e) => {
                        const density = parseFloat(e.target.value);
                        setLyriaDensity(density);
                        lyriaEngineRef.current?.setDensity(density);
                      }}
                      className="w-full accent-blue-400"
                    />
                    <p className="text-xs text-white/50 mt-2 font-mono bg-white/5 rounded px-2 py-1 inline-block">
                      {(lyriaDensity * 100).toFixed(0)}%
                    </p>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Layer 3: Visual */}
          <section className="relative">
            <h3 className="text-xs font-mono text-white/50 tracking-wider mb-4 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-pink-400/50" />
              LAYER 3 / VISUAL MEMBRANE
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/70 mb-2 block font-medium">Mode</label>
                <select
                  value={visualMode}
                  onChange={(e) => {
                    const mode = e.target.value as VisualizationMode;
                    setVisualMode(mode);
                    rendererRef.current?.setConfig({ mode });
                  }}
                  className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-pink-400/50 focus:bg-white/10 transition-all"
                >
                  <option value="wave_field">Wave Field</option>
                  <option value="particle_cloud">Particle Cloud</option>
                  <option value="tension_arcs">Tension Arcs</option>
                  <option value="resonance_bloom">Resonance Bloom</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
            </div>
          </section>

          {/* Identity */}
          <section className="mt-auto pt-6 border-t border-white/5 relative">
            <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-lg p-4 backdrop-blur-sm border border-white/5">
              <p className="text-xs text-white/40 leading-relaxed italic">
                This is not a normal music app.
                <br />
                This is not a plugin clone.
                <br />
                This is not just "AI music generation".
                <br />
                <br />
                <span className="text-white/50">
                  This is a hybrid paradigm:
                  <br />
                  an ambiance instrument,
                  <br />
                  a playable field,
                  <br />
                  a living signal environment.
                </span>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
