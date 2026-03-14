import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    const { width, height } = this.scale;
    this.add.text(width / 2, height / 2, 'Loading...', {
      fontSize: '28px',
      color: '#ffffff',
    }).setOrigin(0.5);
    this.scene.start('PreloadScene');
  }
}
