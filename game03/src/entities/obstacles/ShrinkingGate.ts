import Phaser from 'phaser';
import { BaseObstacle, LogicalRect } from './BaseObstacle';
import {
  ObstacleType, GAME_WIDTH, OBSTACLE_HEIGHT, PLAYER_WIDTH,
  COLOR_LASER_RED, COLOR_NEON_PURPLE,
  toPixelX, toPixelW, toPixelH,
} from '../../constants';

export class ShrinkingGate extends BaseObstacle {
  private leftBar!: Phaser.GameObjects.Rectangle;
  private rightBar!: Phaser.GameObjects.Rectangle;
  private leftEdgeGlow!: Phaser.GameObjects.Rectangle;
  private rightEdgeGlow!: Phaser.GameObjects.Rectangle;
  private initialGapWidth: number;
  private shrinkSpd: number;
  private aliveTime = 0;
  private minGapWidth: number;

  constructor(
    scene: Phaser.Scene,
    logicalY: number,
    gapCenterX: number,
    gapW: number,
    shrinkSpd: number,
  ) {
    super(scene, logicalY, gapCenterX, gapW, ObstacleType.SHRINKING_GATE);
    this.initialGapWidth = gapW;
    this.shrinkSpd = shrinkSpd;
    this.minGapWidth = PLAYER_WIDTH + 2;
  }

  createVisuals(): void {
    const h = toPixelH(OBSTACLE_HEIGHT);

    this.leftBar = this.scene.add.rectangle(0, 0, 10, h, COLOR_LASER_RED, 0.85);
    this.rightBar = this.scene.add.rectangle(0, 0, 10, h, COLOR_LASER_RED, 0.85);
    this.add(this.leftBar);
    this.add(this.rightBar);

    const glowW = toPixelW(0.8);
    this.leftEdgeGlow = this.scene.add.rectangle(0, 0, glowW, h * 1.3, COLOR_NEON_PURPLE, 0.7);
    this.rightEdgeGlow = this.scene.add.rectangle(0, 0, glowW, h * 1.3, COLOR_NEON_PURPLE, 0.7);
    this.add(this.leftEdgeGlow);
    this.add(this.rightEdgeGlow);

    this.updateBarPositions();
  }

  updateMovement(deltaSec: number, scrollSpd: number): void {
    if (this.isDestroyed) return;
    this.aliveTime += deltaSec;

    this.currentGapWidth = Math.max(
      this.minGapWidth,
      this.initialGapWidth - this.shrinkSpd * this.aliveTime,
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

    const pulse = 0.4 + 0.6 * Math.abs(Math.sin(this.aliveTime * 6));
    this.leftEdgeGlow.setPosition(toPixelX(leftEnd), 0);
    this.leftEdgeGlow.setAlpha(pulse);
    this.rightEdgeGlow.setPosition(toPixelX(rightStart), 0);
    this.rightEdgeGlow.setAlpha(pulse);
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
