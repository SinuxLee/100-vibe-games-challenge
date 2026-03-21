import {
  ObstacleType,
  scrollSpeed, spawnInterval, gapWidth,
  driftSpeed, driftRange, shrinkRate, pulseInterval,
  LEVEL_LABEL_DISPLAY_TIME,
} from '../constants';
import { LevelData } from './LevelConfig';

export class DifficultyDirector {
  private levels: LevelData[];
  private currentLevelIndex = 0;
  private levelElapsedTime = 0;
  private totalElapsedTime = 0;
  private levelChangedCallback: ((level: number, label: string) => void) | null = null;
  private levelCompleteCallback: ((completedLevel: number, nextLevel: number) => void) | null = null;
  private allLevelsCompleteCallback: ((finalLevel: number) => void) | null = null;
  private labelShownForCurrentLevel = false;
  private levelCompleted = false;

  constructor(levels?: LevelData[]) {
    this.levels = levels && levels.length > 0 ? levels : [];
  }

  setLevelChangedCallback(cb: (level: number, label: string) => void): void {
    this.levelChangedCallback = cb;
  }

  setLevelCompleteCallback(cb: (completedLevel: number, nextLevel: number) => void): void {
    this.levelCompleteCallback = cb;
  }

  setAllLevelsCompleteCallback(cb: (finalLevel: number) => void): void {
    this.allLevelsCompleteCallback = cb;
  }

  update(deltaSec: number): void {
    if (this.levelCompleted) return;

    this.totalElapsedTime += deltaSec;
    this.levelElapsedTime += deltaSec;

    if (!this.labelShownForCurrentLevel && this.levelElapsedTime < LEVEL_LABEL_DISPLAY_TIME) {
      const current = this.getCurrentLevelData();
      if (current && current.label) {
        this.labelShownForCurrentLevel = true;
        this.levelChangedCallback?.(current.level, current.label);
      }
    }

    if (this.levels.length > 0) {
      const current = this.getCurrentLevelData();
      if (current && current.duration > 0 && this.levelElapsedTime >= current.duration) {
        this.levelCompleted = true;

        if (this.currentLevelIndex < this.levels.length - 1) {
          const completedLevel = current.level;
          const nextLevel = this.levels[this.currentLevelIndex + 1].level;
          this.levelCompleteCallback?.(completedLevel, nextLevel);
        } else {
          this.allLevelsCompleteCallback?.(current.level);
        }
      }
    }
  }

  advanceToNextLevel(): void {
    if (this.currentLevelIndex < this.levels.length - 1) {
      this.currentLevelIndex++;
      this.levelElapsedTime = 0;
      this.labelShownForCurrentLevel = false;
      this.levelCompleted = false;
    }
  }

  getTotalLevelCount(): number {
    return this.levels.length;
  }

  private getCurrentLevelData(): LevelData | null {
    if (this.levels.length === 0) return null;
    return this.levels[this.currentLevelIndex];
  }

  private isUsingLevels(): boolean {
    return this.levels.length > 0;
  }

  getElapsedTime(): number {
    return this.totalElapsedTime;
  }

  getCurrentLevel(): number {
    const data = this.getCurrentLevelData();
    return data ? data.level : 0;
  }

  getCurrentLevelIndex(): number {
    return this.currentLevelIndex;
  }

  getLevelLabel(): string {
    const data = this.getCurrentLevelData();
    if (data && this.levelElapsedTime < LEVEL_LABEL_DISPLAY_TIME) {
      return data.label;
    }
    return '';
  }

  isEndless(): boolean {
    const data = this.getCurrentLevelData();
    return data !== null && data.duration === 0;
  }

  isLevelCompleted(): boolean {
    return this.levelCompleted;
  }

  private getLevelProgress(): number {
    const data = this.getCurrentLevelData();
    if (!data || data.duration <= 0) return 1;
    const t = Math.min(1, this.levelElapsedTime / data.duration);
    return t * t;
  }

  getScrollSpeed(): number {
    const data = this.getCurrentLevelData();
    if (data) {
      if (data.duration > 0) {
        return data.scrollSpeed * (0.9 + 0.1 * this.getLevelProgress());
      }
      return data.scrollSpeed;
    }
    return scrollSpeed(this.totalElapsedTime);
  }

  getSpawnInterval(): number {
    const data = this.getCurrentLevelData();
    if (data) {
      if (data.duration > 0) {
        return data.spawnInterval * (1.15 - 0.15 * this.getLevelProgress());
      }
      return data.spawnInterval;
    }
    return spawnInterval(this.totalElapsedTime);
  }

  getGapWidth(): number {
    const data = this.getCurrentLevelData();
    if (data) {
      if (data.duration > 0) {
        const progress = Math.min(1, this.levelElapsedTime / data.duration);
        const easeProgress = progress * progress;
        return data.gapWidth * (1.2 - 0.2 * easeProgress);
      }
      return data.gapWidth;
    }
    return gapWidth(this.totalElapsedTime);
  }

  getDriftSpeed(): number {
    const data = this.getCurrentLevelData();
    if (data) return data.driftSpeed;
    return driftSpeed(this.totalElapsedTime);
  }

  getDriftRange(): number {
    const data = this.getCurrentLevelData();
    if (data) return data.driftRange;
    return driftRange(this.totalElapsedTime);
  }

  getShrinkRate(): number {
    const data = this.getCurrentLevelData();
    if (data) return data.shrinkRate;
    return shrinkRate(this.totalElapsedTime);
  }

  getPulseInterval(): number {
    const data = this.getCurrentLevelData();
    if (data) return data.pulseInterval;
    return pulseInterval(this.totalElapsedTime);
  }

  getUnlockedTypes(): ObstacleType[] {
    const data = this.getCurrentLevelData();
    if (data) return data.obstacleTypes;
    return [ObstacleType.SINGLE_GAP];
  }

  reset(): void {
    this.currentLevelIndex = 0;
    this.levelElapsedTime = 0;
    this.totalElapsedTime = 0;
    this.labelShownForCurrentLevel = false;
    this.levelCompleted = false;
  }
}
