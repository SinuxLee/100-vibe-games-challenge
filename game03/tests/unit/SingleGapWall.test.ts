import { describe, it, expect, beforeEach } from 'vitest';
import { createMockScene } from './__mocks__/phaser';
import { SingleGapWall } from '../../src/entities/obstacles/SingleGapWall';
import {
  ObstacleType, OBSTACLE_SPAWN_Y, OBSTACLE_DESTROY_Y, OBSTACLE_HEIGHT, GAME_WIDTH,
} from '../../src/constants';

describe('SingleGapWall (BaseObstacle behavior)', () => {
  let scene: any;

  beforeEach(() => {
    scene = createMockScene();
  });

  it('initializes with correct properties', () => {
    const wall = new SingleGapWall(scene, OBSTACLE_SPAWN_Y, 50, 20);
    expect(wall.logicalY).toBe(OBSTACLE_SPAWN_Y);
    expect(wall.gapCenterX).toBe(50);
    expect(wall.currentGapWidth).toBe(20);
    expect(wall.obstacleType).toBe(ObstacleType.SINGLE_GAP);
    expect(wall.passed).toBe(false);
    expect(wall.scored).toBe(false);
    expect(wall.nearMissChecked).toBe(false);
  });

  it('registers with scene', () => {
    const wall = new SingleGapWall(scene, OBSTACLE_SPAWN_Y, 50, 20);
    expect(scene.add.existing).toHaveBeenCalledWith(wall);
  });

  describe('updateMovement', () => {
    it('moves downward by scrollSpeed * delta', () => {
      const wall = new SingleGapWall(scene, 100, 50, 20);
      wall.updateMovement(0.5, 10);
      expect(wall.logicalY).toBeCloseTo(95);
    });

    it('accumulates movement over multiple frames', () => {
      const wall = new SingleGapWall(scene, 100, 50, 20);
      wall.updateMovement(0.1, 10);
      wall.updateMovement(0.1, 10);
      wall.updateMovement(0.1, 10);
      expect(wall.logicalY).toBeCloseTo(97);
    });

    it('does nothing when destroyed', () => {
      const wall = new SingleGapWall(scene, 100, 50, 20);
      wall.destroySelf();
      wall.updateMovement(0.5, 10);
      expect(wall.logicalY).toBe(100);
    });
  });

  describe('isOffScreen', () => {
    it('returns false when above destroy Y', () => {
      const wall = new SingleGapWall(scene, 50, 50, 20);
      expect(wall.isOffScreen()).toBe(false);
    });

    it('returns true when below destroy Y', () => {
      const wall = new SingleGapWall(scene, OBSTACLE_DESTROY_Y - 1, 50, 20);
      expect(wall.isOffScreen()).toBe(true);
    });

    it('returns false at exactly destroy Y', () => {
      const wall = new SingleGapWall(scene, OBSTACLE_DESTROY_Y, 50, 20);
      expect(wall.isOffScreen()).toBe(false);
    });
  });

  describe('destroySelf', () => {
    it('sets isDestroyed flag', () => {
      const wall = new SingleGapWall(scene, 100, 50, 20);
      wall.destroySelf();
      expect((wall as any).isDestroyed).toBe(true);
    });
  });

  describe('getCollisionRects', () => {
    it('returns two rects for centered gap', () => {
      const wall = new SingleGapWall(scene, 100, 50, 20);
      const rects = wall.getCollisionRects();
      expect(rects.length).toBe(2);

      const left = rects[0];
      expect(left.x).toBe(0);
      expect(left.w).toBeCloseTo(40);
      expect(left.y).toBeCloseTo(100 - OBSTACLE_HEIGHT / 2);
      expect(left.h).toBe(OBSTACLE_HEIGHT);

      const right = rects[1];
      expect(right.x).toBeCloseTo(60);
      expect(right.w).toBeCloseTo(40);
    });

    it('returns one rect when gap is at left edge', () => {
      const wall = new SingleGapWall(scene, 100, 5, 10);
      const rects = wall.getCollisionRects();
      expect(rects.length).toBe(1);
      expect(rects[0].x).toBe(10);
    });

    it('returns one rect when gap is at right edge', () => {
      const wall = new SingleGapWall(scene, 100, 95, 10);
      const rects = wall.getCollisionRects();
      expect(rects.length).toBe(1);
      expect(rects[0].x).toBe(0);
      expect(rects[0].w).toBeCloseTo(90);
    });

    it('updates y with movement', () => {
      const wall = new SingleGapWall(scene, 100, 50, 20);
      wall.updateMovement(1, 10);
      const rects = wall.getCollisionRects();
      expect(rects[0].y).toBeCloseTo(90 - OBSTACLE_HEIGHT / 2);
    });
  });

  describe('createVisuals', () => {
    it('creates rectangle visuals for bars', () => {
      new SingleGapWall(scene, 100, 50, 20);
      expect(scene.add.rectangle).toHaveBeenCalled();
    });
  });
});
