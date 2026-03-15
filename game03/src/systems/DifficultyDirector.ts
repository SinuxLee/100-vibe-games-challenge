import {
  ObstacleType, OBSTACLE_UNLOCK, EASY_PERIOD,
  scrollSpeed, spawnInterval, gapWidth,
  driftSpeed, driftRange, shrinkRate, pulseInterval,
} from '../constants';

export class DifficultyDirector {
  private elapsedTime = 0;

  update(deltaSec: number): void {
    this.elapsedTime += deltaSec;
  }

  getElapsedTime(): number {
    return this.elapsedTime;
  }

  getScrollSpeed(): number {
    return scrollSpeed(this.elapsedTime);
  }

  getSpawnInterval(): number {
    return spawnInterval(this.elapsedTime);
  }

  getGapWidth(): number {
    return gapWidth(this.elapsedTime);
  }

  getDriftSpeed(): number {
    return driftSpeed(this.elapsedTime);
  }

  getDriftRange(): number {
    return driftRange(this.elapsedTime);
  }

  getShrinkRate(): number {
    return shrinkRate(this.elapsedTime);
  }

  getPulseInterval(): number {
    return pulseInterval(this.elapsedTime);
  }

  getUnlockedTypes(): ObstacleType[] {
    const types: ObstacleType[] = [];
    for (const [type, unlockTime] of Object.entries(OBSTACLE_UNLOCK)) {
      if (this.elapsedTime >= unlockTime) {
        types.push(type as ObstacleType);
      }
    }
    if (this.elapsedTime < EASY_PERIOD) {
      return [ObstacleType.SINGLE_GAP];
    }
    return types;
  }

  reset(): void {
    this.elapsedTime = 0;
  }
}
