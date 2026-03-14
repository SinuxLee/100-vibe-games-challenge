import Phaser from 'phaser';
import { COLORS, BULLET_SIZE, XP_ORB_SIZE } from '../config';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    // --- Real sprite assets (Kenney Top-Down Shooter, CC0) ---
    // Players
    this.load.image('player_warrior', 'assets/sprites/player_warrior.png');
    this.load.image('player_ranger', 'assets/sprites/player_ranger.png');
    this.load.image('player_mage', 'assets/sprites/player_mage.png');

    // Enemies
    this.load.image('enemy_basic', 'assets/sprites/enemy_basic.png');
    this.load.image('enemy_fast', 'assets/sprites/enemy_fast.png');
    this.load.image('enemy_tank', 'assets/sprites/enemy_tank.png');

    // Boss
    this.load.image('boss_brute', 'assets/sprites/boss_brute.png');

    // Tiles
    this.load.image('tile_floor', 'assets/sprites/tile_floor.png');

    // --- Real audio assets (Kenney Impact/Sci-fi/UI, CC0) ---
    this.load.audio('sfx_shoot', ['assets/audio/shoot.ogg']);
    this.load.audio('sfx_shoot2', ['assets/audio/shoot2.ogg']);
    this.load.audio('sfx_shoot3', ['assets/audio/shoot3.ogg']);
    this.load.audio('sfx_hit', ['assets/audio/hit.ogg']);
    this.load.audio('sfx_hit2', ['assets/audio/hit2.ogg']);
    this.load.audio('sfx_hit3', ['assets/audio/hit3.ogg']);
    this.load.audio('sfx_pickup', ['assets/audio/pickup.ogg']);
    this.load.audio('sfx_levelup', ['assets/audio/levelup.ogg']);
    this.load.audio('sfx_player_hit', ['assets/audio/player_hit.ogg']);
    this.load.audio('sfx_player_hit2', ['assets/audio/player_hit2.ogg']);
    this.load.audio('sfx_enemy_death', ['assets/audio/enemy_death.ogg']);
    this.load.audio('sfx_enemy_death2', ['assets/audio/enemy_death2.ogg']);
    this.load.audio('sfx_boss_spawn', ['assets/audio/boss_spawn.ogg']);
    this.load.audio('sfx_boss_death', ['assets/audio/boss_death.ogg']);
    this.load.audio('sfx_game_over', ['assets/audio/game_over.ogg']);
    this.load.audio('sfx_click', ['assets/audio/click.ogg']);
    this.load.audio('sfx_wave_start', ['assets/audio/wave_start.ogg']);
  }

  create(): void {
    // Legacy texture keys mapped to real sprites (backward compat)
    // player/enemy/boss textures are now loaded as images above;
    // CSV texture fields reference them directly (e.g. "player_warrior").
    // We keep "player", "enemy", "boss" procedural fallbacks for any code that
    // still references the old generic keys.
    this.generateTexture('player', 40, 40, (g) => {
      g.fillStyle(COLORS.playerOutline);
      g.fillCircle(20, 20, 20);
      g.fillStyle(COLORS.player);
      g.fillCircle(20, 20, 17);
    });

    this.generateTexture('enemy', 32, 32, (g) => {
      g.fillStyle(COLORS.enemyOutline);
      g.fillCircle(16, 16, 16);
      g.fillStyle(COLORS.enemy);
      g.fillCircle(16, 16, 14);
    });

    this.generateTexture('boss', 96, 96, (g) => {
      g.fillStyle(COLORS.bossOutline);
      g.fillCircle(48, 48, 48);
      g.fillStyle(COLORS.boss);
      g.fillCircle(48, 48, 44);
    });

    // Bullet — always procedural (6px, not worth a sprite file)
    this.generateTexture('bullet', BULLET_SIZE * 2, BULLET_SIZE * 2, (g) => {
      g.fillStyle(COLORS.bulletGlow, 0.4);
      g.fillCircle(BULLET_SIZE, BULLET_SIZE, BULLET_SIZE);
      g.fillStyle(COLORS.bullet);
      g.fillCircle(BULLET_SIZE, BULLET_SIZE, BULLET_SIZE - 2);
    });

    // XP Orb — always procedural (pulsating effect relies on clean shape)
    this.generateTexture('xp_orb', XP_ORB_SIZE * 2, XP_ORB_SIZE * 2, (g) => {
      g.fillStyle(COLORS.xpOrbGlow, 0.4);
      g.fillCircle(XP_ORB_SIZE, XP_ORB_SIZE, XP_ORB_SIZE);
      g.fillStyle(COLORS.xpOrb);
      g.fillCircle(XP_ORB_SIZE, XP_ORB_SIZE, XP_ORB_SIZE - 2);
    });

    // Joystick — always procedural (UI overlay)
    this.generateTexture('joystick_base', 120, 120, (g) => {
      g.fillStyle(0xffffff, 0.15);
      g.fillCircle(60, 60, 60);
      g.lineStyle(2, 0xffffff, 0.3);
      g.strokeCircle(60, 60, 60);
    });

    this.generateTexture('joystick_thumb', 50, 50, (g) => {
      g.fillStyle(0xffffff, 0.35);
      g.fillCircle(25, 25, 25);
    });

    this.scene.start('MenuScene');
  }

  private generateTexture(
    key: string,
    w: number,
    h: number,
    draw: (g: Phaser.GameObjects.Graphics) => void,
  ): void {
    const g = this.add.graphics();
    draw(g);
    g.generateTexture(key, w, h);
    g.destroy();
  }
}
