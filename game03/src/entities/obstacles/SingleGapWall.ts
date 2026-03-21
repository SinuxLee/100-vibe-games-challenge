import Phaser from 'phaser';
import { BaseObstacle, LogicalRect } from './BaseObstacle';
import {
  ObstacleType, GAME_WIDTH, OBSTACLE_HEIGHT,
  COLOR_LASER_RED, COLOR_HIGHLIGHT_WHITE,
  toPixelX, toPixelW, toPixelH,
} from '../../constants';

export class SingleGapWall extends BaseObstacle {
  private leftBar!: Phaser.GameObjects.Rectangle;
  private rightBar!: Phaser.GameObjects.Rectangle;
  private leftGlow!: Phaser.GameObjects.Rectangle;
  private rightGlow!: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, logicalY: number, gapCenterX: number, gapW: number) {
    super(scene, logicalY, gapCenterX, gapW, ObstacleType.SINGLE_GAP);
  }

  createVisuals(): void {
    const halfGap = this.currentGapWidth / 2;
    const leftEnd = this.gapCenterX - halfGap;
    const rightStart = this.gapCenterX + halfGap;

    const h = toPixelH(OBSTACLE_HEIGHT);
    const glowH = h * 1.6;
    const glowExpand = toPixelW(1.5);

    if (leftEnd > 0) {
      const w = toPixelW(leftEnd);
      this.leftGlow = this.scene.add.rectangle(
        toPixelX(leftEnd / 2), 0, w + glowExpand, glowH, COLOR_LASER_RED, 0.15
      );
      this.leftGlow.setBlendMode(Phaser.BlendModes.ADD);
      this.add(this.leftGlow);

      this.leftBar = this.scene.add.rectangle(
        toPixelX(leftEnd / 2), 0, w, h, COLOR_LASER_RED, 0.9
      );
      this.leftBar.setBlendMode(Phaser.BlendModes.ADD);
      this.add(this.leftBar);
    }

    if (rightStart < GAME_WIDTH) {
      const rightW = GAME_WIDTH - rightStart;
      const w = toPixelW(rightW);
      this.rightGlow = this.scene.add.rectangle(
        toPixelX(rightStart + rightW / 2), 0, w + glowExpand, glowH, COLOR_LASER_RED, 0.15
      );
      this.rightGlow.setBlendMode(Phaser.BlendModes.ADD);
      this.add(this.rightGlow);

      this.rightBar = this.scene.add.rectangle(
        toPixelX(rightStart + rightW / 2), 0, w, h, COLOR_LASER_RED, 0.9
      );
      this.rightBar.setBlendMode(Phaser.BlendModes.ADD);
      this.add(this.rightBar);
    }

    const edgeW = toPixelW(0.4);
    if (leftEnd > 0) {
      const edge = this.scene.add.rectangle(
        toPixelX(leftEnd), 0, edgeW, h * 1.3, COLOR_HIGHLIGHT_WHITE, 0.7
      );
      edge.setBlendMode(Phaser.BlendModes.ADD);
      this.add(edge);
    }
    if (rightStart < GAME_WIDTH) {
      const edge = this.scene.add.rectangle(
        toPixelX(rightStart), 0, edgeW, h * 1.3, COLOR_HIGHLIGHT_WHITE, 0.7
      );
      edge.setBlendMode(Phaser.BlendModes.ADD);
      this.add(edge);
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
