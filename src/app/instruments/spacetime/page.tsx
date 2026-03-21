'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { SpaceTimeEngine, SpaceTimeConditions, ConditionResult, SpaceCondition, TimeCondition, EvolutionRule } from '@/lib/spacetime-engine';

interface Track {
  id: string;
  name: string;
  artistName: string;
  story: string;
  audioFile: File | null;
  audioUrl: string | null;
  conditions: SpaceTimeConditions;
  visual: {
    accentColor: string;
    backgroundImage: string | null;
    symbolLocked: string;
    symbolUnlocked: string;
    lockedMessage: string;
    unlockedMessage: string;
  };
  createdAt: string;
}

type Mode = 'listener' | 'creator';
type CreatorTab = 'upload' | 'story' | 'space' | 'time' | 'visual' | 'preview';

const CITIES = [
  'Tokyo', 'Paris', 'New York', 'London', 'Berlin', 'Los Angeles', 'Sydney',
  'Dubai', 'Seoul', 'São Paulo', 'Mumbai', 'Cairo', 'Moscow', 'Shanghai',
  'Lagos', 'Mexico City', 'Amsterdam', 'Stockholm', 'Reykjavik', 'Marrakech'
];

const MOON_PHASES = [
  { value: 'new', label: 'New Moon', symbol: '○' },
  { value: 'waxing_crescent', label: 'Waxing Crescent', symbol: '◑' },
  { value: 'first_quarter', label: 'First Quarter', symbol: '◑' },
  { value: 'waxing_gibbous', label: 'Waxing Gibbous', symbol: '◑' },
  { value: 'full', label: 'Full Moon', symbol: '●' },
  { value: 'waning_gibbous', label: 'Waning Gibbous', symbol: '◐' },
  { value: 'last_quarter', label: 'Last Quarter', symbol: '◐' },
  { value: 'waning_crescent', label: 'Waning Crescent', symbol: '◐' },
];

const SEASONS = ['spring', 'summer', 'autumn', 'winter'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const DEFAULT_TRACK: Track = {
  id: '',
  name: 'Untitled',
  artistName: '',
  story: '',
  audioFile: null,
  audioUrl: null,
  conditions: {
    id: '',
    name: '',
    space: { type: 'anywhere' },
    time: { type: 'anytime' },
    createdAt: new Date().toISOString(),
  },
  visual: {
    accentColor: '#7C5CFF',
    backgroundImage: null,
    symbolLocked: '◇',
    symbolUnlocked: '◆',
    lockedMessage: 'This experience is not yet available',
    unlockedMessage: 'Welcome',
  },
  createdAt: new Date().toISOString(),
};

export default function SpaceTimePage() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const spaceTimeRef = useRef<SpaceTimeEngine | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<Mode>('listener');
  const [track, setTrack] = useState<Track>({ ...DEFAULT_TRACK, id: crypto.randomUUID() });
  const [creatorTab, setCreatorTab] = useState<CreatorTab>('upload');
  const [conditionResult, setConditionResult] = useState<ConditionResult | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Initialize SpaceTime engine
  useEffect(() => {
    const engine = new SpaceTimeEngine();
    engine.requestLocation();
    spaceTimeRef.current = engine;

    return () => engine.dispose();
  }, []);

  // Evaluate conditions
  useEffect(() => {
    if (!spaceTimeRef.current) return;
    const result = spaceTimeRef.current.evaluate(track.conditions);
    setConditionResult(result);
  }, [track.conditions]);

  // Audio time update
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setTrack(prev => ({
      ...prev,
      audioFile: file,
      audioUrl: url,
      name: prev.name === 'Untitled' ? file.name.replace(/\.[^/.]+$/, '') : prev.name,
    }));
  };

  const togglePlay = () => {
    if (!audioRef.current || !track.audioUrl) return;
    if (!conditionResult?.allowed) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const updateTrack = <K extends keyof Track>(key: K, value: Track[K]) => {
    setTrack(prev => ({ ...prev, [key]: value }));
  };

  const updateConditions = (updates: Partial<SpaceTimeConditions>) => {
    setTrack(prev => ({
      ...prev,
      conditions: { ...prev.conditions, ...updates },
    }));
  };

  const updateSpace = <K extends keyof SpaceCondition>(key: K, value: SpaceCondition[K]) => {
    setTrack(prev => ({
      ...prev,
      conditions: { ...prev.conditions, space: { ...prev.conditions.space, [key]: value } },
    }));
  };

  const updateTime = <K extends keyof TimeCondition>(key: K, value: TimeCondition[K]) => {
    setTrack(prev => ({
      ...prev,
      conditions: { ...prev.conditions, time: { ...prev.conditions.time, [key]: value } },
    }));
  };

  const updateVisual = <K extends keyof Track['visual']>(key: K, value: Track['visual'][K]) => {
    setTrack(prev => ({
      ...prev,
      visual: { ...prev.visual, [key]: value },
    }));
  };

  const generateShareableLink = () => {
    const config = {
      name: track.name,
      artistName: track.artistName,
      story: track.story,
      conditions: track.conditions,
      visual: track.visual,
    };
    const encoded = btoa(JSON.stringify(config));
    return `${window.location.origin}/instruments/spacetime?t=${encoded}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const accentColor = track.visual.accentColor;
  const isUnlocked = conditionResult?.allowed ?? false;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white relative overflow-hidden">
      {/* Hidden audio element */}
      <audio ref={audioRef} src={track.audioUrl || undefined} />
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Corner marks */}
      <div className="absolute w-3 h-3 border-l border-t top-6 left-6" style={{ borderColor: `${accentColor}40` }} />
      <div className="absolute w-3 h-3 border-r border-t top-6 right-6" style={{ borderColor: `${accentColor}40` }} />
      <div className="absolute w-3 h-3 border-l border-b bottom-6 left-6" style={{ borderColor: `${accentColor}40` }} />
      <div className="absolute w-3 h-3 border-r border-b bottom-6 right-6" style={{ borderColor: `${accentColor}40` }} />

      {/* Header */}
      <div className="fixed top-6 left-6 z-20">
        <Link
          href="/"
          className="text-[10px] uppercase tracking-[0.15em] opacity-40 hover:opacity-100 transition-opacity"
          style={{ color: accentColor }}
        >
          ← Home
        </Link>
      </div>

      <div className="fixed top-6 right-6 z-20 flex items-center gap-4">
        <button
          onClick={() => setMode(mode === 'listener' ? 'creator' : 'listener')}
          className="text-[10px] uppercase tracking-[0.15em] px-3 py-1.5 border transition-all"
          style={{
            color: mode === 'creator' ? '#0a0a0a' : accentColor,
            borderColor: accentColor,
            background: mode === 'creator' ? accentColor : 'transparent',
          }}
        >
          {mode === 'creator' ? 'Exit Creator' : 'Creator Mode'}
        </button>
      </div>

      {/* Build label */}
      <div className="fixed bottom-6 left-6 text-[9px] uppercase tracking-[0.15em] opacity-20" style={{ color: accentColor }}>
        SPACE-TIME-0321
      </div>

      {/* ==================== LISTENER MODE ==================== */}
      {mode === 'listener' && (
        <div className="h-screen flex">
          {/* Left side - Access button (middle-left) */}
          <div className="w-1/3 flex items-center justify-center">
            <button
              onClick={togglePlay}
              disabled={!isUnlocked || !track.audioUrl}
              className="w-32 h-32 rounded-full border-2 flex items-center justify-center text-5xl transition-all disabled:opacity-30"
              style={{
                borderColor: isUnlocked ? accentColor : '#ff4444',
                color: isUnlocked ? accentColor : '#ff4444',
                background: isPlaying ? `${accentColor}20` : 'transparent',
              }}
            >
              {isUnlocked ? (isPlaying ? '❚❚' : '▶') : track.visual.symbolLocked}
            </button>
          </div>

          {/* Right side - Track info & story */}
          <div className="flex-1 flex flex-col justify-center pr-20">
            {/* Status */}
            <div
              className="text-[10px] uppercase tracking-[0.2em] mb-4"
              style={{ color: isUnlocked ? accentColor : '#ff4444' }}
            >
              {isUnlocked ? '● Unlocked' : '○ Locked'}
            </div>

            {/* Track name */}
            <h1
              className="text-4xl font-light tracking-wide mb-2"
              style={{ color: isUnlocked ? '#fff' : '#666' }}
            >
              {track.name}
            </h1>

            {/* Artist */}
            {track.artistName && (
              <div className="text-sm opacity-40 mb-8">
                by {track.artistName}
              </div>
            )}

            {/* Story */}
            {track.story && (
              <div
                className="max-w-lg text-sm leading-relaxed opacity-60 mb-8"
                style={{ color: isUnlocked ? '#fff' : '#666' }}
              >
                {track.story}
              </div>
            )}

            {/* Lock reason */}
            {!isUnlocked && conditionResult?.reason && (
              <div className="text-sm mb-4" style={{ color: '#ff4444' }}>
                {track.visual.lockedMessage}
              </div>
            )}

            {/* Condition info */}
            {conditionResult?.currentValues && (
              <div className="text-[10px] uppercase tracking-[0.1em] opacity-30 space-y-1">
                {conditionResult.currentValues.moonPhase && (
                  <div>Moon: {conditionResult.currentValues.moonPhase.replace('_', ' ')}</div>
                )}
                {conditionResult.currentValues.season && (
                  <div>Season: {conditionResult.currentValues.season}</div>
                )}
                {conditionResult.currentValues.location?.city && (
                  <div>Location: {conditionResult.currentValues.location.city}</div>
                )}
              </div>
            )}

            {/* Next available */}
            {!isUnlocked && conditionResult?.nextAvailable && (
              <div className="mt-4 text-[10px] uppercase tracking-[0.1em] opacity-40">
                Next: {conditionResult.nextAvailable.toLocaleDateString()}
              </div>
            )}

            {/* Progress bar (when playing) */}
            {isUnlocked && track.audioUrl && (
              <div className="mt-8 max-w-lg">
                <div className="flex justify-between text-[10px] opacity-40 mb-2">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
                <div className="h-[2px] bg-white/10">
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${(currentTime / duration) * 100 || 0}%`,
                      background: accentColor,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== CREATOR MODE ==================== */}
      {mode === 'creator' && (
        <div className="h-screen flex">
          {/* Left panel - Tabs */}
          <div className="w-48 border-r border-white/10 pt-20">
            {(['upload', 'story', 'space', 'time', 'visual', 'preview'] as CreatorTab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setCreatorTab(tab)}
                className="w-full px-6 py-3 text-left text-[10px] uppercase tracking-[0.15em] transition-all"
                style={{
                  color: creatorTab === tab ? accentColor : '#fff',
                  opacity: creatorTab === tab ? 1 : 0.4,
                  borderLeft: creatorTab === tab ? `2px solid ${accentColor}` : '2px solid transparent',
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Right panel - Content */}
          <div className="flex-1 p-12 pt-20 overflow-y-auto">
            {/* UPLOAD TAB */}
            {creatorTab === 'upload' && (
              <div className="max-w-xl space-y-8">
                <div>
                  <h2 className="text-lg font-light mb-2">Upload Audio</h2>
                  <p className="text-[11px] opacity-40 mb-6">WAV, MP3, or any audio format</p>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-40 border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all hover:border-solid"
                    style={{ borderColor: track.audioUrl ? accentColor : '#333' }}
                  >
                    {track.audioUrl ? (
                      <>
                        <div className="text-3xl" style={{ color: accentColor }}>✓</div>
                        <div className="text-sm opacity-60">{track.audioFile?.name}</div>
                        <div className="text-[10px] opacity-30">Click to replace</div>
                      </>
                    ) : (
                      <>
                        <div className="text-3xl opacity-30">+</div>
                        <div className="text-[10px] uppercase tracking-[0.1em] opacity-40">
                          Drop audio or click to browse
                        </div>
                      </>
                    )}
                  </button>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-[0.1em] opacity-40 mb-2">
                    Track Name
                  </label>
                  <input
                    type="text"
                    value={track.name}
                    onChange={(e) => updateTrack('name', e.target.value)}
                    className="w-full bg-transparent border border-white/20 px-4 py-3 focus:outline-none focus:border-white/40"
                    placeholder="Untitled"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-[0.1em] opacity-40 mb-2">
                    Artist Name
                  </label>
                  <input
                    type="text"
                    value={track.artistName}
                    onChange={(e) => updateTrack('artistName', e.target.value)}
                    className="w-full bg-transparent border border-white/20 px-4 py-3 focus:outline-none focus:border-white/40"
                    placeholder="Your name"
                  />
                </div>
              </div>
            )}

            {/* STORY TAB */}
            {creatorTab === 'story' && (
              <div className="max-w-xl space-y-8">
                <div>
                  <h2 className="text-lg font-light mb-2">Tell the Story</h2>
                  <p className="text-[11px] opacity-40 mb-6">What is this experience about? Why these conditions?</p>

                  <textarea
                    value={track.story}
                    onChange={(e) => updateTrack('story', e.target.value)}
                    className="w-full h-64 bg-transparent border border-white/20 px-4 py-3 focus:outline-none focus:border-white/40 resize-none"
                    placeholder="This track was written during a full moon in Tokyo...&#10;&#10;It can only be heard when the same conditions align..."
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-[0.1em] opacity-40 mb-2">
                    Locked Message
                  </label>
                  <input
                    type="text"
                    value={track.visual.lockedMessage}
                    onChange={(e) => updateVisual('lockedMessage', e.target.value)}
                    className="w-full bg-transparent border border-white/20 px-4 py-3 focus:outline-none focus:border-white/40"
                    placeholder="This experience is not yet available"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-[0.1em] opacity-40 mb-2">
                    Unlocked Message
                  </label>
                  <input
                    type="text"
                    value={track.visual.unlockedMessage}
                    onChange={(e) => updateVisual('unlockedMessage', e.target.value)}
                    className="w-full bg-transparent border border-white/20 px-4 py-3 focus:outline-none focus:border-white/40"
                    placeholder="Welcome"
                  />
                </div>
              </div>
            )}

            {/* SPACE TAB */}
            {creatorTab === 'space' && (
              <div className="max-w-xl space-y-8">
                <div>
                  <h2 className="text-lg font-light mb-2">Location Condition</h2>
                  <p className="text-[11px] opacity-40 mb-6">Where must the listener be?</p>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {(['anywhere', 'city'] as const).map(type => (
                      <button
                        key={type}
                        onClick={() => updateSpace('type', type)}
                        className="p-4 border text-center capitalize transition-all"
                        style={{
                          borderColor: track.conditions.space.type === type ? accentColor : '#333',
                          background: track.conditions.space.type === type ? `${accentColor}20` : 'transparent',
                        }}
                      >
                        {type === 'anywhere' ? 'Anywhere' : 'Specific City'}
                      </button>
                    ))}
                  </div>

                  {track.conditions.space.type === 'city' && (
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.1em] opacity-40 mb-2">
                        City
                      </label>
                      <select
                        value={track.conditions.space.city || ''}
                        onChange={(e) => updateSpace('city', e.target.value)}
                        className="w-full bg-transparent border border-white/20 px-4 py-3 focus:outline-none"
                      >
                        <option value="">Select city...</option>
                        {CITIES.map(city => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TIME TAB */}
            {creatorTab === 'time' && (
              <div className="max-w-xl space-y-8">
                <div>
                  <h2 className="text-lg font-light mb-2">Time Condition</h2>
                  <p className="text-[11px] opacity-40 mb-6">When must the listener access this?</p>

                  <div className="grid grid-cols-3 gap-3 mb-6">
                    {([
                      { type: 'anytime', label: 'Anytime' },
                      { type: 'moon_phase', label: 'Moon Phase' },
                      { type: 'time_range', label: 'Time of Day' },
                      { type: 'season', label: 'Season' },
                      { type: 'specific_date', label: 'Specific Date' },
                    ] as const).map(({ type, label }) => (
                      <button
                        key={type}
                        onClick={() => updateTime('type', type)}
                        className="p-3 border text-center text-[11px] transition-all"
                        style={{
                          borderColor: track.conditions.time.type === type ? accentColor : '#333',
                          background: track.conditions.time.type === type ? `${accentColor}20` : 'transparent',
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {track.conditions.time.type === 'moon_phase' && (
                    <div className="grid grid-cols-4 gap-3">
                      {MOON_PHASES.map(phase => (
                        <button
                          key={phase.value}
                          onClick={() => updateTime('moonPhase', phase.value as TimeCondition['moonPhase'])}
                          className="p-4 border text-center transition-all"
                          style={{
                            borderColor: track.conditions.time.moonPhase === phase.value ? accentColor : '#333',
                            background: track.conditions.time.moonPhase === phase.value ? `${accentColor}20` : 'transparent',
                          }}
                        >
                          <div className="text-2xl mb-1">{phase.symbol}</div>
                          <div className="text-[9px] opacity-60">{phase.label}</div>
                        </button>
                      ))}
                    </div>
                  )}

                  {track.conditions.time.type === 'time_range' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.1em] opacity-40 mb-2">
                          Start Hour (0-23)
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={23}
                          value={track.conditions.time.startHour || 0}
                          onChange={(e) => updateTime('startHour', parseInt(e.target.value))}
                          className="w-full bg-transparent border border-white/20 px-4 py-3 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.1em] opacity-40 mb-2">
                          End Hour (0-23)
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={23}
                          value={track.conditions.time.endHour || 23}
                          onChange={(e) => updateTime('endHour', parseInt(e.target.value))}
                          className="w-full bg-transparent border border-white/20 px-4 py-3 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {track.conditions.time.type === 'season' && (
                    <div className="grid grid-cols-4 gap-3">
                      {SEASONS.map(season => (
                        <button
                          key={season}
                          onClick={() => updateTime('season', season as TimeCondition['season'])}
                          className="p-4 border text-center capitalize transition-all"
                          style={{
                            borderColor: track.conditions.time.season === season ? accentColor : '#333',
                            background: track.conditions.time.season === season ? `${accentColor}20` : 'transparent',
                          }}
                        >
                          {season}
                        </button>
                      ))}
                    </div>
                  )}

                  {track.conditions.time.type === 'specific_date' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.1em] opacity-40 mb-2">
                          Month (1-12)
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={12}
                          value={track.conditions.time.month || 1}
                          onChange={(e) => updateTime('month', parseInt(e.target.value))}
                          className="w-full bg-transparent border border-white/20 px-4 py-3 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.1em] opacity-40 mb-2">
                          Day (1-31)
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={31}
                          value={track.conditions.time.day || 1}
                          onChange={(e) => updateTime('day', parseInt(e.target.value))}
                          className="w-full bg-transparent border border-white/20 px-4 py-3 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* VISUAL TAB */}
            {creatorTab === 'visual' && (
              <div className="max-w-xl space-y-8">
                <div>
                  <h2 className="text-lg font-light mb-2">Visual Design</h2>
                  <p className="text-[11px] opacity-40 mb-6">How should the experience look?</p>

                  <div className="mb-6">
                    <label className="block text-[10px] uppercase tracking-[0.1em] opacity-40 mb-3">
                      Accent Color
                    </label>
                    <div className="flex gap-3">
                      {['#7C5CFF', '#00ff88', '#ff4444', '#00bfff', '#ffaa00', '#ff00aa', '#ffffff'].map(color => (
                        <button
                          key={color}
                          onClick={() => updateVisual('accentColor', color)}
                          className="w-10 h-10 rounded-full border-2 transition-all"
                          style={{
                            background: color,
                            borderColor: track.visual.accentColor === color ? '#fff' : 'transparent',
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.1em] opacity-40 mb-2">
                        Locked Symbol
                      </label>
                      <input
                        type="text"
                        value={track.visual.symbolLocked}
                        onChange={(e) => updateVisual('symbolLocked', e.target.value)}
                        className="w-full bg-transparent border border-white/20 px-4 py-3 text-2xl text-center focus:outline-none"
                        maxLength={2}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.1em] opacity-40 mb-2">
                        Unlocked Symbol
                      </label>
                      <input
                        type="text"
                        value={track.visual.symbolUnlocked}
                        onChange={(e) => updateVisual('symbolUnlocked', e.target.value)}
                        className="w-full bg-transparent border border-white/20 px-4 py-3 text-2xl text-center focus:outline-none"
                        maxLength={2}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PREVIEW TAB */}
            {creatorTab === 'preview' && (
              <div className="max-w-xl space-y-8">
                <div>
                  <h2 className="text-lg font-light mb-2">Preview & Share</h2>
                  <p className="text-[11px] opacity-40 mb-6">See how it looks and get your shareable link</p>

                  {/* Preview card */}
                  <div
                    className="p-8 border mb-6"
                    style={{ borderColor: isUnlocked ? accentColor : '#ff4444' }}
                  >
                    <div className="flex items-center gap-6">
                      <div
                        className="w-20 h-20 rounded-full border-2 flex items-center justify-center text-3xl"
                        style={{
                          borderColor: isUnlocked ? accentColor : '#ff4444',
                          color: isUnlocked ? accentColor : '#ff4444',
                        }}
                      >
                        {isUnlocked ? track.visual.symbolUnlocked : track.visual.symbolLocked}
                      </div>
                      <div>
                        <div
                          className="text-[10px] uppercase tracking-[0.15em] mb-1"
                          style={{ color: isUnlocked ? accentColor : '#ff4444' }}
                        >
                          {isUnlocked ? '● Unlocked' : '○ Locked'}
                        </div>
                        <div className="text-xl font-light">{track.name}</div>
                        {track.artistName && (
                          <div className="text-[11px] opacity-40">by {track.artistName}</div>
                        )}
                      </div>
                    </div>
                    {track.story && (
                      <div className="mt-6 text-sm opacity-60 leading-relaxed">
                        {track.story.slice(0, 150)}{track.story.length > 150 ? '...' : ''}
                      </div>
                    )}
                  </div>

                  {/* Conditions summary */}
                  <div className="p-4 border border-white/10 mb-6">
                    <div className="text-[10px] uppercase tracking-[0.1em] opacity-40 mb-3">
                      Conditions
                    </div>
                    <div className="text-sm space-y-1 opacity-60">
                      <div>
                        Space: {track.conditions.space.type === 'anywhere' ? 'Anywhere' : track.conditions.space.city || 'Not set'}
                      </div>
                      <div>
                        Time: {track.conditions.time.type === 'anytime' ? 'Anytime' :
                          track.conditions.time.type === 'moon_phase' ? `${track.conditions.time.moonPhase?.replace('_', ' ')} moon` :
                          track.conditions.time.type}
                      </div>
                    </div>
                  </div>

                  {/* Shareable link */}
                  <div className="p-4 border border-white/10">
                    <div className="text-[10px] uppercase tracking-[0.1em] opacity-40 mb-3">
                      Shareable Link
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={generateShareableLink()}
                        className="flex-1 bg-transparent border border-white/20 px-3 py-2 text-[10px] font-mono opacity-60 focus:outline-none"
                      />
                      <button
                        onClick={() => copyToClipboard(generateShareableLink())}
                        className="px-4 py-2 border text-[10px] uppercase tracking-[0.1em] transition-all hover:opacity-100 opacity-60"
                        style={{ borderColor: accentColor, color: accentColor }}
                      >
                        Copy
                      </button>
                    </div>
                    <div className="text-[9px] opacity-30 mt-2">
                      Note: Audio file must be hosted separately and linked
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
