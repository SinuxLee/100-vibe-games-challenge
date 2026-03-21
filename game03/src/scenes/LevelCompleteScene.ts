import Phaser from 'phaser';
import {
  CANVAS_WIDTH, CANVAS_HEIGHT,
  COLOR_DARK_BG, COLOR_NEON_PURPLE, COLOR_ELECTRIC_BLUE, COLOR_HIGHLIGHT_WHITE,
  CSS_ELECTRIC_BLUE, CSS_HIGHLIGHT_WHITE, CSS_NEON_PURPLE,
} from '../constants';
import { AudioManager } from '../systems/AudioManager';

export interface LevelCompleteData {
  completedLevel: number;
  nextLevel: number;
  score: number;
  time: number;
  maxCombo: number;
}

export class LevelCompleteScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LevelCompleteScene' });
  }

  create(data: LevelCompleteData): void {
    this.cameras.main.setBackgroundColor(COLOR_DARK_BG);

    const grid = this.add.graphics();
    grid.lineStyle(1, COLOR_NEON_PURPLE, 0.05);
    for (let x = 0; x < CANVAS_WIDTH; x += 50) {
      grid.lineBetween(x, 0, x, CANVAS_HEIGHT);
    }
    for (let y = 0; y < CANVAS_HEIGHT; y += 50) {
      grid.lineBetween(0, y, CANVAS_WIDTH, y);
    }

    this.cameras.main.setAlpha(0);
    this.tweens.add({
      targets: this.cameras.main,
      alpha: 1,
      duration: 250,
      ease: 'Sine.easeIn',
    });

    AudioManager.playLevelComplete();

    const checkmark = this.add.text(CANVAS_WIDTH / 2, CANVAS_HEIGHT * 0.15, '✓', {
      fontFamily: 'monospace',
      fontSize: '80px',
      color: CSS_ELECTRIC_BLUE,
    }).setOrigin(0.5).setScale(0);

    this.tweens.add({
      targets: checkmark,
      scaleX: 1,
      scaleY: 1,
      duration: 400,
      ease: 'Back.easeOut',
    });

    const title = this.add.text(CANVAS_WIDTH / 2, CANVAS_HEIGHT * 0.28, `LEVEL ${data.completedLevel}\nCOMPLETE`, {
      fontFamily: 'monospace',
      fontSize: '48px',
      color: CSS_HIGHLIGHT_WHITE,
      align: 'center',
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: title,
      alpha: 1,
      y: CANVAS_HEIGHT * 0.28,
      duration: 300,
      delay: 200,
      ease: 'Sine.easeOut',
    });

    const scoreLabel = this.add.text(CANVAS_WIDTH / 2, CANVAS_HEIGHT * 0.46, `SCORE: ${data.score}`, {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: CSS_ELECTRIC_BLUE,
    }).setOrigin(0.5).setAlpha(0);

    const timeStr = this.formatTime(data.time);
    const timeLabel = this.add.text(CANVAS_WIDTH / 2, CANVAS_HEIGHT * 0.52, `TIME: ${timeStr}`, {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: CSS_HIGHLIGHT_WHITE,
    }).setOrigin(0.5).setAlpha(0);

    const comboLabel = data.maxCombo > 0 ? this.add.text(CANVAS_WIDTH / 2, CANVAS_HEIGHT * 0.58, `MAX COMBO: ${data.maxCombo}`, {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: CSS_NEON_PURPLE,
    }).setOrigin(0.5).setAlpha(0) : null;

    this.tweens.add({
      targets: [scoreLabel, timeLabel, comboLabel].filter(Boolean),
      alpha: 1,
      duration: 300,
      delay: 500,
    });

    try {
      const emitter = this.add.particles(CANVAS_WIDTH / 2, -20, 'particle_spark', {
        x: { min: -CANVAS_WIDTH / 2, max: CANVAS_WIDTH / 2 },
        speed: { min: 50, max: 180 },
        angle: { min: 70, max: 110 },
        scale: { start: 0.6, end: 0 },
        alpha: { start: 0.8, end: 0 },
        lifespan: { min: 1000, max: 1800 },
        frequency: 50,
        quantity: 2,
        blendMode: Phaser.BlendModes.ADD,
        tint: [COLOR_ELECTRIC_BLUE, COLOR_HIGHLIGHT_WHITE, COLOR_NEON_PURPLE],
      });
      emitter.setDepth(5);
      this.time.delayedCall(2000, () => {
        emitter.stop();
        this.time.delayedCall(2000, () => emitter.destroy());
      });
    } catch {}

    const nextBtn = this.add.text(CANVAS_WIDTH / 2, CANVAS_HEIGHT * 0.72, `NEXT: LEVEL ${data.nextLevel}`, {
      fontFamily: 'monospace',
      fontSize: '36px',
      color: CSS_ELECTRIC_BLUE,
    }).setOrigin(0.5).setAlpha(0).setInteractive();

    this.tweens.add({
      targets: nextBtn,
      alpha: 1,
      duration: 300,
      delay: 800,
    });

    this.tweens.add({
      targets: nextBtn,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 600,
      yoyo: true,
      repeat: -1,
      delay: 1100,
    });

    nextBtn.on('pointerover', () => nextBtn.setScale(1.1));
    nextBtn.on('pointerout', () => nextBtn.setScale(1));
    nextBtn.on('pointerdown', () => {
      this.cameras.main.fade(200, 7, 11, 26, true, (_cam: unknown, progress: number) => {
        if (progress >= 1) {
          this.scene.start('GameScene', { resumeFromLevel: data.nextLevel });
        }
      });
    });

    const menuBtn = this.add.text(CANVAS_WIDTH / 2, CANVAS_HEIGHT * 0.82, 'MENU', {
      fontFamily: 'monospace',
      fontSize: '32px',
      color: CSS_NEON_PURPLE,
    }).setOrigin(0.5).setAlpha(0).setInteractive();

    this.tweens.add({
      targets: menuBtn,
      alpha: 1,
      duration: 300,
      delay: 900,
    });

    menuBtn.on('pointerover', () => menuBtn.setScale(1.08));
    menuBtn.on('pointerout', () => menuBtn.setScale(1));
    menuBtn.on('pointerdown', () => {
      this.cameras.main.fade(200, 7, 11, 26, true, (_cam: unknown, progress: number) => {
        if (progress >= 1) this.scene.start('MenuScene');
      });
    });
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const whole = Math.floor(secs);
    const tenths = Math.floor((secs - whole) * 10);
    return `${String(mins).padStart(2, '0')}:${String(whole).padStart(2, '0')}.${tenths}`;
  }
}
