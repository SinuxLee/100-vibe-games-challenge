import { BaseObstacle } from '../entities/obstacles/BaseObstacle';
import { Player } from '../entities/Player';
import { CollisionSystem } from './CollisionSystem';
import {
  SCORE_PER_TICK, SCORE_TICK_INTERVAL,
  SCORE_OBSTACLE_PASS, SCORE_NEAR_MISS,
  PLAYER_START_Y,
  COMBO_INCREMENT, COMBO_BASE, COMBO_MERCY_MULTIPLIER, COMBO_MERCY_MIN,
  COMBO_MILESTONE_INTERVAL,
} from '../constants';

export class ScoreManager {
  private score = 0;
  private survivalTime = 0;
  private tickTimer = 0;
  private nearMissCount = 0;
  private comboCount = 0;
  private comboMultiplier = COMBO_BASE;
  private maxCombo = 0;
  private collisionSystem: CollisionSystem;
  private onNearMiss: (() => void) | null = null;
  private onObstaclePass: ((obstacleX: number, obstacleY: number) => void) | null = null;
  private onComboMilestone: ((combo: number, multiplier: number) => void) | null = null;

  constructor(collisionSystem: CollisionSystem) {
    this.collisionSystem = collisionSystem;
  }

  setNearMissCallback(cb: () => void): void {
    this.onNearMiss = cb;
  }

  setObstaclePassCallback(cb: (x: number, y: number) => void): void {
    this.onObstaclePass = cb;
  }

  setComboMilestoneCallback(cb: (combo: number, multiplier: number) => void): void {
    this.onComboMilestone = cb;
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
        this.comboCount++;
        if (this.comboCount > this.maxCombo) {
          this.maxCombo = this.comboCount;
        }
        this.comboMultiplier = COMBO_BASE + COMBO_INCREMENT * this.comboCount;
        const passScore = Math.round(SCORE_OBSTACLE_PASS * this.comboMultiplier);
        this.score += passScore;
        this.onObstaclePass?.(player.x, player.y);

        if (this.comboCount > 0 && this.comboCount % COMBO_MILESTONE_INTERVAL === 0) {
          this.onComboMilestone?.(this.comboCount, this.comboMultiplier);
        }
      }

      if (obs.passed && !obs.nearMissChecked) {
        obs.nearMissChecked = true;
        if (this.collisionSystem.checkNearMiss(player, obs)) {
          const nearMissScore = Math.round(SCORE_NEAR_MISS * this.comboMultiplier);
          this.score += nearMissScore;
          this.nearMissCount++;
          this.onNearMiss?.();
        }
      }
    }
  }

  breakCombo(): void {
    if (this.comboCount > 0) {
      this.comboMultiplier = Math.max(
        COMBO_MERCY_MIN,
        this.comboMultiplier * COMBO_MERCY_MULTIPLIER,
      );
      this.comboCount = 0;
    }
  }

  addScore(amount: number): void {
    this.score = Math.max(0, this.score + Math.round(amount));
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

  getComboCount(): number {
    return this.comboCount;
  }

  getComboMultiplier(): number {
    return this.comboMultiplier;
  }

  getMaxCombo(): number {
    return this.maxCombo;
  }

  reset(): void {
    this.score = 0;
    this.survivalTime = 0;
    this.tickTimer = 0;
    this.nearMissCount = 0;
    this.comboCount = 0;
    this.comboMultiplier = COMBO_BASE;
    this.maxCombo = 0;
  }
}
