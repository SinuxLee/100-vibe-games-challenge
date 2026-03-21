import Phaser from 'phaser';
import {
  CANVAS_WIDTH, CANVAS_HEIGHT,
  CSS_ELECTRIC_BLUE, CSS_HIGHLIGHT_WHITE, CSS_NEON_PURPLE, CSS_LASER_RED,
  CSS_COMBO_WHITE, CSS_COMBO_YELLOW, CSS_COMBO_RED,
  REG_SCORE, REG_TIME, REG_IS_PAUSED, REG_LEVEL, REG_COMBO, REG_COMBO_COUNT,
} from '../constants';
import { AudioManager } from '../systems/AudioManager';

export class HUDScene extends Phaser.Scene {
  private scoreText!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private pauseOverlay: Phaser.GameObjects.Container | null = null;
  private changeDataHandler!: (parent: unknown, key: string, data: unknown) => void;
  private lastDisplayedScore = 0;

  constructor() {
    super({ key: 'HUDScene' });
  }

  create(): void {
    this.lastDisplayedScore = 0;

    this.add.text(40, 30, '⏸', {
      fontFamily: 'monospace',
      fontSize: '44px',
      color: CSS_HIGHLIGHT_WHITE,
    }).setInteractive().on('pointerdown', () => this.togglePause());

    this.timeText = this.add.text(CANVAS_WIDTH / 2, 35, '00:00.0', {
      fontFamily: 'monospace',
      fontSize: '32px',
      color: CSS_HIGHLIGHT_WHITE,
    }).setOrigin(0.5, 0);

    this.scoreText = this.add.text(CANVAS_WIDTH - 30, 35, '0', {
      fontFamily: 'monospace',
      fontSize: '32px',
      color: CSS_ELECTRIC_BLUE,
    }).setOrigin(1, 0);

    this.levelText = this.add.text(40, 85, 'LV.1', {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: CSS_NEON_PURPLE,
    }).setOrigin(0, 0);

    this.comboText = this.add.text(CANVAS_WIDTH - 30, 75, '', {
      fontFamily: 'monospace',
      fontSize: '22px',
      color: CSS_COMBO_WHITE,
    }).setOrigin(1, 0).setAlpha(0);

    this.changeDataHandler = (_parent: unknown, key: string, data: unknown) => {
      if (key === REG_SCORE) {
        const newScore = data as number;
        const diff = newScore - this.lastDisplayedScore;
        this.scoreText.setText(String(newScore));
        if (diff > 0 && this.lastDisplayedScore > 0) {
          this.popScore(diff >= 8);
        }
        this.lastDisplayedScore = newScore;
      } else if (key === REG_TIME) {
        this.timeText.setText(this.formatTime(data as number));
      } else if (key === REG_LEVEL) {
        const level = data as number;
        if (level > 0) {
          const prev = this.levelText.text;
          const next = `LV.${level}`;
          this.levelText.setText(next);
          if (prev !== next && prev !== 'LV.1') {
            this.flashLevelUp(level);
          }
        }
      } else if (key === REG_COMBO) {
        const multiplier = data as number;
        this.updateComboDisplay(multiplier);
      }
    };

    this.registry.events.on('changedata', this.changeDataHandler);

    this.events.on('shutdown', () => {
      this.registry.events.off('changedata', this.changeDataHandler);
    });
  }

  private popScore(isNearMiss: boolean): void {
    this.tweens.add({
      targets: this.scoreText,
      scaleX: isNearMiss ? 1.6 : 1.3,
      scaleY: isNearMiss ? 1.6 : 1.3,
      duration: 80,
      yoyo: true,
      ease: 'Quad.easeOut',
    });

    if (isNearMiss) {
      this.scoreText.setColor(CSS_LASER_RED);
      this.time.delayedCall(200, () => {
        if (this.scoreText) this.scoreText.setColor(CSS_ELECTRIC_BLUE);
      });
    }
  }

  private updateComboDisplay(multiplier: number): void {
    if (multiplier <= 1.0) {
      this.comboText.setAlpha(0);
      return;
    }

    const comboCount = this.registry.get(REG_COMBO_COUNT) ?? 0;
    let color = CSS_COMBO_WHITE;
    if (multiplier >= 2.5) color = CSS_COMBO_RED;
    else if (multiplier >= 1.75) color = CSS_COMBO_YELLOW;

    this.comboText.setText(`x${multiplier.toFixed(1)} (${comboCount})`);
    this.comboText.setColor(color);
    this.comboText.setAlpha(1);

    this.tweens.add({
      targets: this.comboText,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 60,
      yoyo: true,
      ease: 'Quad.easeOut',
    });
  }

  private flashLevelUp(level: number): void {
    this.tweens.add({
      targets: this.levelText,
      scaleX: 1.4,
      scaleY: 1.4,
      duration: 150,
      yoyo: true,
      ease: 'Sine.easeOut',
    });

    const popup = this.add.text(CANVAS_WIDTH / 2, CANVAS_HEIGHT * 0.15, `LEVEL ${level}`, {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: CSS_NEON_PURPLE,
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(30).setAlpha(0);

    this.tweens.add({
      targets: popup,
      alpha: 1,
      y: CANVAS_HEIGHT * 0.12,
      duration: 300,
      ease: 'Sine.easeOut',
      hold: 600,
      yoyo: true,
      onComplete: () => popup.destroy(),
    });
  }

  private togglePause(): void {
    const isPaused = this.registry.get(REG_IS_PAUSED);
    if (isPaused) {
      this.resumeGame();
    } else {
      this.pauseGame();
    }
  }

  private pauseGame(): void {
    this.registry.set(REG_IS_PAUSED, true);
    AudioManager.playPauseResume();

    this.pauseOverlay = this.add.container(0, 0);

    const bg = this.add.rectangle(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH, CANVAS_HEIGHT, 0x000000, 0.7);
    this.pauseOverlay.add(bg);

    const title = this.add.text(CANVAS_WIDTH / 2, CANVAS_HEIGHT * 0.35, 'PAUSED', {
      fontFamily: 'monospace',
      fontSize: '52px',
      color: CSS_HIGHLIGHT_WHITE,
    }).setOrigin(0.5);
    this.pauseOverlay.add(title);

    const resumeBtn = this.add.text(CANVAS_WIDTH / 2, CANVAS_HEIGHT * 0.5, 'RESUME', {
      fontFamily: 'monospace',
      fontSize: '36px',
      color: CSS_ELECTRIC_BLUE,
    }).setOrigin(0.5).setInteractive();
    resumeBtn.on('pointerdown', () => this.resumeGame());
    this.pauseOverlay.add(resumeBtn);

    const quitBtn = this.add.text(CANVAS_WIDTH / 2, CANVAS_HEIGHT * 0.6, 'QUIT', {
      fontFamily: 'monospace',
      fontSize: '36px',
      color: CSS_NEON_PURPLE,
    }).setOrigin(0.5).setInteractive();
    quitBtn.on('pointerdown', () => {
      this.registry.set(REG_IS_PAUSED, false);
      this.scene.stop('GameScene');
      this.scene.stop('HUDScene');
      this.scene.start('MenuScene');
    });
    this.pauseOverlay.add(quitBtn);

    this.pauseOverlay.setDepth(100);
  }

  private resumeGame(): void {
    this.registry.set(REG_IS_PAUSED, false);
    AudioManager.playPauseResume();
    if (this.pauseOverlay) {
      this.pauseOverlay.destroy();
      this.pauseOverlay = null;
    }
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const whole = Math.floor(secs);
    const tenths = Math.floor((secs - whole) * 10);
    return `${String(mins).padStart(2, '0')}:${String(whole).padStart(2, '0')}.${tenths}`;
  }
}
