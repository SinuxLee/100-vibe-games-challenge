import Phaser from 'phaser';
import { BaseObstacle } from '../entities/obstacles/BaseObstacle';
import { SingleGapWall } from '../entities/obstacles/SingleGapWall';
import { DriftingGapWall } from '../entities/obstacles/DriftingGapWall';
import { DualGapWall } from '../entities/obstacles/DualGapWall';
import { ShrinkingGate } from '../entities/obstacles/ShrinkingGate';
import { PulseGrid } from '../entities/obstacles/PulseGrid';
import { DifficultyDirector } from './DifficultyDirector';
import {
  ObstacleType, OBSTACLE_SPAWN_Y, GAME_WIDTH,
  PLAYER_MAX_SPEED, PLAYER_WIDTH,
  MAX_CONSECUTIVE_SAME, REACTION_BUFFER_MIN, REACTION_BUFFER_MAX,
} from '../constants';

export class ObstacleManager {
  private scene: Phaser.Scene;
  private director: DifficultyDirector;
  private obstacles: BaseObstacle[] = [];
  private spawnTimer = 0;
  private lastGapCenterX: number;
  private consecutiveTypeCount = 0;
  private lastType: ObstacleType | null = null;

  constructor(scene: Phaser.Scene, director: DifficultyDirector) {
    this.scene = scene;
    this.director = director;
    this.lastGapCenterX = GAME_WIDTH / 2;
  }

  update(deltaSec: number): void {
    const scrollSpd = this.director.getScrollSpeed();

    this.spawnTimer -= deltaSec;
    if (this.spawnTimer <= 0) {
      this.spawnObstacle();
      this.spawnTimer = this.director.getSpawnInterval();
    }

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      if (obs.isOffScreen()) {
        obs.destroySelf();
        this.obstacles.splice(i, 1);
        continue;
      }
      obs.updateMovement(deltaSec, scrollSpd);
    }
  }

  getObstacles(): BaseObstacle[] {
    return this.obstacles;
  }

  private spawnObstacle(): void {
    const types = this.director.getUnlockedTypes();
    const type = this.pickType(types);
    const gw = this.director.getGapWidth();
    const gapCenter = this.computeFairGapCenter(gw);

    let obstacle: BaseObstacle;

    switch (type) {
      case ObstacleType.DRIFTING_GAP:
        obstacle = new DriftingGapWall(
          this.scene, OBSTACLE_SPAWN_Y, gapCenter, gw,
          this.director.getDriftSpeed(), this.director.getDriftRange(),
        );
        break;

      case ObstacleType.DUAL_GAP: {
        const gap2Center = this.computeSecondGapCenter(gapCenter, gw);
        obstacle = new DualGapWall(
          this.scene, OBSTACLE_SPAWN_Y,
          gapCenter, gw, gap2Center, gw * 0.8,
        );
        break;
      }

      case ObstacleType.SHRINKING_GATE:
        obstacle = new ShrinkingGate(
          this.scene, OBSTACLE_SPAWN_Y, gapCenter, gw * 1.4,
          this.director.getShrinkRate(),
        );
        break;

      case ObstacleType.PULSE_GRID:
        obstacle = new PulseGrid(
          this.scene, OBSTACLE_SPAWN_Y,
          this.director.getPulseInterval(),
        );
        break;

      case ObstacleType.SINGLE_GAP:
      default:
        obstacle = new SingleGapWall(this.scene, OBSTACLE_SPAWN_Y, gapCenter, gw);
        break;
    }

    this.obstacles.push(obstacle);
    this.lastGapCenterX = gapCenter;
  }

  private pickType(available: ObstacleType[]): ObstacleType {
    if (available.length === 0) return ObstacleType.SINGLE_GAP;
    if (available.length === 1) return available[0];

    let candidates = [...available];

    if (this.lastType && this.consecutiveTypeCount >= MAX_CONSECUTIVE_SAME) {
      candidates = candidates.filter(t => t !== this.lastType);
    }

    const weights = candidates.map(t => {
      if (t === ObstacleType.SINGLE_GAP) return 3;
      if (t === ObstacleType.DRIFTING_GAP) return 2;
      if (t === ObstacleType.DUAL_GAP) return 2;
      if (t === ObstacleType.SHRINKING_GATE) return 1.5;
      if (t === ObstacleType.PULSE_GRID) return 1;
      return 1;
    });

    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let roll = Math.random() * totalWeight;
    let chosen = candidates[0];
    for (let i = 0; i < candidates.length; i++) {
      roll -= weights[i];
      if (roll <= 0) {
        chosen = candidates[i];
        break;
      }
    }

    if (chosen === this.lastType) {
      this.consecutiveTypeCount++;
    } else {
      this.consecutiveTypeCount = 1;
      this.lastType = chosen;
    }

    return chosen;
  }

  private computeFairGapCenter(gw: number): number {
    const halfGap = gw / 2;
    const minCenter = halfGap;
    const maxCenter = GAME_WIDTH - halfGap;

    const travelTime = (OBSTACLE_SPAWN_Y - 20) / this.director.getScrollSpeed();
    const reactionBuffer = REACTION_BUFFER_MIN + Math.random() * (REACTION_BUFFER_MAX - REACTION_BUFFER_MIN);
    const maxReachable = PLAYER_MAX_SPEED * Math.max(0, travelTime - reactionBuffer);

    const rawCenter = minCenter + Math.random() * (maxCenter - minCenter);

    return Phaser.Math.Clamp(
      rawCenter,
      Math.max(minCenter, this.lastGapCenterX - maxReachable),
      Math.min(maxCenter, this.lastGapCenterX + maxReachable),
    );
  }

  private computeSecondGapCenter(firstGapCenter: number, gw: number): number {
    const gap2W = gw * 0.8;
    const halfGap2 = gap2W / 2;
    const minSeparation = gw / 2 + gap2W / 2 + PLAYER_WIDTH;

    const minCenter = halfGap2;
    const maxCenter = GAME_WIDTH - halfGap2;

    let attempts = 0;
    let gap2Center: number;
    do {
      gap2Center = minCenter + Math.random() * (maxCenter - minCenter);
      attempts++;
    } while (
      Math.abs(gap2Center - firstGapCenter) < minSeparation &&
      attempts < 20
    );

    if (Math.abs(gap2Center - firstGapCenter) < minSeparation) {
      gap2Center = firstGapCenter + minSeparation;
      if (gap2Center > maxCenter) {
        gap2Center = firstGapCenter - minSeparation;
      }
      gap2Center = Phaser.Math.Clamp(gap2Center, minCenter, maxCenter);
    }

    return gap2Center;
  }

  reset(): void {
    for (const obs of this.obstacles) {
      obs.destroySelf();
    }
    this.obstacles = [];
    this.spawnTimer = 0;
    this.lastGapCenterX = GAME_WIDTH / 2;
    this.consecutiveTypeCount = 0;
    this.lastType = null;
  }
}
