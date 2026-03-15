import Phaser from 'phaser';
import {
  ObstacleType,
  OBSTACLE_DESTROY_Y, OBSTACLE_HEIGHT,
  toPixelX, toPixelY, toPixelW, toPixelH,
} from '../../constants';

export interface LogicalRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export abstract class BaseObstacle extends Phaser.GameObjects.Container {
  logicalY: number;
  gapCenterX: number;
  currentGapWidth: number;
  obstacleType: ObstacleType;
  passed = false;
  scored = false;
  nearMissChecked = false;
  protected isDestroyed = false;

  constructor(
    scene: Phaser.Scene,
    logicalY: number,
    gapCenterX: number,
    gapWidth: number,
    type: ObstacleType,
  ) {
    super(scene, 0, 0);

    this.logicalY = logicalY;
    this.gapCenterX = gapCenterX;
    this.currentGapWidth = gapWidth;
    this.obstacleType = type;

    scene.add.existing(this);
    this.setDepth(5);

    this.createVisuals();
    this.syncPosition();
  }

  abstract createVisuals(): void;
  abstract getCollisionRects(): LogicalRect[];

  updateMovement(deltaSec: number, scrollSpd: number): void {
    if (this.isDestroyed) return;
    this.logicalY -= scrollSpd * deltaSec;
    this.syncPosition();
  }

  isOffScreen(): boolean {
    return this.logicalY < OBSTACLE_DESTROY_Y;
  }

  protected syncPosition(): void {
    this.y = toPixelY(this.logicalY + OBSTACLE_HEIGHT / 2);
  }

  destroySelf(): void {
    this.isDestroyed = true;
    this.destroy();
  }
}
