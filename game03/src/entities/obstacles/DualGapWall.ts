import Phaser from 'phaser';
import { BaseObstacle, LogicalRect } from './BaseObstacle';
import {
  ObstacleType, GAME_WIDTH, OBSTACLE_HEIGHT,
  COLOR_LASER_RED, COLOR_HIGHLIGHT_WHITE,
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
    const glowH = h * 1.6;
    const glowExpand = toPixelW(1.5);

    const gaps = this.getSortedGaps();
    const segments = this.computeSegments(gaps);

    for (const seg of segments) {
      if (seg.w > 0.5) {
        const w = toPixelW(seg.w);
        const px = toPixelX(seg.x + seg.w / 2);

        const glow = this.scene.add.rectangle(px, 0, w + glowExpand, glowH, COLOR_LASER_RED, 0.15);
        glow.setBlendMode(Phaser.BlendModes.ADD);
        this.add(glow);

        const bar = this.scene.add.rectangle(px, 0, w, h, COLOR_LASER_RED, 0.9);
        bar.setBlendMode(Phaser.BlendModes.ADD);
        this.add(bar);
        this.bars.push(bar);
      }
    }

    const edgeW = toPixelW(0.4);
    const gapEdges = this.computeGapEdges(gaps);
    for (const ex of gapEdges) {
      const edge = this.scene.add.rectangle(
        toPixelX(ex), 0, edgeW, h * 1.3, COLOR_HIGHLIGHT_WHITE, 0.7
      );
      edge.setBlendMode(Phaser.BlendModes.ADD);
      this.add(edge);
    }
  }

  private computeGapEdges(gaps: Array<{ center: number; width: number }>): number[] {
    const edges: number[] = [];
    for (const gap of gaps) {
      const left = gap.center - gap.width / 2;
      const right = gap.center + gap.width / 2;
      if (left > 0.5) edges.push(left);
      if (right < GAME_WIDTH - 0.5) edges.push(right);
    }
    return edges;
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
