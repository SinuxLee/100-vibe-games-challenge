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

    // --- New enemy procedural textures (distinctive shapes) ---

    // Shooter — diamond/rhombus shape, yellow-ish
    this.generateTexture('enemy_shooter', 36, 36, (g) => {
      g.fillStyle(0x999922);
      g.fillTriangle(18, 0, 36, 18, 18, 36);
      g.fillTriangle(18, 0, 0, 18, 18, 36);
      g.fillStyle(0xcccc44);
      g.fillTriangle(18, 4, 32, 18, 18, 32);
      g.fillTriangle(18, 4, 4, 18, 18, 32);
    });

    // Splitter — hexagon shape, cyan
    this.generateTexture('enemy_splitter', 40, 40, (g) => {
      g.fillStyle(0x338888);
      g.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        const px = 20 + Math.cos(angle) * 20;
        const py = 20 + Math.sin(angle) * 20;
        if (i === 0) g.moveTo(px, py);
        else g.lineTo(px, py);
      }
      g.closePath();
      g.fillPath();
      g.fillStyle(0x44cccc);
      g.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        const px = 20 + Math.cos(angle) * 16;
        const py = 20 + Math.sin(angle) * 16;
        if (i === 0) g.moveTo(px, py);
        else g.lineTo(px, py);
      }
      g.closePath();
      g.fillPath();
    });

    // Ghost — rounded with fading bottom "tail", purple
    this.generateTexture('enemy_ghost', 32, 38, (g) => {
      g.fillStyle(0x7744aa);
      g.fillCircle(16, 14, 14);
      g.fillRect(2, 14, 28, 16);
      g.fillStyle(0xaa88ff);
      g.fillCircle(16, 14, 11);
      g.fillRect(5, 14, 22, 12);
      g.fillStyle(0x7744aa);
      for (let i = 0; i < 4; i++) {
        g.fillTriangle(3 + i * 8, 30, 7 + i * 8, 38, 11 + i * 8, 30);
      }
    });

    // Charger — forward-pointing arrow/wedge, orange
    this.generateTexture('enemy_charger', 44, 36, (g) => {
      g.fillStyle(0xcc5500);
      g.fillTriangle(44, 18, 0, 0, 0, 36);
      g.fillStyle(0xff6600);
      g.fillTriangle(38, 18, 6, 4, 6, 32);
    });

    // Swarm — tiny star shape, bright green
    this.generateTexture('enemy_swarm', 20, 20, (g) => {
      g.fillStyle(0x66cc33);
      g.beginPath();
      for (let i = 0; i < 5; i++) {
        const outerA = (Math.PI * 2 / 5) * i - Math.PI / 2;
        const innerA = outerA + Math.PI / 5;
        const ox = 10 + Math.cos(outerA) * 10;
        const oy = 10 + Math.sin(outerA) * 10;
        const ix = 10 + Math.cos(innerA) * 4;
        const iy = 10 + Math.sin(innerA) * 4;
        if (i === 0) g.moveTo(ox, oy);
        else g.lineTo(ox, oy);
        g.lineTo(ix, iy);
      }
      g.closePath();
      g.fillPath();
      g.fillStyle(0x88ff44);
      g.fillCircle(10, 10, 4);
    });

    // --- New boss procedural textures ---

    // Necromancer — dark purple pentagon with inner glow
    this.generateTexture('boss_necromancer', 88, 88, (g) => {
      g.fillStyle(0x2a0845);
      g.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
        const px = 44 + Math.cos(angle) * 44;
        const py = 44 + Math.sin(angle) * 44;
        if (i === 0) g.moveTo(px, py);
        else g.lineTo(px, py);
      }
      g.closePath();
      g.fillPath();
      g.fillStyle(0x4a148c);
      g.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
        const px = 44 + Math.cos(angle) * 36;
        const py = 44 + Math.sin(angle) * 36;
        if (i === 0) g.moveTo(px, py);
        else g.lineTo(px, py);
      }
      g.closePath();
      g.fillPath();
      g.fillStyle(0x9c27b0, 0.5);
      g.fillCircle(44, 44, 18);
    });

    // Dragon — red/crimson with wing-like shape
    this.generateTexture('boss_dragon', 112, 80, (g) => {
      g.fillStyle(0x8b0000);
      g.fillTriangle(0, 10, 56, 0, 30, 50);
      g.fillTriangle(112, 10, 56, 0, 82, 50);
      g.fillStyle(0xd32f2f);
      g.fillCircle(56, 45, 30);
      g.fillStyle(0xff5252);
      g.fillCircle(56, 45, 22);
      g.fillStyle(0xffab00);
      g.fillCircle(46, 40, 5);
      g.fillCircle(66, 40, 5);
    });

    // Overlord — large red star with black core
    this.generateTexture('boss_overlord', 128, 128, (g) => {
      g.fillStyle(0x880000);
      g.beginPath();
      for (let i = 0; i < 8; i++) {
        const outerA = (Math.PI * 2 / 8) * i - Math.PI / 2;
        const innerA = outerA + Math.PI / 8;
        const ox = 64 + Math.cos(outerA) * 64;
        const oy = 64 + Math.sin(outerA) * 64;
        const ix = 64 + Math.cos(innerA) * 30;
        const iy = 64 + Math.sin(innerA) * 30;
        if (i === 0) g.moveTo(ox, oy);
        else g.lineTo(ox, oy);
        g.lineTo(ix, iy);
      }
      g.closePath();
      g.fillPath();
      g.fillStyle(0xf44336);
      g.beginPath();
      for (let i = 0; i < 8; i++) {
        const outerA = (Math.PI * 2 / 8) * i - Math.PI / 2;
        const innerA = outerA + Math.PI / 8;
        const ox = 64 + Math.cos(outerA) * 54;
        const oy = 64 + Math.sin(outerA) * 54;
        const ix = 64 + Math.cos(innerA) * 26;
        const iy = 64 + Math.sin(innerA) * 26;
        if (i === 0) g.moveTo(ox, oy);
        else g.lineTo(ox, oy);
        g.lineTo(ix, iy);
      }
      g.closePath();
      g.fillPath();
      g.fillStyle(0x1a1a1a);
      g.fillCircle(64, 64, 16);
      g.fillStyle(0xff1744);
      g.fillCircle(64, 64, 8);
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
