/**
 * AUDIO RECORDER
 *
 * Records WebAudio output to WAV file
 * Supports BPM-based recording (record X bars)
 * MIDI clock sync ready
 */

export interface RecorderOptions {
  sampleRate?: number;
  channels?: number;
  bpm?: number;
  beatsPerBar?: number;
}

export interface RecordingState {
  isRecording: boolean;
  duration: number;
  bars: number;
  beats: number;
}

export class AudioRecorder {
  private ctx: AudioContext;
  private destination: MediaStreamAudioDestinationNode;
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private startTime: number = 0;
  private animationFrame: number | null = null;

  // BPM/Tempo
  private bpm: number = 120;
  private beatsPerBar: number = 4;

  // State callback
  public onStateChange?: (state: RecordingState) => void;
  public onRecordingComplete?: (blob: Blob, duration: number) => void;

  constructor(ctx: AudioContext, options: RecorderOptions = {}) {
    this.ctx = ctx;
    this.bpm = options.bpm || 120;
    this.beatsPerBar = options.beatsPerBar || 4;

    // Create destination node for recording
    this.destination = ctx.createMediaStreamDestination();
  }

  // Connect audio source to recorder
  getInputNode(): MediaStreamAudioDestinationNode {
    return this.destination;
  }

  // Connect any audio node to be recorded
  connectSource(source: AudioNode): void {
    source.connect(this.destination);
  }

  setBPM(bpm: number): void {
    this.bpm = Math.max(20, Math.min(300, bpm));
  }

  getBPM(): number {
    return this.bpm;
  }

  setBeatsPerBar(beats: number): void {
    this.beatsPerBar = beats;
  }

  // Calculate duration from bars
  barsToDuration(bars: number): number {
    const beatsTotal = bars * this.beatsPerBar;
    const secondsPerBeat = 60 / this.bpm;
    return beatsTotal * secondsPerBeat;
  }

  // Calculate bars from duration
  durationToBars(duration: number): { bars: number; beats: number } {
    const secondsPerBeat = 60 / this.bpm;
    const totalBeats = duration / secondsPerBeat;
    const bars = Math.floor(totalBeats / this.beatsPerBar);
    const beats = totalBeats % this.beatsPerBar;
    return { bars, beats };
  }

  // Start recording
  start(): void {
    if (this.mediaRecorder?.state === 'recording') return;

    this.chunks = [];
    this.startTime = this.ctx.currentTime;

    // Create media recorder
    this.mediaRecorder = new MediaRecorder(this.destination.stream, {
      mimeType: 'audio/webm;codecs=opus'
    });

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        this.chunks.push(e.data);
      }
    };

    this.mediaRecorder.onstop = () => {
      const blob = new Blob(this.chunks, { type: 'audio/webm' });
      const duration = this.ctx.currentTime - this.startTime;
      this.onRecordingComplete?.(blob, duration);
    };

    this.mediaRecorder.start(100); // Collect data every 100ms

    // Start state update loop
    this.updateState();
  }

  // Record for specific number of bars
  startForBars(bars: number): void {
    this.start();
    const duration = this.barsToDuration(bars);
    setTimeout(() => this.stop(), duration * 1000);
  }

  // Stop recording
  stop(): void {
    if (this.mediaRecorder?.state === 'recording') {
      this.mediaRecorder.stop();
    }
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  private updateState(): void {
    if (this.mediaRecorder?.state !== 'recording') return;

    const duration = this.ctx.currentTime - this.startTime;
    const { bars, beats } = this.durationToBars(duration);

    this.onStateChange?.({
      isRecording: true,
      duration,
      bars,
      beats
    });

    this.animationFrame = requestAnimationFrame(() => this.updateState());
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording' || false;
  }

  // Convert WebM to WAV for better DAW compatibility
  static async webmToWav(webmBlob: Blob, ctx: AudioContext): Promise<Blob> {
    const arrayBuffer = await webmBlob.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    return AudioRecorder.audioBufferToWav(audioBuffer);
  }

  static audioBufferToWav(buffer: AudioBuffer): Blob {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;

    const dataLength = buffer.length * blockAlign;
    const bufferLength = 44 + dataLength;

    const arrayBuffer = new ArrayBuffer(bufferLength);
    const view = new DataView(arrayBuffer);

    // WAV header
    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, bufferLength - 8, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // fmt chunk size
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, dataLength, true);

    // Interleave channels and write samples
    const channels: Float32Array[] = [];
    for (let i = 0; i < numChannels; i++) {
      channels.push(buffer.getChannelData(i));
    }

    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        const sample = Math.max(-1, Math.min(1, channels[ch][i]));
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(offset, intSample, true);
        offset += 2;
      }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  // Download helper
  static downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

/**
 * MIDI CLOCK
 *
 * Provides tempo sync with MIDI clock messages
 * Can send or receive MIDI clock
 */

export class MidiClock {
  private bpm: number = 120;
  private isRunning: boolean = false;
  private lastTickTime: number = 0;
  private tickCount: number = 0;
  private intervalId: number | null = null;

  // MIDI clock = 24 PPQ (pulses per quarter note)
  private static PPQ = 24;

  public onTick?: (tick: number, beat: number, bar: number) => void;
  public onBeatChange?: (beat: number) => void;
  public onBarChange?: (bar: number) => void;

  private beatsPerBar: number = 4;

  setBPM(bpm: number): void {
    this.bpm = Math.max(20, Math.min(300, bpm));
    if (this.isRunning) {
      this.stop();
      this.start();
    }
  }

  getBPM(): number {
    return this.bpm;
  }

  setBeatsPerBar(beats: number): void {
    this.beatsPerBar = beats;
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.tickCount = 0;

    // Calculate interval in ms (24 ticks per beat)
    const tickInterval = (60 / this.bpm / MidiClock.PPQ) * 1000;

    this.intervalId = window.setInterval(() => {
      this.tick();
    }, tickInterval);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    this.tickCount = 0;
  }

  private tick(): void {
    const ticksPerBeat = MidiClock.PPQ;
    const ticksPerBar = ticksPerBeat * this.beatsPerBar;

    const beat = Math.floor(this.tickCount / ticksPerBeat) % this.beatsPerBar;
    const bar = Math.floor(this.tickCount / ticksPerBar);

    // Callbacks
    this.onTick?.(this.tickCount, beat, bar);

    // Beat change
    if (this.tickCount % ticksPerBeat === 0) {
      this.onBeatChange?.(beat);
    }

    // Bar change
    if (this.tickCount % ticksPerBar === 0) {
      this.onBarChange?.(bar);
    }

    this.tickCount++;
  }

  // Receive MIDI clock from external source
  receiveMidiClock(data: Uint8Array): void {
    if (data[0] === 0xF8) {
      // MIDI Clock tick
      this.tick();
    } else if (data[0] === 0xFA) {
      // Start
      this.tickCount = 0;
      this.isRunning = true;
    } else if (data[0] === 0xFB) {
      // Continue
      this.isRunning = true;
    } else if (data[0] === 0xFC) {
      // Stop
      this.isRunning = false;
    }
  }

  // Send MIDI clock out (if we have MIDI output)
  static sendClockTick(output: MIDIOutput): void {
    output.send([0xF8]);
  }

  static sendStart(output: MIDIOutput): void {
    output.send([0xFA]);
  }

  static sendStop(output: MIDIOutput): void {
    output.send([0xFC]);
  }

  getPosition(): { tick: number; beat: number; bar: number } {
    const ticksPerBeat = MidiClock.PPQ;
    const ticksPerBar = ticksPerBeat * this.beatsPerBar;
    return {
      tick: this.tickCount,
      beat: Math.floor(this.tickCount / ticksPerBeat) % this.beatsPerBar,
      bar: Math.floor(this.tickCount / ticksPerBar)
    };
  }
}
