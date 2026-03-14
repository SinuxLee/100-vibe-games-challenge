import Phaser from 'phaser';

export class SoundManager {
  private static soundManager: Phaser.Sound.BaseSoundManager | null = null;
  private static muted: boolean = false;
  private static volume: number = 0.5;

  /** Must call with an active scene that has loaded audio keys */
  static init(scene: Phaser.Scene): void {
    this.soundManager = scene.sound;
    this.soundManager.volume = this.muted ? 0 : this.volume;
  }

  /** Resume AudioContext if browser suspended it (call on first user gesture) */
  static resume(): void {
    if (this.soundManager && 'context' in this.soundManager) {
      const webAudio = this.soundManager as Phaser.Sound.WebAudioSoundManager;
      if (webAudio.context?.state === 'suspended') {
        webAudio.context.resume();
      }
    }
  }

  static toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.soundManager) {
      this.soundManager.volume = this.muted ? 0 : this.volume;
    }
    return this.muted;
  }

  static isMuted(): boolean {
    return this.muted;
  }

  private static play(key: string, vol: number = 1): void {
    if (!this.soundManager) return;
    try {
      this.soundManager.play(key, { volume: vol });
    } catch {}
  }

  private static playRandom(keys: string[], vol: number = 1): void {
    const key = keys[Math.floor(Math.random() * keys.length)];
    this.play(key, vol);
  }

  static playShoot(): void {
    this.playRandom(['sfx_shoot', 'sfx_shoot2', 'sfx_shoot3'], 0.4);
  }

  static playHit(): void {
    this.playRandom(['sfx_hit', 'sfx_hit2', 'sfx_hit3'], 0.5);
  }

  static playPickup(): void {
    this.play('sfx_pickup', 0.5);
  }

  static playLevelUp(): void {
    this.play('sfx_levelup', 0.7);
  }

  static playPlayerHit(): void {
    this.playRandom(['sfx_player_hit', 'sfx_player_hit2'], 0.6);
  }

  static playEnemyDeath(): void {
    this.playRandom(['sfx_enemy_death', 'sfx_enemy_death2'], 0.5);
  }

  static playBossSpawn(): void {
    this.play('sfx_boss_spawn', 0.8);
  }

  static playBossDeath(): void {
    this.play('sfx_boss_death', 0.7);
  }

  static playGameOver(): void {
    this.play('sfx_game_over', 0.7);
  }

  static playClick(): void {
    this.play('sfx_click', 0.4);
  }

  static playWaveStart(): void {
    this.play('sfx_wave_start', 0.6);
  }
}
