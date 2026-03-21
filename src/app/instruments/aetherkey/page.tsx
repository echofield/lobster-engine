'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as Tone from 'tone';
import { subscribeToFlowState, mapToAetherKey, getFlowState, type FlowMindState } from '@/lib/flow-state';

// ============ TYPES ============

interface ToneState {
  purity: number;      // 0-1: how pure/synthetic
  richness: number;    // 0-1: harmonic content
  brightness: number;  // 0-1: high frequency content
}

interface ExcitationState {
  attack: number;      // 0-1: attack sharpness
  intensity: number;   // 0-1: emotional intensity
  direction: number;   // -1 to 1: reverse to forward
}

interface ResonanceState {
  size: number;        // 0-1: resonance chamber size
  width: number;       // 0-1: stereo width
  diffusion: number;   // 0-1: how diffuse the sound
}

interface ModulationState {
  vibrato: number;     // 0-1: pitch wobble
  drift: number;       // 0-1: slow random drift
  instability: number; // 0-1: chaos factor
}

// ============ COMPONENT ============

export default function AetherKeyPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const audioContextStarted = useRef(false);

  // Synth refs
  const stringLayerRef = useRef<Tone.PolySynth | null>(null);
  const padLayerRef = useRef<Tone.PolySynth | null>(null);
  const reverbRef = useRef<Tone.Reverb | null>(null);
  const vibratoRef = useRef<Tone.Vibrato | null>(null);
  const chorusRef = useRef<Tone.Chorus | null>(null);

  // State
  const [tone, setTone] = useState<ToneState>({
    purity: 0.5,
    richness: 0.6,
    brightness: 0.5,
  });

  const [excitation, setExcitation] = useState<ExcitationState>({
    attack: 0.3,
    intensity: 0.7,
    direction: 1,
  });

  const [resonance, setResonance] = useState<ResonanceState>({
    size: 0.6,
    width: 0.5,
    diffusion: 0.4,
  });

  const [modulation, setModulation] = useState<ModulationState>({
    vibrato: 0.2,
    drift: 0.1,
    instability: 0.05,
  });

  // FLOW.MIND connection state
  const [flowMindActive, setFlowMindActive] = useState(false);
  const [flowMindMood, setFlowMindMood] = useState<string>('');

  // Active notes and visualization
  const [activeNotes, setActiveNotes] = useState<Set<number>>(new Set());
  const [resonanceEnergy, setResonanceEnergy] = useState(0);
  const [hoveredKey, setHoveredKey] = useState<number | null>(null);

  // MIDI state
  const [midiConnected, setMidiConnected] = useState(false);
  const [midiDeviceName, setMidiDeviceName] = useState<string | null>(null);

  const accentColor = '#7C5CFF';

  // Key layout - curved, 24 keys spanning 2 octaves
  const NUM_KEYS = 24;
  const BASE_NOTE = 48; // C3

  // ============ AUDIO INIT ============

  useEffect(() => {
    // Create reverb
    const reverb = new Tone.Reverb({
      decay: 4,
      wet: 0.4,
    }).toDestination();

    // Create vibrato
    const vibrato = new Tone.Vibrato({
      frequency: 5,
      depth: 0.1,
    }).connect(reverb);

    // Create chorus for width
    const chorus = new Tone.Chorus({
      frequency: 1.5,
      delayTime: 3.5,
      depth: 0.5,
      wet: 0.3,
    }).connect(vibrato);

    // String layer - FM synthesis for piano-like harmonics
    const stringLayer = new Tone.PolySynth(Tone.FMSynth, {
      harmonicity: 3,
      modulationIndex: 10,
      envelope: {
        attack: 0.01,
        decay: 0.5,
        sustain: 0.3,
        release: 1.5,
      },
      modulationEnvelope: {
        attack: 0.01,
        decay: 0.3,
        sustain: 0.2,
        release: 0.8,
      },
    }).connect(chorus);
    stringLayer.volume.value = -6;

    // Pad layer - soft ambient texture
    const padLayer = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.5,
        decay: 0.2,
        sustain: 0.8,
        release: 3,
      },
    }).connect(reverb);
    padLayer.volume.value = -12;

    stringLayerRef.current = stringLayer;
    padLayerRef.current = padLayer;
    reverbRef.current = reverb;
    vibratoRef.current = vibrato;
    chorusRef.current = chorus;

    return () => {
      stringLayer.dispose();
      padLayer.dispose();
      reverb.dispose();
      vibrato.dispose();
      chorus.dispose();
    };
  }, []);

  // Update audio parameters when state changes
  useEffect(() => {
    if (reverbRef.current) {
      reverbRef.current.decay = 2 + resonance.size * 8;
      reverbRef.current.wet.value = resonance.diffusion * 0.6;
    }
    if (vibratoRef.current) {
      vibratoRef.current.depth.value = modulation.vibrato * 0.3;
      vibratoRef.current.frequency.value = 4 + modulation.instability * 4;
    }
    if (chorusRef.current) {
      chorusRef.current.wet.value = resonance.width * 0.5;
    }
  }, [resonance, modulation]);

  // ============ FLOW.MIND SUBSCRIPTION ============

  useEffect(() => {
    // Check initial state
    const initialState = getFlowState();
    if (initialState.active && Date.now() - initialState.timestamp < 30000) {
      const params = mapToAetherKey(initialState);
      setTone(params.tone);
      setExcitation(e => ({
        ...e,
        attack: params.excitation.attack,
        intensity: params.excitation.intensity,
      }));
      setResonance(params.resonance);
      setModulation(params.modulation);
      setFlowMindActive(true);
      setFlowMindMood(initialState.mode.mood.toUpperCase());
    }

    // Subscribe to state changes from FLOW.MIND
    const unsubscribe = subscribeToFlowState((state: FlowMindState) => {
      if (!state.active) {
        setFlowMindActive(false);
        return;
      }

      // Map FLOW.MIND state to ÆTHER.KEY parameters
      const params = mapToAetherKey(state);

      // Apply the mapped parameters
      setTone(params.tone);
      setExcitation(e => ({
        ...e,
        attack: params.excitation.attack,
        intensity: params.excitation.intensity,
      }));
      setResonance(params.resonance);
      setModulation(params.modulation);

      setFlowMindActive(true);
      setFlowMindMood(state.mode.mood.toUpperCase());
    });

    return () => unsubscribe();
  }, []);

  // ============ NOTE HANDLING ============

  const midiToFreq = (midi: number) => Tone.Frequency(midi, 'midi').toFrequency();

  const playNote = useCallback(async (keyIndex: number) => {
    if (!audioContextStarted.current) {
      await Tone.start();
      audioContextStarted.current = true;
    }

    const midi = BASE_NOTE + keyIndex;
    const freq = midiToFreq(midi);

    // Velocity based on excitation
    const velocity = 0.3 + excitation.intensity * 0.7;

    // String layer
    if (stringLayerRef.current) {
      stringLayerRef.current.triggerAttack(freq, Tone.now(), velocity);
    }

    // Pad layer - more prominent when purity is low (more synthetic)
    if (padLayerRef.current) {
      const padVol = -18 + (1 - tone.purity) * 12;
      padLayerRef.current.volume.value = padVol;
      padLayerRef.current.triggerAttack(freq, Tone.now(), velocity * 0.5);
    }

    setActiveNotes(prev => new Set([...prev, keyIndex]));
    setResonanceEnergy(e => Math.min(1, e + 0.2));
  }, [tone, excitation]);

  const releaseNote = useCallback((keyIndex: number) => {
    const midi = BASE_NOTE + keyIndex;
    const freq = midiToFreq(midi);

    stringLayerRef.current?.triggerRelease(freq);
    padLayerRef.current?.triggerRelease(freq);

    setActiveNotes(prev => {
      const next = new Set(prev);
      next.delete(keyIndex);
      return next;
    });
  }, []);

  // MIDI note handlers (direct MIDI note numbers)
  const playMidiNote = useCallback(async (midiNote: number, velocity: number) => {
    if (!audioContextStarted.current) {
      await Tone.start();
      audioContextStarted.current = true;
    }

    const freq = midiToFreq(midiNote);
    const vel = velocity / 127; // Normalize MIDI velocity

    // String layer
    if (stringLayerRef.current) {
      stringLayerRef.current.triggerAttack(freq, Tone.now(), vel);
    }

    // Pad layer
    if (padLayerRef.current) {
      const padVol = -18 + (1 - tone.purity) * 12;
      padLayerRef.current.volume.value = padVol;
      padLayerRef.current.triggerAttack(freq, Tone.now(), vel * 0.5);
    }

    // Map MIDI note to key index for visualization
    const keyIndex = midiNote - BASE_NOTE;
    if (keyIndex >= 0 && keyIndex < NUM_KEYS) {
      setActiveNotes(prev => new Set([...prev, keyIndex]));
    }
    setResonanceEnergy(e => Math.min(1, e + 0.2));
  }, [tone.purity]);

  const releaseMidiNote = useCallback((midiNote: number) => {
    const freq = midiToFreq(midiNote);

    stringLayerRef.current?.triggerRelease(freq);
    padLayerRef.current?.triggerRelease(freq);

    const keyIndex = midiNote - BASE_NOTE;
    if (keyIndex >= 0 && keyIndex < NUM_KEYS) {
      setActiveNotes(prev => {
        const next = new Set(prev);
        next.delete(keyIndex);
        return next;
      });
    }
  }, []);

  // ============ MIDI SETUP ============

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.requestMIDIAccess) {
      console.log('Web MIDI not supported');
      return;
    }

    let midiAccess: MIDIAccess | null = null;

    const handleMidiMessage = (event: MIDIMessageEvent) => {
      const [status, note, velocity] = event.data || [];
      const command = status >> 4;

      // Note On (command 9) with velocity > 0
      if (command === 9 && velocity > 0) {
        playMidiNote(note, velocity);
      }
      // Note Off (command 8) or Note On with velocity 0
      else if (command === 8 || (command === 9 && velocity === 0)) {
        releaseMidiNote(note);
      }
    };

    const setupMidi = (access: MIDIAccess) => {
      midiAccess = access;

      // Connect to all available inputs
      access.inputs.forEach((input) => {
        input.onmidimessage = handleMidiMessage;
        setMidiConnected(true);
        setMidiDeviceName(input.name || 'MIDI Device');
        console.log(`MIDI connected: ${input.name}`);
      });

      // Handle device changes
      access.onstatechange = (e) => {
        const port = e.port;
        if (!port) return;
        if (port.type === 'input') {
          if (port.state === 'connected') {
            (port as MIDIInput).onmidimessage = handleMidiMessage;
            setMidiConnected(true);
            setMidiDeviceName(port.name || 'MIDI Device');
          } else if (port.state === 'disconnected') {
            setMidiConnected(false);
            setMidiDeviceName(null);
          }
        }
      };
    };

    navigator.requestMIDIAccess()
      .then(setupMidi)
      .catch((err) => {
        console.log('MIDI access denied:', err);
      });

    return () => {
      if (midiAccess) {
        midiAccess.inputs.forEach((input) => {
          input.onmidimessage = null;
        });
      }
    };
  }, [playMidiNote, releaseMidiNote]);

  // Decay resonance energy
  useEffect(() => {
    const decay = setInterval(() => {
      setResonanceEnergy(e => Math.max(0, e - 0.02));
    }, 50);
    return () => clearInterval(decay);
  }, []);

  // ============ VISUALIZATION ============

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;

      // Clear with fade
      ctx.fillStyle = 'rgba(10, 10, 10, 0.1)';
      ctx.fillRect(0, 0, width, height);

      // Draw resonance waves emanating from center
      const centerX = width * 0.4;
      const centerY = height * 0.5;

      const numWaves = 5;
      for (let i = 0; i < numWaves; i++) {
        const phase = (time * 0.02 + i * 0.2) % 1;
        const radius = 50 + phase * 200 * (1 + resonance.size);
        const alpha = (1 - phase) * resonanceEnergy * 0.5;

        ctx.beginPath();
        ctx.strokeStyle = `rgba(124, 92, 255, ${alpha})`;
        ctx.lineWidth = 2;

        // Organic shape
        for (let a = 0; a < Math.PI * 2; a += 0.1) {
          const wobble = Math.sin(a * 3 + time * 0.05) * modulation.instability * 20;
          const r = radius + wobble;
          const x = centerX + Math.cos(a) * r * 1.3;
          const y = centerY + Math.sin(a) * r;

          if (a === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
      }

      // Draw vibrato lines (the scratch marks)
      if (modulation.vibrato > 0.1) {
        ctx.strokeStyle = `rgba(255, 255, 255, ${modulation.vibrato * 0.3})`;
        ctx.lineWidth = 1;

        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          const startX = centerX + 80 + i * 15;
          const startY = centerY - 30 + i * 12;

          for (let t = 0; t < 30; t++) {
            const x = startX + t;
            const y = startY + Math.sin(t * 0.5 + time * 0.1 + i) * modulation.vibrato * 10;
            if (t === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      }

      time++;
      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(animationRef.current);
  }, [resonance, modulation, resonanceEnergy]);

  // ============ RENDER ============

  // Generate curved key positions
  const getKeyPosition = (index: number) => {
    const angle = (index / NUM_KEYS) * Math.PI * 0.8 - Math.PI * 0.4;
    const radius = 280;
    const centerX = 85; // percentage from right
    const centerY = 50;

    return {
      x: centerX - Math.cos(angle) * (radius / 10),
      y: centerY + Math.sin(angle) * (radius / 10),
      angle: angle * (180 / Math.PI) + 90,
    };
  };

  const isBlackKey = (index: number) => {
    const note = index % 12;
    return [1, 3, 6, 8, 10].includes(note);
  };

  return (
    <div className="h-screen w-full bg-[#0a0a0a] text-white relative overflow-hidden">
      {/* Background canvas for resonance visualization */}
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="absolute inset-0 w-full h-full opacity-60"
      />

      {/* Header */}
      <div className="absolute top-6 left-8 z-20">
        <a href="/" className="text-xs uppercase tracking-widest text-white/40 hover:text-white/80">
          ← Exit
        </a>
        <h1 className="text-2xl font-light mt-2 tracking-wider">ÆTHER.KEY</h1>
        <p className="text-[10px] text-white/30 uppercase tracking-[0.2em]">Living Harmonic Instrument</p>
      </div>

      {/* Status Indicators */}
      <div className="absolute top-6 right-8 z-20 text-right space-y-3">
        {/* FLOW.MIND Status */}
        {flowMindActive && (
          <div className="flex items-center gap-2 justify-end px-3 py-1.5 border border-[#7C5CFF]/50 bg-[#7C5CFF]/10 rounded">
            <div className="w-2 h-2 rounded-full bg-[#7C5CFF] animate-pulse" />
            <span className="text-[10px] uppercase tracking-widest text-[#7C5CFF]">
              FLOW.MIND · {flowMindMood}
            </span>
          </div>
        )}

        {/* MIDI Status */}
        <div className="flex items-center gap-2 justify-end">
          <div
            className="w-2 h-2 rounded-full"
            style={{
              background: midiConnected ? '#4ade80' : '#666',
              boxShadow: midiConnected ? '0 0 8px #4ade80' : 'none',
            }}
          />
          <span className="text-[10px] uppercase tracking-widest text-white/40">
            {midiConnected ? 'MIDI' : 'No MIDI'}
          </span>
        </div>
        {midiDeviceName && (
          <p className="text-[9px] text-white/30 mt-1">{midiDeviceName}</p>
        )}
      </div>

      {/* Main Instrument Body */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Organic Body Shape (SVG) */}
        <svg
          viewBox="0 0 600 500"
          className="w-[70vw] max-w-[900px] h-auto"
          style={{ filter: `drop-shadow(0 0 ${20 + resonanceEnergy * 40}px rgba(124, 92, 255, ${0.2 + resonanceEnergy * 0.3}))` }}
        >
          {/* Main body outline */}
          <path
            d="M 150 100
               Q 80 150, 100 250
               Q 120 350, 180 400
               L 350 420
               Q 450 400, 480 300
               Q 500 200, 450 120
               Q 400 80, 300 90
               Q 200 80, 150 100
               Z"
            fill="none"
            stroke={accentColor}
            strokeWidth="2"
            opacity={0.6 + resonanceEnergy * 0.4}
          />

          {/* Upper horn */}
          <path
            d="M 350 90
               Q 380 40, 420 30
               Q 480 20, 500 80
               Q 480 100, 450 120"
            fill="none"
            stroke={accentColor}
            strokeWidth="2"
            opacity="0.5"
          />

          {/* Lower extension */}
          <path
            d="M 180 400
               Q 140 420, 120 450
               Q 130 480, 180 470
               Q 230 450, 250 420"
            fill="none"
            stroke={accentColor}
            strokeWidth="2"
            opacity="0.5"
          />

          {/* Star (excitation marker) */}
          <g transform="translate(130, 180)">
            <path
              d="M 0 -15 L 4 -4 L 15 -4 L 6 4 L 10 15 L 0 8 L -10 15 L -6 4 L -15 -4 L -4 -4 Z"
              fill={resonanceEnergy > 0.3 ? accentColor : 'none'}
              stroke={accentColor}
              strokeWidth="1.5"
              opacity={0.6 + excitation.intensity * 0.4}
            />
          </g>

          {/* Triangle (excitation control) */}
          <g
            transform="translate(250, 280)"
            style={{ cursor: 'pointer' }}
            onClick={() => setExcitation(e => ({ ...e, attack: (e.attack + 0.2) % 1 }))}
          >
            <polygon
              points="0,-50 50,40 -50,40"
              fill={`rgba(124, 92, 255, ${0.1 + excitation.attack * 0.2})`}
              stroke={accentColor}
              strokeWidth="2"
            />
            <text x="0" y="10" textAnchor="middle" fill="white" fontSize="10" opacity="0.5">
              {Math.round(excitation.attack * 100)}
            </text>
          </g>

          {/* Circle (tone/soul control) */}
          <g
            transform="translate(380, 300)"
            style={{ cursor: 'pointer' }}
            onClick={() => setTone(t => ({ ...t, purity: (t.purity + 0.2) % 1 }))}
          >
            <circle
              r="35"
              fill={`rgba(124, 92, 255, ${0.1 + tone.purity * 0.2})`}
              stroke={accentColor}
              strokeWidth="2"
            />
            <text x="0" y="5" textAnchor="middle" fill="white" fontSize="10" opacity="0.5">
              {Math.round(tone.purity * 100)}
            </text>
          </g>

          {/* Modulation lines (scratch marks) */}
          {[0, 1, 2, 3].map((i) => (
            <line
              key={i}
              x1={320 + i * 12}
              y1={160 + i * 8}
              x2={340 + i * 12}
              y2={180 + i * 8}
              stroke={accentColor}
              strokeWidth="1"
              opacity={0.3 + modulation.vibrato * 0.5}
            />
          ))}
        </svg>

        {/* Curved Keyboard */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 h-[80vh]">
          <div className="relative h-full w-24">
            {Array.from({ length: NUM_KEYS }, (_, i) => {
              const pos = getKeyPosition(i);
              const isBlack = isBlackKey(i);
              const isActive = activeNotes.has(i);
              const isHovered = hoveredKey === i;

              return (
                <button
                  key={i}
                  onMouseDown={() => playNote(i)}
                  onMouseUp={() => releaseNote(i)}
                  onMouseLeave={() => {
                    releaseNote(i);
                    setHoveredKey(null);
                  }}
                  onMouseEnter={() => setHoveredKey(i)}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    playNote(i);
                  }}
                  onTouchEnd={() => releaseNote(i)}
                  className="absolute transition-all duration-75"
                  style={{
                    top: `${pos.y}%`,
                    right: `${100 - pos.x}%`,
                    transform: `rotate(${pos.angle}deg)`,
                    width: isBlack ? '40px' : '60px',
                    height: isBlack ? '8px' : '10px',
                    background: isActive
                      ? accentColor
                      : isHovered
                        ? 'rgba(124, 92, 255, 0.4)'
                        : isBlack
                          ? '#333'
                          : '#666',
                    borderRadius: '2px',
                    boxShadow: isActive
                      ? `0 0 20px ${accentColor}`
                      : 'none',
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Control Panels */}
      <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end z-20">
        {/* Tone Controls */}
        <div className="space-y-3">
          <div className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Tone / Soul</div>
          {[
            { label: 'Purity', value: tone.purity, key: 'purity' as const },
            { label: 'Richness', value: tone.richness, key: 'richness' as const },
            { label: 'Brightness', value: tone.brightness, key: 'brightness' as const },
          ].map((ctrl) => (
            <div key={ctrl.key} className="flex items-center gap-3">
              <span className="text-[9px] text-white/40 w-16 uppercase">{ctrl.label}</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={ctrl.value}
                onChange={(e) => setTone(t => ({ ...t, [ctrl.key]: Number(e.target.value) }))}
                className="w-24"
                style={{ accentColor }}
              />
              <span className="text-[9px] text-white/30 w-8">{Math.round(ctrl.value * 100)}</span>
            </div>
          ))}
        </div>

        {/* Excitation Controls */}
        <div className="space-y-3">
          <div className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Excitation</div>
          {[
            { label: 'Attack', value: excitation.attack, key: 'attack' as const },
            { label: 'Intensity', value: excitation.intensity, key: 'intensity' as const },
          ].map((ctrl) => (
            <div key={ctrl.key} className="flex items-center gap-3">
              <span className="text-[9px] text-white/40 w-16 uppercase">{ctrl.label}</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={ctrl.value}
                onChange={(e) => setExcitation(ex => ({ ...ex, [ctrl.key]: Number(e.target.value) }))}
                className="w-24"
                style={{ accentColor }}
              />
              <span className="text-[9px] text-white/30 w-8">{Math.round(ctrl.value * 100)}</span>
            </div>
          ))}
        </div>

        {/* Resonance Controls */}
        <div className="space-y-3">
          <div className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Resonance</div>
          {[
            { label: 'Size', value: resonance.size, key: 'size' as const },
            { label: 'Width', value: resonance.width, key: 'width' as const },
            { label: 'Diffusion', value: resonance.diffusion, key: 'diffusion' as const },
          ].map((ctrl) => (
            <div key={ctrl.key} className="flex items-center gap-3">
              <span className="text-[9px] text-white/40 w-16 uppercase">{ctrl.label}</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={ctrl.value}
                onChange={(e) => setResonance(r => ({ ...r, [ctrl.key]: Number(e.target.value) }))}
                className="w-24"
                style={{ accentColor }}
              />
              <span className="text-[9px] text-white/30 w-8">{Math.round(ctrl.value * 100)}</span>
            </div>
          ))}
        </div>

        {/* Modulation Controls */}
        <div className="space-y-3">
          <div className="text-[10px] uppercase tracking-widest text-white/40 mb-2">Modulation</div>
          {[
            { label: 'Vibrato', value: modulation.vibrato, key: 'vibrato' as const },
            { label: 'Drift', value: modulation.drift, key: 'drift' as const },
            { label: 'Instability', value: modulation.instability, key: 'instability' as const },
          ].map((ctrl) => (
            <div key={ctrl.key} className="flex items-center gap-3">
              <span className="text-[9px] text-white/40 w-16 uppercase">{ctrl.label}</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={ctrl.value}
                onChange={(e) => setModulation(m => ({ ...m, [ctrl.key]: Number(e.target.value) }))}
                className="w-24"
                style={{ accentColor: '#ff6b6b' }}
              />
              <span className="text-[9px] text-white/30 w-8">{Math.round(ctrl.value * 100)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 right-8 text-[9px] uppercase tracking-widest text-white/15">
        ÆTHER.KEY-0321
      </div>
    </div>
  );
}
