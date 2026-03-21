import Phaser from 'phaser';
import { BaseCollectible } from './BaseCollectible';
import {
  CollectibleType, COLLECTIBLE_SIZE,
  COLOR_ELECTRIC_BLUE, COLOR_HIGHLIGHT_WHITE,
  GAME_HEIGHT, SY,
  toPixelX, toPixelW,
} from '../../constants';

export class Gem extends BaseCollectible {
  private diamond!: Phaser.GameObjects.Graphics;
  private glow!: Phaser.GameObjects.Graphics;
  private isRare: boolean;

  constructor(scene: Phaser.Scene, logicalX: number, logicalY: number, rare: boolean) {
    super(scene, logicalX, logicalY, rare ? CollectibleType.GEM_RARE : CollectibleType.GEM_NORMAL);
    this.isRare = rare;
    this.createVisuals();
    this.syncPosition();
  }

  private createVisuals(): void {
    const size = toPixelW(COLLECTIBLE_SIZE);
    const half = size / 2;
    const color = this.isRare ? COLOR_HIGHLIGHT_WHITE : COLOR_ELECTRIC_BLUE;

    this.glow = this.scene.add.graphics();
    this.glow.fillStyle(color, 0.15);
    this.glow.fillCircle(0, 0, half * 1.5);
    this.glow.setBlendMode(Phaser.BlendModes.ADD);
    this.add(this.glow);

    this.diamond = this.scene.add.graphics();
    this.diamond.fillStyle(color, 0.9);
    this.diamond.beginPath();
    this.diamond.moveTo(0, -half);
    this.diamond.lineTo(half * 0.6, 0);
    this.diamond.lineTo(0, half);
    this.diamond.lineTo(-half * 0.6, 0);
    this.diamond.closePath();
    this.diamond.fillPath();
    this.diamond.lineStyle(1, COLOR_HIGHLIGHT_WHITE, 0.8);
    this.diamond.strokePath();
    this.diamond.setBlendMode(Phaser.BlendModes.ADD);
    this.add(this.diamond);
  }

  updateMovement(deltaSec: number, scrollSpd: number): void {
    super.updateMovement(deltaSec, scrollSpd);
    if (this.isDestroyed) return;
    const rotation = this.aliveTime * 2.5;
    this.diamond.setRotation(rotation);
    const pulse = 0.12 + 0.06 * Math.sin(this.aliveTime * 4);
    this.glow.setAlpha(pulse);
  }

  protected syncPosition(): void {
    this.x = toPixelX(this.logicalX);
    this.y = (GAME_HEIGHT - this.logicalY) * SY;
  }
}
