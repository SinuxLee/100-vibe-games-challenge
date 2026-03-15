import { describe, it, expect, beforeEach } from 'vitest';
import { createMockScene } from './__mocks__/phaser';
import { DualGapWall } from '../../src/entities/obstacles/DualGapWall';
import { GAME_WIDTH, OBSTACLE_HEIGHT } from '../../src/constants';

describe('DualGapWall', () => {
  let scene: any;

  beforeEach(() => {
    scene = createMockScene();
  });

  it('initializes with two gap positions', () => {
    const wall = new DualGapWall(scene, 100, 30, 16, 70, 12);
    expect(wall.gapCenterX).toBe(30);
    expect(wall.currentGapWidth).toBe(16);
  });

  describe('getCollisionRects', () => {
    it('returns 3 segments for two separated gaps', () => {
      const wall = new DualGapWall(scene, 100, 25, 14, 75, 14);
      const rects = wall.getCollisionRects();
      expect(rects.length).toBe(3);
    });

    it('total wall width equals screen minus both gaps', () => {
      const g1w = 14;
      const g2w = 12;
      const wall = new DualGapWall(scene, 100, 30, g1w, 70, g2w);
      const rects = wall.getCollisionRects();
      const totalWall = rects.reduce((acc, r) => acc + r.w, 0);
      expect(totalWall).toBeCloseTo(GAME_WIDTH - g1w - g2w);
    });

    it('handles reversed gap order (gap2 < gap1)', () => {
      const wall = new DualGapWall(scene, 100, 70, 14, 30, 14);
      const rects = wall.getCollisionRects();
      expect(rects.length).toBe(3);

      for (let i = 1; i < rects.length; i++) {
        expect(rects[i].x).toBeGreaterThanOrEqual(rects[i - 1].x + rects[i - 1].w - 0.1);
      }
    });

    it('has correct y and height', () => {
      const wall = new DualGapWall(scene, 100, 30, 14, 70, 12);
      const rects = wall.getCollisionRects();
      for (const r of rects) {
        expect(r.y).toBeCloseTo(100 - OBSTACLE_HEIGHT / 2);
        expect(r.h).toBe(OBSTACLE_HEIGHT);
      }
    });

    it('returns 2 segments when gap1 is at left edge', () => {
      const wall = new DualGapWall(scene, 100, 5, 10, 60, 14);
      const rects = wall.getCollisionRects();
      expect(rects.length).toBe(2);
    });

    it('returns 2 segments when gap2 is at right edge', () => {
      const wall = new DualGapWall(scene, 100, 40, 14, 95, 10);
      const rects = wall.getCollisionRects();
      expect(rects.length).toBe(2);
    });

    it('segments cover x from 0 to GAME_WIDTH with gaps', () => {
      const wall = new DualGapWall(scene, 100, 30, 14, 70, 14);
      const rects = wall.getCollisionRects();
      expect(rects[0].x).toBe(0);
      const lastRect = rects[rects.length - 1];
      expect(lastRect.x + lastRect.w).toBeCloseTo(GAME_WIDTH);
    });
  });

  describe('movement', () => {
    it('moves downward like base obstacle', () => {
      const wall = new DualGapWall(scene, 100, 30, 14, 70, 12);
      wall.updateMovement(1, 10);
      expect(wall.logicalY).toBeCloseTo(90);
    });
  });
});
