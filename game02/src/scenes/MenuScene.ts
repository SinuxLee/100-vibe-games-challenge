import Phaser from 'phaser';
import { COLORS } from '../config';
import { SaveSystem } from '../systems/SaveSystem';
import { SoundManager } from '../systems/SoundManager';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    const { width, height } = this.scale;

    this.add.text(width / 2, height * 0.25, 'SURVIVOR', {
      fontSize: '64px',
      fontFamily: 'monospace',
      color: '#4fc3f7',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.33, 'Survive the Horde', {
      fontSize: '20px',
      fontFamily: 'monospace',
      color: '#90a4ae',
    }).setOrigin(0.5);

    const startBtn = this.createButton(width / 2, height * 0.52, 'NEW GAME');
    startBtn.on('pointerdown', () => {
      SoundManager.init(this);
      SoundManager.resume();
      SoundManager.playClick();
      SaveSystem.deleteSave();
      this.scene.start('GameScene');
    });

    if (SaveSystem.hasSave()) {
      const continueBtn = this.createButton(width / 2, height * 0.62, 'CONTINUE');
      continueBtn.on('pointerdown', () => {
        SoundManager.init(this);
        SoundManager.resume();
        SoundManager.playClick();
        this.scene.start('GameScene', { loadSave: true });
      });
    }
  }

  private createButton(x: number, y: number, label: string): Phaser.GameObjects.Text {
    const btn = this.add.text(x, y, label, {
      fontSize: '32px',
      fontFamily: 'monospace',
      color: '#ffffff',
      backgroundColor: '#0f3460',
      padding: { x: 30, y: 14 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#1a237e' }));
    btn.on('pointerout', () => btn.setStyle({ backgroundColor: '#0f3460' }));
    return btn;
  }
}
