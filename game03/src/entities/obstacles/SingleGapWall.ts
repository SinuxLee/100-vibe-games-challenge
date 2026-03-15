import Phaser from 'phaser';
import { BaseObstacle, LogicalRect } from './BaseObstacle';
import {
  ObstacleType, GAME_WIDTH, OBSTACLE_HEIGHT,
  COLOR_LASER_RED,
  toPixelX, toPixelW, toPixelH,
} from '../../constants';

export class SingleGapWall extends BaseObstacle {
  private leftBar!: Phaser.GameObjects.Rectangle;
  private rightBar!: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, logicalY: number, gapCenterX: number, gapW: number) {
    super(scene, logicalY, gapCenterX, gapW, ObstacleType.SINGLE_GAP);
  }

  createVisuals(): void {
    const halfGap = this.currentGapWidth / 2;
    const leftEnd = this.gapCenterX - halfGap;
    const rightStart = this.gapCenterX + halfGap;

    const h = toPixelH(OBSTACLE_HEIGHT);

    if (leftEnd > 0) {
      const w = toPixelW(leftEnd);
      this.leftBar = this.scene.add.rectangle(
        toPixelX(leftEnd / 2), 0, w, h, COLOR_LASER_RED, 0.85
      );
      this.add(this.leftBar);
    }

    if (rightStart < GAME_WIDTH) {
      const rightW = GAME_WIDTH - rightStart;
      const w = toPixelW(rightW);
      this.rightBar = this.scene.add.rectangle(
        toPixelX(rightStart + rightW / 2), 0, w, h, COLOR_LASER_RED, 0.85
      );
      this.add(this.rightBar);
    }
  }

  getCollisionRects(): LogicalRect[] {
    const rects: LogicalRect[] = [];
    const halfGap = this.currentGapWidth / 2;
    const leftEnd = this.gapCenterX - halfGap;
    const rightStart = this.gapCenterX + halfGap;

    if (leftEnd > 0) {
      rects.push({
        x: 0,
        y: this.logicalY - OBSTACLE_HEIGHT / 2,
        w: leftEnd,
        h: OBSTACLE_HEIGHT,
      });
    }

    if (rightStart < GAME_WIDTH) {
      rects.push({
        x: rightStart,
        y: this.logicalY - OBSTACLE_HEIGHT / 2,
        w: GAME_WIDTH - rightStart,
        h: OBSTACLE_HEIGHT,
      });
    }

    return rects;
  }
}
