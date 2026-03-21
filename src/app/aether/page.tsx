'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { AetherEngine, MIDIManager, SCALES, ScaleName } from '@/lib/aether-engine';

const KEYBOARD_MAP: Record<string, number> = {
  'a': 0, 's': 1, 'd': 2, 'f': 3, 'g': 4, 'h': 5, 'j': 6, 'k': 7, 'l': 8,
  'q': 9, 'w': 10, 'e': 11, 'r': 12, 't': 13, 'y': 14, 'u': 15, 'i': 16, 'o': 17, 'p': 18,
};

interface NoteState {
  midiNote: number;
  name: string;
  octave: number;
  envelope: number;
  isPlaying: boolean;
  triggerTime: number;
}

interface Ripple {
  id: number;
  x: number;
  y: number;
  startTime: number;
  noteIndex: number;
}

interface RecordedNote {
  noteIndex: number;
  midiNote: number;
  velocity: number;
  startTime: number;
  duration: number;
}

interface RecordingState {
  isRecording: boolean;
  isPlaying: boolean;
  startTime: number;
  notes: RecordedNote[];
  activeNotes: Map<number, { startBeat: number; velocity: number }>;
}

export default function AetherPage() {
  const engineRef = useRef<AetherEngine | null>(null);
  const midiRef = useRef<MIDIManager | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const waveCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const ripplesRef = useRef<Ripple[]>([]);
  const noteStatesRef = useRef<NoteState[]>([]);
  const lastTimeRef = useRef<number>(0);
  const playbackTimeoutRef = useRef<NodeJS.Timeout[]>([]);

  const [isInitialized, setIsInitialized] = useState(false);
  const [scale, setScale] = useState<ScaleName>('pentatonic');
  const [rootNote, setRootNote] = useState(60);
  const [midiConnected, setMidiConnected] = useState(false);
  const [noteStates, setNoteStates] = useState<NoteState[]>([]);
  const [breathPhase, setBreathPhase] = useState(0);

  const [bpm, setBpm] = useState(120);
  const [recording, setRecording] = useState<RecordingState>({
    isRecording: false,
    isPlaying: false,
    startTime: 0,
    notes: [],
    activeNotes: new Map()
  });
  const [recordedNotes, setRecordedNotes] = useState<RecordedNote[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [playheadBeat, setPlayheadBeat] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const recordingRef = useRef(recording);
  recordingRef.current = recording;

  const timeToBeat = useCallback((timeMs: number) => (timeMs / 1000) * (bpm / 60), [bpm]);
  const beatToTime = useCallback((beat: number) => (beat / (bpm / 60)) * 1000, [bpm]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const hundredths = Math.floor((ms % 1000) / 10);
    return `${minutes}:${secs.toString().padStart(2, '0')}.${hundredths.toString().padStart(2, '0')}`;
  };

  const initEngine = useCallback(async () => {
    if (engineRef.current) return;

    const engine = new AetherEngine();
    await engine.init();
    engine.setScale(scale);
    engine.setRoot(rootNote);

    engine.onNoteOn = (noteIndex: number, _midiNote: number, velocity: number) => {
      noteStatesRef.current = noteStatesRef.current.map((n, i) =>
        i === noteIndex ? { ...n, isPlaying: true, triggerTime: Date.now(), envelope: 0 } : n
      );

      if (recordingRef.current.isRecording) {
        const now = Date.now();
        const beatPosition = timeToBeat(now - recordingRef.current.startTime);
        const newActiveNotes = new Map(recordingRef.current.activeNotes);
        newActiveNotes.set(noteIndex, { startBeat: beatPosition, velocity });
        setRecording(r => ({ ...r, activeNotes: newActiveNotes }));
      }

      const notes = engine.getScaleNotes();
      if (noteIndex < notes.length) {
        const angle = (noteIndex / notes.length) * Math.PI * 2 - Math.PI / 2;
        const radius = 200;
        ripplesRef.current.push({
          id: Date.now() + Math.random(),
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
          startTime: Date.now(),
          noteIndex
        });
      }
    };

    engine.onNoteOff = (noteIndex: number) => {
      noteStatesRef.current = noteStatesRef.current.map((n, i) =>
        i === noteIndex ? { ...n, isPlaying: false } : n
      );

      if (recordingRef.current.isRecording && recordingRef.current.activeNotes.has(noteIndex)) {
        const now = Date.now();
        const beatPosition = timeToBeat(now - recordingRef.current.startTime);
        const noteData = recordingRef.current.activeNotes.get(noteIndex)!;
        const duration = beatPosition - noteData.startBeat;

        const newNote: RecordedNote = {
          noteIndex,
          midiNote: noteStatesRef.current[noteIndex]?.midiNote || 60,
          velocity: noteData.velocity,
          startTime: noteData.startBeat,
          duration: Math.max(0.1, duration)
        };

        const newActiveNotes = new Map(recordingRef.current.activeNotes);
        newActiveNotes.delete(noteIndex);
        setRecording(r => ({ ...r, notes: [...r.notes, newNote], activeNotes: newActiveNotes }));
      }
    };

    engine.onEnvelopeUpdate = (noteIndex: number, value: number) => {
      noteStatesRef.current = noteStatesRef.current.map((n, i) =>
        i === noteIndex ? { ...n, envelope: value } : n
      );
    };

    engineRef.current = engine;

    const scaleNotes = engine.getScaleNotes();
    noteStatesRef.current = scaleNotes.map(n => ({ ...n, envelope: 0, isPlaying: false, triggerTime: 0 }));
    setNoteStates([...noteStatesRef.current]);

    const midi = new MIDIManager();
    const midiSuccess = await midi.init(engine);
    midiRef.current = midi;
    setMidiConnected(midiSuccess && midi.getInputCount() > 0);

    setIsInitialized(true);
  }, [scale, rootNote, timeToBeat]);

  useEffect(() => {
    if (!isInitialized || !engineRef.current) return;
    const keysDown = new Set<string>();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || keysDown.has(e.key.toLowerCase())) return;
      if (e.target instanceof HTMLInputElement) return;
      const noteIndex = KEYBOARD_MAP[e.key.toLowerCase()];
      if (noteIndex !== undefined && engineRef.current) {
        keysDown.add(e.key.toLowerCase());
        engineRef.current.playNote(noteIndex, 0.7);
      }
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        toggleRecording();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const noteIndex = KEYBOARD_MAP[e.key.toLowerCase()];
      if (noteIndex !== undefined && engineRef.current) {
        keysDown.delete(e.key.toLowerCase());
        engineRef.current.releaseNote(noteIndex);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isInitialized]);

  // Main canvas
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fixed square size for perfect circles
    const size = 600;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const render = (time: number) => {
      lastTimeRef.current = time;
      const centerX = size / 2;
      const centerY = size / 2;

      ctx.fillStyle = 'rgba(250, 248, 242, 0.15)';
      ctx.fillRect(0, 0, size, size);

      const breath = Math.sin(time * 0.0008) * 0.5 + 0.5;
      setBreathPhase(breath);

      // Concentric rings
      for (let i = 5; i > 0; i--) {
        const baseRadius = 100 + i * 60;
        const breathRadius = baseRadius + breath * 10;
        ctx.beginPath();
        ctx.arc(centerX, centerY, breathRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(124, 92, 255, ${0.05 + (5 - i) * 0.02})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Recording pulse
      if (recording.isRecording) {
        const pulsePhase = Math.sin(time * 0.005) * 0.5 + 0.5;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 280 + pulsePhase * 10, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 92, 92, ${0.2 + pulsePhase * 0.3})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Center glow
      const pulseSize = 30 + breath * 8;
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, pulseSize);
      gradient.addColorStop(0, 'rgba(124, 92, 255, 0.15)');
      gradient.addColorStop(0.7, 'rgba(124, 92, 255, 0.05)');
      gradient.addColorStop(1, 'rgba(124, 92, 255, 0)');
      ctx.beginPath();
      ctx.arc(centerX, centerY, pulseSize, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Note points
      const notes = noteStatesRef.current;
      const noteCount = notes.length;

      notes.forEach((note, i) => {
        const angle = (i / noteCount) * Math.PI * 2 - Math.PI / 2;
        const baseRadius = 200 + note.envelope * 20;
        const radius = baseRadius + breath * 5;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;

        if (note.envelope > 0.01) {
          const glowRadius = 20 + note.envelope * 30;
          const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, glowRadius);
          glowGradient.addColorStop(0, `rgba(124, 92, 255, ${note.envelope * 0.4})`);
          glowGradient.addColorStop(0.5, `rgba(124, 92, 255, ${note.envelope * 0.15})`);
          glowGradient.addColorStop(1, 'rgba(124, 92, 255, 0)');
          ctx.beginPath();
          ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
          ctx.fillStyle = glowGradient;
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(x, y);
          ctx.strokeStyle = `rgba(124, 92, 255, ${note.envelope * 0.2})`;
          ctx.lineWidth = 1 + note.envelope * 2;
          ctx.stroke();
        }

        const pointSize = 6 + note.envelope * 4;
        ctx.beginPath();
        ctx.arc(x, y, pointSize, 0, Math.PI * 2);
        ctx.fillStyle = note.envelope > 0.01 ? `rgba(124, 92, 255, ${0.5 + note.envelope * 0.5})` : 'rgba(124, 92, 255, 0.25)';
        ctx.fill();

        ctx.font = '10px system-ui, sans-serif';
        ctx.fillStyle = note.envelope > 0.01 ? 'rgba(124, 92, 255, 0.9)' : 'rgba(124, 92, 255, 0.4)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const labelRadius = radius + 25;
        ctx.fillText(`${note.name}${note.octave}`, centerX + Math.cos(angle) * labelRadius, centerY + Math.sin(angle) * labelRadius);
      });

      // Ripples
      const now = Date.now();
      ripplesRef.current = ripplesRef.current.filter(ripple => {
        const age = now - ripple.startTime;
        if (age > 2000) return false;
        const progress = age / 2000;
        ctx.beginPath();
        ctx.arc(centerX + ripple.x, centerY + ripple.y, progress * 150, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(124, 92, 255, ${(1 - progress) * 0.3})`;
        ctx.lineWidth = 2 * (1 - progress);
        ctx.stroke();
        return true;
      });

      if (Math.random() < 0.1) setNoteStates([...noteStatesRef.current]);
      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [recording.isRecording]);

  // Waveform canvas
  useEffect(() => {
    if (!waveCanvasRef.current) return;
    const canvas = waveCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      if (recordedNotes.length === 0) {
        ctx.beginPath();
        const time = Date.now() * 0.001;
        for (let x = 0; x < rect.width; x++) {
          const y = rect.height / 2 + Math.sin(x * 0.02 + time) * 3;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = 'rgba(124, 92, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.stroke();
      } else {
        const maxBeat = Math.max(...recordedNotes.map(n => n.startTime + n.duration), 4);
        const pixelsPerBeat = rect.width / maxBeat;

        for (let beat = 0; beat <= maxBeat; beat++) {
          const x = beat * pixelsPerBeat;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, rect.height);
          ctx.strokeStyle = beat % 4 === 0 ? 'rgba(124, 92, 255, 0.15)' : 'rgba(124, 92, 255, 0.05)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        recordedNotes.forEach(note => {
          const x = note.startTime * pixelsPerBeat;
          const width = Math.max(2, note.duration * pixelsPerBeat);
          const height = 10 + note.velocity * 30;
          const y = (rect.height - height) / 2;
          const grad = ctx.createLinearGradient(x, y, x, y + height);
          grad.addColorStop(0, 'rgba(124, 92, 255, 0.3)');
          grad.addColorStop(0.5, 'rgba(124, 92, 255, 0.6)');
          grad.addColorStop(1, 'rgba(124, 92, 255, 0.3)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(x, y, width, height, 2);
          ctx.fill();
        });

        if (recording.isPlaying) {
          const playheadX = playheadBeat * pixelsPerBeat;
          ctx.beginPath();
          ctx.moveTo(playheadX, 0);
          ctx.lineTo(playheadX, rect.height);
          ctx.strokeStyle = 'rgba(255, 92, 92, 0.8)';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }
      requestAnimationFrame(render);
    };
    render();
  }, [recordedNotes, recording.isPlaying, playheadBeat]);

  const toggleRecording = useCallback(() => {
    if (recording.isRecording) {
      setRecordedNotes(recording.notes);
      setRecording(r => ({ ...r, isRecording: false }));
    } else {
      setRecording({ isRecording: true, isPlaying: false, startTime: Date.now(), notes: [], activeNotes: new Map() });
      setCurrentTime(0);
    }
  }, [recording]);

  const playRecording = useCallback(() => {
    if (!engineRef.current || recordedNotes.length === 0) return;
    playbackTimeoutRef.current.forEach(t => clearTimeout(t));
    playbackTimeoutRef.current = [];
    setRecording(r => ({ ...r, isPlaying: true }));
    setPlayheadBeat(0);

    const startTime = Date.now();
    recordedNotes.forEach(note => {
      playbackTimeoutRef.current.push(
        setTimeout(() => engineRef.current?.playNote(note.noteIndex, note.velocity), beatToTime(note.startTime)),
        setTimeout(() => engineRef.current?.releaseNote(note.noteIndex), beatToTime(note.startTime + note.duration))
      );
    });

    const maxBeat = Math.max(...recordedNotes.map(n => n.startTime + n.duration));
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setPlayheadBeat(timeToBeat(elapsed));
      setCurrentTime(elapsed);
      if (timeToBeat(elapsed) >= maxBeat) {
        clearInterval(interval);
        setRecording(r => ({ ...r, isPlaying: false }));
        setPlayheadBeat(0);
      }
    }, 30);
    playbackTimeoutRef.current.push(interval as unknown as NodeJS.Timeout);
  }, [recordedNotes, beatToTime, timeToBeat]);

  const stopPlayback = useCallback(() => {
    playbackTimeoutRef.current.forEach(t => clearTimeout(t));
    playbackTimeoutRef.current = [];
    setRecording(r => ({ ...r, isPlaying: false }));
    setPlayheadBeat(0);
    noteStatesRef.current.forEach((_, i) => engineRef.current?.releaseNote(i));
  }, []);

  const clearRecording = useCallback(() => {
    stopPlayback();
    setRecordedNotes([]);
    setRecording({ isRecording: false, isPlaying: false, startTime: 0, notes: [], activeNotes: new Map() });
    setCurrentTime(0);
  }, [stopPlayback]);

  const exportAudio = useCallback(async () => {
    if (!engineRef.current || recordedNotes.length === 0) return;
    setIsExporting(true);
    try {
      const maxBeat = Math.max(...recordedNotes.map(n => n.startTime + n.duration));
      const durationSeconds = beatToTime(maxBeat) / 1000 + 3;
      const sampleRate = 44100;
      const offlineCtx = new OfflineAudioContext(2, sampleRate * durationSeconds, sampleRate);
      const masterGain = offlineCtx.createGain();
      masterGain.gain.value = 0.5;
      masterGain.connect(offlineCtx.destination);

      const convolver = offlineCtx.createConvolver();
      const impulse = offlineCtx.createBuffer(2, 2 * sampleRate, sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const data = impulse.getChannelData(ch);
        for (let i = 0; i < 2 * sampleRate; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-3 * i / sampleRate);
      }
      convolver.buffer = impulse;
      const reverbGain = offlineCtx.createGain();
      reverbGain.gain.value = 0.3;
      const dryGain = offlineCtx.createGain();
      dryGain.gain.value = 0.7;
      convolver.connect(reverbGain);
      reverbGain.connect(masterGain);
      dryGain.connect(masterGain);

      const scaleNotes = engineRef.current.getScaleNotes();
      recordedNotes.forEach(note => {
        const startTime = beatToTime(note.startTime) / 1000;
        const duration = beatToTime(note.duration) / 1000;
        const frequency = 440 * Math.pow(2, ((scaleNotes[note.noteIndex]?.midiNote || 60) - 69) / 12);
        [{ r: 1, g: 1 }, { r: 2, g: 0.5 }, { r: 3, g: 0.25 }, { r: 4, g: 0.125 }].forEach(p => {
          const osc = offlineCtx.createOscillator();
          const gain = offlineCtx.createGain();
          osc.type = 'sine';
          osc.frequency.value = frequency * p.r;
          const tg = p.g * note.velocity * 0.15;
          gain.gain.setValueAtTime(0, startTime);
          gain.gain.linearRampToValueAtTime(tg, startTime + 0.1);
          gain.gain.setValueAtTime(tg * 0.6, startTime + duration);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration + 1.5);
          osc.connect(gain);
          gain.connect(dryGain);
          gain.connect(convolver);
          osc.start(startTime);
          osc.stop(startTime + duration + 2);
        });
      });

      const rendered = await offlineCtx.startRendering();
      const wav = audioBufferToWav(rendered);
      const url = URL.createObjectURL(new Blob([wav], { type: 'audio/wav' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `aether-${bpm}bpm-${Date.now()}.wav`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) { console.error(e); }
    setIsExporting(false);
  }, [recordedNotes, beatToTime, bpm]);

  function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
    const nc = buffer.numberOfChannels, sr = buffer.sampleRate, samples = buffer.length;
    const dataSize = samples * nc * 2, arr = new ArrayBuffer(44 + dataSize), v = new DataView(arr);
    const ws = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    ws(0, 'RIFF'); v.setUint32(4, 36 + dataSize, true); ws(8, 'WAVE'); ws(12, 'fmt ');
    v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, nc, true);
    v.setUint32(24, sr, true); v.setUint32(28, sr * nc * 2, true); v.setUint16(32, nc * 2, true);
    v.setUint16(34, 16, true); ws(36, 'data'); v.setUint32(40, dataSize, true);
    const ch: Float32Array[] = []; for (let i = 0; i < nc; i++) ch.push(buffer.getChannelData(i));
    let o = 44;
    for (let i = 0; i < samples; i++) for (let c = 0; c < nc; c++) {
      const s = Math.max(-1, Math.min(1, ch[c][i]));
      v.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7FFF, true); o += 2;
    }
    return arr;
  }

  const handleScaleChange = (s: ScaleName) => {
    setScale(s);
    if (engineRef.current) {
      engineRef.current.setScale(s);
      noteStatesRef.current = engineRef.current.getScaleNotes().map(n => ({ ...n, envelope: 0, isPlaying: false, triggerTime: 0 }));
      setNoteStates([...noteStatesRef.current]);
    }
  };

  const handleRootChange = (r: number) => {
    setRootNote(r);
    if (engineRef.current) {
      engineRef.current.setRoot(r);
      noteStatesRef.current = engineRef.current.getScaleNotes().map(n => ({ ...n, envelope: 0, isPlaying: false, triggerTime: 0 }));
      setNoteStates([...noteStatesRef.current]);
    }
  };

  useEffect(() => {
    return () => {
      engineRef.current?.dispose();
      midiRef.current?.dispose();
      playbackTimeoutRef.current.forEach(t => clearTimeout(t));
    };
  }, []);

  const rootNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const totalDuration = recordedNotes.length > 0 ? beatToTime(Math.max(...recordedNotes.map(n => n.startTime + n.duration))) : 0;

  return (
    <main className="min-h-screen pt-14 flex relative overflow-hidden">
      {/* Instrument Area - Full original layout */}
      <div className="flex-1 relative flex items-center justify-center" style={{ background: 'var(--background)' }}>
        {/* Canvas container - maintains square aspect ratio, centered */}
        <div className="relative" style={{ width: '600px', height: '600px' }}>
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ background: 'var(--background)' }} />

        {/* Init overlay */}
        {!isInitialized && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-[var(--background)]/90 backdrop-blur-sm">
            <button onClick={initEngine} className="group relative px-12 py-6 rounded-full transition-all duration-700 hover:scale-105"
              style={{ background: 'linear-gradient(135deg, rgba(124, 92, 255, 0.15) 0%, rgba(124, 92, 255, 0.05) 100%)', border: '1px solid rgba(124, 92, 255, 0.2)' }}>
              <div className="relative flex flex-col items-center gap-3">
                <span className="text-2xl tracking-[0.2em] text-[var(--foreground)]/80 uppercase">Awaken</span>
                <span className="text-xs tracking-[0.3em] text-[var(--foreground)]/40 uppercase">Click to begin</span>
              </div>
            </button>
          </div>
        )}

          {/* Title - centered in container */}
          {isInitialized && (
            <div className="absolute inset-x-0 top-8 text-center z-10 pointer-events-none">
              <h1 className="text-3xl tracking-[0.3em] font-light uppercase" style={{ color: 'rgba(124, 92, 255, 0.7)', textShadow: '0 0 40px rgba(124, 92, 255, 0.2)' }}>
                Aether
              </h1>
              <p className="mt-1 text-[10px] tracking-[0.25em] text-[var(--foreground)]/30 uppercase">Crystalline Resonance Instrument</p>
            </div>
          )}

          {/* Note touch zones - inside the fixed container */}
          {isInitialized && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-[420px] h-[420px]">
                {noteStates.map((note, i) => {
                  const angle = (i / noteStates.length) * Math.PI * 2 - Math.PI / 2;
                  const radius = 170;
                  const x = 210 + Math.cos(angle) * radius;
                  const y = 210 + Math.sin(angle) * radius;
                  const key = Object.entries(KEYBOARD_MAP).find(([, idx]) => idx === i)?.[0]?.toUpperCase();

                  return (
                    <button key={i} className="absolute w-14 h-14 rounded-full -translate-x-1/2 -translate-y-1/2 transition-all duration-150 touch-none select-none"
                      style={{
                        left: x, top: y,
                        background: note.envelope > 0.01 ? `rgba(124, 92, 255, ${0.1 + note.envelope * 0.2})` : 'rgba(124, 92, 255, 0.02)',
                        border: '1px solid rgba(124, 92, 255, 0.15)',
                        transform: `translate(-50%, -50%) scale(${1 + note.envelope * 0.2})`,
                        boxShadow: note.envelope > 0.01 ? `0 0 ${20 + note.envelope * 30}px rgba(124, 92, 255, ${note.envelope * 0.3})` : 'none'
                      }}
                      onMouseDown={() => engineRef.current?.playNote(i, 0.7)}
                      onMouseUp={() => engineRef.current?.releaseNote(i)}
                      onMouseLeave={() => engineRef.current?.releaseNote(i)}
                      onTouchStart={(e) => { e.preventDefault(); engineRef.current?.playNote(i, 0.7); }}
                      onTouchEnd={(e) => { e.preventDefault(); engineRef.current?.releaseNote(i); }}>
                      <span className="text-xs text-[var(--foreground)]/40 flex flex-col items-center">
                        <span className="font-medium">{note.name}{note.octave}</span>
                        {key && <span className="text-[8px] opacity-50">{key}</span>}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Keyboard hint - inside container at bottom */}
          {isInitialized && (
            <div className="absolute inset-x-0 bottom-4 text-center z-10 pointer-events-none">
              <div className="inline-block px-4 py-2 rounded-full" style={{ background: 'rgba(124, 92, 255, 0.05)' }}>
                <span className="text-[9px] tracking-[0.2em] text-[var(--foreground)]/25 uppercase">
                  Play: A-L / Q-P · Record: Space · {bpm} BPM
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom controls - outside canvas container */}
        {isInitialized && (
          <div className="absolute bottom-6 left-6 right-6 z-10 flex items-end justify-between">
            <div className="flex flex-col gap-2">
              <span className="text-[9px] tracking-[0.2em] text-[var(--foreground)]/30 uppercase">Scale</span>
              <div className="flex gap-1 flex-wrap max-w-[500px]">
                {Object.keys(SCALES).map((s) => (
                  <button key={s} onClick={() => handleScaleChange(s as ScaleName)}
                    className="px-3 py-1.5 text-[10px] tracking-wider uppercase rounded-full transition-all duration-300"
                    style={{
                      background: scale === s ? 'rgba(124, 92, 255, 0.15)' : 'rgba(124, 92, 255, 0.03)',
                      border: scale === s ? '1px solid rgba(124, 92, 255, 0.3)' : '1px solid rgba(124, 92, 255, 0.1)',
                      color: scale === s ? 'rgba(124, 92, 255, 0.9)' : 'rgba(124, 92, 255, 0.4)'
                    }}>
                    {s.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 items-end">
              <span className="text-[9px] tracking-[0.2em] text-[var(--foreground)]/30 uppercase">Root</span>
              <div className="flex gap-1">
                {rootNotes.map((n, i) => (
                  <button key={n} onClick={() => handleRootChange(60 + i)}
                    className="w-7 h-7 text-[10px] rounded-full transition-all duration-300"
                    style={{
                      background: rootNote === 60 + i ? 'rgba(124, 92, 255, 0.15)' : 'rgba(124, 92, 255, 0.03)',
                      border: rootNote === 60 + i ? '1px solid rgba(124, 92, 255, 0.3)' : '1px solid rgba(124, 92, 255, 0.1)',
                      color: rootNote === 60 + i ? 'rgba(124, 92, 255, 0.9)' : 'rgba(124, 92, 255, 0.4)'
                    }}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Player Panel - Right */}
      {isInitialized && (
        <div className="w-72 flex flex-col border-l" style={{ borderColor: 'rgba(124, 92, 255, 0.1)', background: 'rgba(124, 92, 255, 0.02)' }}>
          {/* Time */}
          <div className="p-5 border-b" style={{ borderColor: 'rgba(124, 92, 255, 0.08)' }}>
            <div className="text-3xl font-light tracking-wider"
              style={{
                color: recording.isRecording ? 'rgba(255, 92, 92, 0.9)' : 'rgba(124, 92, 255, 0.85)',
                textShadow: recording.isRecording ? '0 0 20px rgba(255, 92, 92, 0.3)' : 'none'
              }}>
              {formatTime(recording.isPlaying ? currentTime : (recording.isRecording ? Date.now() - recording.startTime : 0))}
            </div>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-[10px] tracking-wider"
                style={{ color: recordedNotes.length > 0 ? 'rgba(124, 92, 255, 0.6)' : 'rgba(124, 92, 255, 0.3)' }}>
                {recordedNotes.length} {recordedNotes.length === 1 ? 'note' : 'notes'}
              </span>
              {totalDuration > 0 && (
                <span className="text-[10px]" style={{ color: 'rgba(124, 92, 255, 0.4)' }}>
                  · {formatTime(totalDuration)} total
                </span>
              )}
            </div>
          </div>

          {/* Waveform */}
          <div className="p-4 border-b flex-1 min-h-[120px]" style={{ borderColor: 'rgba(124, 92, 255, 0.08)' }}>
            <canvas ref={waveCanvasRef} className="w-full h-full rounded-xl"
              style={{ background: 'rgba(124, 92, 255, 0.04)', border: '1px solid rgba(124, 92, 255, 0.08)' }} />
          </div>

          {/* Transport */}
          <div className="p-5 border-b flex items-center justify-center gap-4" style={{ borderColor: 'rgba(124, 92, 255, 0.08)' }}>
            <button onClick={toggleRecording} className="w-14 h-14 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95"
              style={{
                background: recording.isRecording ? 'rgba(255, 92, 92, 0.25)' : 'rgba(255, 92, 92, 0.1)',
                border: recording.isRecording ? '2px solid rgba(255, 92, 92, 0.7)' : '1px solid rgba(255, 92, 92, 0.3)',
                boxShadow: recording.isRecording ? '0 0 20px rgba(255, 92, 92, 0.3)' : 'none'
              }}>
              <div className={`w-5 h-5 rounded-full ${recording.isRecording ? 'animate-pulse' : ''}`} style={{ background: 'rgba(255, 92, 92, 0.9)' }} />
            </button>
            <button onClick={recording.isPlaying ? stopPlayback : playRecording}
              className="w-14 h-14 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95"
              style={{
                background: recording.isPlaying ? 'rgba(124, 92, 255, 0.25)' : recordedNotes.length > 0 ? 'rgba(124, 92, 255, 0.12)' : 'rgba(124, 92, 255, 0.06)',
                border: recording.isPlaying ? '2px solid rgba(124, 92, 255, 0.7)' : '1px solid rgba(124, 92, 255, 0.25)',
                opacity: recordedNotes.length === 0 ? 0.5 : 1
              }}>
              {recording.isPlaying
                ? <div className="w-5 h-5 rounded-sm" style={{ background: 'rgba(124, 92, 255, 0.9)' }} />
                : <div className="w-0 h-0 ml-1" style={{ borderTop: '7px solid transparent', borderBottom: '7px solid transparent', borderLeft: '12px solid rgba(124, 92, 255, 0.9)' }} />}
            </button>
          </div>

          {/* BPM */}
          <div className="p-5 border-b" style={{ borderColor: 'rgba(124, 92, 255, 0.08)' }}>
            <div className="flex items-center justify-between">
              <span className="text-[9px] tracking-[0.2em] text-[var(--foreground)]/40 uppercase">Tempo</span>
              <div className="flex items-center gap-3">
                <button onClick={() => setBpm(b => Math.max(40, b - 5))}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-light transition-all hover:scale-110 active:scale-95"
                  style={{ background: 'rgba(124, 92, 255, 0.1)', border: '1px solid rgba(124, 92, 255, 0.2)', color: 'rgba(124, 92, 255, 0.7)' }}>
                  −
                </button>
                <span className="text-xl font-light w-14 text-center" style={{ color: 'rgba(124, 92, 255, 0.8)' }}>{bpm}</span>
                <button onClick={() => setBpm(b => Math.min(240, b + 5))}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-light transition-all hover:scale-110 active:scale-95"
                  style={{ background: 'rgba(124, 92, 255, 0.1)', border: '1px solid rgba(124, 92, 255, 0.2)', color: 'rgba(124, 92, 255, 0.7)' }}>
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-5 flex flex-col gap-3">
            <button onClick={exportAudio} disabled={isExporting}
              className="w-full h-11 rounded-full text-[10px] tracking-[0.15em] uppercase transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: recordedNotes.length > 0 ? 'rgba(124, 92, 255, 0.15)' : 'rgba(124, 92, 255, 0.06)',
                border: recordedNotes.length > 0 ? '1px solid rgba(124, 92, 255, 0.35)' : '1px solid rgba(124, 92, 255, 0.15)',
                color: recordedNotes.length > 0 ? 'rgba(124, 92, 255, 0.95)' : 'rgba(124, 92, 255, 0.4)',
                opacity: isExporting ? 0.6 : 1
              }}>
              {isExporting ? 'Rendering...' : recordedNotes.length > 0 ? 'Export WAV' : 'Record First'}
            </button>
            <button onClick={clearRecording}
              className="w-full h-10 rounded-full text-[10px] tracking-[0.15em] uppercase transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: recordedNotes.length > 0 ? 'rgba(255, 92, 92, 0.08)' : 'transparent',
                border: recordedNotes.length > 0 ? '1px solid rgba(255, 92, 92, 0.2)' : '1px solid rgba(124, 92, 255, 0.1)',
                color: recordedNotes.length > 0 ? 'rgba(255, 92, 92, 0.7)' : 'rgba(124, 92, 255, 0.3)'
              }}>
              {recordedNotes.length > 0 ? 'Clear' : '—'}
            </button>
          </div>

          {/* MIDI */}
          <div className="mt-auto p-5 border-t" style={{ borderColor: 'rgba(124, 92, 255, 0.08)' }}>
            <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-full"
              style={{ background: midiConnected ? 'rgba(124, 92, 255, 0.08)' : 'transparent' }}>
              <div className={`w-2 h-2 rounded-full ${midiConnected ? 'animate-pulse' : ''}`}
                style={{ background: midiConnected ? 'rgba(124, 92, 255, 0.8)' : 'rgba(124, 92, 255, 0.2)' }} />
              <span className="text-[9px] tracking-[0.15em] uppercase"
                style={{ color: midiConnected ? 'rgba(124, 92, 255, 0.7)' : 'rgba(124, 92, 255, 0.3)' }}>
                {midiConnected ? 'MIDI Connected' : 'No MIDI Device'}
              </span>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
