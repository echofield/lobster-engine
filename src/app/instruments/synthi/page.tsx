'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { SynthiEngine } from '@/lib/synthi-engine';
import { AudioRecorder, MidiClock } from '@/lib/audio-recorder';
import { SpaceTimeEngine, SpaceTimeConditions, ConditionResult } from '@/lib/spacetime-engine';

type ThemeMode = 'day' | 'night';

export default function SynthiPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<SynthiEngine | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const midiClockRef = useRef<MidiClock | null>(null);
  const spaceTimeRef = useRef<SpaceTimeEngine | null>(null);

  const [isInitialized, setIsInitialized] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [analysisData, setAnalysisData] = useState<{ frequency: Uint8Array; waveform: Uint8Array } | null>(null);
  const [midiConnected, setMidiConnected] = useState(false);
  const [lastMidiNote, setLastMidiNote] = useState<number | null>(null);
  const [themeMode, setThemeMode] = useState<ThemeMode>('day');
  const [isPolyphonic, setIsPolyphonic] = useState(true);
  const [voiceCount, setVoiceCount] = useState(0);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingBars, setRecordingBars] = useState(0);

  // BPM/Tempo
  const [bpm, setBpm] = useState(120);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [currentBar, setCurrentBar] = useState(0);

  // Parameters
  const [filterFreq, setFilterFreq] = useState(2000);
  const [filterQ, setFilterQ] = useState(5);
  const [lfo1Rate, setLfo1Rate] = useState(0.5);

  // Space-Time
  const [spaceTimeEnabled, setSpaceTimeEnabled] = useState(false);
  const [spaceTimeConditions, setSpaceTimeConditions] = useState<SpaceTimeConditions | null>(null);
  const [spaceTimeResult, setSpaceTimeResult] = useState<ConditionResult | null>(null);
  const [showConditionEditor, setShowConditionEditor] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('');

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

    // Initialize recorder - connect to engine's audio context
    const ctx = engine['ctx'] as AudioContext;
    if (ctx) {
      const recorder = new AudioRecorder(ctx, { bpm });
      const masterGain = engine['masterGain'] as GainNode;
      if (masterGain) {
        recorder.connectSource(masterGain);
      }
      recorder.onStateChange = (state) => {
        setIsRecording(state.isRecording);
        setRecordingTime(state.duration);
        setRecordingBars(state.bars);
      };
      recorder.onRecordingComplete = async (blob, duration) => {
        // Convert to WAV and download
        try {
          const wavBlob = await AudioRecorder.webmToWav(blob, ctx);
          const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
          AudioRecorder.downloadBlob(wavBlob, `synthi-${timestamp}.wav`);
        } catch (e) {
          // Fallback to webm if WAV conversion fails
          const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
          AudioRecorder.downloadBlob(blob, `synthi-${timestamp}.webm`);
        }
        setIsRecording(false);
      };
      recorderRef.current = recorder;

      // Initialize MIDI clock
      const clock = new MidiClock();
      clock.setBPM(bpm);
      clock.onBeatChange = setCurrentBeat;
      clock.onBarChange = setCurrentBar;
      midiClockRef.current = clock;

      // Initialize Space-Time engine
      const spaceTime = new SpaceTimeEngine();
      spaceTime.onLocationChange = () => {
        // Re-evaluate conditions when location changes
        if (spaceTimeConditions) {
          const result = spaceTime.evaluate(spaceTimeConditions);
          setSpaceTimeResult(result);
        }
      };
      spaceTimeRef.current = spaceTime;
    }

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
    } else if (status >= 0xF8 && status <= 0xFC) {
      // MIDI Clock messages
      midiClockRef.current?.receiveMidiClock(new Uint8Array([status]));
    }
  }, []);

  // Recording controls
  const startRecording = () => {
    if (recorderRef.current && !isRecording) {
      recorderRef.current.setBPM(bpm);
      recorderRef.current.start();
    }
  };

  const stopRecording = () => {
    if (recorderRef.current && isRecording) {
      recorderRef.current.stop();
    }
  };

  const recordBars = (bars: number) => {
    if (recorderRef.current && !isRecording) {
      recorderRef.current.setBPM(bpm);
      recorderRef.current.startForBars(bars);
    }
  };

  // BPM change
  const handleBpmChange = (newBpm: number) => {
    setBpm(newBpm);
    recorderRef.current?.setBPM(newBpm);
    midiClockRef.current?.setBPM(newBpm);
  };

  // Space-Time controls
  const selectSpaceTimePreset = async (presetName: string) => {
    if (!spaceTimeRef.current) return;
    setSelectedPreset(presetName);

    const presets: Record<string, () => SpaceTimeConditions> = {
      'full-moon': SpaceTimeEngine.presets.fullMoonOnly,
      'tokyo-nights': SpaceTimeEngine.presets.tokyoNights,
      'winter-solstice': SpaceTimeEngine.presets.winterSolstice,
      'midnight': SpaceTimeEngine.presets.midnightGlobal,
      'summer-paris': SpaceTimeEngine.presets.summerParis,
      'evolving-moon': SpaceTimeEngine.presets.evolvingMoon,
    };

    const preset = presets[presetName];
    if (preset) {
      const conditions = preset();
      setSpaceTimeConditions(conditions);

      // Request location if needed
      if (conditions.space.type !== 'anywhere') {
        await spaceTimeRef.current.requestLocation();
      }

      // Evaluate conditions
      const result = spaceTimeRef.current.evaluate(conditions);
      setSpaceTimeResult(result);

      // Apply evolution values to synth parameters
      if (result.evolutionValues) {
        applyEvolutionValues(result.evolutionValues);
      }
    }
  };

  const applyEvolutionValues = (values: Record<string, number>) => {
    if (!engineRef.current) return;
    for (const [param, value] of Object.entries(values)) {
      if (param === 'filterFreq') {
        setFilterFreq(value);
        engineRef.current.setParam('filterFreq', value);
      } else if (param === 'filterQ') {
        setFilterQ(value);
        engineRef.current.setParam('filterQ', value);
      } else if (param === 'lfo1Rate') {
        setLfo1Rate(value);
        engineRef.current.setParam('lfo1Rate', value);
      }
    }
  };

  const toggleSpaceTime = async () => {
    const newEnabled = !spaceTimeEnabled;
    setSpaceTimeEnabled(newEnabled);

    if (newEnabled && spaceTimeRef.current) {
      // Request location on enable
      await spaceTimeRef.current.requestLocation();
      spaceTimeRef.current.watchLocation();

      // Evaluate current conditions
      if (spaceTimeConditions) {
        const result = spaceTimeRef.current.evaluate(spaceTimeConditions);
        setSpaceTimeResult(result);
      }
    } else if (spaceTimeRef.current) {
      spaceTimeRef.current.stopWatchingLocation();
    }
  };

  // Update evolution values periodically when SpaceTime is enabled
  useEffect(() => {
    if (!spaceTimeEnabled || !spaceTimeConditions?.evolution || !spaceTimeRef.current) return;

    const interval = setInterval(() => {
      const result = spaceTimeRef.current!.evaluate(spaceTimeConditions);
      setSpaceTimeResult(result);
      if (result.evolutionValues) {
        applyEvolutionValues(result.evolutionValues);
      }
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [spaceTimeEnabled, spaceTimeConditions]);

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
        {/* Space-Time toggle */}
        <button
          onClick={toggleSpaceTime}
          className="text-[10px] uppercase tracking-[0.15em] transition-opacity"
          style={{
            color: spaceTimeEnabled ? '#00ff88' : (themeMode === 'night' ? '#7C5CFF' : 'var(--foreground)'),
            opacity: spaceTimeEnabled ? 1 : 0.4
          }}
        >
          {spaceTimeEnabled ? '◉ ST' : '○ ST'}
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

      {/* Space-Time Panel */}
      {spaceTimeEnabled && (
        <div
          className="fixed left-6 top-20 w-56 p-4 border transition-all z-30"
          style={{
            background: themeMode === 'night' ? 'rgba(10,10,10,0.95)' : 'rgba(250,248,242,0.95)',
            borderColor: spaceTimeResult?.allowed ? '#00ff88' : '#ff4444'
          }}
        >
          <div className="text-[10px] uppercase tracking-[0.15em] mb-3 flex items-center gap-2" style={{ color: '#00ff88' }}>
            <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
            Space-Time
          </div>

          {/* Preset selector */}
          <div className="mb-4">
            <div className="text-[9px] uppercase tracking-[0.1em] opacity-40 mb-2" style={{ color: themeMode === 'night' ? '#7C5CFF' : 'var(--foreground)' }}>
              Condition Preset
            </div>
            <select
              value={selectedPreset}
              onChange={(e) => selectSpaceTimePreset(e.target.value)}
              className="w-full bg-transparent border px-2 py-1.5 text-[10px] focus:outline-none"
              style={{
                borderColor: 'rgba(124, 92, 255, 0.3)',
                color: themeMode === 'night' ? '#7C5CFF' : 'var(--foreground)'
              }}
            >
              <option value="">Select...</option>
              <option value="full-moon">Full Moon Only</option>
              <option value="tokyo-nights">Tokyo Nights</option>
              <option value="midnight">Midnight Hour</option>
              <option value="summer-paris">Paris Summer</option>
              <option value="winter-solstice">Winter Solstice</option>
              <option value="evolving-moon">Evolving Moon</option>
            </select>
          </div>

          {/* Current conditions */}
          {spaceTimeConditions && (
            <div className="mb-4">
              <div className="text-[9px] uppercase tracking-[0.1em] opacity-40 mb-2" style={{ color: themeMode === 'night' ? '#7C5CFF' : 'var(--foreground)' }}>
                {spaceTimeConditions.name}
              </div>
              <div className="text-[9px] opacity-60" style={{ color: themeMode === 'night' ? '#7C5CFF' : 'var(--foreground)' }}>
                {spaceTimeConditions.description}
              </div>
            </div>
          )}

          {/* Status */}
          {spaceTimeResult && (
            <div className="space-y-2">
              <div
                className="text-[10px] uppercase tracking-[0.1em] font-medium"
                style={{ color: spaceTimeResult.allowed ? '#00ff88' : '#ff4444' }}
              >
                {spaceTimeResult.allowed ? '● Unlocked' : '○ Locked'}
              </div>

              {!spaceTimeResult.allowed && spaceTimeResult.reason && (
                <div className="text-[9px] opacity-60" style={{ color: '#ff4444' }}>
                  {spaceTimeResult.reason}
                </div>
              )}

              {spaceTimeResult.nextAvailable && (
                <div className="text-[9px] opacity-40" style={{ color: themeMode === 'night' ? '#7C5CFF' : 'var(--foreground)' }}>
                  Next: {spaceTimeResult.nextAvailable.toLocaleDateString()}
                </div>
              )}

              {/* Current values */}
              {spaceTimeResult.currentValues && (
                <div className="pt-2 border-t border-current opacity-30 text-[8px] space-y-1" style={{ color: themeMode === 'night' ? '#7C5CFF' : 'var(--foreground)' }}>
                  {spaceTimeResult.currentValues.moonPhase && (
                    <div>Moon: {spaceTimeResult.currentValues.moonPhase.replace('_', ' ')}</div>
                  )}
                  {spaceTimeResult.currentValues.season && (
                    <div>Season: {spaceTimeResult.currentValues.season}</div>
                  )}
                  {spaceTimeResult.currentValues.location?.city && (
                    <div>Location: {spaceTimeResult.currentValues.location.city}</div>
                  )}
                </div>
              )}

              {/* Evolution values */}
              {spaceTimeResult.evolutionValues && Object.keys(spaceTimeResult.evolutionValues).length > 0 && (
                <div className="pt-2 border-t border-current opacity-50 text-[8px]" style={{ color: '#00ff88' }}>
                  <div className="mb-1">Evolving:</div>
                  {Object.entries(spaceTimeResult.evolutionValues).map(([param, value]) => (
                    <div key={param}>{param}: {Math.round(value)}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

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

              {/* BPM Control */}
              <div className="text-center">
                <input
                  type="number"
                  min={40}
                  max={240}
                  value={bpm}
                  onChange={(e) => handleBpmChange(parseInt(e.target.value) || 120)}
                  className="w-14 h-6 bg-transparent border text-center text-xs font-mono focus:outline-none"
                  style={{
                    borderColor: 'rgba(124, 92, 255, 0.4)',
                    color: themeMode === 'night' ? '#7C5CFF' : 'var(--foreground)'
                  }}
                />
                <div
                  className="text-[9px] uppercase tracking-[0.1em] mt-1 opacity-40"
                  style={{ color: themeMode === 'night' ? '#7C5CFF' : 'var(--foreground)' }}
                >
                  BPM
                </div>
              </div>

              {/* Record Controls */}
              <div className="flex items-center gap-3">
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className="w-10 h-10 border rounded-full flex items-center justify-center transition-all"
                  style={{
                    borderColor: isRecording ? '#ff4444' : '#7C5CFF',
                    background: isRecording ? '#ff4444' : 'transparent',
                    color: isRecording ? '#fff' : '#7C5CFF'
                  }}
                >
                  {isRecording ? '■' : '●'}
                </button>
                <div className="flex flex-col gap-1">
                  <div className="flex gap-1">
                    {[1, 2, 4, 8].map((bars) => (
                      <button
                        key={bars}
                        onClick={() => recordBars(bars)}
                        disabled={isRecording}
                        className="w-6 h-5 border text-[8px] font-mono transition-all hover:bg-[#7C5CFF] hover:text-white disabled:opacity-30"
                        style={{
                          borderColor: 'rgba(124, 92, 255, 0.4)',
                          color: themeMode === 'night' ? '#7C5CFF' : 'var(--foreground)'
                        }}
                      >
                        {bars}
                      </button>
                    ))}
                  </div>
                  <div
                    className="text-[8px] uppercase tracking-[0.1em] opacity-40 text-center"
                    style={{ color: themeMode === 'night' ? '#7C5CFF' : 'var(--foreground)' }}
                  >
                    bars
                  </div>
                </div>
              </div>

              {/* Recording Status */}
              {isRecording && (
                <div className="text-center">
                  <div
                    className="text-sm font-mono animate-pulse"
                    style={{ color: '#ff4444' }}
                  >
                    {recordingBars}:{Math.floor(recordingTime % (60 / bpm * 4)).toString().padStart(2, '0')}
                  </div>
                  <div
                    className="text-[8px] uppercase tracking-[0.1em] opacity-60"
                    style={{ color: '#ff4444' }}
                  >
                    rec
                  </div>
                </div>
              )}

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
          Click to play • Mouse to modulate • MIDI + Clock sync • Record to WAV
        </p>
      </div>
    </div>
  );
}
