import Phaser from 'phaser';
import { COLORS, GAME_WIDTH } from '../config';
import { formatTime } from '../utils/helpers';
import { SoundManager } from '../systems/SoundManager';

export class HUDScene extends Phaser.Scene {
  private hpBarBg!: Phaser.GameObjects.Graphics;
  private hpBar!: Phaser.GameObjects.Graphics;
  private xpBarBg!: Phaser.GameObjects.Graphics;
  private xpBar!: Phaser.GameObjects.Graphics;
  private killsText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private muteBtn!: Phaser.GameObjects.Text;
  private pauseOverlay?: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'HUDScene' });
  }

  create(): void {
    const barWidth = GAME_WIDTH - 40;
    const barHeight = 16;
    const topY = 20;

    this.hpBarBg = this.add.graphics();
    this.hpBarBg.fillStyle(COLORS.hpBarBg, 0.8);
    this.hpBarBg.fillRoundedRect(20, topY, barWidth, barHeight, 4);

    this.hpBar = this.add.graphics();

    this.xpBarBg = this.add.graphics();
    this.xpBarBg.fillStyle(COLORS.xpBarBg, 0.8);
    this.xpBarBg.fillRoundedRect(20, topY + barHeight + 6, barWidth, 10, 3);

    this.xpBar = this.add.graphics();

    const textStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: '20px',
      fontFamily: 'monospace',
      color: '#ffffff',
    };

    this.levelText = this.add.text(20, topY + 40, 'Lv.1', textStyle);
    this.waveText = this.add.text(GAME_WIDTH - 20, topY + 40, 'Wave 1', textStyle).setOrigin(1, 0);
    this.killsText = this.add.text(20, topY + 68, 'Kills: 0', textStyle);
    this.timerText = this.add.text(GAME_WIDTH - 20, topY + 68, '00:00', textStyle).setOrigin(1, 0);

    this.registry.events.on('changedata', this.onRegistryChange, this);
    this.events.on('shutdown', () => {
      this.registry.events.off('changedata', this.onRegistryChange, this);
    });

    this.muteBtn = this.add.text(GAME_WIDTH - 20, topY + 96, SoundManager.isMuted() ? 'MUTED' : 'SOUND', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#90a4ae',
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });

    this.muteBtn.on('pointerdown', () => {
      const muted = SoundManager.toggleMute();
      this.muteBtn.setText(muted ? 'MUTED' : 'SOUND');
    });

    const gmBtn = this.add.text(20, topY + 96, 'GM', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#58a6ff',
      backgroundColor: '#21262d',
      padding: { x: 6, y: 2 },
    }).setInteractive({ useHandCursor: true });

    gmBtn.on('pointerdown', () => this.toggleGM());
    gmBtn.on('pointerover', () => gmBtn.setBackgroundColor('#30363d'));
    gmBtn.on('pointerout', () => gmBtn.setBackgroundColor('#21262d'));

    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-ESC', () => this.togglePause());
      const backtick = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.BACKTICK);
      backtick.on('down', () => this.toggleGM());
    }
  }

  private togglePause(): void {
    const gameScene = this.scene.get('GameScene') as any;
    if (!gameScene || !gameScene.scene.isActive()) return;

    if (gameScene.isPaused) {
      gameScene.isPaused = false;
      gameScene.physics.resume();
      if (this.pauseOverlay) {
        this.pauseOverlay.destroy();
        this.pauseOverlay = undefined;
      }
    } else {
      gameScene.isPaused = true;
      gameScene.physics.pause();

      const { width, height } = this.scale;
      const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.6);
      const txt = this.add.text(width / 2, height / 2, 'PAUSED', {
        fontSize: '48px',
        fontFamily: 'monospace',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      const hint = this.add.text(width / 2, height / 2 + 60, 'Press ESC to resume', {
        fontSize: '18px',
        fontFamily: 'monospace',
        color: '#90a4ae',
      }).setOrigin(0.5);
      this.pauseOverlay = this.add.container(0, 0, [bg, txt, hint]);
    }
  }

  private toggleGM(): void {
    if (this.scene.isActive('GMScene')) {
      this.scene.stop('GMScene');
    } else {
      this.scene.launch('GMScene');
    }
  }

  private onRegistryChange(_parent: any, key: string, value: any): void {
    const barWidth = GAME_WIDTH - 40;

    switch (key) {
      case 'hp':
      case 'maxHp': {
        const hp = this.registry.get('hp') as number;
        const maxHp = this.registry.get('maxHp') as number;
        const ratio = Math.max(0, hp / maxHp);
        this.hpBar.clear();
        this.hpBar.fillStyle(COLORS.hpBar, 1);
        this.hpBar.fillRoundedRect(20, 20, barWidth * ratio, 16, 4);
        break;
      }
      case 'xp':
      case 'xpToNext': {
        const xp = this.registry.get('xp') as number;
        const xpToNext = this.registry.get('xpToNext') as number;
        const ratio = Math.min(1, xp / xpToNext);
        this.xpBar.clear();
        this.xpBar.fillStyle(COLORS.xpBar, 1);
        this.xpBar.fillRoundedRect(20, 42, barWidth * ratio, 10, 3);
        break;
      }
      case 'level':
        this.levelText.setText(`Lv.${value}`);
        break;
      case 'wave':
        this.waveText.setText(`Wave ${value}`);
        break;
      case 'kills':
        this.killsText.setText(`Kills: ${value}`);
        break;
      case 'time':
        this.timerText.setText(formatTime(value as number));
        break;
    }
  }
}
