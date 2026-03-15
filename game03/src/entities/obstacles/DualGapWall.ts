import Phaser from 'phaser';
import { BaseObstacle, LogicalRect } from './BaseObstacle';
import {
  ObstacleType, GAME_WIDTH, OBSTACLE_HEIGHT,
  COLOR_LASER_RED,
  toPixelX, toPixelW, toPixelH,
} from '../../constants';

export class DualGapWall extends BaseObstacle {
  private bars!: Phaser.GameObjects.Rectangle[];
  private gap2CenterX: number;
  private gap2Width: number;

  constructor(
    scene: Phaser.Scene,
    logicalY: number,
    gap1CenterX: number,
    gap1Width: number,
    gap2CenterX: number,
    gap2Width: number,
  ) {
    super(scene, logicalY, gap1CenterX, gap1Width, ObstacleType.DUAL_GAP);
    this.gap2CenterX = gap2CenterX;
    this.gap2Width = gap2Width;
  }

  createVisuals(): void {
    this.bars = [];
    const h = toPixelH(OBSTACLE_HEIGHT);

    const gaps = this.getSortedGaps();
    const segments = this.computeSegments(gaps);

    for (const seg of segments) {
      if (seg.w > 0.5) {
        const bar = this.scene.add.rectangle(
          toPixelX(seg.x + seg.w / 2), 0,
          toPixelW(seg.w), h,
          COLOR_LASER_RED, 0.85,
        );
        this.add(bar);
        this.bars.push(bar);
      }
    }
  }

  private getSortedGaps(): Array<{ center: number; width: number }> {
    const g1 = { center: this.gapCenterX, width: this.currentGapWidth };
    const g2 = { center: this.gap2CenterX, width: this.gap2Width };
    return g1.center <= g2.center ? [g1, g2] : [g2, g1];
  }

  private computeSegments(gaps: Array<{ center: number; width: number }>): Array<{ x: number; w: number }> {
    const segments: Array<{ x: number; w: number }> = [];
    let cursor = 0;

    for (const gap of gaps) {
      const gapLeft = gap.center - gap.width / 2;
      const gapRight = gap.center + gap.width / 2;
      if (gapLeft > cursor) {
        segments.push({ x: cursor, w: gapLeft - cursor });
      }
      cursor = gapRight;
    }

    if (cursor < GAME_WIDTH) {
      segments.push({ x: cursor, w: GAME_WIDTH - cursor });
    }

    return segments;
  }

  getCollisionRects(): LogicalRect[] {
    const gaps = this.getSortedGaps();
    const segments = this.computeSegments(gaps);

    return segments
      .filter(s => s.w > 0.5)
      .map(seg => ({
        x: seg.x,
        y: this.logicalY - OBSTACLE_HEIGHT / 2,
        w: seg.w,
        h: OBSTACLE_HEIGHT,
      }));
  }
}
