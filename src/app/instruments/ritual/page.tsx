'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { LyriaStreamEngine } from '@/lib/lyria-stream-engine';
import { AetherEngine } from '@/lib/aether-engine';
import { AudioRecorder, MidiClock } from '@/lib/audio-recorder';

type RitualMode = 'IONIC' | 'RADIANT' | 'VORTEX' | 'ETHER';

const RITUAL_MODES: Record<RitualMode, { desc: string; character: string }> = {
  IONIC: { desc: 'Cold, analytical. Sparse harmonics.', character: '◇' },
  RADIANT: { desc: 'Warm, golden. Tube-like harmonics.', character: '○' },
  VORTEX: { desc: 'Chaotic, distorted. Feedback loops.', character: '△' },
  ETHER: { desc: 'Infinite, ambient. Long decay.', character: '□' },
};

export default function RitualInstrumentPage() {
  const aetherRef = useRef<AetherEngine | null>(null);
  const lyriaRef = useRef<LyriaStreamEngine | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const midiClockRef = useRef<MidiClock | null>(null);

  const [isInitialized, setIsInitialized] = useState(false);
  const [currentMode, setCurrentMode] = useState<RitualMode>('IONIC');
  const [connectionState, setConnectionState] = useState<'disconnected' | 'connecting' | 'connected' | 'streaming' | 'error'>('disconnected');
  const [bufferHealth, setBufferHealth] = useState(0);
  const [activeNotes, setActiveNotes] = useState<Set<number>>(new Set());

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingBars, setRecordingBars] = useState(0);
  const [bpm, setBpm] = useState(120);

  const initEngines = async () => {
    if (isInitialized) return;
    try {
      const ctx = new AudioContext();
      audioContextRef.current = ctx;

      const aether = new AetherEngine();
      await aether.init();
      aether.setScale('pentatonic');
      aether.setRoot(60);
      aetherRef.current = aether;

      const lyria = new LyriaStreamEngine();
      await lyria.init(ctx, { serverUrl: 'ws://localhost:3112/lyria-stream', outputGain: 0.6 });
      lyria.onConnectionStateChange = (state) => setConnectionState(state);
      lyria.onBufferHealth = (health) => setBufferHealth(health);
      lyria.onError = (error) => console.error('[Ritual] Lyria error:', error);
      lyriaRef.current = lyria;

      // Initialize recorder
      const recorder = new AudioRecorder(ctx, { bpm });
      const masterGain = aether['masterGain'] as GainNode;
      if (masterGain) recorder.connectSource(masterGain);
      recorder.onStateChange = (state) => {
        setIsRecording(state.isRecording);
        setRecordingTime(state.duration);
        setRecordingBars(state.bars);
      };
      recorder.onRecordingComplete = async (blob) => {
        try {
          const wavBlob = await AudioRecorder.webmToWav(blob, ctx);
          const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
          AudioRecorder.downloadBlob(wavBlob, `ritual-${currentMode.toLowerCase()}-${timestamp}.wav`);
        } catch {
          const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
          AudioRecorder.downloadBlob(blob, `ritual-${currentMode.toLowerCase()}-${timestamp}.webm`);
        }
        setIsRecording(false);
      };
      recorderRef.current = recorder;

      // Initialize MIDI clock
      const clock = new MidiClock();
      clock.setBPM(bpm);
      midiClockRef.current = clock;

      setIsInitialized(true);
    } catch (error) {
      console.error('[Ritual] Initialization error:', error);
    }
  };

  const connectToBackend = async () => {
    if (!lyriaRef.current) return;
    try { await lyriaRef.current.connect(); } catch (e) { console.error('[Ritual] Connection error:', e); }
  };

  const changeMode = (mode: RitualMode) => {
    setCurrentMode(mode);
    lyriaRef.current?.setRitualMode(mode);
  };

  const playNote = (i: number) => {
    setActiveNotes(prev => new Set(prev).add(i));
    if (aetherRef.current && lyriaRef.current) {
      aetherRef.current.playNote(i, 0.8);
      const notes = aetherRef.current.getScaleNotes();
      lyriaRef.current.updateSteeringParams({ harmonicField: [notes[i]?.midiNote || 60], userActivity: 0.8 });
    }
  };

  const releaseNote = (i: number) => {
    setActiveNotes(prev => { const n = new Set(prev); n.delete(i); return n; });
    aetherRef.current?.releaseNote(i);
  };

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

  const handleBpmChange = (newBpm: number) => {
    setBpm(newBpm);
    recorderRef.current?.setBPM(newBpm);
    midiClockRef.current?.setBPM(newBpm);
  };

  useEffect(() => {
    return () => { aetherRef.current?.dispose(); lyriaRef.current?.dispose(); audioContextRef.current?.close(); };
  }, []);

  const healthPct = Math.round(bufferHealth * 100);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="corner-mark top-left" style={{ top: 24, left: 24 }} />
      <div className="corner-mark top-right" style={{ top: 24, right: 24 }} />
      <div className="corner-mark bottom-left" style={{ bottom: 24, left: 24 }} />
      <div className="corner-mark bottom-right" style={{ bottom: 24, right: 24 }} />

      <div className="fixed bottom-6 left-6 build-label">RITUAL-0321</div>

      <div className="fixed top-6 left-6">
        <Link href="/instruments" className="nav-link">← Instruments</Link>
      </div>

      <div className="fixed top-6 right-6 flex items-center gap-3">
        <div
          className="w-2 h-2 rounded-full transition-all"
          style={{
            background: connectionState === 'streaming' || connectionState === 'connected' ? 'var(--accent)' :
                       connectionState === 'connecting' ? 'var(--foreground)' :
                       connectionState === 'error' ? '#ef4444' : 'var(--border-strong)',
            opacity: connectionState === 'streaming' || connectionState === 'connected' ? 1 : 0.4
          }}
        />
        <span className="label-micro">{connectionState}</span>
      </div>

      <div className="content-center">
        <div className="relative">
          <div className="orbit-circle animate-orbit animate-pulse-soft" style={{ width: 420, height: 420, top: '50%', left: '50%', marginTop: -210, marginLeft: -210 }} />
          <div className="orbit-circle animate-orbit-reverse" style={{ width: 320, height: 320, top: '50%', left: '50%', marginTop: -160, marginLeft: -160 }} />
          <div className="orbit-circle orbit-inner" style={{ width: 220, height: 220, top: '50%', left: '50%', marginTop: -110, marginLeft: -110 }} />

          <div className="relative z-10 w-[340px] text-center animate-fade-up">
            <div className="flex justify-center mb-6">
              <div
                className="w-20 h-20 border flex items-center justify-center text-3xl transition-all duration-500"
                style={{
                  borderColor: isInitialized ? 'var(--accent)' : 'var(--border)',
                  color: isInitialized ? 'var(--accent)' : 'var(--foreground)',
                  opacity: isInitialized ? 1 : 0.3
                }}
              >
                {RITUAL_MODES[currentMode].character}
              </div>
            </div>

            <h1 className="text-xl font-medium tracking-[0.15em] mb-1">{currentMode}</h1>
            <p className="text-xs uppercase tracking-[0.2em] opacity-30 mb-10">{RITUAL_MODES[currentMode].desc}</p>

            {!isInitialized ? (
              <button onClick={initEngines} className="btn-primary">Initialize Audio</button>
            ) : (
              <div className="space-y-8">
                <div className="grid grid-cols-4 gap-2">
                  {(Object.keys(RITUAL_MODES) as RitualMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => changeMode(mode)}
                      className="p-3 border transition-all duration-300"
                      style={{
                        borderColor: currentMode === mode ? 'var(--accent)' : 'var(--border)',
                        background: currentMode === mode ? 'var(--accent-muted)' : 'transparent'
                      }}
                    >
                      <div className="text-xl mb-1 transition-all" style={{ color: currentMode === mode ? 'var(--accent)' : 'var(--foreground)', opacity: currentMode === mode ? 1 : 0.3 }}>
                        {RITUAL_MODES[mode].character}
                      </div>
                      <div className="label-micro">{mode}</div>
                    </button>
                  ))}
                </div>

                <div>
                  <div className="label-micro mb-3 opacity-40">Keyboard</div>
                  <div className="grid grid-cols-8 gap-1">
                    {Array.from({ length: 8 }, (_, i) => (
                      <button
                        key={i}
                        onMouseDown={() => playNote(i)}
                        onMouseUp={() => releaseNote(i)}
                        onMouseLeave={() => releaseNote(i)}
                        className="aspect-[3/4] border transition-all duration-150"
                        style={{
                          borderColor: activeNotes.has(i) ? 'var(--accent)' : 'var(--border)',
                          background: activeNotes.has(i) ? 'var(--accent-muted)' : 'transparent'
                        }}
                      >
                        <span className="label-micro" style={{ opacity: activeNotes.has(i) ? 1 : 0.3 }}>{i + 1}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {connectionState === 'streaming' && (
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="label-micro opacity-40">Buffer</span>
                      <span className="label-micro">{healthPct}%</span>
                    </div>
                    <div className="h-[2px] bg-[var(--border)]">
                      <div className="h-full bg-[var(--accent)] transition-all" style={{ width: healthPct + '%' }} />
                    </div>
                  </div>
                )}

                {/* Recording Controls */}
                <div>
                  <div className="label-micro mb-3 opacity-40">Record</div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={40}
                        max={240}
                        value={bpm}
                        onChange={(e) => handleBpmChange(parseInt(e.target.value) || 120)}
                        className="w-14 h-7 bg-transparent border border-[var(--border)] text-center text-xs font-mono focus:outline-none focus:border-[var(--accent)]"
                      />
                      <span className="label-micro opacity-40">BPM</span>
                    </div>
                    <button
                      onClick={isRecording ? stopRecording : startRecording}
                      className="w-8 h-8 border rounded-full flex items-center justify-center transition-all"
                      style={{
                        borderColor: isRecording ? '#ff4444' : 'var(--accent)',
                        background: isRecording ? '#ff4444' : 'transparent',
                        color: isRecording ? '#fff' : 'var(--accent)'
                      }}
                    >
                      {isRecording ? '■' : '●'}
                    </button>
                    <div className="flex gap-1">
                      {[1, 2, 4, 8].map((bars) => (
                        <button
                          key={bars}
                          onClick={() => recordBars(bars)}
                          disabled={isRecording}
                          className="w-6 h-6 border text-[9px] font-mono transition-all hover:bg-[var(--accent)] hover:text-white disabled:opacity-30"
                          style={{ borderColor: 'var(--border)' }}
                        >
                          {bars}
                        </button>
                      ))}
                    </div>
                  </div>
                  {isRecording && (
                    <div className="mt-2 text-xs font-mono animate-pulse" style={{ color: '#ff4444' }}>
                      REC {recordingBars}:{Math.floor(recordingTime % (60 / bpm * 4)).toString().padStart(2, '0')}
                    </div>
                  )}
                </div>

                {connectionState === 'disconnected' && (
                  <button onClick={connectToBackend} className="btn-outline w-full">Connect to Lyria</button>
                )}
              </div>
            )}
          </div>

          <div className="absolute left-[-50px] top-1/2 -translate-y-1/2">
            <div className="diamond" style={{ opacity: isInitialized ? 0.4 : 0.15 }} />
          </div>
          <div className="absolute right-[-50px] top-1/2 -translate-y-1/2">
            <div className="diamond" style={{ opacity: isInitialized ? 0.4 : 0.15 }} />
          </div>
        </div>
      </div>

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-10">
        {(Object.keys(RITUAL_MODES) as RitualMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => isInitialized && changeMode(mode)}
            className="nav-link transition-all"
            style={{ color: currentMode === mode ? 'var(--accent)' : undefined, opacity: currentMode === mode ? 1 : undefined }}
          >
            {mode}
          </button>
        ))}
      </div>
    </div>
  );
}
