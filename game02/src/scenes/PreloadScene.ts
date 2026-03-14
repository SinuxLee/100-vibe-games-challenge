import Phaser from 'phaser';
import { COLORS, PLAYER_SIZE, ENEMY_SIZE, BOSS_SIZE, BULLET_SIZE, XP_ORB_SIZE } from '../config';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  create(): void {
    this.generateTexture('player', PLAYER_SIZE * 2, PLAYER_SIZE * 2, (g) => {
      g.fillStyle(COLORS.playerOutline);
      g.fillCircle(PLAYER_SIZE, PLAYER_SIZE, PLAYER_SIZE);
      g.fillStyle(COLORS.player);
      g.fillCircle(PLAYER_SIZE, PLAYER_SIZE, PLAYER_SIZE - 3);
    });

    this.generateTexture('enemy', ENEMY_SIZE * 2, ENEMY_SIZE * 2, (g) => {
      g.fillStyle(COLORS.enemyOutline);
      g.fillCircle(ENEMY_SIZE, ENEMY_SIZE, ENEMY_SIZE);
      g.fillStyle(COLORS.enemy);
      g.fillCircle(ENEMY_SIZE, ENEMY_SIZE, ENEMY_SIZE - 2);
    });

    this.generateTexture('boss', BOSS_SIZE * 2, BOSS_SIZE * 2, (g) => {
      g.fillStyle(COLORS.bossOutline);
      g.fillCircle(BOSS_SIZE, BOSS_SIZE, BOSS_SIZE);
      g.fillStyle(COLORS.boss);
      g.fillCircle(BOSS_SIZE, BOSS_SIZE, BOSS_SIZE - 4);
      g.fillStyle(0xffffff, 0.15);
      g.fillCircle(BOSS_SIZE - 8, BOSS_SIZE - 8, BOSS_SIZE * 0.4);
    });

    this.generateTexture('bullet', BULLET_SIZE * 2, BULLET_SIZE * 2, (g) => {
      g.fillStyle(COLORS.bulletGlow, 0.4);
      g.fillCircle(BULLET_SIZE, BULLET_SIZE, BULLET_SIZE);
      g.fillStyle(COLORS.bullet);
      g.fillCircle(BULLET_SIZE, BULLET_SIZE, BULLET_SIZE - 2);
    });

    this.generateTexture('xp_orb', XP_ORB_SIZE * 2, XP_ORB_SIZE * 2, (g) => {
      g.fillStyle(COLORS.xpOrbGlow, 0.4);
      g.fillCircle(XP_ORB_SIZE, XP_ORB_SIZE, XP_ORB_SIZE);
      g.fillStyle(COLORS.xpOrb);
      g.fillCircle(XP_ORB_SIZE, XP_ORB_SIZE, XP_ORB_SIZE - 2);
    });

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
