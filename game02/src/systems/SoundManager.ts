export class SoundManager {
  private static ctx: AudioContext | null = null;
  private static masterGain: GainNode | null = null;
  private static muted: boolean = false;

  static init(): void {
    if (this.ctx) return;
    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.3;
    this.masterGain.connect(this.ctx.destination);
  }

  static resume(): void {
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }
  }

  static toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.masterGain) {
      this.masterGain.gain.value = this.muted ? 0 : 0.3;
    }
    return this.muted;
  }

  static isMuted(): boolean {
    return this.muted;
  }

  /** Short high-frequency burst — projectile firing */
  static playShoot(): void {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.exponentialRampToValueAtTime(440, t + 0.06);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.08);
  }

  /** Quick noise burst — bullet hitting enemy */
  static playHit(): void {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.05;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    source.connect(gain);
    gain.connect(this.masterGain);
    source.start(t);
  }

  /** Rising tone — XP orb collected */
  static playPickup(): void {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.1);

    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.12);
  }

  /** Two-tone chord — level up */
  static playLevelUp(): void {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.08);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.12, t + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(t + i * 0.08);
      osc.stop(t + 0.45);
    });
  }

  /** Descending noise — player takes damage */
  static playPlayerHit(): void {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.15);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.18);
  }

  /** Enemy death — short pop */
  static playEnemyDeath(): void {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.12);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.12);
  }

  /** Boss appearing — low rumble */
  static playBossSpawn(): void {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(60, t);
    osc1.frequency.exponentialRampToValueAtTime(40, t + 0.5);

    osc2.type = 'square';
    osc2.frequency.setValueAtTime(55, t);
    osc2.frequency.exponentialRampToValueAtTime(35, t + 0.5);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.linearRampToValueAtTime(0.25, t + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);
    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.6);
    osc2.stop(t + 0.6);
  }

  /** Game over — descending tragic tone */
  static playGameOver(): void {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    [392, 349.23, 293.66].forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + i * 0.2);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.15, t + i * 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(t + i * 0.2);
      osc.stop(t + 0.9);
    });
  }

  /** Button click — soft tick */
  static playClick(): void {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1000, t);
    osc.frequency.exponentialRampToValueAtTime(600, t + 0.04);

    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.05);
  }

  /** New wave start — ascending fanfare */
  static playWaveStart(): void {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;

    [440, 554.37].forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t + i * 0.1);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.08, t + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(t + i * 0.1);
      osc.stop(t + 0.35);
    });
  }
}
