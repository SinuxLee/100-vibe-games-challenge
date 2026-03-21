import Phaser from 'phaser';
import { BaseCollectible } from './BaseCollectible';
import {
  CollectibleType, COLLECTIBLE_SIZE, SHIELD_COLOR, COLOR_HIGHLIGHT_WHITE,
  GAME_HEIGHT, SY, toPixelX, toPixelW,
} from '../../constants';

export class Shield extends BaseCollectible {
  private shape!: Phaser.GameObjects.Graphics;
  private glow!: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, logicalX: number, logicalY: number) {
    super(scene, logicalX, logicalY, CollectibleType.SHIELD);
    this.createVisuals();
    this.syncPosition();
  }

  private createVisuals(): void {
    const size = toPixelW(COLLECTIBLE_SIZE);
    const half = size / 2;

    this.glow = this.scene.add.graphics();
    this.glow.fillStyle(SHIELD_COLOR, 0.15);
    this.glow.fillCircle(0, 0, half * 1.5);
    this.glow.setBlendMode(Phaser.BlendModes.ADD);
    this.add(this.glow);

    this.shape = this.scene.add.graphics();
    this.shape.fillStyle(SHIELD_COLOR, 0.85);
    // Hexagon
    this.shape.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3 - Math.PI / 6;
      const px = Math.cos(angle) * half * 0.7;
      const py = Math.sin(angle) * half * 0.7;
      if (i === 0) this.shape.moveTo(px, py);
      else this.shape.lineTo(px, py);
    }
    this.shape.closePath();
    this.shape.fillPath();
    this.shape.lineStyle(1.5, COLOR_HIGHLIGHT_WHITE, 0.9);
    this.shape.strokePath();
    this.shape.setBlendMode(Phaser.BlendModes.ADD);
    this.add(this.shape);
  }

  updateMovement(deltaSec: number, scrollSpd: number): void {
    super.updateMovement(deltaSec, scrollSpd);
    if (this.isDestroyed) return;
    const pulse = 0.7 + 0.3 * Math.sin(this.aliveTime * 3);
    this.shape.setAlpha(0.85 * pulse);
    this.glow.setAlpha(0.1 + 0.08 * Math.sin(this.aliveTime * 2.5));
  }

  protected syncPosition(): void {
    this.x = toPixelX(this.logicalX);
    this.y = (GAME_HEIGHT - this.logicalY) * SY;
  }
}
