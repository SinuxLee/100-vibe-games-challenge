import { describe, it, expect } from 'vitest';
import {
  scrollSpeed, spawnInterval, gapWidth,
  driftSpeed, driftRange, shrinkRate, pulseInterval,
  toPixelX, toPixelY, toPixelW, toPixelH,
  toLogicalX, toLogicalY,
  GAME_WIDTH, GAME_HEIGHT, CANVAS_WIDTH, CANVAS_HEIGHT,
  SX, SY,
} from '../../src/constants';

describe('Difficulty formulas', () => {
  describe('scrollSpeed(t)', () => {
    it('returns 15 at t=0', () => {
      expect(scrollSpeed(0)).toBe(15);
    });

    it('increases over time', () => {
      expect(scrollSpeed(10)).toBeGreaterThan(scrollSpeed(0));
      expect(scrollSpeed(30)).toBeGreaterThan(scrollSpeed(10));
    });

    it('caps at 65', () => {
      expect(scrollSpeed(200)).toBe(65);
      expect(scrollSpeed(1000)).toBe(65);
    });

    it('matches formula: min(65, 15 + 0.3t + 0.003t²)', () => {
      const t = 25;
      const expected = Math.min(65, 15 + 0.3 * t + 0.003 * t * t);
      expect(scrollSpeed(t)).toBeCloseTo(expected, 10);
    });
  });

  describe('spawnInterval(t)', () => {
    it('returns 3.0 at t=0', () => {
      expect(spawnInterval(0)).toBe(3.0);
    });

    it('decreases over time', () => {
      expect(spawnInterval(20)).toBeLessThan(spawnInterval(0));
    });

    it('floors at 0.6', () => {
      expect(spawnInterval(500)).toBe(0.6);
    });

    it('matches formula: max(0.6, 3.0 - 0.015t)', () => {
      const t = 50;
      const expected = Math.max(0.6, 3.0 - 0.015 * t);
      expect(spawnInterval(t)).toBeCloseTo(expected, 10);
    });
  });

  describe('gapWidth(t)', () => {
    it('returns 30 at t=0', () => {
      expect(gapWidth(0)).toBe(30);
    });

    it('decreases over time', () => {
      expect(gapWidth(50)).toBeLessThan(gapWidth(0));
    });

    it('floors at 14', () => {
      expect(gapWidth(500)).toBe(14);
    });

    it('matches formula: max(14, 30 - 0.12t)', () => {
      const t = 80;
      const expected = Math.max(14, 30 - 0.12 * t);
      expect(gapWidth(t)).toBeCloseTo(expected, 10);
    });
  });

  describe('driftSpeed(t)', () => {
    it('starts at 2 at t=0', () => {
      expect(driftSpeed(0)).toBe(2);
    });

    it('caps at 8', () => {
      expect(driftSpeed(1000)).toBe(8);
    });
  });

  describe('driftRange(t)', () => {
    it('starts at 5 at t=0', () => {
      expect(driftRange(0)).toBe(5);
    });

    it('caps at 15', () => {
      expect(driftRange(1000)).toBe(15);
    });
  });

  describe('shrinkRate(t)', () => {
    it('starts at 4 at t=0', () => {
      expect(shrinkRate(0)).toBe(4);
    });

    it('caps at 20', () => {
      expect(shrinkRate(1000)).toBe(20);
    });
  });

  describe('pulseInterval(t)', () => {
    it('starts at 0.6 at t=0', () => {
      expect(pulseInterval(0)).toBe(0.6);
    });

    it('floors at 0.35', () => {
      expect(pulseInterval(1000)).toBe(0.35);
    });
  });
});

describe('Coordinate conversion', () => {
  describe('scale factors', () => {
    it('SX = CANVAS_WIDTH / GAME_WIDTH', () => {
      expect(SX).toBe(CANVAS_WIDTH / GAME_WIDTH);
      expect(SX).toBe(7.5);
    });

    it('SY = CANVAS_HEIGHT / GAME_HEIGHT', () => {
      expect(SY).toBe(CANVAS_HEIGHT / GAME_HEIGHT);
      expect(SY).toBeCloseTo(8.3375, 4);
    });
  });

  describe('toPixelX / toLogicalX roundtrip', () => {
    it('converts logical X to pixel X', () => {
      expect(toPixelX(0)).toBe(0);
      expect(toPixelX(50)).toBe(375);
      expect(toPixelX(100)).toBe(750);
    });

    it('roundtrips correctly', () => {
      for (const lx of [0, 10, 50, 75, 100]) {
        expect(toLogicalX(toPixelX(lx))).toBeCloseTo(lx, 10);
      }
    });
  });

  describe('toPixelY / toLogicalY roundtrip', () => {
    it('Y=0 (bottom) maps to CANVAS_HEIGHT', () => {
      expect(toPixelY(0)).toBeCloseTo(CANVAS_HEIGHT, 1);
    });

    it('Y=GAME_HEIGHT (top) maps to 0', () => {
      expect(toPixelY(GAME_HEIGHT)).toBeCloseTo(0, 1);
    });

    it('roundtrips correctly', () => {
      for (const ly of [0, 20, 80, 160]) {
        expect(toLogicalY(toPixelY(ly))).toBeCloseTo(ly, 8);
      }
    });
  });

  describe('toPixelW / toPixelH', () => {
    it('scales width correctly', () => {
      expect(toPixelW(8)).toBeCloseTo(60, 1);
      expect(toPixelW(100)).toBe(750);
    });

    it('scales height correctly', () => {
      expect(toPixelH(5)).toBeCloseTo(5 * SY, 1);
      expect(toPixelH(160)).toBeCloseTo(CANVAS_HEIGHT, 1);
    });
  });
});
