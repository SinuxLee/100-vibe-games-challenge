import Phaser from 'phaser';
import {
  CANVAS_WIDTH,
  COLOR_ELECTRIC_BLUE, COLOR_NEON_PURPLE, COLOR_LASER_RED,
  COLOR_HIGHLIGHT_WHITE,
  toPixelW, toPixelH,
  PLAYER_WIDTH, PLAYER_HEIGHT, OBSTACLE_HEIGHT,
} from '../constants';
import { parseLevelsCSV } from '../systems/LevelConfig';
import { parseCollectiblesCSV } from '../constants';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload(): void {
    this.load.text('levels_csv', 'levels.csv');
    this.load.text('collectibles_csv', 'collectibles.csv');
  }

  create(): void {
    const csvText = this.cache.text.get('levels_csv');
    if (csvText) {
      try {
        const levelData = parseLevelsCSV(csvText);
        this.registry.set('levelData', levelData);
      } catch (e) {
        console.warn('Failed to parse levels.csv, using fallback formulas:', e);
        this.registry.set('levelData', []);
      }
    } else {
      console.warn('levels.csv not found, using fallback formulas');
      this.registry.set('levelData', []);
    }

    const collectiblesCsv = this.cache.text.get('collectibles_csv');
    if (collectiblesCsv) {
      try {
        this.registry.set('collectibleConfigs', parseCollectiblesCSV(collectiblesCsv));
      } catch (e) {
        console.warn('Failed to parse collectibles.csv:', e);
        this.registry.set('collectibleConfigs', []);
      }
    } else {
      this.registry.set('collectibleConfigs', []);
    }

    this.generatePlayerTexture();
    this.generateLaserTexture();
    this.generateParticleTexture();
    this.generateGridCellTexture();
    this.generateGlowTexture();
    this.generateButtonTexture();
    this.generateFingerTexture();
    this.generateArrowTexture();
    this.generateSpeedLineTexture();

    this.scene.start('MenuScene');
  }

  private generatePlayerTexture(): void {
    const w = toPixelW(PLAYER_WIDTH);
    const h = toPixelH(PLAYER_HEIGHT);
    const g = this.add.graphics();

    for (let i = 3; i > 0; i--) {
      const a = (1 - i / 3) * 0.15;
      g.fillStyle(COLOR_ELECTRIC_BLUE, a);
      g.fillRect(-i * 2, -i * 2, w + i * 4, h + i * 4);
    }

    g.fillStyle(COLOR_ELECTRIC_BLUE, 0.4);
    g.fillRect(0, 0, w, h);

    g.fillStyle(COLOR_ELECTRIC_BLUE, 1);
    g.beginPath();
    g.moveTo(w / 2, 1);
    g.lineTo(w - 3, h - 1);
    g.lineTo(3, h - 1);
    g.closePath();
    g.fillPath();

    g.lineStyle(2, COLOR_HIGHLIGHT_WHITE, 0.5);
    g.beginPath();
    g.moveTo(w / 2, 1);
    g.lineTo(w - 3, h - 1);
    g.lineTo(3, h - 1);
    g.closePath();
    g.strokePath();

    g.fillStyle(COLOR_HIGHLIGHT_WHITE, 0.9);
    g.fillCircle(w / 2, h * 0.5, Math.min(w, h) * 0.18);
    g.fillStyle(COLOR_ELECTRIC_BLUE, 0.6);
    g.fillCircle(w / 2, h * 0.5, Math.min(w, h) * 0.1);

    g.generateTexture('player_shuttle', w + 8, h + 8);
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
    const size = 10;
    const g = this.add.graphics();

    for (let i = size / 2; i > 0; i--) {
      const a = (1 - i / (size / 2)) * 0.8;
      g.fillStyle(COLOR_HIGHLIGHT_WHITE, a);
      g.fillCircle(size / 2, size / 2, i);
    }

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
    const size = 48;
    const g = this.add.graphics();

    for (let i = size / 2; i > 0; i--) {
      const alpha = (1 - i / (size / 2)) * 0.6;
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

  private generateFingerTexture(): void {
    const w = 48;
    const h = 64;
    const g = this.add.graphics();

    g.fillStyle(COLOR_HIGHLIGHT_WHITE, 0.8);
    g.fillCircle(w / 2, h * 0.35, 14);
    g.fillRoundedRect(w / 2 - 10, h * 0.35, 20, h * 0.5, 8);

    g.generateTexture('finger_icon', w, h);
    g.destroy();
  }

  private generateArrowTexture(): void {
    const w = 40;
    const h = 24;
    const g = this.add.graphics();

    g.fillStyle(COLOR_ELECTRIC_BLUE, 0.9);
    g.beginPath();
    g.moveTo(w, h / 2);
    g.lineTo(w * 0.5, 0);
    g.lineTo(w * 0.5, h * 0.3);
    g.lineTo(0, h * 0.3);
    g.lineTo(0, h * 0.7);
    g.lineTo(w * 0.5, h * 0.7);
    g.lineTo(w * 0.5, h);
    g.closePath();
    g.fillPath();

    g.generateTexture('arrow_right', w, h);
    g.destroy();
  }

  private generateSpeedLineTexture(): void {
    const w = 3;
    const h = 40;
    const g = this.add.graphics();

    for (let i = 0; i < h; i++) {
      const a = (i / h) * 0.6;
      g.fillStyle(COLOR_HIGHLIGHT_WHITE, a);
      g.fillRect(0, i, w, 1);
    }

    g.generateTexture('speed_line', w, h);
    g.destroy();
  }
}
