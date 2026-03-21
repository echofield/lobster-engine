'use client';

import { useEffect, useRef, useState } from 'react';
import { SpaceTimeEngine, SpaceTimeConditions, ConditionResult, SpaceCondition, TimeCondition } from '@/lib/spacetime-engine';

type Mode = 'chamber' | 'creator';

const MOON_PHASES = [
  { value: 'new', label: 'New Moon', symbol: '○' },
  { value: 'full', label: 'Full Moon', symbol: '●' },
  { value: 'waxing_crescent', label: 'Waxing', symbol: '◑' },
  { value: 'waning_crescent', label: 'Waning', symbol: '◐' },
];

const CITIES = ['Tokyo', 'Paris', 'New York', 'London', 'Berlin', 'Los Angeles', 'Sydney', 'Seoul'];

export default function SpaceTimePage() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const engineRef = useRef<SpaceTimeEngine | null>(null);

  const [mode, setMode] = useState<Mode>('chamber');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [story, setStory] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  // Conditions
  const [spaceType, setSpaceType] = useState<'anywhere' | 'city'>('anywhere');
  const [city, setCity] = useState('');
  const [timeType, setTimeType] = useState<'anytime' | 'moon_phase'>('anytime');
  const [moonPhase, setMoonPhase] = useState('');

  // State
  const [conditionResult, setConditionResult] = useState<ConditionResult | null>(null);
  const accentColor = '#7C5CFF';

  // Init engine
  useEffect(() => {
    const engine = new SpaceTimeEngine();
    engine.requestLocation();
    engineRef.current = engine;
    return () => engine.dispose();
  }, []);

  // Evaluate conditions
  useEffect(() => {
    if (!engineRef.current) return;

    const conditions: SpaceTimeConditions = {
      id: 'temp',
      name: title || 'Untitled',
      space: { type: spaceType, city: city || undefined },
      time: {
        type: timeType,
        moonPhase: moonPhase as TimeCondition['moonPhase'] || undefined
      },
      createdAt: new Date().toISOString(),
    };

    const result = engineRef.current.evaluate(conditions);
    setConditionResult(result);
  }, [spaceType, city, timeType, moonPhase, title]);

  // Audio handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTime = () => setProgress(audio.currentTime);
    const onDuration = () => setDuration(audio.duration);
    const onEnd = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('durationchange', onDuration);
    audio.addEventListener('ended', onEnd);

    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('durationchange', onDuration);
      audio.removeEventListener('ended', onEnd);
    };
  }, [audioUrl]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAudioFile(file);
    setAudioUrl(URL.createObjectURL(file));
    if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ''));
  };

  const togglePlay = () => {
    if (!audioRef.current || !audioUrl) return;
    if (!conditionResult?.allowed) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const isUnlocked = conditionResult?.allowed ?? false;

  return (
    <div className="min-h-screen w-full bg-[#0a0a0a] text-white relative">
      {/* Hidden elements */}
      <audio ref={audioRef} src={audioUrl || undefined} />
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFile}
        className="sr-only"
      />

      {/* Header - always visible */}
      <header className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center px-8 py-6">
        <a href="/" className="text-xs uppercase tracking-widest text-white/40 hover:text-white/80">
          ← Exit
        </a>
        <button
          onClick={() => setMode(mode === 'chamber' ? 'creator' : 'chamber')}
          className="text-xs uppercase tracking-widest px-4 py-2 border transition-all"
          style={{
            borderColor: mode === 'creator' ? accentColor : 'rgba(255,255,255,0.3)',
            color: mode === 'creator' ? accentColor : 'rgba(255,255,255,0.8)',
            background: mode === 'creator' ? `${accentColor}15` : 'transparent',
          }}
        >
          {mode === 'creator' ? '← Back to Chamber' : '+ Create Release'}
        </button>
      </header>

      {/* Footer */}
      <div className="absolute bottom-6 left-8 text-[9px] uppercase tracking-widest text-white/15 z-10">
        EVO-0321
      </div>

      {/* ============ CHAMBER MODE ============ */}
      {mode === 'chamber' && (
        <div className="h-screen flex items-center px-16">
          {/* Left: Ring */}
          <div className="w-2/5 flex justify-center">
            <button
              onClick={audioUrl ? togglePlay : () => setMode('creator')}
              disabled={audioUrl ? !isUnlocked : false}
              className="w-40 h-40 rounded-full border-2 flex items-center justify-center transition-all duration-300 hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
              style={{
                borderColor: !audioUrl ? '#333' : isUnlocked ? accentColor : '#661111',
                color: !audioUrl ? '#555' : isUnlocked ? accentColor : '#993333',
                background: isPlaying ? `${accentColor}10` : 'transparent',
              }}
            >
              <span className="text-6xl">
                {!audioUrl ? '+' : isUnlocked ? (isPlaying ? '❚❚' : '▶') : '◇'}
              </span>
            </button>
          </div>

          {/* Right: Info */}
          <div className="flex-1">
            {/* State */}
            <div
              className="text-xs uppercase tracking-[0.3em] mb-4"
              style={{ color: !audioUrl ? '#333' : isUnlocked ? accentColor : '#661111' }}
            >
              {!audioUrl ? 'Empty' : isUnlocked ? '● Unlocked' : '○ Locked'}
            </div>

            {/* Title */}
            <h1
              className="text-5xl font-extralight mb-4"
              style={{ color: !audioUrl ? '#222' : '#fff' }}
            >
              {title || 'Untitled'}
            </h1>

            {/* Story */}
            {story && audioUrl && (
              <p className="text-sm text-white/40 max-w-md mb-8 leading-relaxed">
                {story}
              </p>
            )}

            {/* Hint when empty */}
            {!audioUrl && (
              <p className="text-sm text-white/20 max-w-sm">
                Click the ring or press <span className="text-white/40">Create Release</span> to begin.
              </p>
            )}

            {/* Current conditions */}
            {conditionResult?.currentValues && (
              <div className="text-[10px] uppercase tracking-widest text-white/20 space-y-1 mt-8">
                {conditionResult.currentValues.moonPhase && (
                  <div>moon: {conditionResult.currentValues.moonPhase.replace('_', ' ')}</div>
                )}
                {conditionResult.currentValues.season && (
                  <div>season: {conditionResult.currentValues.season}</div>
                )}
              </div>
            )}

            {/* Progress */}
            {audioUrl && isPlaying && (
              <div className="mt-10 max-w-sm">
                <div className="h-px bg-white/10">
                  <div
                    className="h-full bg-current transition-all"
                    style={{ width: `${(progress / duration) * 100 || 0}%`, color: accentColor }}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-white/20 mt-2 font-mono">
                  <span>{formatTime(progress)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============ CREATOR MODE ============ */}
      {mode === 'creator' && (
        <div className="min-h-screen pt-24 pb-16 px-16">
          <div className="max-w-2xl mx-auto space-y-12">

            {/* Upload */}
            <section>
              <h2 className="text-xs uppercase tracking-widest text-white/40 mb-4">1. Audio</h2>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-32 border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all hover:border-solid"
                style={{ borderColor: audioFile ? accentColor : '#333' }}
              >
                {audioFile ? (
                  <>
                    <span style={{ color: accentColor }}>✓</span>
                    <span className="text-sm text-white/60">{audioFile.name}</span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl text-white/30">+</span>
                    <span className="text-xs text-white/30 uppercase tracking-widest">Drop or click</span>
                  </>
                )}
              </button>
            </section>

            {/* Info */}
            <section>
              <h2 className="text-xs uppercase tracking-widest text-white/40 mb-4">2. Info</h2>
              <div className="space-y-4">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Title"
                  className="w-full bg-transparent border border-white/20 px-4 py-3 text-lg focus:outline-none focus:border-white/40"
                />
                <textarea
                  value={story}
                  onChange={(e) => setStory(e.target.value)}
                  placeholder="Story (optional)"
                  className="w-full h-24 bg-transparent border border-white/20 px-4 py-3 resize-none focus:outline-none focus:border-white/40"
                />
              </div>
            </section>

            {/* Space */}
            <section>
              <h2 className="text-xs uppercase tracking-widest text-white/40 mb-4">3. Space Condition</h2>
              <div className="flex gap-3 mb-4">
                {(['anywhere', 'city'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setSpaceType(t)}
                    className="px-4 py-2 border text-sm capitalize transition-all"
                    style={{
                      borderColor: spaceType === t ? accentColor : '#333',
                      color: spaceType === t ? accentColor : 'white',
                      background: spaceType === t ? `${accentColor}15` : 'transparent',
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
              {spaceType === 'city' && (
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-[#111] border border-white/20 px-4 py-3 focus:outline-none"
                >
                  <option value="">Select city...</option>
                  {CITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              )}
            </section>

            {/* Time */}
            <section>
              <h2 className="text-xs uppercase tracking-widest text-white/40 mb-4">4. Time Condition</h2>
              <div className="flex gap-3 mb-4">
                {(['anytime', 'moon_phase'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTimeType(t)}
                    className="px-4 py-2 border text-sm transition-all"
                    style={{
                      borderColor: timeType === t ? accentColor : '#333',
                      color: timeType === t ? accentColor : 'white',
                      background: timeType === t ? `${accentColor}15` : 'transparent',
                    }}
                  >
                    {t === 'anytime' ? 'Anytime' : 'Moon Phase'}
                  </button>
                ))}
              </div>
              {timeType === 'moon_phase' && (
                <div className="grid grid-cols-4 gap-3">
                  {MOON_PHASES.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => setMoonPhase(p.value)}
                      className="py-4 border text-center transition-all"
                      style={{
                        borderColor: moonPhase === p.value ? accentColor : '#333',
                        background: moonPhase === p.value ? `${accentColor}15` : 'transparent',
                      }}
                    >
                      <div className="text-2xl mb-1">{p.symbol}</div>
                      <div className="text-[10px] text-white/50">{p.label}</div>
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* Preview */}
            <section>
              <h2 className="text-xs uppercase tracking-widest text-white/40 mb-4">Preview</h2>
              <div
                className="p-6 border"
                style={{ borderColor: isUnlocked ? accentColor : '#661111' }}
              >
                <div className="flex items-center gap-6">
                  <div
                    className="w-16 h-16 rounded-full border-2 flex items-center justify-center text-2xl"
                    style={{ borderColor: isUnlocked ? accentColor : '#661111', color: isUnlocked ? accentColor : '#993333' }}
                  >
                    {isUnlocked ? '▶' : '◇'}
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-widest mb-1" style={{ color: isUnlocked ? accentColor : '#661111' }}>
                      {isUnlocked ? '● Unlocked' : '○ Locked'}
                    </div>
                    <div className="text-xl">{title || 'Untitled'}</div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setMode('chamber')}
                className="w-full mt-6 py-3 border text-sm uppercase tracking-widest transition-all hover:bg-white hover:text-black"
                style={{ borderColor: accentColor, color: accentColor }}
              >
                Test in Chamber
              </button>
            </section>

          </div>
        </div>
      )}
    </div>
  );
}
