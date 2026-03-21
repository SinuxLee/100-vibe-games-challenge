import Phaser from 'phaser';
import { BaseObstacle, LogicalRect } from './BaseObstacle';
import {
  ObstacleType, GAME_WIDTH, GAME_HEIGHT, SY, OBSTACLE_HEIGHT,
  COLOR_LASER_RED, COLOR_NEON_PURPLE,
  toPixelX, toPixelW, toPixelH,
} from '../../constants';

const COLUMN_COUNT = 8;
const PULSE_GRID_HEIGHT_MULT = 3;

export class PulseGrid extends BaseObstacle {
  private columns!: Phaser.GameObjects.Rectangle[];
  private glowColumns!: Phaser.GameObjects.Rectangle[];
  private pulseIntvl: number;
  private aliveTime = 0;
  constructor(
    scene: Phaser.Scene,
    logicalY: number,
    pulseIntvl: number,
  ) {
    super(scene, logicalY, GAME_WIDTH / 2, 0, ObstacleType.PULSE_GRID);
    this.pulseIntvl = pulseIntvl;
  }

  createVisuals(): void {
    this.columns = [];
    this.glowColumns = [];
    const colWidth = GAME_WIDTH / COLUMN_COUNT;
    const h = toPixelH(OBSTACLE_HEIGHT * PULSE_GRID_HEIGHT_MULT);
    const glowH = h * 1.3;

    for (let i = 0; i < COLUMN_COUNT; i++) {
      const cx = colWidth * (i + 0.5);
      const color = i % 2 === 0 ? COLOR_LASER_RED : COLOR_NEON_PURPLE;
      const px = toPixelX(cx);
      const w = toPixelW(colWidth) - 2;

      const glow = this.scene.add.rectangle(px, 0, w + 4, glowH, color, 0.12);
      glow.setBlendMode(Phaser.BlendModes.ADD);
      this.add(glow);
      this.glowColumns.push(glow);

      const col = this.scene.add.rectangle(px, 0, w, h, color, 0.85);
      col.setBlendMode(Phaser.BlendModes.ADD);
      this.add(col);
      this.columns.push(col);
    }

    this.updatePulse();
  }

  updateMovement(deltaSec: number, scrollSpd: number): void {
    if (this.isDestroyed) return;
    this.aliveTime += deltaSec;
    super.updateMovement(deltaSec, scrollSpd);
    this.updatePulse();
  }

  private updatePulse(): void {
    if (this.isDestroyed || !this.columns || this.columns.length === 0) return;
    const cyclePos = (this.aliveTime / this.pulseIntvl) % 2;
    const groupAActive = cyclePos < 1;

    const WARNING_TIME = 0.4;
    const timeInHalf = (cyclePos % 1) * this.pulseIntvl;
    const timeToFlip = this.pulseIntvl - timeInHalf;
    const isWarning = timeToFlip < WARNING_TIME;
    const warningFlicker = isWarning
      ? 0.3 + 0.7 * Math.abs(Math.sin(timeToFlip * 20))
      : 1.0;

    for (let i = 0; i < this.columns.length; i++) {
      const isGroupA = i % 2 === 0;
      const active = isGroupA ? groupAActive : !groupAActive;
      this.columns[i].setAlpha(active ? 0.85 * warningFlicker : 0.08);
      this.columns[i].setVisible(true);
      if (this.glowColumns && this.glowColumns[i]) {
        this.glowColumns[i].setAlpha(active ? 0.12 * warningFlicker : 0.02);
      }
    }
  }

  private isColumnActive(index: number): boolean {
    const cyclePos = (this.aliveTime / this.pulseIntvl) % 2;
    const groupAActive = cyclePos < 1;
    const isGroupA = index % 2 === 0;
    return isGroupA ? groupAActive : !groupAActive;
  }

  getCollisionRects(): LogicalRect[] {
    const rects: LogicalRect[] = [];
    const colWidth = GAME_WIDTH / COLUMN_COUNT;
    const obsH = OBSTACLE_HEIGHT * PULSE_GRID_HEIGHT_MULT;

    for (let i = 0; i < COLUMN_COUNT; i++) {
      if (this.isColumnActive(i)) {
        rects.push({
          x: colWidth * i,
          y: this.logicalY - obsH / 2,
          w: colWidth,
          h: obsH,
        });
      }
    }

    return rects;
  }

  protected syncPosition(): void {
    const obsH = OBSTACLE_HEIGHT * PULSE_GRID_HEIGHT_MULT;
    this.y = (GAME_HEIGHT - (this.logicalY + obsH / 2)) * SY;
  }
}
