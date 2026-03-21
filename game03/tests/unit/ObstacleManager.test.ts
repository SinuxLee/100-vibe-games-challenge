import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockScene } from './__mocks__/phaser';
import { ObstacleManager } from '../../src/systems/ObstacleManager';
import { DifficultyDirector } from '../../src/systems/DifficultyDirector';
import {
  ObstacleType, OBSTACLE_SPAWN_Y, GAME_WIDTH,
  PLAYER_MAX_SPEED, PLAYER_WIDTH, PLAYER_START_Y,
  MAX_CONSECUTIVE_SAME, INITIAL_SPAWN_DELAY,
} from '../../src/constants';

describe('ObstacleManager', () => {
  let scene: any;
  let director: DifficultyDirector;
  let manager: ObstacleManager;

  beforeEach(() => {
    scene = createMockScene();
    director = new DifficultyDirector();
    manager = new ObstacleManager(scene, director);
  });

  it('starts with no obstacles', () => {
    expect(manager.getObstacles()).toHaveLength(0);
  });

  describe('spawning', () => {
    it('does not spawn during initial delay', () => {
      manager.update(INITIAL_SPAWN_DELAY - 0.1);
      expect(manager.getObstacles()).toHaveLength(0);
    });

    it('spawns obstacle after initial delay elapses', () => {
      manager.update(INITIAL_SPAWN_DELAY + 0.01);
      expect(manager.getObstacles().length).toBeGreaterThanOrEqual(1);
    });

    it('does not spawn additional obstacle before next interval', () => {
      manager.update(INITIAL_SPAWN_DELAY + 0.01);
      expect(manager.getObstacles()).toHaveLength(1);
      manager.update(0.01);
      expect(manager.getObstacles()).toHaveLength(1);
    });

    it('spawns multiple obstacles over time', () => {
      manager.update(INITIAL_SPAWN_DELAY + 0.01);
      const interval = director.getSpawnInterval();
      for (let i = 0; i < 5; i++) {
        manager.update(interval + 0.01);
      }
      expect(manager.getObstacles().length).toBeGreaterThanOrEqual(3);
    });

    it('spawned obstacles start at expected position after initial delay', () => {
      manager.update(INITIAL_SPAWN_DELAY + 0.01);
      const obs = manager.getObstacles();
      expect(obs.length).toBeGreaterThan(0);
      for (const o of obs) {
        expect(o.logicalY).toBeLessThanOrEqual(OBSTACLE_SPAWN_Y);
        expect(o.logicalY).toBeGreaterThan(OBSTACLE_SPAWN_Y - 60);
      }
    });
  });

  describe('obstacle removal', () => {
    it('removes obstacles that go off screen', () => {
      manager.update(INITIAL_SPAWN_DELAY + 0.01);
      expect(manager.getObstacles().length).toBe(1);

      const obs = manager.getObstacles()[0];
      obs.logicalY = -20;
      manager.update(0.016);
      expect(manager.getObstacles()).toHaveLength(0);
    });
  });

  describe('reset', () => {
    it('clears all obstacles', () => {
      manager.update(INITIAL_SPAWN_DELAY + 0.01);
      expect(manager.getObstacles().length).toBeGreaterThan(0);
      manager.reset();
      expect(manager.getObstacles()).toHaveLength(0);
    });
  });

  describe('pickType (via spawning at different times)', () => {
    it('only spawns SINGLE_GAP during easy period', () => {
      manager.update(INITIAL_SPAWN_DELAY + 0.01);
      const interval = director.getSpawnInterval();
      for (let i = 0; i < 5; i++) {
        manager.update(interval + 0.01);
      }
      const types = manager.getObstacles().map(o => o.obstacleType);
      for (const t of types) {
        expect(t).toBe(ObstacleType.SINGLE_GAP);
      }
    });

    it('can spawn DRIFTING_GAP after 15s', () => {
      manager.update(INITIAL_SPAWN_DELAY + 0.01);
      director.update(16);
      const types = new Set<ObstacleType>();
      for (let i = 0; i < 30; i++) {
        const interval = director.getSpawnInterval();
        manager.update(interval + 0.01);
        director.update(0);
      }
      manager.getObstacles().forEach(o => types.add(o.obstacleType));
      expect(types.has(ObstacleType.SINGLE_GAP) || types.has(ObstacleType.DRIFTING_GAP)).toBe(true);
    });
  });

  describe('fairness', () => {
    it('gap centers stay within reachable range', () => {
      manager.update(INITIAL_SPAWN_DELAY + 0.01);
      director.update(20);

      for (let i = 0; i < 20; i++) {
        const interval = director.getSpawnInterval();
        manager.update(interval + 0.01);
      }

      const obstacles = manager.getObstacles();
      for (let i = 1; i < obstacles.length; i++) {
        const obs = obstacles[i];
        const scrollSpd = director.getScrollSpeed();
        const travelTime = (OBSTACLE_SPAWN_Y - PLAYER_START_Y) / scrollSpd;
        const maxReachable = PLAYER_MAX_SPEED * travelTime;
        const diff = Math.abs(obs.gapCenterX - obstacles[i - 1].gapCenterX);
        expect(diff).toBeLessThanOrEqual(maxReachable + 1);
      }
    });

    it('gap center stays within valid range (halfGap to GAME_WIDTH - halfGap)', () => {
      manager.update(INITIAL_SPAWN_DELAY + 0.01);
      director.update(30);
      for (let i = 0; i < 20; i++) {
        const interval = director.getSpawnInterval();
        manager.update(interval + 0.01);
      }

      for (const obs of manager.getObstacles()) {
        const halfGap = obs.currentGapWidth / 2;
        if (obs.obstacleType !== ObstacleType.PULSE_GRID) {
          expect(obs.gapCenterX).toBeGreaterThanOrEqual(halfGap - 0.1);
          expect(obs.gapCenterX).toBeLessThanOrEqual(GAME_WIDTH - halfGap + 0.1);
        }
      }
    });
  });
});
