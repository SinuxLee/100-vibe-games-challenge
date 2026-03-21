import Phaser from 'phaser';
import { BaseCollectible } from './BaseCollectible';
import {
  CollectibleType, COLLECTIBLE_SIZE,
  COLOR_LASER_RED, COLOR_NEON_PURPLE,
  GAME_HEIGHT, SY,
  toPixelX, toPixelW,
} from '../../constants';

export class Spike extends BaseCollectible {
  private shape!: Phaser.GameObjects.Graphics;
  private glow!: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, logicalX: number, logicalY: number) {
    super(scene, logicalX, logicalY, CollectibleType.SPIKE);
    this.createVisuals();
    this.syncPosition();
  }

  private createVisuals(): void {
    const size = toPixelW(COLLECTIBLE_SIZE);
    const half = size / 2;

    this.glow = this.scene.add.graphics();
    this.glow.fillStyle(COLOR_LASER_RED, 0.12);
    this.glow.fillCircle(0, 0, half * 1.4);
    this.glow.setBlendMode(Phaser.BlendModes.ADD);
    this.add(this.glow);

    this.shape = this.scene.add.graphics();
    this.shape.fillStyle(COLOR_LASER_RED, 0.85);
    // 6-pointed spiky shape
    const points = 6;
    this.shape.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const r = i % 2 === 0 ? half : half * 0.4;
      const px = Math.cos(angle) * r;
      const py = Math.sin(angle) * r;
      if (i === 0) this.shape.moveTo(px, py);
      else this.shape.lineTo(px, py);
    }
    this.shape.closePath();
    this.shape.fillPath();
    this.shape.lineStyle(1, COLOR_NEON_PURPLE, 0.7);
    this.shape.strokePath();
    this.shape.setBlendMode(Phaser.BlendModes.ADD);
    this.add(this.shape);
  }

  updateMovement(deltaSec: number, scrollSpd: number): void {
    super.updateMovement(deltaSec, scrollSpd);
    if (this.isDestroyed) return;
    this.shape.setRotation(this.aliveTime * 1.5);
    const flicker = 0.7 + 0.3 * Math.sin(this.aliveTime * 8);
    this.shape.setAlpha(0.85 * flicker);
    this.glow.setAlpha(0.1 + 0.05 * Math.sin(this.aliveTime * 6));
  }

  protected syncPosition(): void {
    this.x = toPixelX(this.logicalX);
    this.y = (GAME_HEIGHT - this.logicalY) * SY;
  }
}
