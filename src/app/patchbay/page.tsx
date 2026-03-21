'use client';

import { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/components/LanguageProvider';
import { patchbayBays, getPointById } from '@/data/patchbay';
import { getChainById, signalChains } from '@/data/signal-chains';
import { type PatchbayPoint, type CableColor } from '@/types/studio';

// Territory definitions - energy zones in the field
const TERRITORIES = {
  crookwood: { color: '#7C5CFF', ring: 1, label: 'Crookwood' },
  converters: { color: '#3b82f6', ring: 2, label: 'Converters' },
  'bus-console': { color: '#22c55e', ring: 3, label: 'Bus Console' },
  outboard: { color: '#f97316', ring: 4, label: 'Outboard' },
  'stage-room': { color: '#ef4444', ring: 5, label: 'Stage Room' },
} as const;

type Territory = keyof typeof TERRITORIES;
type FieldState = 'void' | 'intent' | 'field' | 'flow';

interface EnergyNode {
  id: string;
  label: string;
  territory: Territory;
  angle: number;
  ring: number;
  type: 'input' | 'output' | 'both';
  gearId?: string;
}

interface FlowPath {
  id: string;
  from: string;
  to: string;
  color: string;
  label?: string;
  active: boolean;
}

// Map patchbay points to energy nodes by analyzing their bay/row
function mapPointToTerritory(point: PatchbayPoint): Territory {
  const label = point.label.toLowerCase();

  if (label.includes('crook') || label.includes('cw')) return 'crookwood';
  if (label.includes('lynx') || label.includes('burl') || label.includes('prism') || label.includes('ad') || label.includes('da')) return 'converters';
  if (label.includes('studer') || label.includes('bus') || label.includes('group')) return 'bus-console';
  if (label.includes('mic') || label.includes('line') || label.includes('stage')) return 'stage-room';

  return 'outboard';
}

// Extract key nodes from patchbay for the field
function extractEnergyNodes(): EnergyNode[] {
  const nodes: EnergyNode[] = [];
  const seenLabels = new Set<string>();

  patchbayBays.forEach(bay => {
    bay.rows.forEach(row => {
      row.points.forEach(point => {
        if (!point.label || seenLabels.has(point.label)) return;

        // Only include verified or important points
        const isImportant = point.label.includes('OUT') ||
                           point.label.includes('IN') ||
                           point.label.includes('L') ||
                           point.label.includes('R');

        if (point.verified || isImportant) {
          seenLabels.add(point.label);
          const territory = mapPointToTerritory(point);
          const territoryNodes = nodes.filter(n => n.territory === territory);

          nodes.push({
            id: point.id,
            label: point.label,
            territory,
            angle: (territoryNodes.length * 30) % 360,
            ring: TERRITORIES[territory].ring,
            type: point.type === 'send' ? 'output' : 'input',
            gearId: point.gearId,
          });
        }
      });
    });
  });

  return nodes.slice(0, 48); // Limit for visual clarity
}

function PatchbayFieldContent() {
  const { t, tr, language } = useLanguage();
  const searchParams = useSearchParams();
  const chainId = searchParams.get('chain');

  const svgRef = useRef<SVGSVGElement>(null);
  const [fieldState, setFieldState] = useState<FieldState>('void');
  const [nodes] = useState<EnergyNode[]>(() => extractEnergyNodes());
  const [flows, setFlows] = useState<FlowPath[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [activeTerritory, setActiveTerritory] = useState<Territory | null>(null);
  const [pulsePhase, setPulsePhase] = useState(0);
  const [showPatterns, setShowPatterns] = useState(false);

  const centerX = 500;
  const centerY = 400;
  const ringSpacing = 65;

  // Breathing animation
  useEffect(() => {
    const interval = setInterval(() => {
      setPulsePhase(p => (p + 0.015) % (Math.PI * 2));
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Wake from void
  useEffect(() => {
    const timer = setTimeout(() => setFieldState('field'), 800);
    return () => clearTimeout(timer);
  }, []);

  // Load chain as pattern
  useEffect(() => {
    if (chainId) {
      const chain = getChainById(chainId);
      if (chain) {
        const chainFlows: FlowPath[] = [];
        chain.steps.forEach((step, idx) => {
          if (step.patchRequired && step.patchFrom && step.patchTo) {
            chainFlows.push({
              id: `flow-${idx}`,
              from: step.patchFrom,
              to: step.patchTo,
              color: TERRITORIES.crookwood.color,
              label: `${step.stepNumber}`,
              active: true,
            });
          }
        });
        setFlows(chainFlows);
        setFieldState('flow');
      }
    }
  }, [chainId]);

  // Get node position
  const getNodePosition = useCallback((node: EnergyNode, index: number, total: number) => {
    const territoryNodes = nodes.filter(n => n.territory === node.territory);
    const nodeIndex = territoryNodes.indexOf(node);
    const angleSpread = Math.min(360, territoryNodes.length * 25);
    const startAngle = -angleSpread / 2;
    const angle = startAngle + (nodeIndex / Math.max(1, territoryNodes.length - 1)) * angleSpread;

    const breathOffset = Math.sin(pulsePhase + nodeIndex * 0.3) * 3;
    const radius = (node.ring * ringSpacing) + breathOffset;

    const rad = (angle * Math.PI) / 180;
    return {
      x: centerX + Math.cos(rad) * radius,
      y: centerY + Math.sin(rad) * radius,
    };
  }, [nodes, pulsePhase]);

  // Handle node click
  const handleNodeClick = (nodeId: string) => {
    if (!selectedNode) {
      setSelectedNode(nodeId);
      setFieldState('intent');
    } else if (selectedNode === nodeId) {
      setSelectedNode(null);
      setFieldState('field');
    } else {
      // Create flow
      const newFlow: FlowPath = {
        id: `flow-${Date.now()}`,
        from: selectedNode,
        to: nodeId,
        color: TERRITORIES[nodes.find(n => n.id === selectedNode)?.territory || 'outboard'].color,
        active: true,
      };
      setFlows(prev => [...prev, newFlow]);
      setSelectedNode(null);
      setFieldState('flow');
    }
  };

  // Clear all flows
  const handleClearField = () => {
    setFlows([]);
    setSelectedNode(null);
    setFieldState('field');
  };

  // Load a pattern
  const loadPattern = (chainId: string) => {
    const chain = getChainById(chainId);
    if (chain) {
      const chainFlows: FlowPath[] = [];
      chain.steps.forEach((step, idx) => {
        if (step.patchRequired && step.patchFrom && step.patchTo) {
          chainFlows.push({
            id: `flow-${idx}`,
            from: step.patchFrom,
            to: step.patchTo,
            color: TERRITORIES.crookwood.color,
            label: `${step.stepNumber}`,
            active: true,
          });
        }
      });
      setFlows(chainFlows);
      setFieldState('flow');
      setShowPatterns(false);
    }
  };

  // Render flow path with catenary curve and energy pulse
  const renderFlow = (flow: FlowPath) => {
    const fromNode = nodes.find(n => n.id === flow.from);
    const toNode = nodes.find(n => n.id === flow.to);
    if (!fromNode || !toNode) return null;

    const fromPos = getNodePosition(fromNode, 0, 1);
    const toPos = getNodePosition(toNode, 0, 1);

    const midX = (fromPos.x + toPos.x) / 2;
    const midY = (fromPos.y + toPos.y) / 2;
    const dist = Math.sqrt(Math.pow(toPos.x - fromPos.x, 2) + Math.pow(toPos.y - fromPos.y, 2));
    const sag = Math.min(dist * 0.15, 40);

    const path = `M ${fromPos.x} ${fromPos.y} Q ${midX} ${midY + sag} ${toPos.x} ${toPos.y}`;

    // Energy pulse position
    const t = (pulsePhase / (Math.PI * 2)) % 1;
    const pulseX = fromPos.x + (toPos.x - fromPos.x) * t;
    const pulseY = fromPos.y + (toPos.y - fromPos.y) * t + Math.sin(t * Math.PI) * sag;

    return (
      <g key={flow.id}>
        {/* Flow path glow */}
        <path
          d={path}
          fill="none"
          stroke={flow.color}
          strokeWidth={flow.active ? 4 : 2}
          strokeLinecap="round"
          opacity={0.2}
          filter="url(#glow)"
        />
        {/* Flow path */}
        <path
          d={path}
          fill="none"
          stroke={flow.color}
          strokeWidth={flow.active ? 2 : 1}
          strokeLinecap="round"
          opacity={flow.active ? 0.8 : 0.4}
          className="transition-all duration-500"
        />
        {/* Energy pulse */}
        {flow.active && (
          <circle
            cx={pulseX}
            cy={pulseY}
            r={4}
            fill={flow.color}
            opacity={0.9}
          >
            <animate
              attributeName="opacity"
              values="0.9;0.4;0.9"
              dur="1s"
              repeatCount="indefinite"
            />
          </circle>
        )}
        {/* Flow label */}
        {flow.label && (
          <text
            x={midX}
            y={midY + sag + 15}
            fill={flow.color}
            fontSize="10"
            textAnchor="middle"
            className="font-mono"
          >
            {flow.label}
          </text>
        )}
      </g>
    );
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col bg-[var(--background)] overflow-hidden">
      {/* Void state overlay */}
      <div
        className={`absolute inset-0 bg-[var(--background)] transition-opacity duration-1000 pointer-events-none z-10 ${
          fieldState === 'void' ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Field header - minimal */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 text-center">
        <div
          className={`transition-all duration-700 ${
            fieldState === 'void' ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
          }`}
        >
          <span className="text-[9px] font-medium tracking-[0.3em] uppercase opacity-30">
            {language === 'fr' ? 'Champ de Connexion' : 'Connection Field'}
          </span>
        </div>
      </div>

      {/* Pattern loader */}
      <div className="absolute top-20 right-8 z-20">
        <button
          onClick={() => setShowPatterns(!showPatterns)}
          className={`text-[9px] font-medium tracking-[0.2em] uppercase transition-opacity ${
            showPatterns ? 'opacity-100' : 'opacity-30 hover:opacity-60'
          }`}
        >
          {language === 'fr' ? 'Motifs' : 'Patterns'}
        </button>

        {showPatterns && (
          <div className="absolute top-8 right-0 w-48 bg-[var(--card)] border border-[var(--border)] p-3 space-y-2">
            {signalChains.slice(0, 5).map(chain => (
              <button
                key={chain.id}
                onClick={() => loadPattern(chain.id)}
                className="block w-full text-left text-[10px] tracking-wide opacity-50 hover:opacity-100 transition-opacity py-1"
              >
                {tr(chain.name)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Clear field */}
      {flows.length > 0 && (
        <div className="absolute top-20 left-8 z-20">
          <button
            onClick={handleClearField}
            className="text-[9px] font-medium tracking-[0.2em] uppercase opacity-30 hover:opacity-60 transition-opacity"
          >
            {language === 'fr' ? 'Effacer' : 'Clear'}
          </button>
        </div>
      )}

      {/* Territory legend */}
      <div
        className={`absolute left-8 top-1/2 -translate-y-1/2 space-y-4 transition-all duration-700 ${
          fieldState === 'void' ? 'opacity-0 -translate-x-4' : 'opacity-100 translate-x-0'
        }`}
      >
        {Object.entries(TERRITORIES).map(([key, territory]) => (
          <button
            key={key}
            onClick={() => setActiveTerritory(activeTerritory === key ? null : key as Territory)}
            className={`flex items-center gap-3 transition-opacity ${
              activeTerritory && activeTerritory !== key ? 'opacity-20' : 'opacity-100'
            }`}
          >
            <div
              className="w-2 h-2 rounded-full transition-transform"
              style={{
                backgroundColor: territory.color,
                transform: activeTerritory === key ? 'scale(1.5)' : 'scale(1)',
              }}
            />
            <span className="text-[9px] tracking-[0.15em] uppercase opacity-40">
              {territory.label}
            </span>
          </button>
        ))}
      </div>

      {/* Selected node info */}
      {selectedNode && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center z-20">
          <div className="text-[10px] tracking-[0.2em] uppercase opacity-40 mb-1">
            {language === 'fr' ? 'Sélectionné' : 'Selected'}
          </div>
          <div className="text-xs font-mono">
            {nodes.find(n => n.id === selectedNode)?.label}
          </div>
          <div className="text-[9px] opacity-30 mt-1">
            {language === 'fr' ? 'Touchez une destination' : 'Touch a destination'}
          </div>
        </div>
      )}

      {/* The Field */}
      <div className="flex-1 flex items-center justify-center">
        <svg
          ref={svgRef}
          width="1000"
          height="800"
          viewBox="0 0 1000 800"
          className={`transition-all duration-1000 ${
            fieldState === 'void' ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
          }`}
        >
          <defs>
            {/* Glow filter */}
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Node gradient */}
            <radialGradient id="nodeGradient">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Territory rings - breathing */}
          {Object.entries(TERRITORIES).map(([key, territory]) => {
            const breathScale = 1 + Math.sin(pulsePhase + territory.ring * 0.5) * 0.01;
            const radius = territory.ring * ringSpacing * breathScale;
            const isActive = !activeTerritory || activeTerritory === key;

            return (
              <circle
                key={key}
                cx={centerX}
                cy={centerY}
                r={radius}
                fill="none"
                stroke={territory.color}
                strokeWidth={1}
                opacity={isActive ? 0.15 : 0.05}
                className="transition-opacity duration-500"
              />
            );
          })}

          {/* Center point - the heart */}
          <circle
            cx={centerX}
            cy={centerY}
            r={8 + Math.sin(pulsePhase) * 2}
            fill="var(--accent)"
            opacity={0.6}
          />
          <circle
            cx={centerX}
            cy={centerY}
            r={20}
            fill="url(#nodeGradient)"
          />

          {/* Flow paths */}
          {flows.map(flow => renderFlow(flow))}

          {/* Pending connection line */}
          {selectedNode && hoveredNode && selectedNode !== hoveredNode && (
            (() => {
              const fromNode = nodes.find(n => n.id === selectedNode);
              const toNode = nodes.find(n => n.id === hoveredNode);
              if (!fromNode || !toNode) return null;

              const fromPos = getNodePosition(fromNode, 0, 1);
              const toPos = getNodePosition(toNode, 0, 1);

              return (
                <line
                  x1={fromPos.x}
                  y1={fromPos.y}
                  x2={toPos.x}
                  y2={toPos.y}
                  stroke="var(--accent)"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                  opacity={0.5}
                />
              );
            })()
          )}

          {/* Energy nodes */}
          {nodes.map((node, idx) => {
            const pos = getNodePosition(node, idx, nodes.length);
            const isSelected = selectedNode === node.id;
            const isHovered = hoveredNode === node.id;
            const hasFlow = flows.some(f => f.from === node.id || f.to === node.id);
            const territory = TERRITORIES[node.territory];
            const isVisible = !activeTerritory || activeTerritory === node.territory;

            const nodeScale = isSelected ? 1.4 : isHovered ? 1.2 : 1;
            const nodeOpacity = isVisible ? (hasFlow ? 1 : 0.7) : 0.15;

            return (
              <g
                key={node.id}
                className="cursor-pointer transition-all duration-300"
                style={{
                  transform: `translate(${pos.x}px, ${pos.y}px) scale(${nodeScale})`,
                  transformOrigin: '0 0',
                }}
                onClick={() => handleNodeClick(node.id)}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                {/* Node glow */}
                <circle
                  cx={0}
                  cy={0}
                  r={12}
                  fill={territory.color}
                  opacity={isSelected ? 0.3 : isHovered ? 0.2 : 0}
                  className="transition-opacity duration-300"
                />

                {/* Node core */}
                <circle
                  cx={0}
                  cy={0}
                  r={hasFlow ? 6 : 4}
                  fill={hasFlow ? territory.color : 'var(--foreground)'}
                  opacity={nodeOpacity}
                  className="transition-all duration-300"
                />

                {/* Node ring */}
                <circle
                  cx={0}
                  cy={0}
                  r={hasFlow ? 8 : 6}
                  fill="none"
                  stroke={isSelected ? 'var(--accent)' : territory.color}
                  strokeWidth={isSelected ? 2 : 1}
                  opacity={nodeOpacity * 0.5}
                  className="transition-all duration-300"
                />

                {/* Node label - appears on hover */}
                {(isHovered || isSelected) && (
                  <text
                    x={0}
                    y={-14}
                    fill="var(--foreground)"
                    fontSize="8"
                    textAnchor="middle"
                    className="font-mono pointer-events-none"
                    opacity={0.6}
                  >
                    {node.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Flow count */}
      {flows.length > 0 && (
        <div className="absolute bottom-8 right-8 text-right">
          <span className="text-[9px] tracking-[0.15em] uppercase opacity-30">
            {language === 'fr' ? 'Flux actifs' : 'Active flows'}
          </span>
          <div className="font-mono text-lg opacity-60">{flows.length}</div>
        </div>
      )}

      {/* Link to classic view */}
      <Link
        href="/gear"
        className="absolute bottom-8 left-8 text-[9px] tracking-[0.15em] uppercase opacity-20 hover:opacity-40 transition-opacity"
      >
        {language === 'fr' ? 'Vue technique' : 'Technical view'}
      </Link>
    </div>
  );
}

export default function PatchbayPage() {
  return (
    <Suspense fallback={
      <div className="h-[calc(100vh-3.5rem)] flex items-center justify-center bg-[var(--background)]">
        <div className="w-3 h-3 bg-[var(--accent)] opacity-40 animate-pulse" />
      </div>
    }>
      <PatchbayFieldContent />
    </Suspense>
  );
}
