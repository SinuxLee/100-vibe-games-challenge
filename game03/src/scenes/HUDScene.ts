import Phaser from 'phaser';
import {
  CANVAS_WIDTH, CANVAS_HEIGHT,
  CSS_ELECTRIC_BLUE, CSS_HIGHLIGHT_WHITE, CSS_NEON_PURPLE,
  REG_SCORE, REG_TIME, REG_IS_PAUSED,
} from '../constants';
import { AudioManager } from '../systems/AudioManager';

export class HUDScene extends Phaser.Scene {
  private scoreText!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;
  private pauseOverlay: Phaser.GameObjects.Container | null = null;
  private changeDataHandler!: (parent: unknown, key: string, data: unknown) => void;

  constructor() {
    super({ key: 'HUDScene' });
  }

  create(): void {
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

    this.changeDataHandler = (_parent: unknown, key: string, data: unknown) => {
      if (key === REG_SCORE) {
        this.scoreText.setText(String(data));
      } else if (key === REG_TIME) {
        this.timeText.setText(this.formatTime(data as number));
      }
    };

    this.registry.events.on('changedata', this.changeDataHandler);

    this.events.on('shutdown', () => {
      this.registry.events.off('changedata', this.changeDataHandler);
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
