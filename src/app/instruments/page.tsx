'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// The field states
type FieldState = 'void' | 'intent' | 'field' | 'flow';

// Intent options - what the operator wants to do
const INTENTS = [
  { id: 'record', label: 'Record' },
  { id: 'mix', label: 'Mix' },
  { id: 'master', label: 'Master' },
  { id: 'listen', label: 'Listen' },
];

// Gear nodes that appear based on intent
const GEAR_FIELDS: Record<string, Array<{ id: string; label: string; type: 'source' | 'process' | 'destination' }>> = {
  record: [
    { id: 'mic', label: 'Microphone', type: 'source' },
    { id: 'preamp', label: 'Preamp', type: 'process' },
    { id: 'compressor', label: 'Compressor', type: 'process' },
    { id: 'converter', label: 'Converter', type: 'process' },
    { id: 'daw', label: 'Pro Tools', type: 'destination' },
  ],
  mix: [
    { id: 'daw-out', label: 'Pro Tools', type: 'source' },
    { id: 'console', label: 'Console', type: 'process' },
    { id: 'eq', label: 'EQ', type: 'process' },
    { id: 'bus-comp', label: 'Bus Comp', type: 'process' },
    { id: 'print', label: 'Print', type: 'destination' },
  ],
  master: [
    { id: 'mix-in', label: 'Mix', type: 'source' },
    { id: 'master-eq', label: 'EQ', type: 'process' },
    { id: 'master-comp', label: 'Limiter', type: 'process' },
    { id: 'master-out', label: 'Master', type: 'destination' },
  ],
  listen: [
    { id: 'source', label: 'Source', type: 'source' },
    { id: 'monitor-ctrl', label: 'Monitor', type: 'process' },
    { id: 'speakers', label: 'Speakers', type: 'destination' },
  ],
};

interface Connection {
  from: string;
  to: string;
  energy: number; // 0-1 for glow intensity
}

interface Point {
  x: number;
  y: number;
}

export default function InstrumentPage() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [fieldState, setFieldState] = useState<FieldState>('void');
  const [activeIntent, setActiveIntent] = useState<string | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [drawingFrom, setDrawingFrom] = useState<string | null>(null);
  const [cursorPos, setCursorPos] = useState<Point>({ x: 0, y: 0 });
  const [nodePositions, setNodePositions] = useState<Record<string, Point>>({});
  const [breathePhase, setBreathePhase] = useState(0);
  const [centerHovered, setCenterHovered] = useState(false);

  // Breathing animation
  useEffect(() => {
    const interval = setInterval(() => {
      setBreathePhase(p => (p + 0.02) % (Math.PI * 2));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Calculate node positions in orbital arrangement
  useEffect(() => {
    if (!activeIntent || !containerRef.current) return;

    const gear = GEAR_FIELDS[activeIntent] || [];
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const radius = Math.min(rect.width, rect.height) * 0.32;

    const positions: Record<string, Point> = {};
    gear.forEach((g, i) => {
      const angle = ((i / gear.length) * Math.PI * 2) - Math.PI / 2;
      positions[g.id] = {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
      };
    });

    setNodePositions(positions);
  }, [activeIntent]);

  // Track cursor for drawing
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCursorPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  }, []);

  // State transitions
  const handleCenterEnter = () => {
    setCenterHovered(true);
    if (fieldState === 'void') {
      setFieldState('intent');
    }
  };

  const handleCenterLeave = () => {
    setCenterHovered(false);
  };

  const selectIntent = (intentId: string) => {
    setActiveIntent(intentId);
    setFieldState('field');
    setConnections([]);
  };

  // Connection drawing
  const startConnection = (nodeId: string) => {
    setDrawingFrom(nodeId);
  };

  const completeConnection = (nodeId: string) => {
    if (drawingFrom && drawingFrom !== nodeId) {
      // Check if connection already exists
      const exists = connections.some(
        c => (c.from === drawingFrom && c.to === nodeId) || (c.from === nodeId && c.to === drawingFrom)
      );

      if (!exists) {
        setConnections(prev => [...prev, { from: drawingFrom, to: nodeId, energy: 0 }]);

        // Animate energy
        setTimeout(() => {
          setConnections(prev => prev.map(c =>
            c.from === drawingFrom && c.to === nodeId ? { ...c, energy: 1 } : c
          ));
        }, 100);

        // Check if we have a complete flow
        if (connections.length >= 1) {
          setFieldState('flow');
        }
      }
    }
    setDrawingFrom(null);
  };

  const cancelConnection = () => {
    setDrawingFrom(null);
  };

  // Reset to void
  const resetField = () => {
    setFieldState('void');
    setActiveIntent(null);
    setConnections([]);
    setDrawingFrom(null);
  };

  // Compute center position
  const getCenter = () => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return { x: rect.width / 2, y: rect.height / 2 };
  };

  const center = getCenter();
  const breatheScale = 1 + Math.sin(breathePhase) * 0.02;
  const breatheOpacity = 0.3 + Math.sin(breathePhase) * 0.1;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-[#FAFAF8] overflow-hidden cursor-crosshair"
      onMouseMove={handleMouseMove}
      onMouseUp={cancelConnection}
      style={{ top: '3.5rem' }}
    >
      {/* Ambient gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 50%, rgba(124, 92, 255, ${breatheOpacity * 0.05}) 0%, transparent 60%)`,
        }}
      />

      {/* Return gesture - top left */}
      <button
        onClick={() => router.push('/')}
        className="absolute top-6 left-6 text-[10px] tracking-[0.2em] uppercase opacity-20 hover:opacity-40 transition-opacity duration-700"
      >
        ← Return
      </button>

      {/* Field state indicator - top right */}
      <div className="absolute top-6 right-6 flex items-center gap-3">
        <div
          className="w-1.5 h-1.5 rounded-full transition-all duration-1000"
          style={{
            backgroundColor: fieldState === 'flow' ? '#7C5CFF' : '#1a1a1a',
            opacity: fieldState === 'void' ? 0.1 : fieldState === 'flow' ? 0.8 : 0.3,
            transform: `scale(${fieldState === 'flow' ? breatheScale : 1})`,
          }}
        />
        <span className="text-[9px] tracking-[0.2em] uppercase opacity-20">
          {fieldState}
        </span>
      </div>

      {/* Central diamond - the heart */}
      <div
        className="absolute transition-all duration-1000"
        style={{
          left: '50%',
          top: '50%',
          transform: `translate(-50%, -50%) scale(${centerHovered ? 1.1 : breatheScale})`,
        }}
        onMouseEnter={handleCenterEnter}
        onMouseLeave={handleCenterLeave}
      >
        {/* Outer resonance rings */}
        {fieldState !== 'void' && (
          <>
            <div
              className="absolute rounded-full border transition-all duration-1000"
              style={{
                width: 400,
                height: 400,
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                borderColor: `rgba(124, 92, 255, ${0.03 + Math.sin(breathePhase) * 0.02})`,
              }}
            />
            <div
              className="absolute rounded-full border border-dashed transition-all duration-1000"
              style={{
                width: 280,
                height: 280,
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                borderColor: `rgba(26, 26, 26, ${0.03})`,
              }}
            />
          </>
        )}

        {/* The diamond */}
        <div
          className="relative w-16 h-16 transition-all duration-700"
          style={{
            transform: 'rotate(45deg)',
            border: `1px solid rgba(26, 26, 26, ${centerHovered ? 0.15 : 0.08})`,
            backgroundColor: centerHovered ? 'rgba(124, 92, 255, 0.03)' : 'transparent',
          }}
        >
          {/* Inner pulse */}
          <div
            className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full transition-all duration-500"
            style={{
              transform: 'translate(-50%, -50%)',
              backgroundColor: fieldState === 'flow' ? '#7C5CFF' : '#1a1a1a',
              opacity: fieldState === 'flow' ? 0.8 : 0.15,
              boxShadow: fieldState === 'flow' ? '0 0 20px rgba(124, 92, 255, 0.5)' : 'none',
            }}
          />
        </div>

        {/* Intent label - appears below diamond */}
        {activeIntent && (
          <div
            className="absolute top-full mt-6 left-1/2 -translate-x-1/2 text-center transition-all duration-700"
            style={{ opacity: fieldState === 'flow' ? 0.6 : 0.3 }}
          >
            <div className="text-xs tracking-[0.15em] uppercase">
              {INTENTS.find(i => i.id === activeIntent)?.label}
            </div>
            <div className="text-[9px] tracking-[0.1em] opacity-50 mt-1">
              {connections.length} connection{connections.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}
      </div>

      {/* Intent options - orbital text when in intent state */}
      {fieldState === 'intent' && (
        <div className="absolute inset-0 pointer-events-none">
          {INTENTS.map((intent, i) => {
            const angle = ((i / INTENTS.length) * Math.PI * 2) - Math.PI / 2;
            const radius = 140;
            const x = center.x + Math.cos(angle) * radius;
            const y = center.y + Math.sin(angle) * radius;

            return (
              <button
                key={intent.id}
                className="absolute pointer-events-auto transition-all duration-500 hover:opacity-100"
                style={{
                  left: x,
                  top: y,
                  transform: 'translate(-50%, -50%)',
                  opacity: 0.25,
                }}
                onClick={() => selectIntent(intent.id)}
              >
                <span className="text-[11px] tracking-[0.2em] uppercase">
                  {intent.label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Gear nodes - appear when field state */}
      {(fieldState === 'field' || fieldState === 'flow') && activeIntent && (
        <>
          {/* SVG layer for connections */}
          <svg className="absolute inset-0 pointer-events-none">
            <defs>
              <linearGradient id="energyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#7C5CFF" stopOpacity="0.1" />
                <stop offset="50%" stopColor="#7C5CFF" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#7C5CFF" stopOpacity="0.1" />
              </linearGradient>
            </defs>

            {/* Existing connections */}
            {connections.map((conn, idx) => {
              const from = nodePositions[conn.from];
              const to = nodePositions[conn.to];
              if (!from || !to) return null;

              // Curved path
              const midX = (from.x + to.x) / 2;
              const midY = (from.y + to.y) / 2;
              const dx = to.x - from.x;
              const dy = to.y - from.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              const curve = dist * 0.2;

              // Perpendicular offset for curve
              const perpX = -dy / dist * curve;
              const perpY = dx / dist * curve;
              const ctrlX = midX + perpX;
              const ctrlY = midY + perpY;

              const path = `M ${from.x} ${from.y} Q ${ctrlX} ${ctrlY} ${to.x} ${to.y}`;

              return (
                <g key={idx}>
                  {/* Base path */}
                  <path
                    d={path}
                    fill="none"
                    stroke="rgba(124, 92, 255, 0.1)"
                    strokeWidth="1"
                  />
                  {/* Energy flow */}
                  <path
                    d={path}
                    fill="none"
                    stroke="#7C5CFF"
                    strokeWidth="2"
                    strokeOpacity={conn.energy * 0.6}
                    strokeLinecap="round"
                    style={{
                      filter: 'blur(1px)',
                    }}
                  />
                  {/* Pulse animation */}
                  <circle r="3" fill="#7C5CFF" opacity={conn.energy * 0.8}>
                    <animateMotion
                      dur="2s"
                      repeatCount="indefinite"
                      path={path}
                    />
                  </circle>
                </g>
              );
            })}

            {/* Drawing path */}
            {drawingFrom && nodePositions[drawingFrom] && (
              <path
                d={`M ${nodePositions[drawingFrom].x} ${nodePositions[drawingFrom].y} Q ${(nodePositions[drawingFrom].x + cursorPos.x) / 2} ${(nodePositions[drawingFrom].y + cursorPos.y) / 2 - 30} ${cursorPos.x} ${cursorPos.y}`}
                fill="none"
                stroke="rgba(124, 92, 255, 0.3)"
                strokeWidth="2"
                strokeDasharray="4 4"
                strokeLinecap="round"
              />
            )}
          </svg>

          {/* Gear nodes */}
          {GEAR_FIELDS[activeIntent]?.map((gear, i) => {
            const pos = nodePositions[gear.id];
            if (!pos) return null;

            const isConnected = connections.some(c => c.from === gear.id || c.to === gear.id);
            const isHovered = hoveredNode === gear.id;
            const isDrawingSource = drawingFrom === gear.id;

            return (
              <div
                key={gear.id}
                className="absolute transition-all duration-500"
                style={{
                  left: pos.x,
                  top: pos.y,
                  transform: `translate(-50%, -50%) scale(${isHovered ? 1.1 : 1})`,
                  opacity: 0,
                  animation: `fadeIn 0.8s ease-out ${i * 0.1}s forwards`,
                }}
                onMouseEnter={() => setHoveredNode(gear.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onMouseDown={() => startConnection(gear.id)}
                onMouseUp={() => completeConnection(gear.id)}
              >
                {/* Node glow */}
                {(isConnected || isDrawingSource) && (
                  <div
                    className="absolute inset-0 rounded-full transition-all duration-500"
                    style={{
                      width: 80,
                      height: 80,
                      left: '50%',
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                      background: 'radial-gradient(circle, rgba(124, 92, 255, 0.15) 0%, transparent 70%)',
                    }}
                  />
                )}

                {/* Node circle */}
                <div
                  className="relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer"
                  style={{
                    backgroundColor: isConnected ? 'rgba(124, 92, 255, 0.08)' : 'rgba(26, 26, 26, 0.02)',
                    border: `1px solid ${isConnected ? 'rgba(124, 92, 255, 0.3)' : 'rgba(26, 26, 26, 0.08)'}`,
                    boxShadow: isHovered ? '0 0 30px rgba(124, 92, 255, 0.1)' : 'none',
                  }}
                >
                  {/* Type indicator */}
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      backgroundColor: isConnected ? '#7C5CFF' : '#1a1a1a',
                      opacity: isConnected ? 0.8 : 0.15,
                    }}
                  />
                </div>

                {/* Label */}
                <div
                  className="absolute top-full mt-3 left-1/2 -translate-x-1/2 whitespace-nowrap text-center transition-all duration-300"
                  style={{
                    opacity: isHovered ? 0.6 : 0.25,
                  }}
                >
                  <span className="text-[9px] tracking-[0.15em] uppercase">
                    {gear.label}
                  </span>
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* Hint text - bottom */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
        <p className="text-[9px] tracking-[0.2em] uppercase opacity-15">
          {fieldState === 'void' && 'hover center to begin'}
          {fieldState === 'intent' && 'select intention'}
          {fieldState === 'field' && 'draw connections between nodes'}
          {fieldState === 'flow' && 'signal flows'}
        </p>
      </div>

      {/* Reset - bottom left */}
      {fieldState !== 'void' && (
        <button
          onClick={resetField}
          className="absolute bottom-8 left-8 text-[9px] tracking-[0.15em] uppercase opacity-15 hover:opacity-30 transition-opacity duration-500"
        >
          clear
        </button>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.8);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
