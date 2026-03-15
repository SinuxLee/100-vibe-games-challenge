import Phaser from 'phaser';
import {
  CANVAS_WIDTH, CANVAS_HEIGHT,
  COLOR_ELECTRIC_BLUE, COLOR_NEON_PURPLE, COLOR_LASER_RED,
  COLOR_HIGHLIGHT_WHITE, COLOR_DARK_BG,
  toPixelW, toPixelH,
  PLAYER_WIDTH, PLAYER_HEIGHT, OBSTACLE_HEIGHT,
} from '../constants';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  create(): void {
    this.generatePlayerTexture();
    this.generateLaserTexture();
    this.generateParticleTexture();
    this.generateGridCellTexture();
    this.generateGlowTexture();
    this.generateButtonTexture();

    this.scene.start('MenuScene');
  }

  private generatePlayerTexture(): void {
    const w = toPixelW(PLAYER_WIDTH);
    const h = toPixelH(PLAYER_HEIGHT);
    const g = this.add.graphics();

    g.fillStyle(COLOR_ELECTRIC_BLUE, 0.3);
    g.fillRect(0, 0, w, h);

    g.fillStyle(COLOR_ELECTRIC_BLUE, 1);
    g.beginPath();
    g.moveTo(w / 2, 2);
    g.lineTo(w - 4, h - 2);
    g.lineTo(4, h - 2);
    g.closePath();
    g.fillPath();

    g.fillStyle(COLOR_HIGHLIGHT_WHITE, 0.8);
    g.fillCircle(w / 2, h * 0.5, Math.min(w, h) * 0.15);

    g.lineStyle(2, COLOR_ELECTRIC_BLUE, 0.6);
    g.beginPath();
    g.moveTo(w / 2, 2);
    g.lineTo(w - 4, h - 2);
    g.lineTo(4, h - 2);
    g.closePath();
    g.strokePath();

    g.generateTexture('player_shuttle', w, h);
    g.destroy();
  }

  private generateLaserTexture(): void {
    const w = 4;
    const h = toPixelH(OBSTACLE_HEIGHT);
    const g = this.add.graphics();

    g.fillStyle(COLOR_LASER_RED, 1);
    g.fillRect(0, 0, w, h);

    g.generateTexture('laser_segment', w, h);
    g.destroy();
  }

  private generateParticleTexture(): void {
    const size = 8;
    const g = this.add.graphics();

    g.fillStyle(COLOR_HIGHLIGHT_WHITE, 1);
    g.fillCircle(size / 2, size / 2, size / 2);

    g.generateTexture('particle_spark', size, size);
    g.destroy();
  }

  private generateGridCellTexture(): void {
    const size = 24;
    const g = this.add.graphics();

    g.fillStyle(COLOR_LASER_RED, 0.8);
    g.fillRect(1, 1, size - 2, size - 2);
    g.lineStyle(1, COLOR_LASER_RED, 1);
    g.strokeRect(0, 0, size, size);

    g.generateTexture('grid_cell', size, size);
    g.destroy();
  }

  private generateGlowTexture(): void {
    const size = 32;
    const g = this.add.graphics();

    for (let i = size / 2; i > 0; i--) {
      const alpha = (1 - i / (size / 2)) * 0.5;
      g.fillStyle(COLOR_ELECTRIC_BLUE, alpha);
      g.fillCircle(size / 2, size / 2, i);
    }

    g.generateTexture('neon_glow', size, size);
    g.destroy();
  }

  private generateButtonTexture(): void {
    const w = 300;
    const h = 80;
    const g = this.add.graphics();

    g.lineStyle(3, COLOR_NEON_PURPLE, 1);
    g.strokeRoundedRect(2, 2, w - 4, h - 4, 12);

    g.generateTexture('button_frame', w, h);
    g.destroy();
  }
}
