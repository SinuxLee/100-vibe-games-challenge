import Phaser from 'phaser';
import {
  CANVAS_WIDTH, CANVAS_HEIGHT,
  COLOR_ELECTRIC_BLUE, COLOR_NEON_PURPLE, COLOR_DARK_BG,
  CSS_ELECTRIC_BLUE, CSS_NEON_PURPLE, CSS_HIGHLIGHT_WHITE,
} from '../constants';
import { SaveSystem } from '../systems/SaveSystem';
import { AudioManager } from '../systems/AudioManager';

export class MenuScene extends Phaser.Scene {
  private startText!: Phaser.GameObjects.Text;
  private titleMain!: Phaser.GameObjects.Text;
  private titleSub!: Phaser.GameObjects.Text;
  private pulseTimer = 0;
  private gridOffset = 0;
  private gridGraphics!: Phaser.GameObjects.Graphics;
  private titleGlow!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    AudioManager.init(this);
    this.cameras.main.setBackgroundColor(COLOR_DARK_BG);

    this.gridGraphics = this.add.graphics().setDepth(0);
    this.drawGrid();

    this.drawTunnelLines();
    this.drawTitleGlow();
    this.drawTitle();
    this.drawStartButton();
    this.drawBestScore();
    this.drawSoundToggle();

    this.cameras.main.setAlpha(0);
    this.tweens.add({
      targets: this.cameras.main,
      alpha: 1,
      duration: 400,
      ease: 'Sine.easeIn',
    });

    this.input.on('pointerdown', () => {
      AudioManager.resume();
    });
  }

  update(_time: number, delta: number): void {
    const deltaSec = delta / 1000;
    this.pulseTimer += deltaSec;

    const startAlpha = 0.4 + 0.6 * Math.sin(this.pulseTimer * 2.5);
    if (this.startText) {
      this.startText.setAlpha(startAlpha);
    }

    this.gridOffset += deltaSec * 15;
    this.drawGrid();

    if (this.titleGlow) {
      const glowAlpha = 0.15 + 0.1 * Math.sin(this.pulseTimer * 1.8);
      this.titleGlow.setAlpha(glowAlpha);
    }
  }

  private drawGrid(): void {
    this.gridGraphics.clear();
    const spacing = 50;
    this.gridGraphics.lineStyle(1, COLOR_NEON_PURPLE, 0.08);

    for (let x = 0; x <= CANVAS_WIDTH; x += spacing) {
      this.gridGraphics.lineBetween(x, 0, x, CANVAS_HEIGHT);
    }
    const offsetY = this.gridOffset % spacing;
    for (let y = -spacing + offsetY; y <= CANVAS_HEIGHT + spacing; y += spacing) {
      this.gridGraphics.lineBetween(0, y, CANVAS_WIDTH, y);
    }
  }

  private drawTunnelLines(): void {
    const g = this.add.graphics().setDepth(1);
    const cx = CANVAS_WIDTH / 2;
    const vanishY = -50;
    g.lineStyle(1, COLOR_ELECTRIC_BLUE, 0.03);
    for (let i = 0; i < 12; i++) {
      const x = (i / 11) * CANVAS_WIDTH;
      g.lineBetween(x, CANVAS_HEIGHT, cx, vanishY);
    }
  }

  private drawTitleGlow(): void {
    this.titleGlow = this.add.graphics().setDepth(2);
    const cx = CANVAS_WIDTH / 2;
    const cy = CANVAS_HEIGHT * 0.25;
    for (let r = 160; r > 0; r -= 8) {
      const alpha = (1 - r / 160) * 0.12;
      this.titleGlow.fillStyle(COLOR_ELECTRIC_BLUE, alpha);
      this.titleGlow.fillEllipse(cx, cy, r * 2.5, r);
    }
  }

  private drawTitle(): void {
    this.titleMain = this.add.text(CANVAS_WIDTH / 2, CANVAS_HEIGHT * 0.25, '霓虹闪避', {
      fontFamily: 'monospace',
      fontSize: '72px',
      color: CSS_ELECTRIC_BLUE,
      stroke: CSS_ELECTRIC_BLUE,
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(3);

    this.titleSub = this.add.text(CANVAS_WIDTH / 2, CANVAS_HEIGHT * 0.25 + 80, 'NEON DODGE', {
      fontFamily: 'monospace',
      fontSize: '40px',
      color: CSS_NEON_PURPLE,
    }).setOrigin(0.5).setDepth(3);
  }

  private drawStartButton(): void {
    const btnY = CANVAS_HEIGHT * 0.55;

    const border = this.add.graphics().setDepth(3);
    border.lineStyle(2, COLOR_NEON_PURPLE, 0.5);
    border.strokeRoundedRect(CANVAS_WIDTH / 2 - 160, btnY - 32, 320, 64, 8);

    this.startText = this.add.text(CANVAS_WIDTH / 2, btnY, 'TAP TO START', {
      fontFamily: 'monospace',
      fontSize: '36px',
      color: CSS_HIGHLIGHT_WHITE,
    }).setOrigin(0.5).setDepth(3);

    const zone = this.add.zone(CANVAS_WIDTH / 2, btnY, 400, 120).setInteractive();
    zone.on('pointerdown', () => {
      AudioManager.playStart();
      this.cameras.main.fade(300, 7, 11, 26, true, (_cam: unknown, progress: number) => {
        if (progress >= 1) {
          this.scene.start('GameScene');
        }
      });
    });
  }

  private drawBestScore(): void {
    const data = SaveSystem.load();
    if (data.bestScore > 0) {
      this.add.text(CANVAS_WIDTH / 2, CANVAS_HEIGHT * 0.68, `BEST: ${data.bestScore}`, {
        fontFamily: 'monospace',
        fontSize: '28px',
        color: CSS_ELECTRIC_BLUE,
      }).setOrigin(0.5).setDepth(3);
    }
  }

  private drawSoundToggle(): void {
    const data = SaveSystem.load();
    const icon = data.soundEnabled ? '♪' : '♪̶';
    const text = this.add.text(CANVAS_WIDTH - 60, 40, icon, {
      fontFamily: 'monospace',
      fontSize: '40px',
      color: data.soundEnabled ? CSS_ELECTRIC_BLUE : '#666666',
    }).setOrigin(0.5).setInteractive().setDepth(5);

    text.on('pointerdown', () => {
      const enabled = SaveSystem.toggleSound();
      AudioManager.toggleMute();
      text.setColor(enabled ? CSS_ELECTRIC_BLUE : '#666666');
      text.setText(enabled ? '♪' : '♪̶');
    });
  }
}
