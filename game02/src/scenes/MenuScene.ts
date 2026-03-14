import Phaser from 'phaser';
import { COLORS } from '../config';
import { SaveSystem } from '../systems/SaveSystem';
import { SoundManager } from '../systems/SoundManager';
import { t, getLang, setLang } from '../i18n';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    const { width, height } = this.scale;

    this.add.text(width / 2, height * 0.25, t('title'), {
      fontSize: '64px',
      fontFamily: 'monospace',
      color: '#4fc3f7',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.33, t('subtitle'), {
      fontSize: '20px',
      fontFamily: 'monospace',
      color: '#90a4ae',
    }).setOrigin(0.5);

    const startBtn = this.createButton(width / 2, height * 0.52, t('new_game'));
    startBtn.on('pointerdown', () => {
      SoundManager.init(this);
      SoundManager.resume();
      SoundManager.playClick();
      SaveSystem.deleteSave();
      this.scene.start('GameScene');
    });

    if (SaveSystem.hasSave()) {
      const continueBtn = this.createButton(width / 2, height * 0.62, t('continue_game'));
      continueBtn.on('pointerdown', () => {
        SoundManager.init(this);
        SoundManager.resume();
        SoundManager.playClick();
        this.scene.start('GameScene', { loadSave: true });
      });
    }

    const langBtn = this.add.text(width / 2, height * 0.78, t('lang_toggle'), {
      fontSize: '22px',
      fontFamily: 'monospace',
      color: '#90a4ae',
      backgroundColor: '#16213e',
      padding: { x: 18, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    langBtn.on('pointerover', () => langBtn.setStyle({ backgroundColor: '#1a237e' }));
    langBtn.on('pointerout', () => langBtn.setStyle({ backgroundColor: '#16213e' }));
    langBtn.on('pointerdown', () => {
      const next = getLang() === 'zh' ? 'en' : 'zh';
      setLang(next);
      SoundManager.init(this);
      SoundManager.playClick();
      this.scene.restart();
    });
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
