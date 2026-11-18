export type SoundProfile = 'mx-blue' | 'mx-brown' | 'mx-red' | 'typewriter' | 'muted';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private profile: SoundProfile = 'mx-blue';
  private volume: number = 0.6;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setProfile(profile: SoundProfile) {
    this.profile = profile;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  public playKeyPress(profileOverride?: SoundProfile) {
    const activeProfile = profileOverride ?? this.profile;
    if (activeProfile === 'muted' || this.volume <= 0.01) return;

    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const pitchJitter = 0.96 + Math.random() * 0.08;

    if (activeProfile === 'mx-blue') {
      // Crisp high-pitched click + low mechanical bottom-out
      this.triggerTone(ctx, now, 2200 * pitchJitter, 650, 0.018, 'triangle', 0.32 * this.volume);
      this.triggerTone(ctx, now + 0.008, 190 * pitchJitter, 75, 0.032, 'sine', 0.42 * this.volume);
    } else if (activeProfile === 'mx-brown') {
      // Soft tactile bump + warm housing thock
      this.triggerTone(ctx, now, 780 * pitchJitter, 240, 0.024, 'sine', 0.35 * this.volume);
      this.triggerTone(ctx, now + 0.006, 155 * pitchJitter, 65, 0.035, 'triangle', 0.38 * this.volume);
    } else if (activeProfile === 'mx-red') {
      // Deep linear creamy thock
      this.triggerTone(ctx, now, 320 * pitchJitter, 110, 0.038, 'sine', 0.45 * this.volume);
    } else if (activeProfile === 'typewriter') {
      // Vintage metallic strike
      this.triggerTone(ctx, now, 1650 * pitchJitter, 310, 0.028, 'sawtooth', 0.25 * this.volume);
      this.triggerNoiseBurst(ctx, now, 0.025, 0.3 * this.volume);
    }
  }

  public playError() {
    if (this.profile === 'muted' || this.volume <= 0.01) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    this.triggerTone(ctx, now, 195, 130, 0.09, 'sawtooth', 0.26 * this.volume);
  }

  public playVictory(stars: number = 3) {
    if (this.profile === 'muted' || this.volume <= 0.01) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = stars >= 3 ? [523.25, 659.25, 783.99, 1046.5] : [440, 554.37, 659.25];
    notes.forEach((freq, idx) => {
      this.triggerTone(
        ctx,
        now + idx * 0.075,
        freq,
        freq * 1.005,
        0.22,
        'triangle',
        0.28 * this.volume
      );
    });
  }

  private triggerTone(
    ctx: AudioContext,
    startTime: number,
    startFreq: number,
    endFreq: number,
    duration: number,
    type: OscillatorType,
    gainPeak: number
  ) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, startTime);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), startTime + duration);

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(gainPeak, startTime + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.005);
  }

  private triggerNoiseBurst(
    ctx: AudioContext,
    startTime: number,
    duration: number,
    gainPeak: number
  ) {
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(gainPeak, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    noise.connect(gain);
    gain.connect(ctx.destination);
    noise.start(startTime);
  }
}

export const soundEngine = new SoundEngine();
