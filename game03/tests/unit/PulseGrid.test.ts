import { describe, it, expect, beforeEach } from 'vitest';
import { createMockScene } from './__mocks__/phaser';
import { PulseGrid } from '../../src/entities/obstacles/PulseGrid';
import { GAME_WIDTH, OBSTACLE_HEIGHT } from '../../src/constants';

const COLUMN_COUNT = 8;
const PULSE_GRID_HEIGHT_MULT = 3;

describe('PulseGrid', () => {
  let scene: any;

  beforeEach(() => {
    scene = createMockScene();
  });

  it('initializes at center with zero gap width', () => {
    const grid = new PulseGrid(scene, 170, 0.8);
    expect(grid.gapCenterX).toBe(GAME_WIDTH / 2);
    expect(grid.currentGapWidth).toBe(0);
  });

  describe('pulse cycling', () => {
    it('initially group A (even columns) is active', () => {
      const grid = new PulseGrid(scene, 100, 0.8);
      const rects = grid.getCollisionRects();
      const activeColumns = rects.map(r => Math.floor(r.x / (GAME_WIDTH / COLUMN_COUNT)));
      for (const col of activeColumns) {
        expect(col % 2).toBe(0);
      }
    });

    it('after half-period, group B (odd columns) becomes active', () => {
      const pulseIntvl = 0.8;
      const grid = new PulseGrid(scene, 100, pulseIntvl);
      grid.updateMovement(pulseIntvl, 0);
      const rects = grid.getCollisionRects();
      const colWidth = GAME_WIDTH / COLUMN_COUNT;
      const activeColumns = rects.map(r => Math.floor(r.x / colWidth));
      for (const col of activeColumns) {
        expect(col % 2).toBe(1);
      }
    });

    it('returns 4 active columns at any time (half of 8)', () => {
      const grid = new PulseGrid(scene, 100, 0.8);
      const rects = grid.getCollisionRects();
      expect(rects.length).toBe(4);
    });

    it('alternates back after full cycle', () => {
      const pulseIntvl = 0.8;
      const grid = new PulseGrid(scene, 100, pulseIntvl);
      const rectsInitial = grid.getCollisionRects();
      grid.updateMovement(pulseIntvl * 2, 0);
      const rectsAfterCycle = grid.getCollisionRects();
      expect(rectsInitial.length).toBe(rectsAfterCycle.length);
      for (let i = 0; i < rectsInitial.length; i++) {
        expect(rectsAfterCycle[i].x).toBeCloseTo(rectsInitial[i].x);
      }
    });
  });

  describe('collision rects', () => {
    it('columns span correct width', () => {
      const grid = new PulseGrid(scene, 100, 0.8);
      const rects = grid.getCollisionRects();
      const colWidth = GAME_WIDTH / COLUMN_COUNT;
      for (const r of rects) {
        expect(r.w).toBeCloseTo(colWidth);
      }
    });

    it('has 3x obstacle height', () => {
      const grid = new PulseGrid(scene, 100, 0.8);
      const rects = grid.getCollisionRects();
      const expectedH = OBSTACLE_HEIGHT * PULSE_GRID_HEIGHT_MULT;
      for (const r of rects) {
        expect(r.h).toBe(expectedH);
      }
    });

    it('y is centered on logicalY', () => {
      const grid = new PulseGrid(scene, 100, 0.8);
      const rects = grid.getCollisionRects();
      const expectedH = OBSTACLE_HEIGHT * PULSE_GRID_HEIGHT_MULT;
      for (const r of rects) {
        expect(r.y).toBeCloseTo(100 - expectedH / 2);
      }
    });
  });

  describe('destroyed guard', () => {
    it('stops movement after destroy', () => {
      const grid = new PulseGrid(scene, 170, 0.8);
      grid.destroySelf();
      grid.updateMovement(1, 10);
      expect(grid.logicalY).toBe(170);
    });
  });

  describe('movement', () => {
    it('moves downward', () => {
      const grid = new PulseGrid(scene, 100, 0.8);
      grid.updateMovement(1, 10);
      expect(grid.logicalY).toBeCloseTo(90);
    });
  });
});
