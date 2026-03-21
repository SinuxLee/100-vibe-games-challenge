import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DifficultyDirector } from '../../src/systems/DifficultyDirector';
import { ObstacleType } from '../../src/constants';
import { LevelData } from '../../src/systems/LevelConfig';

function makeLevels(overrides?: Partial<LevelData>[]): LevelData[] {
  const defaults: LevelData[] = [
    { level: 1, scrollSpeed: 4, spawnInterval: 3.0, gapWidth: 50, driftSpeed: 0, driftRange: 0, shrinkRate: 0, pulseInterval: 0, obstacleTypes: [ObstacleType.SINGLE_GAP], duration: 10, label: 'START' },
    { level: 2, scrollSpeed: 6, spawnInterval: 2.2, gapWidth: 42, driftSpeed: 1.5, driftRange: 6, shrinkRate: 0, pulseInterval: 0, obstacleTypes: [ObstacleType.SINGLE_GAP, ObstacleType.DRIFTING_GAP], duration: 15, label: 'DRIFT!' },
    { level: 3, scrollSpeed: 12, spawnInterval: 1.2, gapWidth: 25, driftSpeed: 3, driftRange: 12, shrinkRate: 3.5, pulseInterval: 1.2, obstacleTypes: [ObstacleType.SINGLE_GAP, ObstacleType.DRIFTING_GAP, ObstacleType.DUAL_GAP, ObstacleType.SHRINKING_GATE, ObstacleType.PULSE_GRID], duration: 0, label: 'ENDLESS' },
  ];
  if (overrides) {
    return defaults.map((d, i) => overrides[i] ? { ...d, ...overrides[i] } : d);
  }
  return defaults;
}

describe('DifficultyDirector', () => {
  describe('without levels (formula fallback)', () => {
    let director: DifficultyDirector;

    beforeEach(() => {
      director = new DifficultyDirector();
    });

    it('starts at elapsed time 0', () => {
      expect(director.getElapsedTime()).toBe(0);
    });

    it('accumulates time from updates', () => {
      director.update(1.0);
      expect(director.getElapsedTime()).toBeCloseTo(1.0);
      director.update(0.5);
      expect(director.getElapsedTime()).toBeCloseTo(1.5);
    });

    it('uses formula fallback for scroll speed at t=0', () => {
      expect(director.getScrollSpeed()).toBe(15);
    });

    it('uses formula fallback for spawn interval at t=0', () => {
      expect(director.getSpawnInterval()).toBe(3.0);
    });

    it('uses formula fallback for gap width at t=0', () => {
      expect(director.getGapWidth()).toBe(30);
    });

    it('returns SINGLE_GAP as only unlocked type without levels', () => {
      expect(director.getUnlockedTypes()).toEqual([ObstacleType.SINGLE_GAP]);
    });

    it('getCurrentLevel returns 0 without levels', () => {
      expect(director.getCurrentLevel()).toBe(0);
    });

    it('isEndless returns false without levels', () => {
      expect(director.isEndless()).toBe(false);
    });

    it('getLevelLabel returns empty without levels', () => {
      expect(director.getLevelLabel()).toBe('');
    });

    it('scroll speed increases over time with formulas', () => {
      const speed0 = director.getScrollSpeed();
      director.update(30);
      expect(director.getScrollSpeed()).toBeGreaterThan(speed0);
    });

    it('resets to 0', () => {
      director.update(10);
      director.reset();
      expect(director.getElapsedTime()).toBe(0);
      expect(director.getScrollSpeed()).toBe(15);
    });
  });

  describe('with levels', () => {
    let director: DifficultyDirector;
    let levels: LevelData[];

    beforeEach(() => {
      levels = makeLevels();
      director = new DifficultyDirector(levels);
    });

    describe('initial state', () => {
      it('starts at level 1', () => {
        expect(director.getCurrentLevel()).toBe(1);
      });

      it('returns level 1 scroll speed (starts at 90% of target)', () => {
        expect(director.getScrollSpeed()).toBeCloseTo(4 * 0.9);
      });

      it('returns level 1 spawn interval (starts at 115% of target)', () => {
        expect(director.getSpawnInterval()).toBeCloseTo(3.0 * 1.15);
      });

      it('returns level 1 gap width (starts at 120% of target)', () => {
        expect(director.getGapWidth()).toBeCloseTo(50 * 1.2);
      });

      it('returns level 1 obstacle types', () => {
        expect(director.getUnlockedTypes()).toEqual([ObstacleType.SINGLE_GAP]);
      });

      it('is not endless at level 1', () => {
        expect(director.isEndless()).toBe(false);
      });

      it('returns level 1 drift speed', () => {
        expect(director.getDriftSpeed()).toBe(0);
      });

      it('returns level 1 drift range', () => {
        expect(director.getDriftRange()).toBe(0);
      });

      it('returns level 1 shrink rate', () => {
        expect(director.getShrinkRate()).toBe(0);
      });

      it('returns level 1 pulse interval', () => {
        expect(director.getPulseInterval()).toBe(0);
      });
    });

    describe('level progression', () => {
      it('marks level completed after duration expires', () => {
        director.update(10.1);
        expect(director.isLevelCompleted()).toBe(true);
        expect(director.getCurrentLevel()).toBe(1);
      });

      it('advances to level 2 after advanceToNextLevel', () => {
        director.update(10.1);
        director.advanceToNextLevel();
        expect(director.getCurrentLevel()).toBe(2);
        expect(director.isLevelCompleted()).toBe(false);
      });

      it('stays on level 1 before duration expires', () => {
        director.update(9.9);
        expect(director.getCurrentLevel()).toBe(1);
        expect(director.isLevelCompleted()).toBe(false);
      });

      it('stops updating when level is completed', () => {
        director.update(10.1);
        const timeAfterComplete = director.getElapsedTime();
        director.update(5.0);
        expect(director.getElapsedTime()).toBeCloseTo(timeAfterComplete);
      });

      it('returns level 2 parameters after advancing (at intra-level start)', () => {
        director.update(10.1);
        director.advanceToNextLevel();
        expect(director.getScrollSpeed()).toBeCloseTo(6 * 0.9);
        expect(director.getSpawnInterval()).toBeCloseTo(2.2 * 1.15);
        expect(director.getGapWidth()).toBeCloseTo(42 * 1.2);
        expect(director.getUnlockedTypes()).toContain(ObstacleType.DRIFTING_GAP);
      });

      it('advances to level 3 after level 2 duration', () => {
        director.update(10.1);
        director.advanceToNextLevel();
        director.update(15.1);
        director.advanceToNextLevel();
        expect(director.getCurrentLevel()).toBe(3);
      });

      it('tracks total elapsed time across levels', () => {
        director.update(10.1);
        director.advanceToNextLevel();
        director.update(15.1);
        director.advanceToNextLevel();
        expect(director.getElapsedTime()).toBeCloseTo(25.2);
      });

      it('does not advance past last level', () => {
        director.update(10.1);
        director.advanceToNextLevel();
        director.update(15.1);
        director.advanceToNextLevel();
        director.update(100);
        expect(director.getCurrentLevel()).toBe(3);
      });
    });

    describe('endless level', () => {
      it('last level (duration=0) is endless', () => {
        director.update(10.1);
        director.advanceToNextLevel();
        director.update(15.1);
        director.advanceToNextLevel();
        expect(director.isEndless()).toBe(true);
      });

      it('stays on endless level indefinitely', () => {
        director.update(10.1);
        director.advanceToNextLevel();
        director.update(15.1);
        director.advanceToNextLevel();
        director.update(500);
        expect(director.getCurrentLevel()).toBe(3);
        expect(director.isEndless()).toBe(true);
      });
    });

    describe('level label', () => {
      it('returns label at start of level', () => {
        director.update(0.1);
        expect(director.getLevelLabel()).toBe('START');
      });

      it('returns empty label after display time expires', () => {
        director.update(3.0);
        expect(director.getLevelLabel()).toBe('');
      });

      it('returns new label after level change', () => {
        director.update(10.1);
        director.advanceToNextLevel();
        director.update(0.1);
        expect(director.getLevelLabel()).toBe('DRIFT!');
      });
    });

    describe('level complete callback', () => {
      it('fires levelCompleteCallback when level duration expires', () => {
        const cb = vi.fn();
        director.setLevelCompleteCallback(cb);
        director.update(10.1);
        expect(cb).toHaveBeenCalledWith(1, 2);
      });

      it('does not fire callback before duration expires', () => {
        const cb = vi.fn();
        director.setLevelCompleteCallback(cb);
        director.update(9.9);
        expect(cb).not.toHaveBeenCalled();
      });

      it('fires allLevelsCompleteCallback on last non-endless level', () => {
        const finiteLevels: LevelData[] = [
          { level: 1, scrollSpeed: 4, spawnInterval: 3.0, gapWidth: 50, driftSpeed: 0, driftRange: 0, shrinkRate: 0, pulseInterval: 0, obstacleTypes: [ObstacleType.SINGLE_GAP], duration: 10, label: 'START' },
          { level: 2, scrollSpeed: 6, spawnInterval: 2.2, gapWidth: 42, driftSpeed: 1.5, driftRange: 6, shrinkRate: 0, pulseInterval: 0, obstacleTypes: [ObstacleType.SINGLE_GAP, ObstacleType.DRIFTING_GAP], duration: 15, label: 'FINAL' },
        ];
        const d = new DifficultyDirector(finiteLevels);
        const completeCb = vi.fn();
        const allCompleteCb = vi.fn();
        d.setLevelCompleteCallback(completeCb);
        d.setAllLevelsCompleteCallback(allCompleteCb);
        d.update(10.1);
        d.advanceToNextLevel();
        d.update(15.1);
        expect(allCompleteCb).toHaveBeenCalledWith(2);
        expect(completeCb).toHaveBeenCalledTimes(1);
      });

      it('stops updating after level complete until advanceToNextLevel', () => {
        director.update(10.1);
        expect(director.isLevelCompleted()).toBe(true);
        const time = director.getElapsedTime();
        director.update(5.0);
        expect(director.getElapsedTime()).toBeCloseTo(time);
        director.advanceToNextLevel();
        expect(director.isLevelCompleted()).toBe(false);
        director.update(1.0);
        expect(director.getElapsedTime()).toBeCloseTo(time + 1.0);
      });

      it('getTotalLevelCount returns correct count', () => {
        expect(director.getTotalLevelCount()).toBe(3);
      });

      it('getCurrentLevelIndex starts at 0', () => {
        expect(director.getCurrentLevelIndex()).toBe(0);
      });

      it('getCurrentLevelIndex advances with advanceToNextLevel', () => {
        director.update(10.1);
        director.advanceToNextLevel();
        expect(director.getCurrentLevelIndex()).toBe(1);
      });
    });

    describe('level change callback (label display)', () => {
      it('fires callback when level label is shown', () => {
        const cb = vi.fn();
        director.setLevelChangedCallback(cb);
        director.update(0.1);
        expect(cb).toHaveBeenCalledWith(1, 'START');
      });

      it('fires callback for level 2 label', () => {
        const cb = vi.fn();
        director.setLevelChangedCallback(cb);
        director.update(10.1);
        director.advanceToNextLevel();
        director.update(0.1);
        expect(cb).toHaveBeenCalledWith(2, 'DRIFT!');
      });

      it('does not fire callback for levels without label', () => {
        const noLabelLevels = makeLevels([{ label: '' }, { label: '' }, { label: '' }]);
        const d = new DifficultyDirector(noLabelLevels);
        const cb = vi.fn();
        d.setLevelChangedCallback(cb);
        d.update(0.5);
        expect(cb).not.toHaveBeenCalled();
      });
    });

    describe('reset', () => {
      it('resets to level 1', () => {
        director.update(10.1);
        director.advanceToNextLevel();
        director.update(15.1);
        director.advanceToNextLevel();
        director.reset();
        expect(director.getCurrentLevel()).toBe(1);
        expect(director.getElapsedTime()).toBe(0);
        expect(director.getScrollSpeed()).toBeCloseTo(4 * 0.9);
        expect(director.getUnlockedTypes()).toEqual([ObstacleType.SINGLE_GAP]);
        expect(director.isLevelCompleted()).toBe(false);
      });

      it('resets label shown flag', () => {
        director.update(0.1);
        director.reset();
        const cb = vi.fn();
        director.setLevelChangedCallback(cb);
        director.update(0.1);
        expect(cb).toHaveBeenCalledWith(1, 'START');
      });

      it('resets levelCompleted flag', () => {
        director.update(10.1);
        expect(director.isLevelCompleted()).toBe(true);
        director.reset();
        expect(director.isLevelCompleted()).toBe(false);
      });
    });
  });

  describe('with empty levels array', () => {
    it('falls back to formulas', () => {
      const director = new DifficultyDirector([]);
      expect(director.getScrollSpeed()).toBe(15);
      expect(director.getCurrentLevel()).toBe(0);
    });
  });
});
