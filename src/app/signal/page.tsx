'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { SignalEngine } from '@/lib/signal-engine';
import { LyriaStreamEngine } from '@/lib/lyria-stream-engine';
import { FieldRenderer } from '@/lib/field-renderer';
import type { Scale, SignalVoiceType, LyriaMood, VisualizationMode } from '@/types/signal';

export default function SignalFieldPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signalEngineRef = useRef<SignalEngine | null>(null);
  const lyriaEngineRef = useRef<LyriaStreamEngine | null>(null);
  const rendererRef = useRef<FieldRenderer | null>(null);

  const [isInitialized, setIsInitialized] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeVoiceCount, setActiveVoiceCount] = useState(0);

  const [scale, setScale] = useState<Scale>('pentatonic');
  const [root, setRoot] = useState(60);
  const [voiceType, setVoiceType] = useState<SignalVoiceType>('pad');

  const [lyriaEnabled, setLyriaEnabled] = useState(false);
  const [lyriaConnected, setLyriaConnected] = useState(false);
  const [lyriaMood, setLyriaMood] = useState<LyriaMood>('ambient');
  const [lyriaDensity, setLyriaDensity] = useState(0.3);

  const [visualMode, setVisualMode] = useState<VisualizationMode>('wave_field');
  const [mouseDown, setMouseDown] = useState(false);
  const [mouseEnergy, setMouseEnergy] = useState(0);

  useEffect(() => {
    const init = async () => {
      if (!canvasRef.current) return;
      try {
        const signalEngine = new SignalEngine();
        await signalEngine.init();
        signalEngine.onVoiceStart = () => { setActiveVoiceCount(signalEngine.getActiveVoiceCount()); setIsPlaying(true); };
        signalEngine.onVoiceEnd = () => { setActiveVoiceCount(signalEngine.getActiveVoiceCount()); if (signalEngine.getActiveVoiceCount() === 0) setIsPlaying(false); };
        signalEngine.onMusicalContextChange = (context) => { if (lyriaEngineRef.current && lyriaEnabled) lyriaEngineRef.current.updateFromMusicalContext(context, activeVoiceCount / 16); };
        signalEngineRef.current = signalEngine;

        const renderer = new FieldRenderer(canvasRef.current, { mode: visualMode, color: '#7C5CFF', accentColor: '#9B7FFF' });
        renderer.start();
        rendererRef.current = renderer;

        const lyriaEngine = new LyriaStreamEngine();
        await lyriaEngine.init(signalEngine.isReady() ? signalEngine['ctx']! : new AudioContext());
        lyriaEngine.onConnectionStateChange = (state) => setLyriaConnected(state === 'connected' || state === 'streaming');
        lyriaEngineRef.current = lyriaEngine;

        setIsInitialized(true);
      } catch (error) { console.error('[SIGNAL/FIELD] Initialization failed:', error); }
    };
    init();
    return () => { signalEngineRef.current?.dispose(); lyriaEngineRef.current?.dispose(); rendererRef.current?.dispose(); };
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    const interval = setInterval(() => {
      rendererRef.current?.updateAnalysisData({ energy: activeVoiceCount / 16, brightness: mouseEnergy, pitch: root });
    }, 50);
    return () => clearInterval(interval);
  }, [isInitialized, activeVoiceCount, root, mouseEnergy]);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isInitialized || !canvasRef.current) return;
    setMouseDown(true);
    const rect = canvasRef.current.getBoundingClientRect();
    const velocity = Math.min(1, Math.max(0.3, (e.clientY - rect.top) / rect.height));
    const note = root + Math.floor(((e.clientX - rect.left) / rect.width) * 12);
    signalEngineRef.current?.playNote(note, velocity, voiceType);
    setMouseEnergy(velocity);
  }, [isInitialized, root, voiceType]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!mouseDown || !isInitialized || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const velocity = Math.min(1, Math.max(0.3, (e.clientY - rect.top) / rect.height));
    const note = root + Math.floor(((e.clientX - rect.left) / rect.width) * 12);
    signalEngineRef.current?.playNote(note, velocity, voiceType);
    setMouseEnergy(velocity);
    if (lyriaEngineRef.current && lyriaEnabled) lyriaEngineRef.current.setGestureEnergy(velocity);
  }, [mouseDown, isInitialized, root, voiceType, lyriaEnabled]);

  const handleCanvasMouseUp = useCallback(() => { setMouseDown(false); setMouseEnergy(0); }, []);

  const toggleLyria = useCallback(async () => {
    if (!lyriaEngineRef.current) return;
    if (lyriaEnabled) { lyriaEngineRef.current.disconnect(); setLyriaEnabled(false); }
    else { await lyriaEngineRef.current.connect(); setLyriaEnabled(true); }
  }, [lyriaEnabled]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isInitialized) return;
      const keyMap: Record<string, number> = { 'a': 0, 's': 1, 'd': 2, 'f': 3, 'g': 4, 'h': 5, 'j': 6, 'k': 7, 'w': 8, 'e': 9, 'r': 10, 't': 11, 'y': 12, 'u': 13 };
      const offset = keyMap[e.key];
      if (offset !== undefined) signalEngineRef.current?.playNote(root + offset, 0.7, voiceType);
      if (e.key === ' ') { e.preventDefault(); toggleLyria(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isInitialized, root, voiceType, toggleLyria]);

  return (
    <div className="min-h-screen relative overflow-hidden flex">
      {/* Corner Marks */}
      <div className="corner-mark top-left" style={{ top: 24, left: 24 }} />
      <div className="corner-mark top-right" style={{ top: 24, right: 24 }} />
      <div className="corner-mark bottom-left" style={{ bottom: 24, left: 24 }} />
      <div className="corner-mark bottom-right" style={{ bottom: 24, right: 24 }} />

      {/* Build Label */}
      <div className="fixed bottom-6 left-6 build-label">SIGNAL-0321</div>

      {/* Back Link */}
      <div className="fixed top-6 left-6 z-20">
        <Link href="/" className="nav-link">← Home</Link>
      </div>

      {/* Status */}
      <div className="fixed top-6 right-6 z-20 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full transition-all" style={{ background: isPlaying ? 'var(--accent)' : 'var(--border-strong)', opacity: isPlaying ? 1 : 0.4 }} />
          <span className="label-micro">{activeVoiceCount} voices</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full transition-all" style={{ background: lyriaConnected ? 'var(--accent)' : 'var(--border-strong)', opacity: lyriaConnected ? 1 : 0.4 }} />
          <span className="label-micro">{lyriaConnected ? 'lyria' : 'offline'}</span>
        </div>
      </div>

      {/* Canvas Field */}
      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair"
          style={{ background: 'var(--muted)' }}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
        />

        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="w-16 h-16 border border-[var(--border)] mx-auto mb-6 flex items-center justify-center">
                <div className="w-2 h-2 bg-[var(--accent)]" />
              </div>
              <h2 className="text-lg font-medium tracking-wide mb-2">Signal Field</h2>
              <p className="text-xs uppercase tracking-[0.2em] opacity-30 mb-6">Click or drag to play</p>
              <p className="label-micro opacity-30">ASDFGHJK keys • Space for Lyria</p>
            </div>
          </div>
        )}
      </div>

      {/* Control Panel */}
      <div className="w-72 border-l border-[var(--border)] p-6 flex flex-col gap-8 overflow-y-auto bg-[var(--card)]">
        {/* Deterministic Layer */}
        <section>
          <h3 className="label-micro opacity-40 mb-4">Layer 1 / Deterministic</h3>
          <div className="space-y-4">
            <div>
              <label className="label-micro block mb-2">Voice</label>
              <select
                value={voiceType}
                onChange={(e) => setVoiceType(e.target.value as SignalVoiceType)}
                className="w-full bg-transparent border border-[var(--border)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"
              >
                <option value="pad">Pad</option>
                <option value="drone">Drone</option>
                <option value="pulse">Pulse</option>
                <option value="lead">Lead</option>
                <option value="texture">Texture</option>
              </select>
            </div>
            <div>
              <label className="label-micro block mb-2">Scale</label>
              <select
                value={scale}
                onChange={(e) => { const s = e.target.value as Scale; setScale(s); signalEngineRef.current?.setScale(s); }}
                className="w-full bg-transparent border border-[var(--border)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"
              >
                <option value="pentatonic">Pentatonic</option>
                <option value="major">Major</option>
                <option value="minor">Minor</option>
                <option value="dorian">Dorian</option>
                <option value="lydian">Lydian</option>
              </select>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <label className="label-micro">Root</label>
                <span className="label-micro">MIDI {root}</span>
              </div>
              <input
                type="range"
                min="36"
                max="84"
                value={root}
                onChange={(e) => { const r = parseInt(e.target.value); setRoot(r); signalEngineRef.current?.setRoot(r); }}
                className="w-full accent-[var(--accent)]"
              />
            </div>
          </div>
        </section>

        {/* Lyria Layer */}
        <section>
          <h3 className="label-micro opacity-40 mb-4">Layer 2 / Lyria</h3>
          <div className="space-y-4">
            <button
              onClick={toggleLyria}
              className={lyriaEnabled ? 'btn-primary w-full' : 'btn-outline w-full'}
              style={lyriaEnabled ? { background: 'var(--accent)', color: 'var(--accent-foreground)', borderColor: 'var(--accent)' } : {}}
            >
              {lyriaEnabled ? 'Lyria Active' : 'Activate Lyria'}
            </button>

            {lyriaEnabled && (
              <>
                <div>
                  <label className="label-micro block mb-2">Mood</label>
                  <select
                    value={lyriaMood}
                    onChange={(e) => { const m = e.target.value as LyriaMood; setLyriaMood(m); lyriaEngineRef.current?.setMood(m); }}
                    className="w-full bg-transparent border border-[var(--border)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"
                  >
                    <option value="ambient">Ambient</option>
                    <option value="tension">Tension</option>
                    <option value="drift">Drift</option>
                    <option value="pulse">Pulse</option>
                  </select>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="label-micro">Density</label>
                    <span className="label-micro">{Math.round(lyriaDensity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={lyriaDensity}
                    onChange={(e) => { const d = parseFloat(e.target.value); setLyriaDensity(d); lyriaEngineRef.current?.setDensity(d); }}
                    className="w-full accent-[var(--accent)]"
                  />
                </div>
              </>
            )}
          </div>
        </section>

        {/* Visual Layer */}
        <section>
          <h3 className="label-micro opacity-40 mb-4">Layer 3 / Visual</h3>
          <div>
            <label className="label-micro block mb-2">Mode</label>
            <select
              value={visualMode}
              onChange={(e) => { const m = e.target.value as VisualizationMode; setVisualMode(m); rendererRef.current?.setConfig({ mode: m }); }}
              className="w-full bg-transparent border border-[var(--border)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent)]"
            >
              <option value="wave_field">Wave Field</option>
              <option value="particle_cloud">Particle Cloud</option>
              <option value="tension_arcs">Tension Arcs</option>
              <option value="resonance_bloom">Resonance Bloom</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>
        </section>

        {/* Footer */}
        <div className="mt-auto pt-6 border-t border-[var(--border)]">
          <p className="text-xs opacity-30 leading-relaxed">
            Hybrid ambient field instrument. Part deterministic, part generative, part visual.
          </p>
        </div>
      </div>
    </div>
  );
}
