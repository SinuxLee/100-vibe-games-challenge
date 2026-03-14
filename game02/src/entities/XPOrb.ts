import Phaser from 'phaser';
import { XP_ORB_SIZE } from '../config';

export class XPOrb extends Phaser.Physics.Arcade.Sprite {
  xpValue: number;

  constructor(scene: Phaser.Scene, x: number, y: number, value: number) {
    super(scene, x, y, 'xp_orb');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.xpValue = value;
    this.setCircle(XP_ORB_SIZE, 0, 0);

    scene.tweens.add({
      targets: this,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }
}
