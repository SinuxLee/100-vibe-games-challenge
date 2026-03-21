import Phaser from 'phaser';
import { SaveSystem } from './SaveSystem';

export class AudioManager {
  private static soundManager: Phaser.Sound.BaseSoundManager | null = null;
  private static muted = false;
  private static audioContext: AudioContext | null = null;
  private static bgmNodes: { oscillators: OscillatorNode[]; gains: GainNode[]; masterGain: GainNode } | null = null;
  private static bgmIntensity = 0;
  private static bgmPlaying = false;

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
    if (AudioManager.bgmNodes) {
      AudioManager.bgmNodes.masterGain.gain.setValueAtTime(
        AudioManager.muted ? 0 : 0.12,
        AudioManager.audioContext?.currentTime ?? 0,
      );
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

  // --- BGM: procedural bass + arp synth ---
  static startBGM(): void {
    if (AudioManager.bgmPlaying || !AudioManager.audioContext) return;
    AudioManager.bgmPlaying = true;
    try {
      const ctx = AudioManager.audioContext;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(AudioManager.muted ? 0 : 0.12, ctx.currentTime);
      masterGain.connect(ctx.destination);

      // Bass drone — low sine
      const bass = ctx.createOscillator();
      const bassGain = ctx.createGain();
      bass.type = 'sine';
      bass.frequency.setValueAtTime(55, ctx.currentTime); // A1
      bassGain.gain.setValueAtTime(0.5, ctx.currentTime);
      bass.connect(bassGain);
      bassGain.connect(masterGain);
      bass.start();

      // Sub bass — slightly detuned for width
      const sub = ctx.createOscillator();
      const subGain = ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(55.5, ctx.currentTime);
      subGain.gain.setValueAtTime(0.3, ctx.currentTime);
      sub.connect(subGain);
      subGain.connect(masterGain);
      sub.start();

      // Mid pulse — square wave LFO'd
      const mid = ctx.createOscillator();
      const midGain = ctx.createGain();
      mid.type = 'square';
      mid.frequency.setValueAtTime(110, ctx.currentTime); // A2
      midGain.gain.setValueAtTime(0.08, ctx.currentTime);
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(2, ctx.currentTime); // 2Hz pulse
      lfoGain.gain.setValueAtTime(0.06, ctx.currentTime);
      lfo.connect(lfoGain);
      lfoGain.connect(midGain.gain);
      mid.connect(midGain);
      midGain.connect(masterGain);
      mid.start();
      lfo.start();

      // High shimmer — triangle
      const shimmer = ctx.createOscillator();
      const shimGain = ctx.createGain();
      shimmer.type = 'triangle';
      shimmer.frequency.setValueAtTime(440, ctx.currentTime);
      shimGain.gain.setValueAtTime(0.02, ctx.currentTime);
      shimmer.connect(shimGain);
      shimGain.connect(masterGain);
      shimmer.start();

      AudioManager.bgmNodes = {
        oscillators: [bass, sub, mid, lfo, shimmer],
        gains: [bassGain, subGain, midGain, shimGain],
        masterGain,
      };
    } catch {
      AudioManager.bgmPlaying = false;
    }
  }

  static updateBGMIntensity(normalizedIntensity: number): void {
    if (!AudioManager.bgmNodes || !AudioManager.audioContext) return;
    const t = Math.min(1, Math.max(0, normalizedIntensity));
    AudioManager.bgmIntensity = t;

    try {
      const ctx = AudioManager.audioContext;
      const now = ctx.currentTime;
      const gains = AudioManager.bgmNodes.gains;
      const oscs = AudioManager.bgmNodes.oscillators;

      // Bass gets slightly louder and shifts up
      gains[0].gain.setTargetAtTime(0.5 + t * 0.15, now, 0.5);
      oscs[0].frequency.setTargetAtTime(55 + t * 15, now, 0.5);

      // Mid pulse gets louder and faster LFO
      gains[2].gain.setTargetAtTime(0.08 + t * 0.10, now, 0.5);
      oscs[3].frequency.setTargetAtTime(2 + t * 4, now, 0.5); // LFO 2→6 Hz

      // Shimmer gets louder and higher
      gains[3].gain.setTargetAtTime(0.02 + t * 0.04, now, 0.5);
      oscs[4].frequency.setTargetAtTime(440 + t * 220, now, 0.5);

      // Master volume rises slightly
      AudioManager.bgmNodes.masterGain.gain.setTargetAtTime(
        AudioManager.muted ? 0 : 0.12 + t * 0.06,
        now,
        0.5,
      );
    } catch {}
  }

  static stopBGM(): void {
    if (!AudioManager.bgmNodes) return;
    try {
      for (const osc of AudioManager.bgmNodes.oscillators) {
        try { osc.stop(); } catch {}
      }
    } catch {}
    AudioManager.bgmNodes = null;
    AudioManager.bgmPlaying = false;
    AudioManager.bgmIntensity = 0;
  }

  // --- BGM glitch on death ---
  static glitchBGM(): void {
    if (!AudioManager.bgmNodes || !AudioManager.audioContext) return;
    try {
      const ctx = AudioManager.audioContext;
      const now = ctx.currentTime;
      // Rapidly detune all oscillators then kill
      for (const osc of AudioManager.bgmNodes.oscillators) {
        osc.frequency.setValueAtTime(osc.frequency.value * 0.5, now);
        osc.frequency.linearRampToValueAtTime(20, now + 0.3);
      }
      AudioManager.bgmNodes.masterGain.gain.setTargetAtTime(0, now, 0.1);
      setTimeout(() => AudioManager.stopBGM(), 400);
    } catch {
      AudioManager.stopBGM();
    }
  }

  // --- SFX (louder, punchier) ---
  static playStart(): void {
    AudioManager.synthBeep(880, 0.12, 0.25, 'square');
    setTimeout(() => AudioManager.synthBeep(1320, 0.18, 0.2, 'square'), 80);
  }

  static playSlide(): void {
    AudioManager.synthBeep(330 + Math.random() * 110, 0.04, 0.08, 'sine');
  }

  static playPassThrough(): void {
    AudioManager.synthBeep(660, 0.1, 0.18, 'triangle');
    setTimeout(() => AudioManager.synthBeep(990, 0.06, 0.10, 'triangle'), 40);
  }

  static playNearMiss(): void {
    AudioManager.synthBeep(1200, 0.08, 0.22, 'square');
    setTimeout(() => AudioManager.synthBeep(1600, 0.12, 0.18, 'square'), 50);
    setTimeout(() => AudioManager.synthBeep(2000, 0.08, 0.12, 'sine'), 100);
  }

  static playPauseResume(): void {
    AudioManager.synthBeep(520, 0.1, 0.15, 'triangle');
  }

  static playDeathExplosion(): void {
    AudioManager.synthNoise(0.4, 0.35);
    AudioManager.synthBeep(120, 0.5, 0.3, 'sawtooth');
    AudioManager.synthBeep(80, 0.6, 0.2, 'sine');
    AudioManager.glitchBGM();
  }

  static playNewBest(): void {
    AudioManager.synthBeep(660, 0.14, 0.2, 'square');
    setTimeout(() => AudioManager.synthBeep(880, 0.14, 0.2, 'square'), 100);
    setTimeout(() => AudioManager.synthBeep(1100, 0.2, 0.25, 'square'), 200);
    setTimeout(() => AudioManager.synthBeep(1320, 0.3, 0.2, 'triangle'), 350);
  }

  static playLevelComplete(): void {
    AudioManager.synthBeep(523, 0.12, 0.22, 'square');
    setTimeout(() => AudioManager.synthBeep(659, 0.12, 0.22, 'square'), 80);
    setTimeout(() => AudioManager.synthBeep(784, 0.12, 0.22, 'square'), 160);
    setTimeout(() => AudioManager.synthBeep(1047, 0.25, 0.28, 'triangle'), 260);
    setTimeout(() => AudioManager.synthNoise(0.08, 0.1), 260);
  }

  static playComboMilestone(): void {
    AudioManager.synthBeep(1400, 0.06, 0.18, 'square');
    setTimeout(() => AudioManager.synthBeep(1800, 0.08, 0.15, 'sine'), 50);
  }

  static vibrate(pattern: number | number[]): void {
    try {
      if (navigator.vibrate && SaveSystem.load().vibrateEnabled) {
        navigator.vibrate(pattern);
      }
    } catch {}
  }
}
