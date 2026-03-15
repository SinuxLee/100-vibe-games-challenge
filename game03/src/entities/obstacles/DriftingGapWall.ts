import Phaser from 'phaser';
import { BaseObstacle, LogicalRect } from './BaseObstacle';
import {
  ObstacleType, GAME_WIDTH, OBSTACLE_HEIGHT,
  COLOR_LASER_RED,
  toPixelX, toPixelW, toPixelH,
} from '../../constants';

export class DriftingGapWall extends BaseObstacle {
  private leftBar!: Phaser.GameObjects.Rectangle;
  private rightBar!: Phaser.GameObjects.Rectangle;
  private driftSpd: number;
  private driftAmp: number;
  private baseGapCenterX: number;
  private aliveTime = 0;

  constructor(
    scene: Phaser.Scene,
    logicalY: number,
    gapCenterX: number,
    gapW: number,
    driftSpd: number,
    driftAmp: number,
  ) {
    super(scene, logicalY, gapCenterX, gapW, ObstacleType.DRIFTING_GAP);
    this.driftSpd = driftSpd;
    this.driftAmp = driftAmp;
    this.baseGapCenterX = gapCenterX;
  }

  createVisuals(): void {
    const h = toPixelH(OBSTACLE_HEIGHT);
    this.leftBar = this.scene.add.rectangle(0, 0, 10, h, COLOR_LASER_RED, 0.85);
    this.rightBar = this.scene.add.rectangle(0, 0, 10, h, COLOR_LASER_RED, 0.85);
    this.add(this.leftBar);
    this.add(this.rightBar);
    this.updateBarPositions();
  }

  updateMovement(deltaSec: number, scrollSpd: number): void {
    if (this.isDestroyed) return;
    this.aliveTime += deltaSec;
    const offset = Math.sin(this.aliveTime * this.driftSpd * Math.PI) * this.driftAmp;
    const halfGap = this.currentGapWidth / 2;
    this.gapCenterX = Phaser.Math.Clamp(
      this.baseGapCenterX + offset,
      halfGap,
      GAME_WIDTH - halfGap,
    );
    super.updateMovement(deltaSec, scrollSpd);
    this.updateBarPositions();
  }

  private updateBarPositions(): void {
    if (this.isDestroyed || !this.leftBar || !this.rightBar) return;
    const halfGap = this.currentGapWidth / 2;
    const leftEnd = this.gapCenterX - halfGap;
    const rightStart = this.gapCenterX + halfGap;
    const h = toPixelH(OBSTACLE_HEIGHT);

    if (leftEnd > 0) {
      const w = toPixelW(leftEnd);
      this.leftBar.setPosition(toPixelX(leftEnd / 2), 0);
      this.leftBar.setSize(w, h);
      this.leftBar.setVisible(true);
    } else {
      this.leftBar.setVisible(false);
    }

    if (rightStart < GAME_WIDTH) {
      const rightW = GAME_WIDTH - rightStart;
      const w = toPixelW(rightW);
      this.rightBar.setPosition(toPixelX(rightStart + rightW / 2), 0);
      this.rightBar.setSize(w, h);
      this.rightBar.setVisible(true);
    } else {
      this.rightBar.setVisible(false);
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
