import Phaser from 'phaser';
import {
  CollectibleType, OBSTACLE_DESTROY_Y, GAME_HEIGHT, SY,
  COLLECTIBLE_SIZE,
} from '../../constants';

export class BaseCollectible extends Phaser.GameObjects.Container {
  logicalX: number;
  logicalY: number;
  collectibleType: CollectibleType;
  collected = false;
  protected isDestroyed = false;
  protected aliveTime = 0;

  constructor(
    scene: Phaser.Scene,
    logicalX: number,
    logicalY: number,
    type: CollectibleType,
  ) {
    super(scene, 0, 0);
    this.logicalX = logicalX;
    this.logicalY = logicalY;
    this.collectibleType = type;

    scene.add.existing(this);
    this.setDepth(6);
  }

  updateMovement(deltaSec: number, scrollSpd: number): void {
    if (this.isDestroyed) return;
    this.aliveTime += deltaSec;
    this.logicalY -= scrollSpd * deltaSec;
    this.syncPosition();
  }

  getCollisionRect(): { x: number; y: number; w: number; h: number } {
    const half = COLLECTIBLE_SIZE / 2;
    return {
      x: this.logicalX - half,
      y: this.logicalY - half,
      w: COLLECTIBLE_SIZE,
      h: COLLECTIBLE_SIZE,
    };
  }

  isOffScreen(): boolean {
    return this.logicalY < OBSTACLE_DESTROY_Y;
  }

  protected syncPosition(): void {
    // intentionally left for subclasses; overridden by Gem/Spike
  }

  destroySelf(): void {
    this.isDestroyed = true;
    this.destroy();
  }
}
