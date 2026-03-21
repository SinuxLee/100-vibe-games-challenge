import Phaser from 'phaser';
import { BaseObstacle, LogicalRect } from './BaseObstacle';
import {
  ObstacleType, GAME_WIDTH, OBSTACLE_HEIGHT, MIN_WALL_WIDTH,
  COLOR_LASER_RED, COLOR_HIGHLIGHT_WHITE, DRIFT_MAX_LATERAL_SPEED,
  toPixelX, toPixelW, toPixelH,
} from '../../constants';

export class DriftingGapWall extends BaseObstacle {
  private leftBar!: Phaser.GameObjects.Rectangle;
  private rightBar!: Phaser.GameObjects.Rectangle;
  private leftGlow!: Phaser.GameObjects.Rectangle;
  private rightGlow!: Phaser.GameObjects.Rectangle;
  private leftEdge!: Phaser.GameObjects.Rectangle;
  private rightEdge!: Phaser.GameObjects.Rectangle;
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
    const glowH = h * 1.6;

    this.leftGlow = this.scene.add.rectangle(0, 0, 10, glowH, COLOR_LASER_RED, 0.15);
    this.leftGlow.setBlendMode(Phaser.BlendModes.ADD);
    this.rightGlow = this.scene.add.rectangle(0, 0, 10, glowH, COLOR_LASER_RED, 0.15);
    this.rightGlow.setBlendMode(Phaser.BlendModes.ADD);
    this.add(this.leftGlow);
    this.add(this.rightGlow);

    this.leftBar = this.scene.add.rectangle(0, 0, 10, h, COLOR_LASER_RED, 0.9);
    this.leftBar.setBlendMode(Phaser.BlendModes.ADD);
    this.rightBar = this.scene.add.rectangle(0, 0, 10, h, COLOR_LASER_RED, 0.9);
    this.rightBar.setBlendMode(Phaser.BlendModes.ADD);
    this.add(this.leftBar);
    this.add(this.rightBar);

    const edgeW = toPixelW(0.4);
    this.leftEdge = this.scene.add.rectangle(0, 0, edgeW, h * 1.3, COLOR_HIGHLIGHT_WHITE, 0.7);
    this.leftEdge.setBlendMode(Phaser.BlendModes.ADD);
    this.rightEdge = this.scene.add.rectangle(0, 0, edgeW, h * 1.3, COLOR_HIGHLIGHT_WHITE, 0.7);
    this.rightEdge.setBlendMode(Phaser.BlendModes.ADD);
    this.add(this.leftEdge);
    this.add(this.rightEdge);

    this.updateBarPositions();
  }

  updateMovement(deltaSec: number, scrollSpd: number): void {
    if (this.isDestroyed) return;
    this.aliveTime += deltaSec;
    const rawOffset = Math.sin(this.aliveTime * this.driftSpd * Math.PI) * this.driftAmp;
    const maxDelta = DRIFT_MAX_LATERAL_SPEED * deltaSec;
    const prevOffset = this.gapCenterX - this.baseGapCenterX;
    const clampedOffset = Phaser.Math.Clamp(rawOffset, prevOffset - maxDelta, prevOffset + maxDelta);
    const halfGap = this.currentGapWidth / 2;
    this.gapCenterX = Phaser.Math.Clamp(
      this.baseGapCenterX + clampedOffset,
      MIN_WALL_WIDTH + halfGap,
      GAME_WIDTH - MIN_WALL_WIDTH - halfGap,
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
    const glowExpand = toPixelW(1.5);

    if (leftEnd > 0) {
      const w = toPixelW(leftEnd);
      this.leftBar.setPosition(toPixelX(leftEnd / 2), 0);
      this.leftBar.setSize(w, h);
      this.leftBar.setVisible(true);
      this.leftGlow.setPosition(toPixelX(leftEnd / 2), 0);
      this.leftGlow.setSize(w + glowExpand, h * 1.6);
      this.leftGlow.setVisible(true);
      this.leftEdge.setPosition(toPixelX(leftEnd), 0);
      this.leftEdge.setVisible(true);
    } else {
      this.leftBar.setVisible(false);
      this.leftGlow.setVisible(false);
      this.leftEdge.setVisible(false);
    }

    if (rightStart < GAME_WIDTH) {
      const rightW = GAME_WIDTH - rightStart;
      const w = toPixelW(rightW);
      this.rightBar.setPosition(toPixelX(rightStart + rightW / 2), 0);
      this.rightBar.setSize(w, h);
      this.rightBar.setVisible(true);
      this.rightGlow.setPosition(toPixelX(rightStart + rightW / 2), 0);
      this.rightGlow.setSize(w + glowExpand, h * 1.6);
      this.rightGlow.setVisible(true);
      this.rightEdge.setPosition(toPixelX(rightStart), 0);
      this.rightEdge.setVisible(true);
    } else {
      this.rightBar.setVisible(false);
      this.rightGlow.setVisible(false);
      this.rightEdge.setVisible(false);
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
