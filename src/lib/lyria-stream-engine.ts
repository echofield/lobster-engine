/**
 * LYRIA STREAM ENGINE
 *
 * WebSocket-based real-time audio streaming from Lyria
 * This layer provides emergence, atmosphere, and adaptive accompaniment
 *
 * Lyria is NOT a "press button get track" feature.
 * It's a responsive musical field, an intelligence layer, an ambient co-performer.
 */

import type {
  LyriaMood,
  LyriaSteeringParams,
  LyriaConnectionState,
  LyriaStreamConfig,
  LyriaStreamState,
  MusicalContext,
} from '@/types/signal';

export class LyriaStreamEngine {
  private ctx: AudioContext | null = null;
  private ws: WebSocket | null = null;

  // Audio nodes
  private gainNode: GainNode | null = null;
  private crossfadeGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;

  // PCM playback
  private audioQueue: Float32Array[] = [];
  private playbackNode: AudioBufferSourceNode | null = null;
  private isPlaying = false;
  private nextStartTime = 0;

  // Configuration
  private config: LyriaStreamConfig = {
    serverUrl: 'ws://localhost:3112/lyria-stream', // Default, will be configurable
    sampleRate: 48000,
    bufferSize: 4096,
    reconnectAttempts: 5,
    reconnectDelay: 2000,
    crossfadeDuration: 2.0,
    outputGain: 0.6,
  };

  // State
  private connectionState: LyriaConnectionState = 'disconnected';
  private steeringParams: LyriaSteeringParams = {
    mood: 'ambient',
    density: 0.3,
    harmonicField: [60, 67, 72], // C, G, C
    userActivity: 0,
    gestureEnergy: 0,
    sessionDuration: 0,
    evolutionRate: 0.5,
  };

  private reconnectCount = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private sessionStartTime = 0;
  private lastPacketTime = 0;

  // Callbacks
  public onConnectionStateChange?: (state: LyriaConnectionState) => void;
  public onError?: (error: string) => void;
  public onBufferHealth?: (health: number) => void;

  // === INITIALIZATION ===

  async init(audioContext: AudioContext, config?: Partial<LyriaStreamConfig>): Promise<void> {
    this.ctx = audioContext;

    if (config) {
      this.config = { ...this.config, ...config };
    }

    // Create audio nodes
    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.value = this.config.outputGain;

    this.crossfadeGain = this.ctx.createGain();
    this.crossfadeGain.gain.value = 0; // Start silent

    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 2048;

    // Connect chain
    this.gainNode.connect(this.crossfadeGain);
    this.crossfadeGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    this.sessionStartTime = Date.now();
  }

  // === CONNECTION MANAGEMENT ===

  async connect(): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('[LyriaStream] Already connected');
      return;
    }

    this.setConnectionState('connecting');

    try {
      this.ws = new WebSocket(this.config.serverUrl);
      this.ws.binaryType = 'arraybuffer';

      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onerror = this.handleError.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.handleError(new Event('error'));
      this.onError?.(`Connection failed: ${errorMsg}`);
    }
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.setConnectionState('disconnected');
    this.stopPlayback();
    this.audioQueue = [];
  }

  private handleOpen(): void {
    console.log('[LyriaStream] Connected');
    this.setConnectionState('connected');
    this.reconnectCount = 0;

    // Send initial steering parameters
    this.sendSteeringParams();

    // Start streaming request
    this.sendMessage({
      type: 'start_stream',
      sampleRate: this.config.sampleRate,
      bufferSize: this.config.bufferSize,
    });
  }

  private handleMessage(event: MessageEvent): void {
    if (event.data instanceof ArrayBuffer) {
      // Binary PCM audio data
      this.handleAudioData(event.data);
    } else {
      // JSON control message
      try {
        const message = JSON.parse(event.data);
        this.handleControlMessage(message);
      } catch (e) {
        console.error('[LyriaStream] Invalid message:', e);
      }
    }

    this.lastPacketTime = Date.now();
  }

  private handleAudioData(arrayBuffer: ArrayBuffer): void {
    if (!this.ctx) return;

    // Convert ArrayBuffer to Float32Array (assuming PCM f32)
    const pcmData = new Float32Array(arrayBuffer);

    // Add to playback queue
    this.audioQueue.push(pcmData);

    // Update buffer health
    const health = Math.min(1, this.audioQueue.length / 10);
    this.onBufferHealth?.(health);

    // Start playback if not already playing
    if (!this.isPlaying && this.audioQueue.length > 2) {
      this.startPlayback();
    }

    // Update connection state
    if (this.connectionState !== 'streaming') {
      this.setConnectionState('streaming');
      this.fadeIn();
    }
  }

  private handleControlMessage(message: any): void {
    switch (message.type) {
      case 'stream_started':
        console.log('[LyriaStream] Stream started');
        break;

      case 'stream_stopped':
        console.log('[LyriaStream] Stream stopped');
        this.stopPlayback();
        break;

      case 'error':
        console.error('[LyriaStream] Server error:', message.error);
        this.onError?.(message.error);
        break;

      default:
        console.log('[LyriaStream] Unknown message:', message);
    }
  }

  private handleError(event: Event): void {
    console.error('[LyriaStream] WebSocket error:', event);
    this.setConnectionState('error');
    this.onError?.('Connection error');
  }

  private handleClose(): void {
    console.log('[LyriaStream] Connection closed');
    this.setConnectionState('disconnected');
    this.stopPlayback();

    // Attempt reconnect
    if (this.reconnectCount < this.config.reconnectAttempts) {
      this.reconnectCount++;
      const delay = this.config.reconnectDelay * Math.pow(2, this.reconnectCount - 1);
      console.log(`[LyriaStream] Reconnecting in ${delay}ms (attempt ${this.reconnectCount})`);

      this.reconnectTimer = setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      this.onError?.('Max reconnection attempts reached');
    }
  }

  // === PLAYBACK ===

  private startPlayback(): void {
    if (!this.ctx || this.isPlaying) return;

    this.isPlaying = true;
    this.nextStartTime = this.ctx.currentTime;
    this.scheduleNextBuffer();
  }

  private scheduleNextBuffer(): void {
    if (!this.ctx || !this.isPlaying || this.audioQueue.length === 0) return;

    const pcmData = this.audioQueue.shift()!;

    // Create AudioBuffer
    const buffer = this.ctx.createBuffer(
      2, // Stereo
      pcmData.length / 2,
      this.config.sampleRate
    );

    // Deinterleave stereo data
    const leftChannel = buffer.getChannelData(0);
    const rightChannel = buffer.getChannelData(1);

    for (let i = 0; i < buffer.length; i++) {
      leftChannel[i] = pcmData[i * 2];
      rightChannel[i] = pcmData[i * 2 + 1];
    }

    // Create source node
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.gainNode!);

    // Schedule playback
    source.start(this.nextStartTime);
    this.nextStartTime += buffer.duration;

    // Schedule next buffer
    source.onended = () => {
      this.scheduleNextBuffer();
    };
  }

  private stopPlayback(): void {
    this.isPlaying = false;
    this.audioQueue = [];
    this.fadeOut();
  }

  // === STEERING ===

  updateSteeringParams(params: Partial<LyriaSteeringParams>): void {
    this.steeringParams = { ...this.steeringParams, ...params };

    // Update session duration
    this.steeringParams.sessionDuration = (Date.now() - this.sessionStartTime) / 1000;

    this.sendSteeringParams();
  }

  updateFromMusicalContext(context: MusicalContext, activity: number): void {
    this.updateSteeringParams({
      harmonicField: context.harmonicField,
      userActivity: activity,
    });
  }

  setMood(mood: LyriaMood): void {
    this.updateSteeringParams({ mood });
  }

  // Set ritual mode (for backend compatibility)
  setRitualMode(mode: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    this.sendMessage({
      type: 'set_mode',
      mode: mode.toUpperCase(),
    });
  }

  setDensity(density: number): void {
    this.updateSteeringParams({ density: Math.max(0, Math.min(1, density)) });
  }

  setGestureEnergy(energy: number): void {
    this.updateSteeringParams({ gestureEnergy: Math.max(0, Math.min(1, energy)) });
  }

  private sendSteeringParams(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    this.sendMessage({
      type: 'steering_update',
      params: this.steeringParams,
    });
  }

  private sendMessage(message: any): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    try {
      this.ws.send(JSON.stringify(message));
    } catch (e) {
      console.error('[LyriaStream] Failed to send message:', e);
    }
  }

  // === CROSSFADE ===

  private fadeIn(): void {
    if (!this.ctx || !this.crossfadeGain) return;

    const now = this.ctx.currentTime;
    this.crossfadeGain.gain.cancelScheduledValues(now);
    this.crossfadeGain.gain.setValueAtTime(this.crossfadeGain.gain.value, now);
    this.crossfadeGain.gain.linearRampToValueAtTime(1, now + this.config.crossfadeDuration);
  }

  private fadeOut(): void {
    if (!this.ctx || !this.crossfadeGain) return;

    const now = this.ctx.currentTime;
    this.crossfadeGain.gain.cancelScheduledValues(now);
    this.crossfadeGain.gain.setValueAtTime(this.crossfadeGain.gain.value, now);
    this.crossfadeGain.gain.linearRampToValueAtTime(0, now + this.config.crossfadeDuration);
  }

  // === CONFIGURATION ===

  setConfig(config: Partial<LyriaStreamConfig>): void {
    this.config = { ...this.config, ...config };

    if (this.gainNode) {
      this.gainNode.gain.value = this.config.outputGain;
    }
  }

  getConfig(): LyriaStreamConfig {
    return { ...this.config };
  }

  // === STATE ===

  getState(): LyriaStreamState {
    return {
      connectionState: this.connectionState,
      steeringParams: { ...this.steeringParams },
      config: this.getConfig(),
      isStreaming: this.connectionState === 'streaming',
      bufferHealth: Math.min(1, this.audioQueue.length / 10),
      lastPacketTime: this.lastPacketTime,
    };
  }

  private setConnectionState(state: LyriaConnectionState): void {
    if (this.connectionState === state) return;

    this.connectionState = state;
    this.onConnectionStateChange?.(state);
  }

  isConnected(): boolean {
    return this.connectionState === 'connected' || this.connectionState === 'streaming';
  }

  isStreaming(): boolean {
    return this.connectionState === 'streaming';
  }

  // === ANALYSIS ===

  getFrequencyData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(0);

    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    return data;
  }

  getWaveformData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(0);

    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteTimeDomainData(data);
    return data;
  }

  // === CLEANUP ===

  dispose(): void {
    this.disconnect();

    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }

    if (this.crossfadeGain) {
      this.crossfadeGain.disconnect();
      this.crossfadeGain = null;
    }

    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }

    this.ctx = null;
  }
}
