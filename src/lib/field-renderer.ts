/**
 * FIELD RENDERER
 *
 * Visual feedback membrane for SIGNAL/FIELD
 * Turns sound into felt motion - not technical monitoring, but embodied perception
 *
 * This should NOT look like: EQ, DAW metering, spectrum analyzer
 * This should feel like: living pitch field, resonance membrane, motion-based perception
 */

import type { VisualizationMode, AnalysisData, VisualConfig, VisualState } from '@/types/signal';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  energy: number;
  frequency: number;
  hue: number;
  radius: number;
}

export class FieldRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width = 0;
  private height = 0;
  private centerX = 0;
  private centerY = 0;

  // Animation
  private animationId: number | null = null;
  private time = 0;
  private isRunning = false;

  // Particles
  private particles: Particle[] = [];

  // Wave field
  private waveRings: { radius: number; energy: number; birth: number }[] = [];

  // Configuration
  private config: VisualConfig = {
    mode: 'wave_field',
    color: '#7C5CFF',           // Studio purple
    accentColor: '#9B7FFF',     // Lighter purple
    particleCount: 100,
    bloomIntensity: 0.6,
    motionSpeed: 0.5,
    responseTime: 100,          // ms
    opacity: 0.8,
  };

  // Analysis data
  private analysisData: AnalysisData = {
    pitch: 0,
    energy: 0,
    brightness: 0,
    onsets: [],
    frequencyBands: new Float32Array(0),
    waveform: new Float32Array(0),
  };

  // Smoothing
  private smoothedEnergy = 0;
  private smoothedBrightness = 0;

  constructor(canvas: HTMLCanvasElement, config?: Partial<VisualConfig>) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to get 2D context');
    }

    this.ctx = ctx;

    if (config) {
      this.config = { ...this.config, ...config };
    }

    this.resize();
    this.initParticles();

    // Handle resize
    window.addEventListener('resize', this.resize.bind(this));
  }

  // === INITIALIZATION ===

  private resize(): void {
    const dpr = window.devicePixelRatio || 1;

    this.width = this.canvas.clientWidth;
    this.height = this.canvas.clientHeight;

    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;

    this.ctx.scale(dpr, dpr);

    this.centerX = this.width / 2;
    this.centerY = this.height / 2;
  }

  private initParticles(): void {
    this.particles = [];

    for (let i = 0; i < this.config.particleCount; i++) {
      const angle = (i / this.config.particleCount) * Math.PI * 2;
      const radius = 100 + Math.random() * 100;

      this.particles.push({
        x: this.centerX + Math.cos(angle) * radius,
        y: this.centerY + Math.sin(angle) * radius,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        energy: 0,
        frequency: 200 + Math.random() * 2000,
        hue: Math.random() * 60 + 260, // Purple to blue range
        radius: 2 + Math.random() * 3,
      });
    }
  }

  // === RENDERING ===

  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.render();
  }

  stop(): void {
    this.isRunning = false;

    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private render(): void {
    if (!this.isRunning) return;

    this.time += 0.016; // ~60fps

    // Material background gradient (breathing, alive)
    const bgGradient = this.ctx.createRadialGradient(
      this.centerX,
      this.centerY,
      0,
      this.centerX,
      this.centerY,
      Math.max(this.width, this.height) * 0.7
    );

    const breathe = Math.sin(this.time * 0.5) * 0.02 + 0.98;
    bgGradient.addColorStop(0, `rgba(20, 18, 28, ${0.12 * breathe})`);
    bgGradient.addColorStop(0.5, `rgba(15, 14, 22, ${0.18 * breathe})`);
    bgGradient.addColorStop(1, `rgba(10, 10, 15, ${0.25 * breathe})`);

    this.ctx.fillStyle = bgGradient;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Smooth analysis data
    this.smoothAnalysisData();

    // Render based on mode
    switch (this.config.mode) {
      case 'wave_field':
        this.renderWaveField();
        break;

      case 'particle_cloud':
        this.renderParticleCloud();
        break;

      case 'tension_arcs':
        this.renderTensionArcs();
        break;

      case 'resonance_bloom':
        this.renderResonanceBloom();
        break;

      case 'hybrid':
        this.renderWaveField();
        this.renderParticleCloud();
        break;
    }

    this.animationId = requestAnimationFrame(this.render.bind(this));
  }

  // === VISUALIZATION MODES ===

  private renderWaveField(): void {
    const baseRadius = 80;
    const energyScale = this.smoothedEnergy * 150;

    // Update wave rings
    this.waveRings = this.waveRings.filter(ring => {
      const age = this.time - ring.birth;
      return age < 4; // Extended lifetime for smoother fade
    });

    // Add new ring on onsets
    if (this.analysisData.energy > this.smoothedEnergy * 1.5) {
      this.waveRings.push({
        radius: baseRadius,
        energy: this.analysisData.energy,
        birth: this.time,
      });
    }

    // Draw rings with glass-like material quality
    this.waveRings.forEach(ring => {
      const age = this.time - ring.birth;
      const expansion = age * 80; // Slower expansion
      const radius = ring.radius + expansion;
      const opacity = Math.max(0, 1 - age / 4) * ring.energy * this.config.opacity;

      // Outer glow (soft diffusion)
      const glowGradient = this.ctx.createRadialGradient(
        this.centerX, this.centerY, radius - 15,
        this.centerX, this.centerY, radius + 15
      );
      glowGradient.addColorStop(0, `rgba(124, 92, 255, 0)`);
      glowGradient.addColorStop(0.5, `rgba(124, 92, 255, ${opacity * 0.15})`);
      glowGradient.addColorStop(1, `rgba(155, 127, 255, 0)`);

      this.ctx.fillStyle = glowGradient;
      this.ctx.beginPath();
      this.ctx.arc(this.centerX, this.centerY, radius + 15, 0, Math.PI * 2);
      this.ctx.fill();

      // Main ring (frosted glass edge)
      this.ctx.strokeStyle = `rgba(155, 127, 255, ${opacity * 0.5})`;
      this.ctx.lineWidth = 1 + ring.energy * 2;
      this.ctx.beginPath();
      this.ctx.arc(this.centerX, this.centerY, radius, 0, Math.PI * 2);
      this.ctx.stroke();
    });

    // Draw main field with layered material depth
    const pulseRadius = baseRadius + Math.sin(this.time * 2) * 8 + energyScale;

    // Deep inner glow (core energy)
    const innerGlow = this.ctx.createRadialGradient(
      this.centerX, this.centerY, 0,
      this.centerX, this.centerY, pulseRadius * 0.4
    );
    innerGlow.addColorStop(0, `rgba(155, 127, 255, ${this.config.bloomIntensity * 0.3})`);
    innerGlow.addColorStop(1, `rgba(124, 92, 255, 0)`);

    this.ctx.fillStyle = innerGlow;
    this.ctx.beginPath();
    this.ctx.arc(this.centerX, this.centerY, pulseRadius * 0.4, 0, Math.PI * 2);
    this.ctx.fill();

    // Mid layer (soft gradient)
    const midGradient = this.ctx.createRadialGradient(
      this.centerX, this.centerY, pulseRadius * 0.5,
      this.centerX, this.centerY, pulseRadius * 0.85
    );
    midGradient.addColorStop(0, `rgba(110, 80, 200, ${this.config.bloomIntensity * 0.12})`);
    midGradient.addColorStop(1, `rgba(124, 92, 255, 0)`);

    this.ctx.fillStyle = midGradient;
    this.ctx.beginPath();
    this.ctx.arc(this.centerX, this.centerY, pulseRadius * 0.85, 0, Math.PI * 2);
    this.ctx.fill();

    // Outer edge (defined boundary with glass effect)
    this.ctx.strokeStyle = `rgba(155, 127, 255, ${this.config.opacity * 0.4})`;
    this.ctx.lineWidth = 2;
    this.ctx.shadowBlur = 20;
    this.ctx.shadowColor = 'rgba(124, 92, 255, 0.4)';
    this.ctx.beginPath();
    this.ctx.arc(this.centerX, this.centerY, pulseRadius, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;
  }

  private renderParticleCloud(): void {
    const energy = this.smoothedEnergy;

    this.particles.forEach((p, i) => {
      // Update particle based on frequency match
      const frequencyMatch = this.getFrequencyEnergy(p.frequency);
      p.energy = p.energy * 0.92 + frequencyMatch * 0.08;

      // Organic orbital motion with slight chaos
      const angle = (i / this.particles.length) * Math.PI * 2 + this.time * this.config.motionSpeed * 0.15;
      const wobble = Math.sin(this.time * 0.8 + i) * 15;
      const baseRadius = 150;
      const energyOffset = p.energy * 80;

      const targetX = this.centerX + Math.cos(angle) * (baseRadius + energyOffset + wobble);
      const targetY = this.centerY + Math.sin(angle) * (baseRadius + energyOffset + wobble);

      // Fluid smooth movement
      p.x += (targetX - p.x) * 0.04;
      p.y += (targetY - p.y) * 0.04;

      // Draw particle with glass/liquid material
      const opacity = (0.25 + p.energy * 0.6) * this.config.opacity;
      const size = p.radius * (1 + p.energy * 1.8);

      // Outer diffusion (soft atmospheric glow)
      const outerGlow = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 4);
      outerGlow.addColorStop(0, `hsla(${p.hue}, 70%, 65%, ${opacity * 0.15})`);
      outerGlow.addColorStop(0.4, `hsla(${p.hue}, 75%, 70%, ${opacity * 0.08})`);
      outerGlow.addColorStop(1, `hsla(${p.hue}, 80%, 75%, 0)`);

      this.ctx.fillStyle = outerGlow;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, size * 4, 0, Math.PI * 2);
      this.ctx.fill();

      // Mid glow (glass body)
      const midGlow = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 2);
      midGlow.addColorStop(0, `hsla(${p.hue}, 80%, 75%, ${opacity * 0.3})`);
      midGlow.addColorStop(0.6, `hsla(${p.hue}, 85%, 80%, ${opacity * 0.15})`);
      midGlow.addColorStop(1, `hsla(${p.hue}, 85%, 85%, 0)`);

      this.ctx.fillStyle = midGlow;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, size * 2, 0, Math.PI * 2);
      this.ctx.fill();

      // Core with depth (liquid center with highlight)
      const coreGradient = this.ctx.createRadialGradient(
        p.x - size * 0.3, p.y - size * 0.3, 0,
        p.x, p.y, size
      );
      coreGradient.addColorStop(0, `hsla(${p.hue}, 90%, 90%, ${opacity * 0.8})`);
      coreGradient.addColorStop(0.5, `hsla(${p.hue}, 85%, 80%, ${opacity * 0.6})`);
      coreGradient.addColorStop(1, `hsla(${p.hue}, 75%, 70%, ${opacity * 0.3})`);

      this.ctx.fillStyle = coreGradient;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
      this.ctx.fill();

      // Subtle highlight (glass reflection)
      const highlight = this.ctx.createRadialGradient(
        p.x - size * 0.4, p.y - size * 0.4, 0,
        p.x - size * 0.3, p.y - size * 0.3, size * 0.4
      );
      highlight.addColorStop(0, `rgba(255, 255, 255, ${opacity * 0.4})`);
      highlight.addColorStop(1, `rgba(255, 255, 255, 0)`);

      this.ctx.fillStyle = highlight;
      this.ctx.beginPath();
      this.ctx.arc(p.x - size * 0.3, p.y - size * 0.3, size * 0.4, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }

  private renderTensionArcs(): void {
    if (this.particles.length < 2) return;

    const energy = this.smoothedEnergy;

    // Draw connections between energetic particles
    for (let i = 0; i < this.particles.length; i++) {
      const p1 = this.particles[i];

      if (p1.energy < 0.3) continue;

      for (let j = i + 1; j < this.particles.length; j++) {
        const p2 = this.particles[j];

        if (p2.energy < 0.3) continue;

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 200) {
          const opacity = (1 - dist / 200) * p1.energy * p2.energy * this.config.opacity * 0.5;

          // Bezier curve for organic feel
          const cpx = (p1.x + p2.x) / 2 + (Math.random() - 0.5) * 50;
          const cpy = (p1.y + p2.y) / 2 + (Math.random() - 0.5) * 50;

          this.ctx.strokeStyle = `${this.config.accentColor}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`;
          this.ctx.lineWidth = 1 + p1.energy * 2;

          this.ctx.beginPath();
          this.ctx.moveTo(p1.x, p1.y);
          this.ctx.quadraticCurveTo(cpx, cpy, p2.x, p2.y);
          this.ctx.stroke();
        }
      }
    }
  }

  private renderResonanceBloom(): void {
    const baseRadius = 100;
    const energyRadius = baseRadius + this.smoothedEnergy * 180;
    const brightness = this.smoothedBrightness;
    const breathe = Math.sin(this.time * 0.6) * 0.15 + 0.85;

    // Organic multi-layer bloom with depth
    for (let layer = 0; layer < 6; layer++) {
      const layerRadius = energyRadius * (0.4 + layer * 0.13);
      const layerOpacity = (1 - layer / 6) * this.config.bloomIntensity * this.config.opacity * breathe;
      const rotation = this.time * 0.08 + layer * 0.6;

      // Organic petal formations
      const petals = 6;
      for (let petal = 0; petal < petals; petal++) {
        const angle = (petal / petals) * Math.PI * 2 + rotation;
        const petalDistance = layerRadius * (0.25 + layer * 0.05);
        const petalX = this.centerX + Math.cos(angle) * petalDistance;
        const petalY = this.centerY + Math.sin(angle) * petalDistance;

        // Soft flowing gradient
        const gradient = this.ctx.createRadialGradient(
          petalX,
          petalY,
          0,
          petalX,
          petalY,
          layerRadius * 0.9
        );

        const hue = 260 + brightness * 35 + layer * 5;
        const saturation = 75 - layer * 5;
        const lightness = 65 + layer * 3;

        gradient.addColorStop(0, `hsla(${hue}, ${saturation}%, ${lightness}%, ${layerOpacity * 0.4})`);
        gradient.addColorStop(0.3, `hsla(${hue}, ${saturation - 5}%, ${lightness - 5}%, ${layerOpacity * 0.25})`);
        gradient.addColorStop(0.7, `hsla(${hue + 5}, ${saturation - 10}%, ${lightness - 10}%, ${layerOpacity * 0.1})`);
        gradient.addColorStop(1, `hsla(${hue + 10}, ${saturation - 15}%, ${lightness - 15}%, 0)`);

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(petalX, petalY, layerRadius * 0.9, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }

    // Central soft glow
    const centralGlow = this.ctx.createRadialGradient(
      this.centerX, this.centerY, 0,
      this.centerX, this.centerY, energyRadius * 0.5
    );
    const centralHue = 265 + brightness * 30;
    centralGlow.addColorStop(0, `hsla(${centralHue}, 85%, 75%, ${this.config.bloomIntensity * 0.3})`);
    centralGlow.addColorStop(0.5, `hsla(${centralHue}, 80%, 70%, ${this.config.bloomIntensity * 0.15})`);
    centralGlow.addColorStop(1, `hsla(${centralHue + 5}, 75%, 65%, 0)`);

    this.ctx.fillStyle = centralGlow;
    this.ctx.beginPath();
    this.ctx.arc(this.centerX, this.centerY, energyRadius * 0.5, 0, Math.PI * 2);
    this.ctx.fill();
  }

  // === ANALYSIS ===

  private smoothAnalysisData(): void {
    const smoothing = 1 - (this.config.responseTime / 1000);

    this.smoothedEnergy = this.smoothedEnergy * smoothing + this.analysisData.energy * (1 - smoothing);
    this.smoothedBrightness = this.smoothedBrightness * smoothing + this.analysisData.brightness * (1 - smoothing);
  }

  private getFrequencyEnergy(frequency: number): number {
    if (this.analysisData.frequencyBands.length === 0) return 0;

    // Map frequency to bin index (assuming 0-22050Hz range for 44.1kHz sample rate)
    const nyquist = 22050;
    const binIndex = Math.floor((frequency / nyquist) * this.analysisData.frequencyBands.length);

    if (binIndex < 0 || binIndex >= this.analysisData.frequencyBands.length) return 0;

    return this.analysisData.frequencyBands[binIndex];
  }

  // === PUBLIC API ===

  updateAnalysisData(data: Partial<AnalysisData>): void {
    this.analysisData = { ...this.analysisData, ...data };
  }

  setConfig(config: Partial<VisualConfig>): void {
    this.config = { ...this.config, ...config };

    if (config.particleCount && config.particleCount !== this.particles.length) {
      this.initParticles();
    }
  }

  getConfig(): VisualConfig {
    return { ...this.config };
  }

  getState(): VisualState {
    return {
      config: this.getConfig(),
      analysisData: { ...this.analysisData },
      particlePositions: this.particles.map(p => ({
        x: p.x,
        y: p.y,
        velocity: { x: p.vx, y: p.vy },
      })),
      fieldRadius: 100 + this.smoothedEnergy * 200,
      time: this.time,
    };
  }

  dispose(): void {
    this.stop();
    window.removeEventListener('resize', this.resize.bind(this));
  }
}
