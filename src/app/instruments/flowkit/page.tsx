'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as Tone from 'tone';

// ============ TYPES ============

interface FlowState {
  energy: number;      // 0-1: intensity of hits
  density: number;     // 0-1: how many hits
  chaos: number;       // 0-1: randomness
  humanize: number;    // 0-1: timing variation
}

interface WaveParams {
  comp: number;        // compression/glue
  pick: number;        // pattern bias (house/trap/broken)
  magic: number;       // ghost notes/variation
}

interface DrumKit {
  name: string;
  kick: string;
  snare: string;
  hihat: string;
}

interface StepPattern {
  kick: boolean[];
  snare: boolean[];
  hihat: boolean[];
}

type DrumType = 'kick' | 'snare' | 'hihat';

// ============ DEFAULT PATTERNS ============

const PRESET_PATTERNS: { name: string; pattern: StepPattern }[] = [
  { name: 'FOUR', pattern: {
    kick:  [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0].map(Boolean),
    snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0].map(Boolean),
    hihat: [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0].map(Boolean),
  }},
  { name: 'HOUSE', pattern: {
    kick:  [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0].map(Boolean),
    snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0].map(Boolean),
    hihat: [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1].map(Boolean),
  }},
  { name: 'BREAK', pattern: {
    kick:  [1,0,0,0, 0,0,1,0, 0,0,1,0, 0,0,0,0].map(Boolean),
    snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,1].map(Boolean),
    hihat: [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0].map(Boolean),
  }},
  { name: 'TRAP', pattern: {
    kick:  [1,0,0,0, 0,0,0,0, 1,0,1,0, 0,0,0,0].map(Boolean),
    snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0].map(Boolean),
    hihat: [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1].map(Boolean),
  }},
  { name: 'TECH', pattern: {
    kick:  [1,0,0,1, 0,0,1,0, 0,1,0,0, 1,0,0,0].map(Boolean),
    snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0].map(Boolean),
    hihat: [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,1].map(Boolean),
  }},
  { name: 'FUNK', pattern: {
    kick:  [1,0,0,0, 0,0,1,0, 1,0,0,0, 0,0,0,0].map(Boolean),
    snare: [0,0,0,0, 1,0,0,1, 0,0,0,0, 1,0,0,0].map(Boolean),
    hihat: [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0].map(Boolean),
  }},
  { name: 'MINIMAL', pattern: {
    kick:  [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0].map(Boolean),
    snare: [0,0,0,0, 0,0,0,0, 0,0,0,0, 1,0,0,0].map(Boolean),
    hihat: [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0].map(Boolean),
  }},
  { name: 'EMPTY', pattern: {
    kick:  Array(16).fill(false),
    snare: Array(16).fill(false),
    hihat: Array(16).fill(false),
  }},
];

// ============ DRUM KITS ============

const KITS: DrumKit[] = [
  { name: '808', kick: 'C1', snare: 'D1', hihat: 'F#1' },
  { name: 'ANALOG', kick: 'C1', snare: 'D1', hihat: 'F#1' },
  { name: 'ACOUSTIC', kick: 'C1', snare: 'D1', hihat: 'F#1' },
];

// ============ COMPONENT ============

export default function FlowKitPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const synthsRef = useRef<{
    kick: Tone.MembraneSynth | null;
    snare: Tone.NoiseSynth | null;
    hihat: Tone.MetalSynth | null;
  }>({ kick: null, snare: null, hihat: null });
  const sequenceRef = useRef<Tone.Loop | null>(null);

  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [swing, setSwing] = useState(0);
  const [kitIndex, setKitIndex] = useState(0);

  const [wave, setWave] = useState<WaveParams>({
    comp: 0.5,
    pick: 0.5,
    magic: 0.3,
  });

  const [flow, setFlow] = useState<FlowState>({
    energy: 0.7,
    density: 0.5,
    chaos: 0.2,
    humanize: 0.1,
  });

  // Active triggers for visual feedback
  const [activeKick, setActiveKick] = useState(false);
  const [activeSnare, setActiveSnare] = useState(false);
  const [activeHihat, setActiveHihat] = useState(false);

  // Wave phase for visualization
  const [wavePhase, setWavePhase] = useState(0);

  // Step sequencer state
  const [steps, setSteps] = useState<StepPattern>({
    kick:  [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0].map(Boolean),
    snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0].map(Boolean),
    hihat: [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0].map(Boolean),
  });
  const [selectedDrum, setSelectedDrum] = useState<DrumType>('kick');
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedPreset, setSelectedPreset] = useState(0);

  const accentColor = '#7C5CFF';
  const drumColors: Record<DrumType, string> = {
    kick: '#ff6b6b',
    snare: '#4ecdc4',
    hihat: '#ffe66d',
  };

  // ============ AUDIO INIT ============

  useEffect(() => {
    // Create synths
    const kick = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 6,
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.001,
        decay: 0.4,
        sustain: 0.01,
        release: 0.4,
      },
    }).toDestination();

    const snare = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: {
        attack: 0.001,
        decay: 0.2,
        sustain: 0,
        release: 0.1,
      },
    }).toDestination();

    const hihat = new Tone.MetalSynth({
      envelope: {
        attack: 0.001,
        decay: 0.1,
        release: 0.01,
      },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5,
    }).toDestination();
    hihat.volume.value = -10;

    synthsRef.current = { kick, snare, hihat };

    return () => {
      kick.dispose();
      snare.dispose();
      hihat.dispose();
    };
  }, []);

  // ============ WAVE RHYTHM GENERATOR ============

  const generateWaveValue = useCallback((t: number, drumType: 'kick' | 'snare' | 'hihat'): number => {
    // Base wave influenced by pick (pattern bias)
    const baseFreq = drumType === 'kick' ? 1 : drumType === 'snare' ? 0.5 : 2;
    const pickOffset = wave.pick * Math.PI;

    // Sine wave with density and chaos modulation
    let value = Math.sin(t * baseFreq * Math.PI * 2 + pickOffset);

    // Add harmonics based on magic (variation)
    value += Math.sin(t * baseFreq * 2 * Math.PI * 2) * wave.magic * 0.5;
    value += Math.sin(t * baseFreq * 3 * Math.PI * 2) * wave.magic * 0.25;

    // Compress the wave
    value = Math.tanh(value * (1 + wave.comp * 2));

    // Apply chaos (random threshold variation)
    const chaosOffset = (Math.random() - 0.5) * flow.chaos;
    value += chaosOffset;

    // Scale by energy
    value *= flow.energy;

    return value;
  }, [wave, flow]);

  const shouldTrigger = useCallback((t: number, drumType: 'kick' | 'snare' | 'hihat'): boolean => {
    const waveValue = generateWaveValue(t, drumType);

    // Threshold based on density
    const threshold = 1 - flow.density;

    // Different thresholds for different drums
    const drumThreshold = drumType === 'kick' ? threshold * 0.8 :
                          drumType === 'snare' ? threshold * 1.2 :
                          threshold * 0.6;

    return waveValue > drumThreshold;
  }, [generateWaveValue, flow.density]);

  // ============ PLAYBACK ============

  const startPlayback = useCallback(async () => {
    await Tone.start();
    Tone.Transport.bpm.value = bpm;
    Tone.Transport.swing = swing;

    let step = 0;

    const loop = new Tone.Loop((time) => {
      const currentSteps = steps; // Capture current state

      // Humanize timing
      const humanizeAmount = flow.humanize * 0.02; // Max 20ms
      const humanizeOffset = (Math.random() - 0.5) * humanizeAmount;

      // Check step pattern for triggers
      if (currentSteps.kick[step]) {
        synthsRef.current.kick?.triggerAttackRelease('C1', '8n', time + humanizeOffset);
        setActiveKick(true);
        setTimeout(() => setActiveKick(false), 100);
      }

      if (currentSteps.snare[step]) {
        synthsRef.current.snare?.triggerAttackRelease('8n', time + humanizeOffset);
        setActiveSnare(true);
        setTimeout(() => setActiveSnare(false), 100);
      }

      if (currentSteps.hihat[step]) {
        synthsRef.current.hihat?.triggerAttackRelease('C6', '16n', time + humanizeOffset);
        setActiveHihat(true);
        setTimeout(() => setActiveHihat(false), 50);
      }

      setCurrentStep(step);
      step = (step + 1) % 16;
      setWavePhase(step / 16);
    }, '16n');

    sequenceRef.current = loop;
    loop.start(0);
    Tone.Transport.start();
    setIsPlaying(true);
  }, [bpm, swing, flow.humanize, steps]);

  const stopPlayback = useCallback(() => {
    sequenceRef.current?.stop();
    sequenceRef.current?.dispose();
    Tone.Transport.stop();
    setIsPlaying(false);
    setWavePhase(0);
  }, []);

  // Update BPM in real-time
  useEffect(() => {
    if (isPlaying) {
      Tone.Transport.bpm.value = bpm;
    }
  }, [bpm, isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      Tone.Transport.swing = swing;
    }
  }, [swing, isPlaying]);

  // Toggle step
  const toggleStep = useCallback((stepIndex: number) => {
    setSteps(prev => ({
      ...prev,
      [selectedDrum]: prev[selectedDrum].map((v, i) => i === stepIndex ? !v : v),
    }));
  }, [selectedDrum]);

  // Load preset
  const loadPreset = useCallback((presetIndex: number) => {
    setSteps({ ...PRESET_PATTERNS[presetIndex].pattern });
    setSelectedPreset(presetIndex);
  }, []);

  // ============ WAVE VISUALIZATION ============

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;

      // Clear
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, width, height);

      // Draw wave for each drum type
      const drawWave = (drumType: 'kick' | 'snare' | 'hihat', color: string, yOffset: number) => {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;

        for (let x = 0; x < width; x++) {
          const t = x / width;
          const value = generateWaveValue(t + wavePhase, drumType);
          const y = yOffset + value * (height / 6);

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();

        // Draw threshold line
        ctx.beginPath();
        ctx.strokeStyle = `${color}40`;
        ctx.setLineDash([5, 5]);
        const threshold = 1 - flow.density;
        const thresholdY = yOffset - threshold * flow.energy * (height / 6);
        ctx.moveTo(0, thresholdY);
        ctx.lineTo(width, thresholdY);
        ctx.stroke();
        ctx.setLineDash([]);
      };

      drawWave('kick', '#ff6b6b', height * 0.25);
      drawWave('snare', '#4ecdc4', height * 0.5);
      drawWave('hihat', '#ffe66d', height * 0.75);

      // Draw playhead
      if (isPlaying) {
        const playheadX = wavePhase * width;
        ctx.beginPath();
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 2;
        ctx.moveTo(playheadX, 0);
        ctx.lineTo(playheadX, height);
        ctx.stroke();
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [wavePhase, wave, flow, isPlaying, generateWaveValue]);

  // ============ RENDER ============

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <a href="/" className="text-xs uppercase tracking-widest text-white/40 hover:text-white/80">
            ← Exit
          </a>
          <h1 className="text-2xl font-light mt-2">FLOW.KIT</h1>
          <p className="text-xs text-white/30 uppercase tracking-widest">Wave Rhythm Engine</p>
        </div>
        <button
          onClick={isPlaying ? stopPlayback : startPlayback}
          className="w-16 h-16 rounded-full border-2 flex items-center justify-center text-2xl transition-all hover:scale-105"
          style={{
            borderColor: isPlaying ? '#ff4444' : accentColor,
            color: isPlaying ? '#ff4444' : accentColor,
            background: isPlaying ? 'rgba(255,68,68,0.1)' : 'transparent',
          }}
        >
          {isPlaying ? '■' : '▶'}
        </button>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-12 gap-6">

        {/* LEFT PANEL - BPM / KIT */}
        <div className="col-span-2 space-y-6">
          <div className="text-xs uppercase tracking-widest text-white/40 mb-4">BPM / KIT</div>

          {/* BPM */}
          <div>
            <div className="flex justify-between text-xs text-white/50 mb-2">
              <span>BPM</span>
              <span>{bpm}</span>
            </div>
            <input
              type="range"
              min={60}
              max={180}
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              className="w-full"
              style={{ accentColor }}
            />
          </div>

          {/* Swing */}
          <div>
            <div className="flex justify-between text-xs text-white/50 mb-2">
              <span>SWING</span>
              <span>{Math.round(swing * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={swing}
              onChange={(e) => setSwing(Number(e.target.value))}
              className="w-full"
              style={{ accentColor }}
            />
          </div>

          {/* Kit Selector */}
          <div>
            <div className="text-xs text-white/50 mb-2">KIT</div>
            <div className="space-y-2">
              {KITS.map((kit, i) => (
                <button
                  key={kit.name}
                  onClick={() => setKitIndex(i)}
                  className="w-full py-2 border text-xs uppercase tracking-widest transition-all"
                  style={{
                    borderColor: kitIndex === i ? accentColor : '#333',
                    color: kitIndex === i ? accentColor : 'white',
                    background: kitIndex === i ? `${accentColor}15` : 'transparent',
                  }}
                >
                  {kit.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* CENTER - WAVE */}
        <div className="col-span-6 space-y-6">
          <div className="text-xs uppercase tracking-widest text-white/40 mb-4">WAVE</div>

          {/* Wave Canvas */}
          <div className="border border-white/10 rounded">
            <canvas
              ref={canvasRef}
              width={600}
              height={200}
              className="w-full"
            />
          </div>

          {/* COMP / PICK / MAGIC */}
          <div className="grid grid-cols-3 gap-4">
            {/* COMP */}
            <div className="text-center">
              <div
                className="w-20 h-20 mx-auto rounded-full border-2 flex items-center justify-center cursor-pointer transition-all hover:scale-105"
                style={{ borderColor: accentColor }}
              >
                <span className="text-lg font-light">{Math.round(wave.comp * 100)}</span>
              </div>
              <div className="text-xs text-white/50 mt-2 uppercase tracking-widest">Comp</div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={wave.comp}
                onChange={(e) => setWave(w => ({ ...w, comp: Number(e.target.value) }))}
                className="w-full mt-2"
                style={{ accentColor }}
              />
            </div>

            {/* PICK */}
            <div className="text-center">
              <div
                className="w-20 h-20 mx-auto rounded-full border-2 flex items-center justify-center cursor-pointer transition-all hover:scale-105"
                style={{ borderColor: accentColor }}
              >
                <span className="text-lg font-light">{Math.round(wave.pick * 100)}</span>
              </div>
              <div className="text-xs text-white/50 mt-2 uppercase tracking-widest">Pick</div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={wave.pick}
                onChange={(e) => setWave(w => ({ ...w, pick: Number(e.target.value) }))}
                className="w-full mt-2"
                style={{ accentColor }}
              />
            </div>

            {/* MAGIC */}
            <div className="text-center">
              <div
                className="w-20 h-20 mx-auto rounded-full border-2 flex items-center justify-center cursor-pointer transition-all hover:scale-105"
                style={{ borderColor: '#ff00aa' }}
              >
                <span className="text-lg font-light">{Math.round(wave.magic * 100)}</span>
              </div>
              <div className="text-xs text-white/50 mt-2 uppercase tracking-widest">Magic</div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={wave.magic}
                onChange={(e) => setWave(w => ({ ...w, magic: Number(e.target.value) }))}
                className="w-full mt-2"
                style={{ accentColor: '#ff00aa' }}
              />
            </div>
          </div>
        </div>

        {/* RIGHT PANEL - FLOW STATE */}
        <div className="col-span-2 space-y-6">
          <div className="text-xs uppercase tracking-widest text-white/40 mb-4">FLOW STATE</div>

          {/* Energy */}
          <div>
            <div className="flex justify-between text-xs text-white/50 mb-2">
              <span>ENERGY</span>
              <span>{Math.round(flow.energy * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={flow.energy}
              onChange={(e) => setFlow(f => ({ ...f, energy: Number(e.target.value) }))}
              className="w-full"
              style={{ accentColor }}
            />
          </div>

          {/* Density */}
          <div>
            <div className="flex justify-between text-xs text-white/50 mb-2">
              <span>DENSITY</span>
              <span>{Math.round(flow.density * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={flow.density}
              onChange={(e) => setFlow(f => ({ ...f, density: Number(e.target.value) }))}
              className="w-full"
              style={{ accentColor }}
            />
          </div>

          {/* Chaos */}
          <div>
            <div className="flex justify-between text-xs text-white/50 mb-2">
              <span>CHAOS</span>
              <span>{Math.round(flow.chaos * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={flow.chaos}
              onChange={(e) => setFlow(f => ({ ...f, chaos: Number(e.target.value) }))}
              className="w-full"
              style={{ accentColor: '#ff6b6b' }}
            />
          </div>

          {/* Humanize */}
          <div>
            <div className="flex justify-between text-xs text-white/50 mb-2">
              <span>HUMANIZE</span>
              <span>{Math.round(flow.humanize * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={flow.humanize}
              onChange={(e) => setFlow(f => ({ ...f, humanize: Number(e.target.value) }))}
              className="w-full"
              style={{ accentColor }}
            />
          </div>
        </div>

        {/* DRUM PADS - Right side */}
        <div className="col-span-2 space-y-4">
          <div className="text-xs uppercase tracking-widest text-white/40 mb-4">TRIGGERS</div>

          {/* Hi-Hat - Triangle */}
          <button
            onClick={() => {
              synthsRef.current.hihat?.triggerAttackRelease('C6', '16n');
              setActiveHihat(true);
              setTimeout(() => setActiveHihat(false), 100);
            }}
            className="w-full aspect-square border-2 flex items-center justify-center transition-all hover:scale-105"
            style={{
              borderColor: activeHihat ? '#ffe66d' : '#333',
              background: activeHihat ? 'rgba(255,230,109,0.2)' : 'transparent',
            }}
          >
            <div
              className="w-0 h-0 border-l-[30px] border-r-[30px] border-b-[50px] border-l-transparent border-r-transparent"
              style={{ borderBottomColor: activeHihat ? '#ffe66d' : '#666' }}
            />
          </button>

          {/* Kick - Circle */}
          <button
            onClick={() => {
              synthsRef.current.kick?.triggerAttackRelease('C1', '8n');
              setActiveKick(true);
              setTimeout(() => setActiveKick(false), 100);
            }}
            className="w-full aspect-square border-2 flex items-center justify-center transition-all hover:scale-105"
            style={{
              borderColor: activeKick ? '#ff6b6b' : '#333',
              background: activeKick ? 'rgba(255,107,107,0.2)' : 'transparent',
            }}
          >
            <div
              className="w-16 h-16 rounded-full border-4"
              style={{ borderColor: activeKick ? '#ff6b6b' : '#666' }}
            />
          </button>

          {/* Snare - Square */}
          <button
            onClick={() => {
              synthsRef.current.snare?.triggerAttackRelease('8n');
              setActiveSnare(true);
              setTimeout(() => setActiveSnare(false), 100);
            }}
            className="w-full aspect-square border-2 flex items-center justify-center transition-all hover:scale-105"
            style={{
              borderColor: activeSnare ? '#4ecdc4' : '#333',
              background: activeSnare ? 'rgba(78,205,196,0.2)' : 'transparent',
            }}
          >
            <div
              className="w-14 h-14 border-4"
              style={{ borderColor: activeSnare ? '#4ecdc4' : '#666' }}
            />
          </button>
        </div>

      </div>

      {/* TR-909 Style Sequencer */}
      <div className="mt-8 border-t border-white/10 pt-6">
        {/* Instrument Selector */}
        <div className="flex items-center gap-4 mb-6">
          <div className="text-xs uppercase tracking-widest text-white/40">INST</div>
          <div className="flex gap-2">
            {(['kick', 'snare', 'hihat'] as DrumType[]).map((drum) => (
              <button
                key={drum}
                onClick={() => setSelectedDrum(drum)}
                className="px-6 py-3 border-2 text-xs uppercase tracking-widest transition-all"
                style={{
                  borderColor: selectedDrum === drum ? drumColors[drum] : '#333',
                  background: selectedDrum === drum ? `${drumColors[drum]}20` : 'transparent',
                  color: selectedDrum === drum ? drumColors[drum] : '#666',
                }}
              >
                {drum === 'kick' ? 'BD' : drum === 'snare' ? 'SD' : 'HH'}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-4">
            <div className="text-xs uppercase tracking-widest text-white/40">PATTERN</div>
            <div className="flex gap-1">
              {PRESET_PATTERNS.map((preset, i) => (
                <button
                  key={preset.name}
                  onClick={() => loadPreset(i)}
                  className="px-3 py-2 border text-[10px] uppercase tracking-widest transition-all"
                  style={{
                    borderColor: selectedPreset === i ? accentColor : '#333',
                    background: selectedPreset === i ? `${accentColor}20` : 'transparent',
                    color: selectedPreset === i ? accentColor : '#666',
                  }}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 16 Step Buttons */}
        <div className="flex gap-2">
          {Array.from({ length: 16 }, (_, i) => {
            const isActive = steps[selectedDrum][i];
            const isCurrentStep = isPlaying && currentStep === i;
            const isBeat = i % 4 === 0;

            return (
              <button
                key={i}
                onClick={() => toggleStep(i)}
                className="flex-1 aspect-square border-2 flex items-center justify-center text-sm font-mono transition-all relative"
                style={{
                  borderColor: isCurrentStep ? '#fff' : isActive ? drumColors[selectedDrum] : isBeat ? '#444' : '#222',
                  background: isActive ? `${drumColors[selectedDrum]}${isCurrentStep ? '80' : '40'}` : isCurrentStep ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: isActive ? drumColors[selectedDrum] : isBeat ? '#666' : '#333',
                }}
              >
                {i + 1}
                {/* Playhead indicator */}
                {isCurrentStep && (
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white" />
                )}
              </button>
            );
          })}
        </div>

        {/* Beat markers */}
        <div className="flex mt-2">
          {[1, 2, 3, 4].map((beat) => (
            <div key={beat} className="flex-1 text-center text-[9px] uppercase tracking-widest text-white/20">
              {beat}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-6 left-8 text-[9px] uppercase tracking-widest text-white/15">
        FLOW.KIT-0321
      </div>
    </div>
  );
}
