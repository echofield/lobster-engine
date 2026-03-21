'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { SynthiEngine } from '@/lib/synthi-engine';

type ThemeMode = 'day' | 'night';

export default function SynthiPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<SynthiEngine | null>(null);

  const [isInitialized, setIsInitialized] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [analysisData, setAnalysisData] = useState<{ frequency: Uint8Array; waveform: Uint8Array } | null>(null);
  const [midiConnected, setMidiConnected] = useState(false);
  const [lastMidiNote, setLastMidiNote] = useState<number | null>(null);
  const [themeMode, setThemeMode] = useState<ThemeMode>('day');
  const [isPolyphonic, setIsPolyphonic] = useState(true);
  const [voiceCount, setVoiceCount] = useState(0);

  // Parameters
  const [filterFreq, setFilterFreq] = useState(2000);
  const [filterQ, setFilterQ] = useState(5);
  const [lfo1Rate, setLfo1Rate] = useState(0.5);

  // Theme colors
  const theme = {
    day: {
      bg: '#FAF8F2',
      stroke: 'rgba(26, 26, 26, 0.6)',
      lightStroke: 'rgba(26, 26, 26, 0.15)',
      accent: '#7C5CFF',
      text: '#1a1a1a',
    },
    night: {
      bg: '#0a0a0a',
      stroke: 'rgba(124, 92, 255, 0.4)',
      lightStroke: 'rgba(124, 92, 255, 0.15)',
      accent: '#7C5CFF',
      text: '#7C5CFF',
    }
  }[themeMode];

  const initEngine = async () => {
    if (isInitialized) return;
    const engine = new SynthiEngine();
    await engine.init();
    engine.onAnalysis = setAnalysisData;
    engine.onVoiceChange = (count) => {
      setVoiceCount(count);
      setIsPlaying(count > 0 || engine.getIsPlaying());
    };
    engineRef.current = engine;
    setIsInitialized(true);

    // Initialize MIDI
    initMidi();
  };

  const initMidi = async () => {
    try {
      const midiAccess = await navigator.requestMIDIAccess();
      const inputs = Array.from(midiAccess.inputs.values());

      if (inputs.length > 0) {
        setMidiConnected(true);
        inputs.forEach((input) => {
          input.onmidimessage = handleMidiMessage;
        });
      }

      midiAccess.onstatechange = (e) => {
        const port = e.port;
        if (port && port.type === 'input' && port.state === 'connected') {
          (port as MIDIInput).onmidimessage = handleMidiMessage;
          setMidiConnected(true);
        }
      };
    } catch (err) {
      console.log('[SYNTHI] MIDI not available:', err);
    }
  };

  const handleMidiMessage = useCallback((event: MIDIMessageEvent) => {
    if (!event.data) return;
    const [status, note, velocity] = event.data;
    const command = status & 0xf0;

    if (command === 0x90 && velocity > 0) {
      // Note On - use polyphonic noteOn
      setLastMidiNote(note);
      if (engineRef.current) {
        engineRef.current.noteOn(note, velocity / 127);
        setIsPlaying(true);
      }
    } else if (command === 0x80 || (command === 0x90 && velocity === 0)) {
      // Note Off - use polyphonic noteOff
      if (engineRef.current) {
        engineRef.current.noteOff(note);
      }
      setLastMidiNote(null);
    } else if (command === 0xb0) {
      // CC
      const ccValue = velocity / 127;
      if (note === 1) { // Mod wheel -> filter
        const freq = 200 + ccValue * 7800;
        setFilterFreq(freq);
        engineRef.current?.setParam('filterFreq', freq);
      } else if (note === 74) { // Filter cutoff
        const freq = 200 + ccValue * 7800;
        setFilterFreq(freq);
        engineRef.current?.setParam('filterFreq', freq);
      } else if (note === 71) { // Resonance
        const q = 0.5 + ccValue * 19.5;
        setFilterQ(q);
        engineRef.current?.setParam('filterQ', q);
      } else if (note === 123) { // All notes off
        engineRef.current?.allNotesOff();
      }
    }
  }, []);

  const togglePlay = () => {
    if (!engineRef.current) return;
    if (isPlaying) {
      engineRef.current.stop();
      setIsPlaying(false);
    } else {
      engineRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleGesture = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !engineRef.current || !isPlaying) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setMousePos({ x, y });
    engineRef.current.gesture(x, y, 0.7);
  }, [isPlaying]);

  // Draw visualization matching sketch
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    ctx.scale(2, 2);

    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    const cx = w / 2;
    const cy = h / 2;

    // Clear with theme background
    ctx.fillStyle = theme.bg;
    ctx.fillRect(0, 0, w, h);

    const strokeColor = theme.stroke;
    const accentColor = theme.accent;
    const lightStroke = theme.lightStroke;

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1;

    // === MAIN SHAPE - Asymmetric polygon matching sketch ===
    // Left section is more triangular/tapered, right extends to point
    ctx.beginPath();
    // Top edge - angled
    ctx.moveTo(cx - 160, cy - 80);   // top left
    ctx.lineTo(cx + 80, cy - 100);    // top right (higher)
    // Right triangular extension
    ctx.lineTo(cx + 180, cy - 40);    // right top point
    ctx.lineTo(cx + 200, cy + 20);    // rightmost point (arrow tip)
    ctx.lineTo(cx + 160, cy + 80);    // right bottom
    // Bottom section with small protrusion
    ctx.lineTo(cx + 40, cy + 120);    // bottom right
    ctx.lineTo(cx - 20, cy + 140);    // bottom center protrusion
    ctx.lineTo(cx - 80, cy + 100);    // bottom left of protrusion
    // Left tapered section
    ctx.lineTo(cx - 180, cy + 40);    // bottom left corner
    ctx.closePath();
    ctx.stroke();

    // === INTERNAL DIVIDING LINES ===
    // Vertical center line through circle
    ctx.beginPath();
    ctx.moveTo(cx, cy - 60);
    ctx.lineTo(cx, cy + 60);
    ctx.strokeStyle = lightStroke;
    ctx.stroke();

    // Secondary vertical line
    ctx.beginPath();
    ctx.moveTo(cx + 15, cy - 55);
    ctx.lineTo(cx + 15, cy + 55);
    ctx.stroke();

    // Diagonal dividers
    ctx.strokeStyle = strokeColor;
    ctx.beginPath();
    ctx.moveTo(cx - 60, cy - 70);
    ctx.lineTo(cx - 100, cy + 60);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx + 60, cy - 80);
    ctx.lineTo(cx + 140, cy + 40);
    ctx.stroke();

    // === CENTER MATRIX CIRCLE ===
    ctx.beginPath();
    ctx.arc(cx - 20, cy + 10, 55, 0, Math.PI * 2);
    ctx.strokeStyle = isPlaying ? accentColor : strokeColor;
    ctx.lineWidth = isPlaying ? 1.5 : 1;
    ctx.stroke();

    // Inner circles in matrix
    const matrixCx = cx - 20;
    const matrixCy = cy + 10;

    // Arrange circles like in sketch
    const innerCircles = [
      { x: -25, y: -20, r: 10 },
      { x: 15, y: -15, r: 8 },
      { x: -30, y: 20, r: 12 },
      { x: 10, y: 25, r: 9 },
      { x: -5, y: 0, r: 6 },
    ];

    ctx.lineWidth = 1;
    innerCircles.forEach((c, i) => {
      ctx.beginPath();
      ctx.arc(matrixCx + c.x, matrixCy + c.y, c.r, 0, Math.PI * 2);
      if (isPlaying && analysisData) {
        const intensity = analysisData.frequency[i * 20] / 255;
        ctx.fillStyle = `rgba(124, 92, 255, ${0.2 + intensity * 0.6})`;
        ctx.fill();
      }
      ctx.strokeStyle = strokeColor;
      ctx.stroke();
    });

    // Diamond in matrix
    const diamondSize = 12;
    ctx.beginPath();
    ctx.moveTo(matrixCx + 30, matrixCy - 10);
    ctx.lineTo(matrixCx + 30 + diamondSize, matrixCy - 10 + diamondSize);
    ctx.lineTo(matrixCx + 30, matrixCy - 10 + diamondSize * 2);
    ctx.lineTo(matrixCx + 30 - diamondSize, matrixCy - 10 + diamondSize);
    ctx.closePath();
    ctx.strokeStyle = isPlaying ? accentColor : strokeColor;
    ctx.stroke();

    // === LEFT SECTION - Oscillators ===
    const leftX = cx - 130;

    // Top rectangles (oscillator controls)
    ctx.strokeStyle = strokeColor;
    ctx.strokeRect(leftX - 30, cy - 70, 18, 22);
    ctx.strokeRect(leftX - 5, cy - 70, 18, 22);
    ctx.strokeRect(leftX + 20, cy - 65, 14, 18);

    // Vertical hatching lines
    ctx.strokeStyle = lightStroke;
    for (let i = 0; i < 12; i++) {
      ctx.beginPath();
      ctx.moveTo(leftX - 25 + i * 4, cy - 40);
      ctx.lineTo(leftX - 25 + i * 4, cy + 20);
      ctx.stroke();
    }

    // Wavy line (like in sketch)
    ctx.beginPath();
    ctx.strokeStyle = strokeColor;
    for (let i = 0; i < 40; i++) {
      const x = leftX - 30 + i * 2;
      const y = cy + 35 + Math.sin(i * 0.5) * 5;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Small shapes at bottom left
    ctx.strokeRect(leftX - 35, cy + 55, 10, 10);
    ctx.beginPath();
    ctx.arc(leftX - 15, cy + 60, 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(leftX + 5, cy + 65, 5, 0, Math.PI * 2);
    ctx.stroke();

    // === RIGHT SECTION - Filter / Output ===
    const rightX = cx + 100;

    // Circles in triangular section
    ctx.strokeStyle = strokeColor;
    ctx.beginPath();
    ctx.arc(rightX, cy - 50, 14, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(rightX + 40, cy - 30, 12, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(rightX + 20, cy + 10, 10, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(rightX + 60, cy + 30, 8, 0, Math.PI * 2);
    ctx.stroke();

    // Hatching in right section
    ctx.strokeStyle = lightStroke;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(rightX + 80 + i * 5, cy - 20);
      ctx.lineTo(rightX + 100 + i * 5, cy + 40);
      ctx.stroke();
    }

    // === BOTTOM PROTRUSION ===
    ctx.strokeStyle = strokeColor;
    ctx.beginPath();
    ctx.arc(cx - 40, cy + 115, 7, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy + 125, 6, 0, Math.PI * 2);
    ctx.stroke();

    // Small cross/star
    ctx.beginPath();
    ctx.moveTo(cx - 60, cy + 120);
    ctx.lineTo(cx - 50, cy + 120);
    ctx.moveTo(cx - 55, cy + 115);
    ctx.lineTo(cx - 55, cy + 125);
    ctx.stroke();

    // === WAVEFORM VISUALIZATION ===
    if (isPlaying && analysisData) {
      ctx.beginPath();
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 1.5;
      const waveRadius = 40;
      for (let i = 0; i < analysisData.waveform.length; i += 4) {
        const angle = (i / analysisData.waveform.length) * Math.PI * 2;
        const amp = (analysisData.waveform[i] - 128) / 128;
        const r = waveRadius + amp * 12;
        const px = matrixCx + Math.cos(angle) * r;
        const py = matrixCy + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    }

    // === GESTURE INDICATOR ===
    if (isPlaying) {
      const gx = mousePos.x * w;
      const gy = mousePos.y * h;
      ctx.beginPath();
      ctx.arc(gx, gy, 4, 0, Math.PI * 2);
      ctx.fillStyle = accentColor;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(matrixCx, matrixCy);
      ctx.lineTo(gx, gy);
      ctx.strokeStyle = 'rgba(124, 92, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // === CORNER MARKS ===
    ctx.strokeStyle = 'rgba(26, 26, 26, 0.15)';
    ctx.lineWidth = 1;
    [[20, 20], [w - 20, 20], [20, h - 20], [w - 20, h - 20]].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.moveTo(x, y + (y < h / 2 ? 12 : -12));
      ctx.lineTo(x, y);
      ctx.lineTo(x + (x < w / 2 ? 12 : -12), y);
      ctx.stroke();
    });

  }, [analysisData, isPlaying, mousePos, theme]);

  useEffect(() => {
    // Start drawing loop even without audio
    const draw = () => {
      if (canvasRef.current && !analysisData) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          // Trigger initial draw
          setAnalysisData({
            frequency: new Uint8Array(1024).fill(0),
            waveform: new Uint8Array(1024).fill(128)
          });
        }
      }
    };
    draw();

    return () => { engineRef.current?.dispose(); };
  }, []);

  const toggleTheme = () => setThemeMode(prev => prev === 'day' ? 'night' : 'day');

  return (
    <div
      className="min-h-screen relative overflow-hidden transition-colors duration-500"
      style={{ background: themeMode === 'night' ? '#0a0a0a' : 'var(--background)' }}
    >
      {/* Corner marks */}
      <div
        className="absolute w-3 h-3 border-l border-t transition-colors"
        style={{ top: 24, left: 24, borderColor: themeMode === 'night' ? 'rgba(124,92,255,0.3)' : 'var(--border)' }}
      />
      <div
        className="absolute w-3 h-3 border-r border-t transition-colors"
        style={{ top: 24, right: 24, borderColor: themeMode === 'night' ? 'rgba(124,92,255,0.3)' : 'var(--border)' }}
      />
      <div
        className="absolute w-3 h-3 border-l border-b transition-colors"
        style={{ bottom: 24, left: 24, borderColor: themeMode === 'night' ? 'rgba(124,92,255,0.3)' : 'var(--border)' }}
      />
      <div
        className="absolute w-3 h-3 border-r border-b transition-colors"
        style={{ bottom: 24, right: 24, borderColor: themeMode === 'night' ? 'rgba(124,92,255,0.3)' : 'var(--border)' }}
      />

      {/* Header */}
      <div className="fixed top-6 left-6 z-20">
        <Link
          href="/"
          className="text-[10px] uppercase tracking-[0.15em] opacity-40 hover:opacity-100 transition-opacity"
          style={{ color: themeMode === 'night' ? '#7C5CFF' : 'var(--foreground)' }}
        >
          ← Home
        </Link>
      </div>

      <div className="fixed top-6 right-6 z-20 flex items-center gap-4">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="text-[10px] uppercase tracking-[0.15em] opacity-40 hover:opacity-100 transition-opacity"
          style={{ color: themeMode === 'night' ? '#7C5CFF' : 'var(--foreground)' }}
        >
          {themeMode === 'day' ? '◐ night' : '○ day'}
        </button>
        {/* Poly/Mono toggle */}
        <button
          onClick={() => {
            const newMode = !isPolyphonic;
            setIsPolyphonic(newMode);
            engineRef.current?.setPolyphonic(newMode);
          }}
          className="text-[10px] uppercase tracking-[0.15em] opacity-40 hover:opacity-100 transition-opacity"
          style={{ color: themeMode === 'night' ? '#7C5CFF' : 'var(--foreground)' }}
        >
          {isPolyphonic ? 'poly' : 'mono'}
        </button>
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full transition-all"
            style={{
              background: midiConnected ? '#7C5CFF' : (themeMode === 'night' ? '#333' : 'var(--border-strong)'),
              opacity: midiConnected ? 1 : 0.3
            }}
          />
          <span
            className="text-[10px] uppercase tracking-[0.15em] opacity-40"
            style={{ color: themeMode === 'night' ? '#7C5CFF' : 'var(--foreground)' }}
          >
            {midiConnected ? 'midi' : 'no midi'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full transition-all"
            style={{
              background: isPlaying ? '#7C5CFF' : (themeMode === 'night' ? '#333' : 'var(--border-strong)'),
              opacity: isPlaying ? 1 : 0.4,
              boxShadow: isPlaying && themeMode === 'night' ? '0 0 10px #7C5CFF' : 'none'
            }}
          />
          <span
            className="text-[10px] uppercase tracking-[0.15em] opacity-40"
            style={{ color: themeMode === 'night' ? '#7C5CFF' : 'var(--foreground)' }}
          >
            {isPlaying ? (voiceCount > 0 ? `${voiceCount} voice${voiceCount > 1 ? 's' : ''}` : 'active') : 'idle'}
          </span>
        </div>
      </div>

      <div
        className="fixed bottom-6 left-6 text-[9px] uppercase tracking-[0.15em] opacity-20"
        style={{ color: themeMode === 'night' ? '#7C5CFF' : 'var(--foreground)' }}
      >
        SYNTHI-0321
      </div>

      {/* Main Canvas */}
      <div className="h-screen flex items-center justify-center">
        <div className="relative">
          {/* Title */}
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 text-center">
            <h1
              className="text-xl font-medium tracking-[0.2em] mb-1"
              style={{ color: themeMode === 'night' ? '#7C5CFF' : 'var(--foreground)' }}
            >
              SYNTHI
            </h1>
            <p
              className="text-[10px] uppercase tracking-[0.15em] opacity-30"
              style={{ color: themeMode === 'night' ? '#7C5CFF' : 'var(--foreground)' }}
            >
              Geometric Sound Engine
            </p>
          </div>

          {/* Canvas */}
          <canvas
            ref={canvasRef}
            className="cursor-crosshair transition-all duration-500"
            style={{ width: 560, height: 420 }}
            onMouseMove={handleGesture}
            onClick={isInitialized ? togglePlay : initEngine}
          />

          {/* Init overlay */}
          {!isInitialized && (
            <div
              className="absolute inset-0 flex items-center justify-center transition-colors duration-500"
              style={{ background: themeMode === 'night' ? 'rgba(10,10,10,0.8)' : 'rgba(250,248,242,0.8)' }}
            >
              <button
                onClick={initEngine}
                className="px-6 py-3 border text-xs uppercase tracking-[0.2em] transition-all hover:bg-[#7C5CFF]"
                style={{
                  borderColor: '#7C5CFF',
                  color: '#7C5CFF',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = themeMode === 'night' ? '#000' : '#fff'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#7C5CFF'}
              >
                Initialize Audio
              </button>
            </div>
          )}

          {/* Controls */}
          {isInitialized && (
            <div className="absolute -bottom-28 left-1/2 -translate-x-1/2 flex items-center gap-8">
              <button
                onClick={togglePlay}
                className="w-12 h-12 border rounded-full flex items-center justify-center transition-all"
                style={{
                  borderColor: '#7C5CFF',
                  background: isPlaying ? '#7C5CFF' : 'transparent',
                  color: isPlaying ? (themeMode === 'night' ? '#000' : '#fff') : '#7C5CFF'
                }}
              >
                {isPlaying ? '■' : '▶'}
              </button>

              {/* Parameter sliders */}
              <div className="flex gap-6">
                {[
                  { label: 'FREQ', value: filterFreq, set: setFilterFreq, min: 100, max: 8000, param: 'filterFreq' },
                  { label: 'Q', value: filterQ, set: setFilterQ, min: 0.5, max: 20, param: 'filterQ' },
                  { label: 'LFO', value: lfo1Rate, set: setLfo1Rate, min: 0.1, max: 10, param: 'lfo1Rate' },
                ].map(({ label, value, set, min, max, param }) => (
                  <div key={label} className="text-center">
                    <input
                      type="range"
                      min={min}
                      max={max}
                      step={(max - min) / 100}
                      value={value}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        set(v);
                        if (param === 'filterFreq') engineRef.current?.setParam('filterFreq', v);
                        if (param === 'filterQ') engineRef.current?.setParam('filterQ', v);
                        if (param === 'lfo1Rate') engineRef.current?.setParam('lfo1Rate', v);
                      }}
                      className="w-20 accent-[#7C5CFF]"
                    />
                    <div
                      className="text-[9px] uppercase tracking-[0.1em] mt-1 opacity-40"
                      style={{ color: themeMode === 'night' ? '#7C5CFF' : 'var(--foreground)' }}
                    >
                      {label}
                    </div>
                  </div>
                ))}
              </div>

              {/* MIDI indicator */}
              {lastMidiNote !== null && (
                <div className="text-center">
                  <div
                    className="text-[9px] uppercase tracking-[0.1em] opacity-60"
                    style={{ color: themeMode === 'night' ? '#7C5CFF' : 'var(--foreground)' }}
                  >
                    MIDI
                  </div>
                  <div
                    className="text-sm font-mono"
                    style={{ color: themeMode === 'night' ? '#7C5CFF' : 'var(--foreground)' }}
                  >
                    {lastMidiNote}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="fixed bottom-6 right-6 text-right">
        <p
          className="text-[9px] uppercase tracking-[0.1em] opacity-30"
          style={{ color: themeMode === 'night' ? '#7C5CFF' : 'var(--foreground)' }}
        >
          Click to play • Mouse to modulate • MIDI supported
        </p>
      </div>
    </div>
  );
}
