import Phaser from 'phaser';
import { t } from '../i18n';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    const { width, height } = this.scale;
    this.add.text(width / 2, height / 2, t('loading'), {
      fontSize: '28px',
      color: '#ffffff',
    }).setOrigin(0.5);
    this.scene.start('PreloadScene');
  }
}
