import Phaser from 'phaser';
import { CANVAS_WIDTH, CANVAS_HEIGHT, COLOR_ELECTRIC_BLUE } from '../constants';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    this.add.text(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 'LOADING...', {
      fontFamily: 'monospace',
      fontSize: '36px',
      color: '#00E5FF',
    }).setOrigin(0.5);

    this.time.delayedCall(100, () => {
      this.scene.start('PreloadScene');
    });
  }
}
