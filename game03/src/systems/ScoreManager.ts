import { BaseObstacle } from '../entities/obstacles/BaseObstacle';
import { Player } from '../entities/Player';
import { CollisionSystem } from './CollisionSystem';
import {
  SCORE_PER_TICK, SCORE_TICK_INTERVAL,
  SCORE_OBSTACLE_PASS, SCORE_NEAR_MISS,
  PLAYER_START_Y,
} from '../constants';

export class ScoreManager {
  private score = 0;
  private survivalTime = 0;
  private tickTimer = 0;
  private nearMissCount = 0;
  private collisionSystem: CollisionSystem;
  private onNearMiss: (() => void) | null = null;
  private onObstaclePass: ((obstacleX: number, obstacleY: number) => void) | null = null;

  constructor(collisionSystem: CollisionSystem) {
    this.collisionSystem = collisionSystem;
  }

  setNearMissCallback(cb: () => void): void {
    this.onNearMiss = cb;
  }

  setObstaclePassCallback(cb: (x: number, y: number) => void): void {
    this.onObstaclePass = cb;
  }

  update(deltaSec: number, player: Player, obstacles: BaseObstacle[]): void {
    this.survivalTime += deltaSec;

    this.tickTimer += deltaSec;
    while (this.tickTimer >= SCORE_TICK_INTERVAL) {
      this.score += SCORE_PER_TICK;
      this.tickTimer -= SCORE_TICK_INTERVAL;
    }

    for (const obs of obstacles) {
      if (!obs.passed && obs.logicalY < PLAYER_START_Y) {
        obs.passed = true;
        this.score += SCORE_OBSTACLE_PASS;
        this.onObstaclePass?.(player.x, player.y);
      }

      if (obs.passed && !obs.nearMissChecked) {
        obs.nearMissChecked = true;
        if (this.collisionSystem.checkNearMiss(player, obs)) {
          this.score += SCORE_NEAR_MISS;
          this.nearMissCount++;
          this.onNearMiss?.();
        }
      }
    }
  }

  getScore(): number {
    return this.score;
  }

  getSurvivalTime(): number {
    return this.survivalTime;
  }

  getNearMissCount(): number {
    return this.nearMissCount;
  }

  reset(): void {
    this.score = 0;
    this.survivalTime = 0;
    this.tickTimer = 0;
    this.nearMissCount = 0;
  }
}
