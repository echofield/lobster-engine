'use client';

import { useEffect, useRef, useState, use } from 'react';
import Link from 'next/link';
import { SpaceTimeEngine, SpaceTimeConditions, ConditionResult } from '@/lib/spacetime-engine';

interface TrackData {
  id: string;
  name: string;
  artistId: string | null;
  story: string | null;
  audioUrl: string;
  audioDuration: number | null;
  conditions: SpaceTimeConditions;
  visual: {
    accentColor: string;
    symbolLocked: string;
    symbolUnlocked: string;
    lockedMessage: string;
    unlockedMessage: string;
    backgroundUrl: string | null;
  };
  stats: {
    playCount: number;
    unlockCount: number;
  };
  publishedAt: string | null;
  createdAt: string;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function SpaceTimeViewPage({ params }: PageProps) {
  const { id } = use(params);
  const audioRef = useRef<HTMLAudioElement>(null);
  const spaceTimeRef = useRef<SpaceTimeEngine | null>(null);

  const [track, setTrack] = useState<TrackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  // Fetch track data
  useEffect(() => {
    const fetchTrack = async () => {
      try {
        // Get location for server-side verification
        const engine = spaceTimeRef.current;
        const location = engine?.getLocation();

        const headers: HeadersInit = {};
        if (location) {
          headers['x-listener-latitude'] = location.latitude.toString();
          headers['x-listener-longitude'] = location.longitude.toString();
        }

        const res = await fetch(`/api/spacetime?id=${id}`, { headers });

        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('Track not found');
          }
          throw new Error('Failed to load track');
        }

        const data = await res.json();
        setTrack(data.track);

        // Server returns verification result too
        if (data.verification) {
          // But we also do client-side verification for real-time updates
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load track');
      } finally {
        setLoading(false);
      }
    };

    fetchTrack();
  }, [id]);

  // Evaluate conditions client-side
  useEffect(() => {
    if (!spaceTimeRef.current || !track) return;
    const result = spaceTimeRef.current.evaluate(track.conditions);
    setConditionResult(result);
  }, [track]);

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

  const togglePlay = () => {
    if (!audioRef.current || !track?.audioUrl) return;
    if (!conditionResult?.allowed) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white/40 text-sm animate-pulse">Loading...</div>
      </div>
    );
  }

  if (error || !track) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4">
        <div className="text-red-400 text-sm">{error || 'Track not found'}</div>
        <Link href="/" className="text-white/40 text-xs hover:text-white/60 transition-colors">
          ← Back home
        </Link>
      </div>
    );
  }

  const accentColor = track.visual.accentColor;
  const isUnlocked = conditionResult?.allowed ?? false;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white relative overflow-hidden">
      {/* Hidden audio element */}
      <audio ref={audioRef} src={track.audioUrl} />

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

      {/* Build label */}
      <div className="fixed bottom-6 left-6 text-[9px] uppercase tracking-[0.15em] opacity-20" style={{ color: accentColor }}>
        SPACE-TIME-0321
      </div>

      {/* Main content */}
      <div className="h-screen flex">
        {/* Left side - Access button */}
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

        {/* Right side - Track info */}
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

          {/* Stats */}
          <div className="mt-8 text-[9px] uppercase tracking-[0.1em] opacity-20 flex gap-4">
            <span>{track.stats.playCount} plays</span>
            <span>{track.stats.unlockCount} unlocks</span>
          </div>
        </div>
      </div>
    </div>
  );
}
