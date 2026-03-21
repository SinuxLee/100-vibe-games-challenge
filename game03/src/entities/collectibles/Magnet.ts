import Phaser from 'phaser';
import { BaseCollectible } from './BaseCollectible';
import {
  CollectibleType, COLLECTIBLE_SIZE, MAGNET_COLOR, COLOR_HIGHLIGHT_WHITE,
  GAME_HEIGHT, SY, toPixelX, toPixelW,
} from '../../constants';

export class Magnet extends BaseCollectible {
  private shape!: Phaser.GameObjects.Graphics;
  private glow!: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, logicalX: number, logicalY: number) {
    super(scene, logicalX, logicalY, CollectibleType.MAGNET);
    this.createVisuals();
    this.syncPosition();
  }

  private createVisuals(): void {
    const size = toPixelW(COLLECTIBLE_SIZE);
    const half = size / 2;

    this.glow = this.scene.add.graphics();
    this.glow.fillStyle(MAGNET_COLOR, 0.15);
    this.glow.fillCircle(0, 0, half * 1.6);
    this.glow.setBlendMode(Phaser.BlendModes.ADD);
    this.add(this.glow);

    this.shape = this.scene.add.graphics();
    this.shape.fillStyle(MAGNET_COLOR, 0.9);
    // Lightning bolt shape
    this.shape.beginPath();
    this.shape.moveTo(-half * 0.2, -half);
    this.shape.lineTo(half * 0.3, -half * 0.1);
    this.shape.lineTo(-half * 0.05, -half * 0.1);
    this.shape.lineTo(half * 0.2, half);
    this.shape.lineTo(-half * 0.3, half * 0.1);
    this.shape.lineTo(half * 0.05, half * 0.1);
    this.shape.closePath();
    this.shape.fillPath();
    this.shape.lineStyle(1, COLOR_HIGHLIGHT_WHITE, 0.8);
    this.shape.strokePath();
    this.shape.setBlendMode(Phaser.BlendModes.ADD);
    this.add(this.shape);
  }

  updateMovement(deltaSec: number, scrollSpd: number): void {
    super.updateMovement(deltaSec, scrollSpd);
    if (this.isDestroyed) return;
    const flash = 0.6 + 0.4 * Math.abs(Math.sin(this.aliveTime * 5));
    this.shape.setAlpha(flash);
    this.glow.setAlpha(0.1 + 0.1 * Math.sin(this.aliveTime * 3));
  }

  protected syncPosition(): void {
    this.x = toPixelX(this.logicalX);
    this.y = (GAME_HEIGHT - this.logicalY) * SY;
  }
}
