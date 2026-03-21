'use client';

import { useState, useEffect } from 'react';
import { SpaceTimeEngine, SpaceTimeConditions, SpaceCondition, TimeCondition, EvolutionRule } from '@/lib/spacetime-engine';

interface CreatorConfig {
  // Identity
  name: string;
  description: string;
  artistName: string;

  // Conditions
  space: SpaceCondition;
  time: TimeCondition;
  evolution: EvolutionRule[];

  // Visual Design
  visual: {
    lockedMessage: string;
    unlockedMessage: string;
    accentColor: string;
    backgroundStyle: 'dark' | 'light' | 'gradient';
    symbolLocked: string;
    symbolUnlocked: string;
  };

  // Sound snapshot (parameter values)
  soundParams: Record<string, number>;
}

interface SpaceTimeCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (config: CreatorConfig) => void;
  currentSoundParams: Record<string, number>;
  themeMode: 'day' | 'night';
}

const DEFAULT_CONFIG: CreatorConfig = {
  name: 'Untitled Experience',
  description: '',
  artistName: '',
  space: { type: 'anywhere' },
  time: { type: 'anytime' },
  evolution: [],
  visual: {
    lockedMessage: 'This experience is not yet available',
    unlockedMessage: 'Welcome',
    accentColor: '#7C5CFF',
    backgroundStyle: 'dark',
    symbolLocked: '◇',
    symbolUnlocked: '◆',
  },
  soundParams: {},
};

const CITIES = [
  'Tokyo', 'Paris', 'New York', 'London', 'Berlin', 'Los Angeles', 'Sydney',
  'Dubai', 'Seoul', 'São Paulo', 'Mumbai', 'Cairo', 'Moscow', 'Shanghai',
  'Lagos', 'Mexico City', 'Amsterdam', 'Stockholm', 'Reykjavik', 'Marrakech'
];

const MOON_PHASES = [
  { value: 'new', label: 'New Moon' },
  { value: 'waxing_crescent', label: 'Waxing Crescent' },
  { value: 'first_quarter', label: 'First Quarter' },
  { value: 'waxing_gibbous', label: 'Waxing Gibbous' },
  { value: 'full', label: 'Full Moon' },
  { value: 'waning_gibbous', label: 'Waning Gibbous' },
  { value: 'last_quarter', label: 'Last Quarter' },
  { value: 'waning_crescent', label: 'Waning Crescent' },
];

const SEASONS = ['spring', 'summer', 'autumn', 'winter'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function SpaceTimeCreator({ isOpen, onClose, onExport, currentSoundParams, themeMode }: SpaceTimeCreatorProps) {
  const [config, setConfig] = useState<CreatorConfig>({ ...DEFAULT_CONFIG, soundParams: currentSoundParams });
  const [activeTab, setActiveTab] = useState<'identity' | 'space' | 'time' | 'evolution' | 'visual' | 'preview'>('identity');
  const [previewResult, setPreviewResult] = useState<{ allowed: boolean; reason?: string } | null>(null);

  // Preview conditions
  useEffect(() => {
    if (activeTab === 'preview') {
      const engine = new SpaceTimeEngine();
      const conditions: SpaceTimeConditions = {
        id: 'preview',
        name: config.name,
        space: config.space,
        time: config.time,
        evolution: config.evolution,
        createdAt: new Date().toISOString(),
      };
      const result = engine.evaluate(conditions);
      setPreviewResult(result);
    }
  }, [activeTab, config]);

  const updateConfig = <K extends keyof CreatorConfig>(key: K, value: CreatorConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const updateSpace = <K extends keyof SpaceCondition>(key: K, value: SpaceCondition[K]) => {
    setConfig(prev => ({ ...prev, space: { ...prev.space, [key]: value } }));
  };

  const updateTime = <K extends keyof TimeCondition>(key: K, value: TimeCondition[K]) => {
    setConfig(prev => ({ ...prev, time: { ...prev.time, [key]: value } }));
  };

  const updateVisual = <K extends keyof CreatorConfig['visual']>(key: K, value: CreatorConfig['visual'][K]) => {
    setConfig(prev => ({ ...prev, visual: { ...prev.visual, [key]: value } }));
  };

  const addEvolutionRule = () => {
    setConfig(prev => ({
      ...prev,
      evolution: [...prev.evolution, { parameter: 'filterFreq', source: 'moon_cycle', mapping: 'linear', min: 200, max: 4000 }]
    }));
  };

  const removeEvolutionRule = (index: number) => {
    setConfig(prev => ({
      ...prev,
      evolution: prev.evolution.filter((_, i) => i !== index)
    }));
  };

  const updateEvolutionRule = (index: number, updates: Partial<EvolutionRule>) => {
    setConfig(prev => ({
      ...prev,
      evolution: prev.evolution.map((rule, i) => i === index ? { ...rule, ...updates } : rule)
    }));
  };

  const handleExport = () => {
    onExport({ ...config, soundParams: currentSoundParams });
  };

  const generateShareableLink = () => {
    const encoded = btoa(JSON.stringify(config));
    const baseUrl = window.location.origin;
    return `${baseUrl}/instruments/synthi?st=${encoded}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (!isOpen) return null;

  const bgColor = themeMode === 'night' ? 'rgba(10,10,10,0.98)' : 'rgba(250,248,242,0.98)';
  const textColor = themeMode === 'night' ? '#7C5CFF' : '#1a1a1a';
  const borderColor = themeMode === 'night' ? 'rgba(124,92,255,0.3)' : 'rgba(0,0,0,0.1)';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.8)' }}>
      <div
        className="w-[800px] max-h-[90vh] overflow-hidden flex flex-col"
        style={{ background: bgColor, border: `1px solid ${borderColor}` }}
      >
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor }}>
          <div>
            <h2 className="text-sm font-medium tracking-wide" style={{ color: textColor }}>
              Space-Time Creator
            </h2>
            <p className="text-[10px] uppercase tracking-[0.15em] opacity-40" style={{ color: textColor }}>
              Design your conditional experience
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-lg opacity-40 hover:opacity-100 transition-opacity"
            style={{ color: textColor }}
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b" style={{ borderColor }}>
          {(['identity', 'space', 'time', 'evolution', 'visual', 'preview'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-3 text-[10px] uppercase tracking-[0.15em] transition-all"
              style={{
                color: activeTab === tab ? config.visual.accentColor : textColor,
                opacity: activeTab === tab ? 1 : 0.4,
                borderBottom: activeTab === tab ? `2px solid ${config.visual.accentColor}` : '2px solid transparent',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Identity Tab */}
          {activeTab === 'identity' && (
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] uppercase tracking-[0.1em] opacity-40 mb-2" style={{ color: textColor }}>
                  Experience Name
                </label>
                <input
                  type="text"
                  value={config.name}
                  onChange={(e) => updateConfig('name', e.target.value)}
                  className="w-full bg-transparent border px-3 py-2 text-sm focus:outline-none"
                  style={{ borderColor, color: textColor }}
                  placeholder="e.g., Midnight Tokyo"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-[0.1em] opacity-40 mb-2" style={{ color: textColor }}>
                  Artist Name
                </label>
                <input
                  type="text"
                  value={config.artistName}
                  onChange={(e) => updateConfig('artistName', e.target.value)}
                  className="w-full bg-transparent border px-3 py-2 text-sm focus:outline-none"
                  style={{ borderColor, color: textColor }}
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-[0.1em] opacity-40 mb-2" style={{ color: textColor }}>
                  Description
                </label>
                <textarea
                  value={config.description}
                  onChange={(e) => updateConfig('description', e.target.value)}
                  className="w-full bg-transparent border px-3 py-2 text-sm focus:outline-none resize-none h-24"
                  style={{ borderColor, color: textColor }}
                  placeholder="What is this experience about?"
                />
              </div>
            </div>
          )}

          {/* Space Tab */}
          {activeTab === 'space' && (
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] uppercase tracking-[0.1em] opacity-40 mb-2" style={{ color: textColor }}>
                  Location Requirement
                </label>
                <select
                  value={config.space.type}
                  onChange={(e) => updateSpace('type', e.target.value as SpaceCondition['type'])}
                  className="w-full bg-transparent border px-3 py-2 text-sm focus:outline-none"
                  style={{ borderColor, color: textColor }}
                >
                  <option value="anywhere">Anywhere in the world</option>
                  <option value="city">Specific city</option>
                  <option value="country">Specific country</option>
                  <option value="coordinates">GPS coordinates</option>
                </select>
              </div>

              {config.space.type === 'city' && (
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.1em] opacity-40 mb-2" style={{ color: textColor }}>
                    City
                  </label>
                  <select
                    value={config.space.city || ''}
                    onChange={(e) => updateSpace('city', e.target.value)}
                    className="w-full bg-transparent border px-3 py-2 text-sm focus:outline-none"
                    style={{ borderColor, color: textColor }}
                  >
                    <option value="">Select city...</option>
                    {CITIES.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
              )}

              {config.space.type === 'coordinates' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.1em] opacity-40 mb-2" style={{ color: textColor }}>
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={config.space.latitude || ''}
                      onChange={(e) => updateSpace('latitude', parseFloat(e.target.value))}
                      className="w-full bg-transparent border px-3 py-2 text-sm focus:outline-none"
                      style={{ borderColor, color: textColor }}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.1em] opacity-40 mb-2" style={{ color: textColor }}>
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={config.space.longitude || ''}
                      onChange={(e) => updateSpace('longitude', parseFloat(e.target.value))}
                      className="w-full bg-transparent border px-3 py-2 text-sm focus:outline-none"
                      style={{ borderColor, color: textColor }}
                    />
                  </div>
                </div>
              )}

              {(config.space.type === 'city' || config.space.type === 'coordinates') && (
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.1em] opacity-40 mb-2" style={{ color: textColor }}>
                    Radius (km)
                  </label>
                  <input
                    type="number"
                    value={config.space.radiusKm || 25}
                    onChange={(e) => updateSpace('radiusKm', parseInt(e.target.value))}
                    className="w-full bg-transparent border px-3 py-2 text-sm focus:outline-none"
                    style={{ borderColor, color: textColor }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Time Tab */}
          {activeTab === 'time' && (
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] uppercase tracking-[0.1em] opacity-40 mb-2" style={{ color: textColor }}>
                  Time Requirement
                </label>
                <select
                  value={config.time.type}
                  onChange={(e) => updateTime('type', e.target.value as TimeCondition['type'])}
                  className="w-full bg-transparent border px-3 py-2 text-sm focus:outline-none"
                  style={{ borderColor, color: textColor }}
                >
                  <option value="anytime">Anytime</option>
                  <option value="moon_phase">Moon phase</option>
                  <option value="time_range">Time of day</option>
                  <option value="season">Season</option>
                  <option value="day_of_week">Days of week</option>
                  <option value="specific_date">Specific date (yearly)</option>
                  <option value="date_range">Date range</option>
                </select>
              </div>

              {config.time.type === 'moon_phase' && (
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.1em] opacity-40 mb-2" style={{ color: textColor }}>
                    Moon Phase
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {MOON_PHASES.map(phase => (
                      <button
                        key={phase.value}
                        onClick={() => updateTime('moonPhase', phase.value as TimeCondition['moonPhase'])}
                        className="p-3 border text-center transition-all"
                        style={{
                          borderColor: config.time.moonPhase === phase.value ? config.visual.accentColor : borderColor,
                          background: config.time.moonPhase === phase.value ? `${config.visual.accentColor}20` : 'transparent',
                        }}
                      >
                        <div className="text-lg mb-1">{phase.value === 'full' ? '●' : phase.value === 'new' ? '○' : '◐'}</div>
                        <div className="text-[9px] uppercase" style={{ color: textColor, opacity: 0.6 }}>{phase.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {config.time.type === 'time_range' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.1em] opacity-40 mb-2" style={{ color: textColor }}>
                      Start Hour (0-23)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={23}
                      value={config.time.startHour || 0}
                      onChange={(e) => updateTime('startHour', parseInt(e.target.value))}
                      className="w-full bg-transparent border px-3 py-2 text-sm focus:outline-none"
                      style={{ borderColor, color: textColor }}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.1em] opacity-40 mb-2" style={{ color: textColor }}>
                      End Hour (0-23)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={23}
                      value={config.time.endHour || 23}
                      onChange={(e) => updateTime('endHour', parseInt(e.target.value))}
                      className="w-full bg-transparent border px-3 py-2 text-sm focus:outline-none"
                      style={{ borderColor, color: textColor }}
                    />
                  </div>
                </div>
              )}

              {config.time.type === 'season' && (
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.1em] opacity-40 mb-2" style={{ color: textColor }}>
                    Season
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {SEASONS.map(season => (
                      <button
                        key={season}
                        onClick={() => updateTime('season', season as TimeCondition['season'])}
                        className="p-3 border text-center transition-all capitalize"
                        style={{
                          borderColor: config.time.season === season ? config.visual.accentColor : borderColor,
                          background: config.time.season === season ? `${config.visual.accentColor}20` : 'transparent',
                          color: textColor,
                        }}
                      >
                        {season}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {config.time.type === 'day_of_week' && (
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.1em] opacity-40 mb-2" style={{ color: textColor }}>
                    Days (click to toggle)
                  </label>
                  <div className="flex gap-2">
                    {DAYS.map((day, i) => (
                      <button
                        key={day}
                        onClick={() => {
                          const current = config.time.dayOfWeek || [];
                          const updated = current.includes(i) ? current.filter(d => d !== i) : [...current, i];
                          updateTime('dayOfWeek', updated);
                        }}
                        className="w-10 h-10 border text-center transition-all"
                        style={{
                          borderColor: config.time.dayOfWeek?.includes(i) ? config.visual.accentColor : borderColor,
                          background: config.time.dayOfWeek?.includes(i) ? `${config.visual.accentColor}20` : 'transparent',
                          color: textColor,
                        }}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {config.time.type === 'specific_date' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.1em] opacity-40 mb-2" style={{ color: textColor }}>
                      Month (1-12)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={config.time.month || 1}
                      onChange={(e) => updateTime('month', parseInt(e.target.value))}
                      className="w-full bg-transparent border px-3 py-2 text-sm focus:outline-none"
                      style={{ borderColor, color: textColor }}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.1em] opacity-40 mb-2" style={{ color: textColor }}>
                      Day (1-31)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={config.time.day || 1}
                      onChange={(e) => updateTime('day', parseInt(e.target.value))}
                      className="w-full bg-transparent border px-3 py-2 text-sm focus:outline-none"
                      style={{ borderColor, color: textColor }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Evolution Tab */}
          {activeTab === 'evolution' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.1em] opacity-40" style={{ color: textColor }}>
                    Evolution Rules
                  </div>
                  <div className="text-[9px] opacity-30" style={{ color: textColor }}>
                    Parameters that change based on space-time
                  </div>
                </div>
                <button
                  onClick={addEvolutionRule}
                  className="px-3 py-1.5 border text-[10px] uppercase tracking-[0.1em] transition-all hover:opacity-100 opacity-60"
                  style={{ borderColor, color: textColor }}
                >
                  + Add Rule
                </button>
              </div>

              {config.evolution.map((rule, index) => (
                <div key={index} className="p-4 border" style={{ borderColor }}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] uppercase tracking-[0.1em] opacity-40" style={{ color: textColor }}>
                      Rule {index + 1}
                    </span>
                    <button
                      onClick={() => removeEvolutionRule(index)}
                      className="text-[10px] opacity-40 hover:opacity-100"
                      style={{ color: '#ff4444' }}
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[9px] uppercase tracking-[0.1em] opacity-40 mb-1" style={{ color: textColor }}>
                        Parameter
                      </label>
                      <select
                        value={rule.parameter}
                        onChange={(e) => updateEvolutionRule(index, { parameter: e.target.value })}
                        className="w-full bg-transparent border px-2 py-1.5 text-sm focus:outline-none"
                        style={{ borderColor, color: textColor }}
                      >
                        <option value="filterFreq">Filter Frequency</option>
                        <option value="filterQ">Filter Q</option>
                        <option value="lfo1Rate">LFO Rate</option>
                        <option value="reverbMix">Reverb Mix</option>
                        <option value="delayTime">Delay Time</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase tracking-[0.1em] opacity-40 mb-1" style={{ color: textColor }}>
                        Source
                      </label>
                      <select
                        value={rule.source}
                        onChange={(e) => updateEvolutionRule(index, { source: e.target.value as EvolutionRule['source'] })}
                        className="w-full bg-transparent border px-2 py-1.5 text-sm focus:outline-none"
                        style={{ borderColor, color: textColor }}
                      >
                        <option value="moon_cycle">Moon Cycle</option>
                        <option value="time_of_day">Time of Day</option>
                        <option value="season">Season</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase tracking-[0.1em] opacity-40 mb-1" style={{ color: textColor }}>
                        Min Value
                      </label>
                      <input
                        type="number"
                        value={rule.min}
                        onChange={(e) => updateEvolutionRule(index, { min: parseFloat(e.target.value) })}
                        className="w-full bg-transparent border px-2 py-1.5 text-sm focus:outline-none"
                        style={{ borderColor, color: textColor }}
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase tracking-[0.1em] opacity-40 mb-1" style={{ color: textColor }}>
                        Max Value
                      </label>
                      <input
                        type="number"
                        value={rule.max}
                        onChange={(e) => updateEvolutionRule(index, { max: parseFloat(e.target.value) })}
                        className="w-full bg-transparent border px-2 py-1.5 text-sm focus:outline-none"
                        style={{ borderColor, color: textColor }}
                      />
                    </div>
                  </div>
                </div>
              ))}

              {config.evolution.length === 0 && (
                <div className="text-center py-8 opacity-30" style={{ color: textColor }}>
                  No evolution rules. Sound will be static.
                </div>
              )}
            </div>
          )}

          {/* Visual Tab */}
          {activeTab === 'visual' && (
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] uppercase tracking-[0.1em] opacity-40 mb-2" style={{ color: textColor }}>
                  Accent Color
                </label>
                <div className="flex gap-2">
                  {['#7C5CFF', '#00ff88', '#ff4444', '#00bfff', '#ffaa00', '#ff00aa'].map(color => (
                    <button
                      key={color}
                      onClick={() => updateVisual('accentColor', color)}
                      className="w-10 h-10 rounded-full border-2 transition-all"
                      style={{
                        background: color,
                        borderColor: config.visual.accentColor === color ? '#fff' : 'transparent',
                      }}
                    />
                  ))}
                  <input
                    type="color"
                    value={config.visual.accentColor}
                    onChange={(e) => updateVisual('accentColor', e.target.value)}
                    className="w-10 h-10 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-[0.1em] opacity-40 mb-2" style={{ color: textColor }}>
                  Background Style
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['dark', 'light', 'gradient'] as const).map(style => (
                    <button
                      key={style}
                      onClick={() => updateVisual('backgroundStyle', style)}
                      className="p-3 border text-center capitalize transition-all"
                      style={{
                        borderColor: config.visual.backgroundStyle === style ? config.visual.accentColor : borderColor,
                        background: config.visual.backgroundStyle === style ? `${config.visual.accentColor}20` : 'transparent',
                        color: textColor,
                      }}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.1em] opacity-40 mb-2" style={{ color: textColor }}>
                    Locked Symbol
                  </label>
                  <input
                    type="text"
                    value={config.visual.symbolLocked}
                    onChange={(e) => updateVisual('symbolLocked', e.target.value)}
                    className="w-full bg-transparent border px-3 py-2 text-2xl text-center focus:outline-none"
                    style={{ borderColor, color: textColor }}
                    maxLength={2}
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.1em] opacity-40 mb-2" style={{ color: textColor }}>
                    Unlocked Symbol
                  </label>
                  <input
                    type="text"
                    value={config.visual.symbolUnlocked}
                    onChange={(e) => updateVisual('symbolUnlocked', e.target.value)}
                    className="w-full bg-transparent border px-3 py-2 text-2xl text-center focus:outline-none"
                    style={{ borderColor, color: textColor }}
                    maxLength={2}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-[0.1em] opacity-40 mb-2" style={{ color: textColor }}>
                  Locked Message
                </label>
                <input
                  type="text"
                  value={config.visual.lockedMessage}
                  onChange={(e) => updateVisual('lockedMessage', e.target.value)}
                  className="w-full bg-transparent border px-3 py-2 text-sm focus:outline-none"
                  style={{ borderColor, color: textColor }}
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-[0.1em] opacity-40 mb-2" style={{ color: textColor }}>
                  Unlocked Message
                </label>
                <input
                  type="text"
                  value={config.visual.unlockedMessage}
                  onChange={(e) => updateVisual('unlockedMessage', e.target.value)}
                  className="w-full bg-transparent border px-3 py-2 text-sm focus:outline-none"
                  style={{ borderColor, color: textColor }}
                />
              </div>
            </div>
          )}

          {/* Preview Tab */}
          {activeTab === 'preview' && (
            <div className="space-y-6">
              {/* Live Preview Card */}
              <div
                className="p-8 text-center border transition-all"
                style={{
                  background: config.visual.backgroundStyle === 'dark' ? '#0a0a0a' :
                             config.visual.backgroundStyle === 'light' ? '#FAF8F2' :
                             `linear-gradient(135deg, #0a0a0a 0%, ${config.visual.accentColor}40 100%)`,
                  borderColor: previewResult?.allowed ? config.visual.accentColor : '#ff4444',
                }}
              >
                <div
                  className="text-5xl mb-4"
                  style={{ color: previewResult?.allowed ? config.visual.accentColor : '#ff4444' }}
                >
                  {previewResult?.allowed ? config.visual.symbolUnlocked : config.visual.symbolLocked}
                </div>
                <div
                  className="text-lg font-medium tracking-wide mb-2"
                  style={{ color: config.visual.backgroundStyle === 'dark' ? '#fff' : '#000' }}
                >
                  {config.name}
                </div>
                {config.artistName && (
                  <div
                    className="text-[10px] uppercase tracking-[0.15em] opacity-40 mb-4"
                    style={{ color: config.visual.backgroundStyle === 'dark' ? '#fff' : '#000' }}
                  >
                    by {config.artistName}
                  </div>
                )}
                <div
                  className="text-sm"
                  style={{ color: previewResult?.allowed ? config.visual.accentColor : '#ff4444' }}
                >
                  {previewResult?.allowed ? config.visual.unlockedMessage : config.visual.lockedMessage}
                </div>
                {!previewResult?.allowed && previewResult?.reason && (
                  <div className="mt-2 text-[10px] opacity-60" style={{ color: '#ff4444' }}>
                    {previewResult.reason}
                  </div>
                )}
              </div>

              {/* Current Status */}
              <div className="p-4 border" style={{ borderColor }}>
                <div className="text-[10px] uppercase tracking-[0.1em] opacity-40 mb-3" style={{ color: textColor }}>
                  Current Status
                </div>
                <div className="grid grid-cols-2 gap-4 text-[11px]" style={{ color: textColor }}>
                  <div>
                    <span className="opacity-40">Space: </span>
                    {config.space.type === 'anywhere' ? 'Anywhere' :
                     config.space.type === 'city' ? config.space.city :
                     config.space.type}
                  </div>
                  <div>
                    <span className="opacity-40">Time: </span>
                    {config.time.type === 'anytime' ? 'Anytime' :
                     config.time.type === 'moon_phase' ? `${config.time.moonPhase} moon` :
                     config.time.type}
                  </div>
                </div>
              </div>

              {/* Shareable Link */}
              <div className="p-4 border" style={{ borderColor }}>
                <div className="text-[10px] uppercase tracking-[0.1em] opacity-40 mb-3" style={{ color: textColor }}>
                  Shareable Link
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={generateShareableLink()}
                    className="flex-1 bg-transparent border px-3 py-2 text-[10px] font-mono focus:outline-none"
                    style={{ borderColor, color: textColor }}
                  />
                  <button
                    onClick={() => copyToClipboard(generateShareableLink())}
                    className="px-4 py-2 border text-[10px] uppercase tracking-[0.1em] transition-all hover:opacity-100 opacity-60"
                    style={{ borderColor, color: textColor }}
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex items-center justify-between" style={{ borderColor }}>
          <button
            onClick={onClose}
            className="px-4 py-2 border text-[10px] uppercase tracking-[0.1em] opacity-60 hover:opacity-100 transition-all"
            style={{ borderColor, color: textColor }}
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            className="px-6 py-2 text-[10px] uppercase tracking-[0.1em] transition-all"
            style={{
              background: config.visual.accentColor,
              color: '#fff',
            }}
          >
            Save Experience
          </button>
        </div>
      </div>
    </div>
  );
}

export type { CreatorConfig };
