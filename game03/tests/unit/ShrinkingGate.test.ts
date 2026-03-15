import { describe, it, expect, beforeEach } from 'vitest';
import { createMockScene } from './__mocks__/phaser';
import { ShrinkingGate } from '../../src/entities/obstacles/ShrinkingGate';
import { PLAYER_WIDTH, GAME_WIDTH, OBSTACLE_HEIGHT } from '../../src/constants';

describe('ShrinkingGate', () => {
  let scene: any;

  beforeEach(() => {
    scene = createMockScene();
  });

  it('initializes with correct gap width', () => {
    const gate = new ShrinkingGate(scene, 100, 50, 30, 5);
    expect(gate.currentGapWidth).toBe(30);
  });

  describe('shrinking behavior', () => {
    it('gap shrinks over time', () => {
      const gate = new ShrinkingGate(scene, 170, 50, 30, 5);
      const initialWidth = gate.currentGapWidth;
      gate.updateMovement(1, 0);
      expect(gate.currentGapWidth).toBeLessThan(initialWidth);
    });

    it('shrinks at correct rate', () => {
      const shrinkSpd = 5;
      const gate = new ShrinkingGate(scene, 170, 50, 30, shrinkSpd);
      gate.updateMovement(2, 0);
      expect(gate.currentGapWidth).toBeCloseTo(30 - shrinkSpd * 2);
    });

    it('never shrinks below PLAYER_WIDTH + 2', () => {
      const gate = new ShrinkingGate(scene, 170, 50, 30, 10);
      for (let i = 0; i < 20; i++) {
        gate.updateMovement(1, 0);
      }
      expect(gate.currentGapWidth).toBe(PLAYER_WIDTH + 2);
    });

    it('gap width stays at min after reaching it', () => {
      const gate = new ShrinkingGate(scene, 170, 50, 15, 10);
      gate.updateMovement(10, 0);
      const widthAfterLong = gate.currentGapWidth;
      gate.updateMovement(5, 0);
      expect(gate.currentGapWidth).toBe(widthAfterLong);
      expect(gate.currentGapWidth).toBe(PLAYER_WIDTH + 2);
    });
  });

  describe('destroyed guard', () => {
    it('stops updates after destroy', () => {
      const gate = new ShrinkingGate(scene, 170, 50, 30, 5);
      gate.destroySelf();
      gate.updateMovement(1, 10);
      expect(gate.logicalY).toBe(170);
      expect(gate.currentGapWidth).toBe(30);
    });
  });

  describe('getCollisionRects', () => {
    it('returns two rects for centered gap', () => {
      const gate = new ShrinkingGate(scene, 100, 50, 20, 5);
      const rects = gate.getCollisionRects();
      expect(rects.length).toBe(2);
    });

    it('wall grows as gap shrinks', () => {
      const gate = new ShrinkingGate(scene, 100, 50, 30, 5);
      const rectsBefore = gate.getCollisionRects();
      const wallBefore = rectsBefore.reduce((acc, r) => acc + r.w, 0);

      gate.updateMovement(2, 0);
      const rectsAfter = gate.getCollisionRects();
      const wallAfter = rectsAfter.reduce((acc, r) => acc + r.w, 0);

      expect(wallAfter).toBeGreaterThan(wallBefore);
    });

    it('has correct y and height', () => {
      const gate = new ShrinkingGate(scene, 100, 50, 20, 5);
      const rects = gate.getCollisionRects();
      for (const r of rects) {
        expect(r.y).toBeCloseTo(100 - OBSTACLE_HEIGHT / 2);
        expect(r.h).toBe(OBSTACLE_HEIGHT);
      }
    });
  });

  describe('movement', () => {
    it('moves downward', () => {
      const gate = new ShrinkingGate(scene, 100, 50, 30, 5);
      gate.updateMovement(1, 10);
      expect(gate.logicalY).toBeCloseTo(90);
    });
  });
});
