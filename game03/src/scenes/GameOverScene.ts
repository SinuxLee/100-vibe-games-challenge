import Phaser from 'phaser';
import {
  CANVAS_WIDTH, CANVAS_HEIGHT,
  COLOR_DARK_BG, COLOR_NEON_PURPLE, COLOR_ELECTRIC_BLUE,
  COLOR_HIGHLIGHT_WHITE,
  CSS_LASER_RED, CSS_ELECTRIC_BLUE, CSS_HIGHLIGHT_WHITE, CSS_NEON_PURPLE,
} from '../constants';
import { SaveSystem } from '../systems/SaveSystem';
import { AudioManager } from '../systems/AudioManager';

interface GameOverData {
  score: number;
  time: number;
  isNewBest: boolean;
  levelReached?: number;
  totalLevels?: number;
  maxCombo?: number;
  allComplete?: boolean;
}

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create(data: GameOverData): void {
    this.cameras.main.setBackgroundColor(COLOR_DARK_BG);

    const drawGrid = this.add.graphics();
    drawGrid.lineStyle(1, COLOR_NEON_PURPLE, 0.06);
    for (let x = 0; x < CANVAS_WIDTH; x += 50) {
      drawGrid.lineBetween(x, 0, x, CANVAS_HEIGHT);
    }
    for (let y = 0; y < CANVAS_HEIGHT; y += 50) {
      drawGrid.lineBetween(0, y, CANVAS_WIDTH, y);
    }

    this.cameras.main.setAlpha(0);
    this.tweens.add({
      targets: this.cameras.main,
      alpha: 1,
      duration: 300,
      ease: 'Sine.easeIn',
    });

    const titleText = this.add.text(CANVAS_WIDTH / 2, CANVAS_HEIGHT * 0.18, 'GAME OVER', {
      fontFamily: 'monospace',
      fontSize: '56px',
      color: CSS_LASER_RED,
      stroke: CSS_LASER_RED,
      strokeThickness: 2,
    }).setOrigin(0.5);

    this.tweens.add({
      targets: titleText,
      alpha: { from: 0, to: 1 },
      y: { from: CANVAS_HEIGHT * 0.15, to: CANVAS_HEIGHT * 0.18 },
      duration: 400,
      ease: 'Back.easeOut',
    });

    const scoreText = this.add.text(CANVAS_WIDTH / 2, CANVAS_HEIGHT * 0.32, '0', {
      fontFamily: 'monospace',
      fontSize: '80px',
      color: CSS_ELECTRIC_BLUE,
    }).setOrigin(0.5);

    const scoreDuration = Math.min(1200, Math.max(400, data.score * 2));
    this.tweens.addCounter({
      from: 0,
      to: data.score,
      duration: scoreDuration,
      ease: 'Cubic.easeOut',
      onUpdate: (tween) => {
        scoreText.setText(String(Math.floor(tween.getValue() ?? 0)));
      },
    });

    this.add.text(CANVAS_WIDTH / 2, CANVAS_HEIGHT * 0.32 + 70, 'SCORE', {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: CSS_HIGHLIGHT_WHITE,
    }).setOrigin(0.5);

    const mins = Math.floor(data.time / 60);
    const secs = data.time % 60;
    const timeStr = `${String(mins).padStart(2, '0')}:${String(Math.floor(secs)).padStart(2, '0')}.${Math.floor((secs % 1) * 10)}`;

    this.add.text(CANVAS_WIDTH / 2, CANVAS_HEIGHT * 0.48, `TIME  ${timeStr}`, {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: CSS_HIGHLIGHT_WHITE,
    }).setOrigin(0.5);

    const saved = SaveSystem.load();
    this.add.text(CANVAS_WIDTH / 2, CANVAS_HEIGHT * 0.55, `BEST  ${saved.bestScore}`, {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: CSS_NEON_PURPLE,
    }).setOrigin(0.5);

    let infoY = 0.61;

    if (data.levelReached && data.totalLevels) {
      this.add.text(CANVAS_WIDTH / 2, CANVAS_HEIGHT * infoY, `LEVEL ${data.levelReached} / ${data.totalLevels}`, {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: CSS_HIGHLIGHT_WHITE,
      }).setOrigin(0.5);
      infoY += 0.05;
    }

    if (data.maxCombo && data.maxCombo > 1) {
      this.add.text(CANVAS_WIDTH / 2, CANVAS_HEIGHT * infoY, `MAX COMBO: ${data.maxCombo}`, {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: CSS_NEON_PURPLE,
      }).setOrigin(0.5);
      infoY += 0.05;
    }

    if (data.allComplete) {
      const completeText = this.add.text(CANVAS_WIDTH / 2, CANVAS_HEIGHT * infoY, 'ALL LEVELS COMPLETE!', {
        fontFamily: 'monospace',
        fontSize: '32px',
        color: '#FFD700',
        stroke: '#FFD700',
        strokeThickness: 1,
      }).setOrigin(0.5).setScale(0);

      this.tweens.add({
        targets: completeText,
        scaleX: 1,
        scaleY: 1,
        duration: 500,
        ease: 'Back.easeOut',
        delay: scoreDuration,
      });
      infoY += 0.06;
    } else if (data.levelReached && data.totalLevels && data.totalLevels - data.levelReached <= 2 && data.totalLevels - data.levelReached > 0) {
      const remaining = data.totalLevels - data.levelReached;
      const almostMsg = remaining === 1 ? 'ONE LEVEL AWAY!' : 'TWO LEVELS AWAY!';
      const almostText = this.add.text(CANVAS_WIDTH / 2, CANVAS_HEIGHT * infoY, almostMsg, {
        fontFamily: 'monospace',
        fontSize: '26px',
        color: CSS_LASER_RED,
      }).setOrigin(0.5).setAlpha(0);

      this.tweens.add({
        targets: almostText,
        alpha: 1,
        duration: 400,
        delay: scoreDuration + 200,
        yoyo: true,
        hold: 1500,
      });
      infoY += 0.06;
    }

    if (data.isNewBest) {
      const newBestText = this.add.text(CANVAS_WIDTH / 2, CANVAS_HEIGHT * infoY, 'NEW BEST!', {
        fontFamily: 'monospace',
        fontSize: '40px',
        color: '#FFD700',
        stroke: '#FFD700',
        strokeThickness: 1,
      }).setOrigin(0.5).setScale(0);

      AudioManager.playNewBest();

      this.tweens.add({
        targets: newBestText,
        scaleX: 1,
        scaleY: 1,
        duration: 500,
        ease: 'Back.easeOut',
        delay: scoreDuration,
        onComplete: () => {
          this.tweens.add({
            targets: newBestText,
            scaleX: 1.15,
            scaleY: 1.15,
            alpha: 0.7,
            duration: 500,
            yoyo: true,
            repeat: -1,
          });
        },
      });

      this.time.delayedCall(scoreDuration, () => {
        try {
          const emitter = this.add.particles(CANVAS_WIDTH / 2, -20, 'particle_spark', {
            x: { min: -CANVAS_WIDTH / 2, max: CANVAS_WIDTH / 2 },
            speed: { min: 60, max: 200 },
            angle: { min: 70, max: 110 },
            scale: { start: 0.8, end: 0 },
            alpha: { start: 0.9, end: 0 },
            lifespan: { min: 1200, max: 2000 },
            frequency: 40,
            quantity: 2,
            blendMode: Phaser.BlendModes.ADD,
            tint: [0xFFD700, COLOR_HIGHLIGHT_WHITE, COLOR_ELECTRIC_BLUE],
          });
          emitter.setDepth(15);
          this.time.delayedCall(2500, () => {
            emitter.stop();
            this.time.delayedCall(2000, () => emitter.destroy());
          });
        } catch {}
      });
    }

    const restartBtn = this.add.text(CANVAS_WIDTH / 2, CANVAS_HEIGHT * 0.78, 'RESTART', {
      fontFamily: 'monospace',
      fontSize: '36px',
      color: CSS_ELECTRIC_BLUE,
    }).setOrigin(0.5).setInteractive();

    restartBtn.on('pointerover', () => restartBtn.setScale(1.08));
    restartBtn.on('pointerout', () => restartBtn.setScale(1));
    restartBtn.on('pointerdown', () => {
      this.cameras.main.fade(200, 7, 11, 26, true, (_cam: unknown, progress: number) => {
        if (progress >= 1) this.scene.start('GameScene');
      });
    });

    const menuBtn = this.add.text(CANVAS_WIDTH / 2, CANVAS_HEIGHT * 0.86, 'MENU', {
      fontFamily: 'monospace',
      fontSize: '36px',
      color: CSS_NEON_PURPLE,
    }).setOrigin(0.5).setInteractive();

    menuBtn.on('pointerover', () => menuBtn.setScale(1.08));
    menuBtn.on('pointerout', () => menuBtn.setScale(1));
    menuBtn.on('pointerdown', () => {
      this.cameras.main.fade(200, 7, 11, 26, true, (_cam: unknown, progress: number) => {
        if (progress >= 1) this.scene.start('MenuScene');
      });
    });
  }
}
