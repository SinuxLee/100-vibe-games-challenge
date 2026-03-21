import Phaser from 'phaser';
import { BaseObstacle, LogicalRect } from './BaseObstacle';
import {
  ObstacleType, GAME_WIDTH, OBSTACLE_HEIGHT, PLAYER_WIDTH, SHRINKING_GATE_MIN_GAP_EXTRA,
  COLOR_LASER_RED, COLOR_NEON_PURPLE, COLOR_HIGHLIGHT_WHITE,
  toPixelX, toPixelW, toPixelH,
} from '../../constants';

export class ShrinkingGate extends BaseObstacle {
  private leftBar!: Phaser.GameObjects.Rectangle;
  private rightBar!: Phaser.GameObjects.Rectangle;
  private leftEdgeGlow!: Phaser.GameObjects.Rectangle;
  private rightEdgeGlow!: Phaser.GameObjects.Rectangle;
  private leftGlow!: Phaser.GameObjects.Rectangle;
  private rightGlow!: Phaser.GameObjects.Rectangle;
  private leftWhiteEdge!: Phaser.GameObjects.Rectangle;
  private rightWhiteEdge!: Phaser.GameObjects.Rectangle;
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
    this.minGapWidth = PLAYER_WIDTH + SHRINKING_GATE_MIN_GAP_EXTRA;
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

    const glowW = toPixelW(1.2);
    this.leftEdgeGlow = this.scene.add.rectangle(0, 0, glowW, h * 1.5, COLOR_NEON_PURPLE, 0.8);
    this.leftEdgeGlow.setBlendMode(Phaser.BlendModes.ADD);
    this.rightEdgeGlow = this.scene.add.rectangle(0, 0, glowW, h * 1.5, COLOR_NEON_PURPLE, 0.8);
    this.rightEdgeGlow.setBlendMode(Phaser.BlendModes.ADD);
    this.add(this.leftEdgeGlow);
    this.add(this.rightEdgeGlow);

    const edgeW = toPixelW(0.4);
    this.leftWhiteEdge = this.scene.add.rectangle(0, 0, edgeW, h * 1.3, COLOR_HIGHLIGHT_WHITE, 0.7);
    this.leftWhiteEdge.setBlendMode(Phaser.BlendModes.ADD);
    this.add(this.leftWhiteEdge);
    this.rightWhiteEdge = this.scene.add.rectangle(0, 0, edgeW, h * 1.3, COLOR_HIGHLIGHT_WHITE, 0.7);
    this.rightWhiteEdge.setBlendMode(Phaser.BlendModes.ADD);
    this.add(this.rightWhiteEdge);

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
    const glowExpand = toPixelW(1.5);

    if (leftEnd > 0) {
      const w = toPixelW(leftEnd);
      this.leftBar.setPosition(toPixelX(leftEnd / 2), 0);
      this.leftBar.setSize(w, h);
      this.leftBar.setVisible(true);
      this.leftGlow.setPosition(toPixelX(leftEnd / 2), 0);
      this.leftGlow.setSize(w + glowExpand, h * 1.6);
      this.leftGlow.setVisible(true);
    } else {
      this.leftBar.setVisible(false);
      this.leftGlow.setVisible(false);
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
    } else {
      this.rightBar.setVisible(false);
      this.rightGlow.setVisible(false);
    }

    const pulse = 0.4 + 0.6 * Math.abs(Math.sin(this.aliveTime * 6));
    this.leftEdgeGlow.setPosition(toPixelX(leftEnd), 0);
    this.leftEdgeGlow.setAlpha(pulse);
    this.rightEdgeGlow.setPosition(toPixelX(rightStart), 0);
    this.rightEdgeGlow.setAlpha(pulse);

    if (this.leftWhiteEdge && this.rightWhiteEdge) {
      this.leftWhiteEdge.setPosition(toPixelX(leftEnd), 0);
      this.rightWhiteEdge.setPosition(toPixelX(rightStart), 0);
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
