'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface AccessResponse {
  success: boolean;
  type?: 'password' | 'token';
  label?: string;
  expiresAt?: string;
  error?: string;
  proof?: {
    tokenId: string;
    usedAt: string;
    usedFrom: {
      ip: string | null;
      country: string | null;
      city: string | null;
    };
  };
}

// Audio engine for bass rumble
function useBassSynth() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const filterRef = useRef<BiquadFilterNode | null>(null);
  const isPlayingRef = useRef(false);

  const start = useCallback(() => {
    if (isPlayingRef.current) return;

    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      audioCtxRef.current = ctx;

      // Create oscillator - sub bass
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 40; // Deep sub bass

      // Create filter - low pass
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 80;
      filter.Q.value = 8;

      // Create gain
      const gain = ctx.createGain();
      gain.gain.value = 0;

      // Connect: osc -> filter -> gain -> destination
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start();

      oscillatorRef.current = osc;
      filterRef.current = filter;
      gainRef.current = gain;
      isPlayingRef.current = true;
    } catch {
      // Audio not supported
    }
  }, []);

  const update = useCallback((intensity: number) => {
    if (!audioCtxRef.current || !gainRef.current || !oscillatorRef.current || !filterRef.current) return;

    const ctx = audioCtxRef.current;
    const now = ctx.currentTime;

    // Map intensity (0-1) to audio params
    // Higher intensity = deeper frequency, more volume
    const freq = 60 - (intensity * 35); // 60Hz -> 25Hz
    const vol = intensity * 0.15; // Max 0.15 to keep it subtle
    const filterFreq = 60 + (intensity * 40); // Open filter slightly with intensity

    oscillatorRef.current.frequency.setTargetAtTime(freq, now, 0.1);
    gainRef.current.gain.setTargetAtTime(vol, now, 0.05);
    filterRef.current.frequency.setTargetAtTime(filterFreq, now, 0.1);
  }, []);

  const stop = useCallback(() => {
    if (gainRef.current && audioCtxRef.current) {
      gainRef.current.gain.setTargetAtTime(0, audioCtxRef.current.currentTime, 0.1);
    }
    setTimeout(() => {
      oscillatorRef.current?.stop();
      audioCtxRef.current?.close();
      isPlayingRef.current = false;
    }, 200);
  }, []);

  return { start, update, stop };
}

export default function AccessPage() {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<AccessResponse | null>(null);
  const [orbitSpeed, setOrbitSpeed] = useState(0);
  const [audioStarted, setAudioStarted] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const bassSynth = useBassSynth();

  // Get the redirect target (if any)
  const next = searchParams.get('next') || '/';

  // Handle fader change
  const handleOrbitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setOrbitSpeed(value);

    // Start audio on first interaction
    if (!audioStarted && value > 0) {
      bassSynth.start();
      setAudioStarted(true);
    }

    bassSynth.update(value);
  };

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioStarted) {
        bassSynth.stop();
      }
    };
  }, [audioStarted, bassSynth]);

  // Format input as token if it matches pattern
  const formatAsToken = (value: string): string => {
    // Remove all non-alphanumeric
    const clean = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    // Add dashes every 4 characters
    const parts = clean.match(/.{1,4}/g) || [];
    return parts.slice(0, 4).join('-');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // If it looks like a token (has dashes or is uppercase), format it
    if (value.includes('-') || (value.length > 0 && value === value.toUpperCase())) {
      setCode(formatAsToken(value));
    } else {
      setCode(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const response = await fetch('/api/access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      const data: AccessResponse = await response.json();

      if (response.ok && data.success) {
        setSuccess(data);

        // Brief delay to show success state, then redirect
        setTimeout(() => {
          router.push(next);
          router.refresh();
        }, data.type === 'token' ? 1500 : 500);
      } else {
        setError(data.error || 'Key not recognized');
        setCode('');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Focus input on mount
  useEffect(() => {
    const input = document.getElementById('access-code');
    if (input) input.focus();
  }, []);

  // Format expiration time
  const formatExpiry = (expiresAt: string): string => {
    const date = new Date(expiresAt);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 24) {
      return `${Math.floor(diffHours / 24)} days`;
    } else if (diffHours > 0) {
      return `${diffHours}h ${diffMins}m`;
    } else {
      return `${diffMins} minutes`;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      {/* Animated orbital background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Outer static ring */}
        <div
          className="absolute top-1/2 left-1/2 w-[600px] h-[600px] rounded-full border border-[var(--foreground)]"
          style={{
            opacity: 0.03,
            transform: 'translate(-50%, -50%)',
          }}
        />

        {/* Rotating ring */}
        <div
          className="absolute top-1/2 left-1/2 w-[500px] h-[500px] rounded-full border border-dashed border-[var(--foreground)]"
          style={{
            opacity: 0.03 + (orbitSpeed * 0.08),
            transform: 'translate(-50%, -50%)',
            animation: orbitSpeed > 0.01 ? `orbitSpin ${Math.max(0.4, 25 - (orbitSpeed * 24))}s linear infinite` : 'none',
          }}
        />

        {/* Inner counter-rotating ring */}
        <div
          className="absolute top-1/2 left-1/2 w-[400px] h-[400px] rounded-full border border-[var(--foreground)]"
          style={{
            opacity: 0.02 + (orbitSpeed * 0.05),
            transform: 'translate(-50%, -50%)',
            animation: orbitSpeed > 0.01 ? `orbitSpin ${Math.max(0.3, 18 - (orbitSpeed * 17))}s linear infinite reverse` : 'none',
          }}
        />

        {/* Orbiting dot */}
        {orbitSpeed > 0.01 && (
          <div
            className="absolute top-1/2 left-1/2 w-[500px] h-[500px]"
            style={{
              transform: 'translate(-50%, -50%)',
              animation: `orbitSpin ${Math.max(0.4, 25 - (orbitSpeed * 24))}s linear infinite`,
            }}
          >
            <div
              className="absolute top-0 left-1/2 w-2 h-2 rounded-full bg-[var(--foreground)]"
              style={{
                opacity: 0.15 + (orbitSpeed * 0.4),
                transform: `translateX(-50%) scale(${1 + orbitSpeed * 0.8})`,
                boxShadow: orbitSpeed > 0.5 ? `0 0 ${orbitSpeed * 20}px rgba(0,0,0,0.1)` : 'none',
              }}
            />
          </div>
        )}
      </div>

      {/* Keyframes */}
      <style jsx>{`
        @keyframes orbitSpin {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
      `}</style>

      {/* Fader control - bottom right */}
      <div className="fixed bottom-8 right-8 flex flex-col items-center gap-2">
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={orbitSpeed}
          onChange={handleOrbitChange}
          className="w-24 h-1 appearance-none bg-[var(--border)] rounded-full cursor-pointer rotate-[-90deg] origin-center"
          style={{
            transform: 'rotate(-90deg)',
            accentColor: 'var(--foreground)',
          }}
          aria-label="Orbit speed"
        />
        <div
          className="label-micro mt-8"
          style={{ opacity: 0.2 + (orbitSpeed * 0.3) }}
        >
          {orbitSpeed > 0.01 ? Math.round(orbitSpeed * 100) : '·'}
        </div>
      </div>

      <div className="relative w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="label-micro mb-2">Lobster Sound</div>
          <h1 className="text-xl font-light tracking-wide">Private Access</h1>
        </div>

        {/* Success State */}
        {success ? (
          <div className="text-center animate-fade-in space-y-4">
            <div className="w-12 h-12 mx-auto border border-[var(--accent)] rounded-full flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            {success.type === 'token' && (
              <div className="space-y-2">
                <p className="text-sm opacity-60">{success.label}</p>
                <p className="label-micro">
                  Session expires in {formatExpiry(success.expiresAt!)}
                </p>
              </div>
            )}

            <p className="label-micro opacity-40 mt-4">Redirecting...</p>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="access-code" className="sr-only">
                Access Code
              </label>
              <input
                id="access-code"
                type="text"
                value={code}
                onChange={handleInputChange}
                placeholder="Password or XXXX-XXXX-XXXX-XXXX"
                className="w-full h-12 px-4 bg-transparent border border-[var(--border)] text-center text-sm tracking-widest placeholder:text-[var(--muted-foreground)] placeholder:tracking-[0.1em] placeholder:text-xs focus:outline-none focus:border-[var(--border-strong)] transition-colors font-mono"
                disabled={loading}
                autoComplete="off"
                spellCheck={false}
                autoCapitalize="off"
              />
            </div>

            {error && (
              <div className="text-center text-sm opacity-60 animate-fade-in">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="btn-primary w-full disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Enter'}
            </button>
          </form>
        )}

        {/* Footer */}
        {!success && (
          <div className="mt-16 text-center">
            <p className="label-micro">
              This app is currently in private preview.
            </p>
          </div>
        )}
      </div>

      {/* Corner marks */}
      <div className="corner-mark top-left fixed top-8 left-8" />
      <div className="corner-mark top-right fixed top-8 right-8" />
      <div className="corner-mark bottom-left fixed bottom-8 left-8" />
      <div className="corner-mark bottom-right fixed bottom-8 right-8" />
    </div>
  );
}
