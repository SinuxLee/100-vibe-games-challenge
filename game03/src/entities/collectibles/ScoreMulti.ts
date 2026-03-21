import Phaser from 'phaser';
import { BaseCollectible } from './BaseCollectible';
import {
  CollectibleType, COLLECTIBLE_SIZE, SCORE_MULTI_COLOR, COLOR_HIGHLIGHT_WHITE,
  GAME_HEIGHT, SY, toPixelX, toPixelW,
} from '../../constants';

export class ScoreMulti extends BaseCollectible {
  private shape!: Phaser.GameObjects.Graphics;
  private glow!: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, logicalX: number, logicalY: number) {
    super(scene, logicalX, logicalY, CollectibleType.SCORE_MULTI);
    this.createVisuals();
    this.syncPosition();
  }

  private createVisuals(): void {
    const size = toPixelW(COLLECTIBLE_SIZE);
    const half = size / 2;

    this.glow = this.scene.add.graphics();
    this.glow.fillStyle(SCORE_MULTI_COLOR, 0.18);
    this.glow.fillCircle(0, 0, half * 1.6);
    this.glow.setBlendMode(Phaser.BlendModes.ADD);
    this.add(this.glow);

    this.shape = this.scene.add.graphics();
    this.shape.fillStyle(SCORE_MULTI_COLOR, 0.9);
    // 5-pointed star
    this.shape.beginPath();
    for (let i = 0; i < 10; i++) {
      const angle = (i * Math.PI) / 5 - Math.PI / 2;
      const r = i % 2 === 0 ? half * 0.7 : half * 0.3;
      const px = Math.cos(angle) * r;
      const py = Math.sin(angle) * r;
      if (i === 0) this.shape.moveTo(px, py);
      else this.shape.lineTo(px, py);
    }
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
    this.shape.setRotation(this.aliveTime * 2);
    const pulse = 0.7 + 0.3 * Math.sin(this.aliveTime * 4);
    this.shape.setAlpha(pulse);
    this.glow.setAlpha(0.12 + 0.08 * Math.sin(this.aliveTime * 3));
  }

  protected syncPosition(): void {
    this.x = toPixelX(this.logicalX);
    this.y = (GAME_HEIGHT - this.logicalY) * SY;
  }
}
