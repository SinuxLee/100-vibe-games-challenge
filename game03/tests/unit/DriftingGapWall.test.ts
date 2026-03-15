import { describe, it, expect, beforeEach } from 'vitest';
import { createMockScene } from './__mocks__/phaser';
import { DriftingGapWall } from '../../src/entities/obstacles/DriftingGapWall';
import { GAME_WIDTH, OBSTACLE_HEIGHT } from '../../src/constants';

describe('DriftingGapWall', () => {
  let scene: any;

  beforeEach(() => {
    scene = createMockScene();
  });

  it('initializes with drift parameters', () => {
    const wall = new DriftingGapWall(scene, 170, 50, 20, 2, 10);
    expect(wall.gapCenterX).toBe(50);
    expect(wall.currentGapWidth).toBe(20);
  });

  describe('drift oscillation', () => {
    it('gap center changes over time', () => {
      const wall = new DriftingGapWall(scene, 170, 50, 20, 2, 10);
      const initialGap = wall.gapCenterX;
      wall.updateMovement(0.25, 0);
      expect(wall.gapCenterX).not.toBe(initialGap);
    });

    it('gap stays within screen bounds', () => {
      const wall = new DriftingGapWall(scene, 170, 10, 20, 5, 40);
      for (let i = 0; i < 100; i++) {
        wall.updateMovement(0.05, 0);
        const halfGap = wall.currentGapWidth / 2;
        expect(wall.gapCenterX).toBeGreaterThanOrEqual(halfGap);
        expect(wall.gapCenterX).toBeLessThanOrEqual(GAME_WIDTH - halfGap);
      }
    });

    it('drift amplitude affects range', () => {
      const smallDrift = new DriftingGapWall(scene, 170, 50, 20, 2, 3);
      const largeDrift = new DriftingGapWall(scene, 170, 50, 20, 2, 15);

      let smallMax = 0;
      let largeMax = 0;
      for (let i = 0; i < 100; i++) {
        smallDrift.updateMovement(0.05, 0);
        largeDrift.updateMovement(0.05, 0);
        smallMax = Math.max(smallMax, Math.abs(smallDrift.gapCenterX - 50));
        largeMax = Math.max(largeMax, Math.abs(largeDrift.gapCenterX - 50));
      }

      expect(largeMax).toBeGreaterThan(smallMax);
    });
  });

  describe('destroyed guard', () => {
    it('stops movement after destroy', () => {
      const wall = new DriftingGapWall(scene, 170, 50, 20, 2, 10);
      wall.destroySelf();
      const yBefore = wall.logicalY;
      wall.updateMovement(1, 10);
      expect(wall.logicalY).toBe(yBefore);
    });
  });

  describe('getCollisionRects', () => {
    it('returns two rects for centered gap', () => {
      const wall = new DriftingGapWall(scene, 100, 50, 20, 2, 10);
      const rects = wall.getCollisionRects();
      expect(rects.length).toBe(2);

      const totalCoverage = rects.reduce((acc, r) => acc + r.w, 0);
      expect(totalCoverage).toBeCloseTo(GAME_WIDTH - 20);
    });

    it('collision rects update with drift', () => {
      const wall = new DriftingGapWall(scene, 100, 50, 20, 2, 10);
      const rectsBefore = wall.getCollisionRects();
      wall.updateMovement(0.25, 0);
      const rectsAfter = wall.getCollisionRects();

      const leftWidthBefore = rectsBefore[0].w;
      const leftWidthAfter = rectsAfter[0].w;
      expect(leftWidthBefore).not.toBeCloseTo(leftWidthAfter);
    });

    it('has correct y and height', () => {
      const wall = new DriftingGapWall(scene, 100, 50, 20, 2, 10);
      const rects = wall.getCollisionRects();
      for (const r of rects) {
        expect(r.y).toBeCloseTo(100 - OBSTACLE_HEIGHT / 2);
        expect(r.h).toBe(OBSTACLE_HEIGHT);
      }
    });
  });
});
