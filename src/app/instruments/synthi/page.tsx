'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { SynthiEngine } from '@/lib/synthi-engine';

type ZoneId = 'osc' | 'matrix' | 'filter' | 'output' | 'lfo1' | 'lfo2';

export default function SynthiPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<SynthiEngine | null>(null);

  const [isInitialized, setIsInitialized] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeZone, setActiveZone] = useState<ZoneId | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [analysisData, setAnalysisData] = useState<{ frequency: Uint8Array; waveform: Uint8Array } | null>(null);

  // Parameters
  const [osc1Freq, setOsc1Freq] = useState(220);
  const [osc2Freq, setOsc2Freq] = useState(220.5);
  const [osc3Freq, setOsc3Freq] = useState(110);
  const [filterFreq, setFilterFreq] = useState(2000);
  const [filterQ, setFilterQ] = useState(5);
  const [lfo1Rate, setLfo1Rate] = useState(0.5);
  const [lfo1Depth, setLfo1Depth] = useState(50);

  const initEngine = async () => {
    if (isInitialized) return;
    const engine = new SynthiEngine();
    await engine.init();
    engine.onAnalysis = setAnalysisData;
    engineRef.current = engine;
    setIsInitialized(true);
  };

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

  // Draw visualization
  useEffect(() => {
    if (!canvasRef.current || !analysisData) return;
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

    // Clear
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, w, h);

    // Draw geometric frame (matching sketch)
    ctx.strokeStyle = 'rgba(124, 92, 255, 0.3)';
    ctx.lineWidth = 1;

    // Outer trapezoid shape
    ctx.beginPath();
    ctx.moveTo(cx - 180, cy - 100); // top left
    ctx.lineTo(cx + 120, cy - 80);  // top right (angled)
    ctx.lineTo(cx + 150, cy + 100); // bottom right
    ctx.lineTo(cx + 50, cy + 140);  // bottom spike right
    ctx.lineTo(cx, cy + 160);       // spike point
    ctx.lineTo(cx - 50, cy + 140);  // bottom spike left
    ctx.lineTo(cx - 160, cy + 80);  // bottom left
    ctx.closePath();
    ctx.stroke();

    // Center matrix circle
    ctx.beginPath();
    ctx.arc(cx, cy, 60, 0, Math.PI * 2);
    ctx.strokeStyle = isPlaying ? 'rgba(124, 92, 255, 0.8)' : 'rgba(124, 92, 255, 0.3)';
    ctx.stroke();

    // Inner matrix circles
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
      const r = 35;
      const px = cx + Math.cos(angle) * r;
      const py = cy + Math.sin(angle) * r;
      ctx.beginPath();
      ctx.arc(px, py, 8, 0, Math.PI * 2);
      ctx.fillStyle = isPlaying ? `rgba(124, 92, 255, ${0.3 + (analysisData.frequency[i * 10] / 255) * 0.7})` : 'rgba(124, 92, 255, 0.2)';
      ctx.fill();
    }

    // Left zone - oscillator rectangles
    const leftX = cx - 140;
    ctx.strokeStyle = 'rgba(124, 92, 255, 0.4)';
    ctx.strokeRect(leftX - 25, cy - 60, 20, 30);
    ctx.strokeRect(leftX - 25, cy - 20, 20, 30);
    ctx.strokeRect(leftX - 25, cy + 20, 20, 30);

    // Hatching in left zone
    ctx.strokeStyle = 'rgba(124, 92, 255, 0.15)';
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(leftX - 50, cy - 40 + i * 10);
      ctx.lineTo(leftX - 30, cy - 40 + i * 10);
      ctx.stroke();
    }

    // Right zone - filter circles
    const rightX = cx + 100;
    ctx.strokeStyle = 'rgba(124, 92, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(rightX, cy - 40, 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(rightX, cy + 10, 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(rightX + 30, cy + 50, 8, 0, Math.PI * 2);
    ctx.stroke();

    // Waveform visualization in center
    if (isPlaying) {
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(124, 92, 255, 0.6)';
      const waveRadius = 45;
      for (let i = 0; i < analysisData.waveform.length; i += 4) {
        const angle = (i / analysisData.waveform.length) * Math.PI * 2;
        const amp = (analysisData.waveform[i] - 128) / 128;
        const r = waveRadius + amp * 15;
        const px = cx + Math.cos(angle) * r;
        const py = cy + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    }

    // Gesture indicator
    if (isPlaying) {
      const gx = mousePos.x * w;
      const gy = mousePos.y * h;
      ctx.beginPath();
      ctx.arc(gx, gy, 5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(124, 92, 255, 0.8)';
      ctx.fill();

      // Connection line to center
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(gx, gy);
      ctx.strokeStyle = 'rgba(124, 92, 255, 0.2)';
      ctx.stroke();
    }

    // Corner marks
    ctx.strokeStyle = 'rgba(124, 92, 255, 0.2)';
    ctx.lineWidth = 1;
    [[20, 20], [w - 20, 20], [20, h - 20], [w - 20, h - 20]].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.moveTo(x, y + (y < h / 2 ? 15 : -15));
      ctx.lineTo(x, y);
      ctx.lineTo(x + (x < w / 2 ? 15 : -15), y);
      ctx.stroke();
    });

  }, [analysisData, isPlaying, mousePos]);

  useEffect(() => {
    return () => { engineRef.current?.dispose(); };
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#0a0a0a' }}>
      {/* Header */}
      <div className="fixed top-6 left-6 z-20">
        <Link href="/instruments" className="text-xs uppercase tracking-[0.15em] opacity-40 hover:opacity-100 transition-opacity" style={{ color: '#7C5CFF' }}>
          ← Instruments
        </Link>
      </div>

      <div className="fixed top-6 right-6 z-20 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full transition-all" style={{ background: isPlaying ? '#7C5CFF' : '#333', boxShadow: isPlaying ? '0 0 10px #7C5CFF' : 'none' }} />
          <span className="text-xs uppercase tracking-[0.15em] opacity-40" style={{ color: '#7C5CFF' }}>{isPlaying ? 'active' : 'idle'}</span>
        </div>
      </div>

      <div className="fixed bottom-6 left-6 text-xs uppercase tracking-[0.15em] opacity-20" style={{ color: '#7C5CFF' }}>
        SYNTHI-0321
      </div>

      {/* Main Canvas */}
      <div className="h-screen flex items-center justify-center">
        <div className="relative">
          {/* Title */}
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 text-center">
            <h1 className="text-2xl font-light tracking-[0.2em] mb-2" style={{ color: '#7C5CFF' }}>SYNTHI</h1>
            <p className="text-xs uppercase tracking-[0.2em] opacity-30" style={{ color: '#7C5CFF' }}>Geometric Sound Engine</p>
          </div>

          {/* Canvas */}
          <canvas
            ref={canvasRef}
            className="cursor-crosshair"
            style={{ width: 500, height: 400 }}
            onMouseMove={handleGesture}
            onClick={isInitialized ? togglePlay : initEngine}
          />

          {/* Init overlay */}
          {!isInitialized && (
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={initEngine}
                className="px-6 py-3 border text-xs uppercase tracking-[0.2em] transition-all hover:bg-[#7C5CFF] hover:text-black"
                style={{ borderColor: '#7C5CFF', color: '#7C5CFF' }}
              >
                Initialize
              </button>
            </div>
          )}

          {/* Controls */}
          {isInitialized && (
            <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 flex items-center gap-8">
              <button
                onClick={togglePlay}
                className="w-12 h-12 border rounded-full flex items-center justify-center transition-all"
                style={{
                  borderColor: '#7C5CFF',
                  background: isPlaying ? '#7C5CFF' : 'transparent',
                  color: isPlaying ? '#000' : '#7C5CFF'
                }}
              >
                {isPlaying ? '■' : '▶'}
              </button>

              {/* Parameter knobs */}
              <div className="flex gap-4">
                {[
                  { label: 'FREQ', value: filterFreq, set: setFilterFreq, min: 100, max: 8000 },
                  { label: 'Q', value: filterQ, set: setFilterQ, min: 0.5, max: 20 },
                  { label: 'LFO', value: lfo1Rate, set: setLfo1Rate, min: 0.1, max: 10 },
                ].map(({ label, value, set, min, max }) => (
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
                        if (label === 'FREQ') engineRef.current?.setParam('filterFreq', v);
                        if (label === 'Q') engineRef.current?.setParam('filterQ', v);
                        if (label === 'LFO') engineRef.current?.setParam('lfo1Rate', v);
                      }}
                      className="w-16 accent-[#7C5CFF]"
                      style={{ filter: 'hue-rotate(260deg)' }}
                    />
                    <div className="text-[9px] uppercase tracking-[0.1em] mt-1 opacity-40" style={{ color: '#7C5CFF' }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="fixed bottom-6 right-6 text-right">
        <p className="text-[9px] uppercase tracking-[0.1em] opacity-30" style={{ color: '#7C5CFF' }}>
          Click to play • Move mouse to modulate
        </p>
      </div>
    </div>
  );
}
