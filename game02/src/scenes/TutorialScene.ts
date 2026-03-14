import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from '../config';

interface TutorialStep {
  title: string;
  body: string;
  icon: string;
  spotlight?: { x: number; y: number; r: number };
}

const STEPS: TutorialStep[] = [
  {
    title: 'Move',
    body: 'Use WASD keys or drag the\nleft side of screen to move.',
    icon: '🕹️',
  },
  {
    title: 'Auto-Attack',
    body: 'Your weapon fires automatically\nat the nearest enemy.',
    icon: '🔫',
  },
  {
    title: 'Collect XP',
    body: 'Enemies drop XP orbs.\nWalk near them to pick up.',
    icon: '💎',
  },
  {
    title: 'Level Up',
    body: 'Choose 1 of 3 upgrades\nwhen you level up.',
    icon: '⬆️',
  },
  {
    title: 'Survive',
    body: 'Waves get harder over time.\nBoss appears every 5 waves!',
    icon: '💀',
  },
];

const STORAGE_KEY = 'survivor_tutorial_done';

export class TutorialScene extends Phaser.Scene {
  private currentStep = 0;
  private stepContainer?: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'TutorialScene' });
  }

  static shouldShow(): boolean {
    return !localStorage.getItem(STORAGE_KEY);
  }

  static markDone(): void {
    localStorage.setItem(STORAGE_KEY, '1');
  }

  create(): void {
    const { width, height } = this.scale;

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.75);
    overlay.fillRect(0, 0, width, height);

    this.showStep(0);

    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-SPACE', () => this.advance());
      this.input.keyboard.on('keydown-ENTER', () => this.advance());
    }
    this.input.on('pointerdown', () => this.advance());
  }

  private showStep(index: number): void {
    if (this.stepContainer) {
      this.stepContainer.destroy();
    }

    const step = STEPS[index];
    const { width, height } = this.scale;
    const cx = width / 2;

    const elements: Phaser.GameObjects.GameObject[] = [];

    const cardW = width * 0.85;
    const cardH = 260;
    const cardY = height * 0.3;

    const cardBg = this.add.graphics();
    cardBg.fillStyle(COLORS.uiPanel, 0.95);
    cardBg.fillRoundedRect(cx - cardW / 2, cardY, cardW, cardH, 16);
    cardBg.lineStyle(2, COLORS.gold, 0.5);
    cardBg.strokeRoundedRect(cx - cardW / 2, cardY, cardW, cardH, 16);
    elements.push(cardBg);

    const icon = this.add.text(cx, cardY + 40, step.icon, {
      fontSize: '48px',
    }).setOrigin(0.5);
    elements.push(icon);

    const title = this.add.text(cx, cardY + 100, step.title, {
      fontSize: '32px',
      fontFamily: 'monospace',
      color: '#ffd700',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    elements.push(title);

    const body = this.add.text(cx, cardY + 150, step.body, {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#cfd8dc',
      align: 'center',
      lineSpacing: 6,
    }).setOrigin(0.5, 0);
    elements.push(body);

    const dots = this.add.container(cx, cardY + cardH + 30);
    for (let i = 0; i < STEPS.length; i++) {
      const dotColor = i === index ? COLORS.gold : 0x424242;
      const dot = this.add.circle((i - (STEPS.length - 1) / 2) * 20, 0, 5, dotColor);
      dots.add(dot);
    }
    elements.push(dots);

    const isLast = index === STEPS.length - 1;
    const hintText = isLast ? 'Tap to Start!' : `Tap to continue  (${index + 1}/${STEPS.length})`;
    const hint = this.add.text(cx, height * 0.82, hintText, {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#90a4ae',
    }).setOrigin(0.5);
    this.tweens.add({
      targets: hint,
      alpha: { from: 0.4, to: 1 },
      duration: 800,
      yoyo: true,
      repeat: -1,
    });
    elements.push(hint);

    if (index > 0) {
      const skipBtn = this.add.text(width - 20, 20, 'SKIP >', {
        fontSize: '16px',
        fontFamily: 'monospace',
        color: '#607d8b',
      }).setOrigin(1, 0).setInteractive({ useHandCursor: true });
      skipBtn.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        pointer.event.stopPropagation();
        this.finish();
      });
      elements.push(skipBtn);
    }

    this.stepContainer = this.add.container(0, 0, elements);

    this.stepContainer.setAlpha(0);
    this.tweens.add({
      targets: this.stepContainer,
      alpha: 1,
      duration: 250,
    });
  }

  private advance(): void {
    this.currentStep++;
    if (this.currentStep >= STEPS.length) {
      this.finish();
    } else {
      this.showStep(this.currentStep);
    }
  }

  private finish(): void {
    TutorialScene.markDone();
    const gameScene = this.scene.get('GameScene') as any;
    if (gameScene) {
      gameScene.isPaused = false;
      gameScene.physics.resume();
    }
    this.scene.stop();
  }
}
