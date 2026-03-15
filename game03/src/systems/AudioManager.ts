import Phaser from 'phaser';
import { SaveSystem } from './SaveSystem';

export class AudioManager {
  private static soundManager: Phaser.Sound.BaseSoundManager | null = null;
  private static muted = false;
  private static audioContext: AudioContext | null = null;

  static init(scene: Phaser.Scene): void {
    AudioManager.soundManager = scene.sound;
    const data = SaveSystem.load();
    AudioManager.muted = !data.soundEnabled;
    if (AudioManager.soundManager) {
      AudioManager.soundManager.mute = AudioManager.muted;
    }
    const sm = AudioManager.soundManager as unknown as { context?: AudioContext };
    if (sm?.context) {
      AudioManager.audioContext = sm.context;
    }
  }

  static resume(): void {
    if (AudioManager.audioContext && AudioManager.audioContext.state === 'suspended') {
      AudioManager.audioContext.resume();
    }
  }

  static toggleMute(): void {
    AudioManager.muted = !AudioManager.muted;
    if (AudioManager.soundManager) {
      AudioManager.soundManager.mute = AudioManager.muted;
    }
  }

  static isMuted(): boolean {
    return AudioManager.muted;
  }

  static play(key: string, volume = 1): void {
    if (!AudioManager.soundManager || AudioManager.muted) return;
    try {
      AudioManager.soundManager.play(key, { volume });
    } catch {}
  }

  private static synthBeep(freq: number, duration: number, vol: number, type: OscillatorType = 'square'): void {
    if (AudioManager.muted || !AudioManager.audioContext) return;
    try {
      const ctx = AudioManager.audioContext;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {}
  }

  private static synthNoise(duration: number, vol: number): void {
    if (AudioManager.muted || !AudioManager.audioContext) return;
    try {
      const ctx = AudioManager.audioContext;
      const bufferSize = Math.floor(ctx.sampleRate * duration);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * vol;
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      source.connect(gain);
      gain.connect(ctx.destination);
      source.start();
    } catch {}
  }

  static playStart(): void {
    AudioManager.synthBeep(880, 0.1, 0.15, 'square');
    setTimeout(() => AudioManager.synthBeep(1320, 0.15, 0.12, 'square'), 80);
  }

  static playSlide(): void {
    AudioManager.synthBeep(440, 0.05, 0.04, 'sine');
  }

  static playPassThrough(): void {
    AudioManager.synthBeep(660, 0.08, 0.08, 'triangle');
  }

  static playNearMiss(): void {
    AudioManager.synthBeep(1200, 0.06, 0.12, 'square');
    setTimeout(() => AudioManager.synthBeep(1600, 0.1, 0.1, 'square'), 50);
  }

  static playPauseResume(): void {
    AudioManager.synthBeep(520, 0.08, 0.1, 'triangle');
  }

  static playDeathExplosion(): void {
    AudioManager.synthNoise(0.3, 0.25);
    AudioManager.synthBeep(120, 0.4, 0.2, 'sawtooth');
  }

  static playNewBest(): void {
    AudioManager.synthBeep(660, 0.12, 0.12, 'square');
    setTimeout(() => AudioManager.synthBeep(880, 0.12, 0.12, 'square'), 100);
    setTimeout(() => AudioManager.synthBeep(1100, 0.18, 0.15, 'square'), 200);
  }

  static vibrate(pattern: number | number[]): void {
    try {
      if (navigator.vibrate && SaveSystem.load().vibrateEnabled) {
        navigator.vibrate(pattern);
      }
    } catch {}
  }
}
