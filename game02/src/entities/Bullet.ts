import Phaser from 'phaser';
import { WEAPON_BULLET_SPEED, BULLET_SIZE } from '../config';

export class Bullet extends Phaser.Physics.Arcade.Sprite {
  damage: number = 0;
  pierce: number = 1;

  constructor(scene: Phaser.Scene, x: number, y: number, bulletSize?: number, bulletTexture?: string) {
    super(scene, x, y, bulletTexture ?? 'bullet');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCircle(bulletSize ?? BULLET_SIZE, 0, 0);
  }

  fire(targetX: number, targetY: number, damage: number, pierce: number, speed: number = WEAPON_BULLET_SPEED): void {
    this.damage = damage;
    this.pierce = pierce;
    this.setActive(true).setVisible(true);
    const angle = Math.atan2(targetY - this.y, targetX - this.x);
    this.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
  }

  update(): void {
    if (!this.active) return;
    const bounds = this.scene.physics.world.bounds;
    if (this.x < bounds.x - 100 || this.x > bounds.right + 100 ||
        this.y < bounds.y - 100 || this.y > bounds.bottom + 100) {
      this.destroy();
    }
  }
}
