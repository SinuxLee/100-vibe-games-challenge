import { describe, it, expect, beforeEach } from 'vitest';
import { DifficultyDirector } from '../../src/systems/DifficultyDirector';
import { ObstacleType } from '../../src/constants';

describe('DifficultyDirector', () => {
  let director: DifficultyDirector;

  beforeEach(() => {
    director = new DifficultyDirector();
  });

  describe('time tracking', () => {
    it('starts at 0', () => {
      expect(director.getElapsedTime()).toBe(0);
    });

    it('accumulates time from updates', () => {
      director.update(1.0);
      expect(director.getElapsedTime()).toBeCloseTo(1.0);
      director.update(0.5);
      expect(director.getElapsedTime()).toBeCloseTo(1.5);
    });

    it('resets to 0', () => {
      director.update(10);
      director.reset();
      expect(director.getElapsedTime()).toBe(0);
    });
  });

  describe('difficulty values at t=0', () => {
    it('scroll speed starts at 8', () => {
      expect(director.getScrollSpeed()).toBe(8);
    });

    it('spawn interval starts at 1.6', () => {
      expect(director.getSpawnInterval()).toBe(1.6);
    });

    it('gap width starts at 30', () => {
      expect(director.getGapWidth()).toBe(30);
    });

    it('drift speed starts at 2', () => {
      expect(director.getDriftSpeed()).toBe(2);
    });

    it('drift range starts at 5', () => {
      expect(director.getDriftRange()).toBe(5);
    });

    it('shrink rate starts at 1.5', () => {
      expect(director.getShrinkRate()).toBe(1.5);
    });

    it('pulse interval starts at 0.8', () => {
      expect(director.getPulseInterval()).toBe(0.8);
    });
  });

  describe('difficulty progression', () => {
    it('scroll speed increases over time', () => {
      const speed0 = director.getScrollSpeed();
      director.update(30);
      const speed30 = director.getScrollSpeed();
      director.update(30);
      const speed60 = director.getScrollSpeed();

      expect(speed30).toBeGreaterThan(speed0);
      expect(speed60).toBeGreaterThan(speed30);
    });

    it('spawn interval decreases over time', () => {
      const int0 = director.getSpawnInterval();
      director.update(30);
      expect(director.getSpawnInterval()).toBeLessThan(int0);
    });

    it('gap width decreases over time', () => {
      const gw0 = director.getGapWidth();
      director.update(30);
      expect(director.getGapWidth()).toBeLessThan(gw0);
    });
  });

  describe('obstacle unlocking', () => {
    it('only SINGLE_GAP during easy period (< 10s)', () => {
      director.update(5);
      const types = director.getUnlockedTypes();
      expect(types).toEqual([ObstacleType.SINGLE_GAP]);
    });

    it('only SINGLE_GAP at t=9.9', () => {
      director.update(9.9);
      expect(director.getUnlockedTypes()).toEqual([ObstacleType.SINGLE_GAP]);
    });

    it('still only SINGLE_GAP at t=10 (just past easy period, before B unlock)', () => {
      director.update(10);
      const types = director.getUnlockedTypes();
      expect(types).toEqual([ObstacleType.SINGLE_GAP]);
    });

    it('SINGLE_GAP + DRIFTING_GAP at t=15', () => {
      director.update(15);
      const types = director.getUnlockedTypes();
      expect(types).toContain(ObstacleType.SINGLE_GAP);
      expect(types).toContain(ObstacleType.DRIFTING_GAP);
      expect(types).toHaveLength(2);
    });

    it('adds DUAL_GAP at t=30', () => {
      director.update(30);
      const types = director.getUnlockedTypes();
      expect(types).toContain(ObstacleType.DUAL_GAP);
      expect(types).toHaveLength(3);
    });

    it('adds SHRINKING_GATE at t=50', () => {
      director.update(50);
      const types = director.getUnlockedTypes();
      expect(types).toContain(ObstacleType.SHRINKING_GATE);
      expect(types).toHaveLength(4);
    });

    it('all 5 types at t=75', () => {
      director.update(75);
      const types = director.getUnlockedTypes();
      expect(types).toHaveLength(5);
      expect(types).toContain(ObstacleType.SINGLE_GAP);
      expect(types).toContain(ObstacleType.DRIFTING_GAP);
      expect(types).toContain(ObstacleType.DUAL_GAP);
      expect(types).toContain(ObstacleType.SHRINKING_GATE);
      expect(types).toContain(ObstacleType.PULSE_GRID);
    });
  });

  describe('reset behavior', () => {
    it('restores all values to t=0 after reset', () => {
      director.update(100);
      director.reset();

      expect(director.getElapsedTime()).toBe(0);
      expect(director.getScrollSpeed()).toBe(8);
      expect(director.getSpawnInterval()).toBe(1.6);
      expect(director.getGapWidth()).toBe(30);
      expect(director.getUnlockedTypes()).toEqual([ObstacleType.SINGLE_GAP]);
    });
  });
});
