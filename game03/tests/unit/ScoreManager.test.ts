import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ScoreManager } from '../../src/systems/ScoreManager';
import { CollisionSystem } from '../../src/systems/CollisionSystem';
import {
  SCORE_PER_TICK, SCORE_TICK_INTERVAL,
  SCORE_OBSTACLE_PASS, SCORE_NEAR_MISS,
  PLAYER_START_Y, PLAYER_WIDTH, PLAYER_HEIGHT,
} from '../../src/constants';

function makePlayer(logicalX = 50, logicalY = PLAYER_START_Y) {
  return {
    logicalX,
    logicalY,
    x: 0,
    y: 0,
    getCollisionRect() {
      return {
        x: this.logicalX - PLAYER_WIDTH / 2,
        y: this.logicalY - PLAYER_HEIGHT / 2,
        w: PLAYER_WIDTH,
        h: PLAYER_HEIGHT,
      };
    },
  } as any;
}

function makeObstacle(logicalY: number, rects: { x: number; y: number; w: number; h: number }[]) {
  return {
    logicalY,
    passed: false,
    scored: false,
    nearMissChecked: false,
    getCollisionRects: () => rects,
  } as any;
}

describe('ScoreManager', () => {
  let scoreManager: ScoreManager;
  let collisionSystem: CollisionSystem;

  beforeEach(() => {
    collisionSystem = new CollisionSystem();
    scoreManager = new ScoreManager(collisionSystem);
  });

  describe('initial state', () => {
    it('starts with 0 score', () => {
      expect(scoreManager.getScore()).toBe(0);
    });

    it('starts with 0 survival time', () => {
      expect(scoreManager.getSurvivalTime()).toBe(0);
    });

    it('starts with 0 near miss count', () => {
      expect(scoreManager.getNearMissCount()).toBe(0);
    });
  });

  describe('survival time scoring', () => {
    it('accumulates survival time', () => {
      const player = makePlayer();
      scoreManager.update(0.5, player, []);
      expect(scoreManager.getSurvivalTime()).toBeCloseTo(0.5);
    });

    it('awards SCORE_PER_TICK every SCORE_TICK_INTERVAL', () => {
      const player = makePlayer();
      scoreManager.update(SCORE_TICK_INTERVAL, player, []);
      expect(scoreManager.getScore()).toBe(SCORE_PER_TICK);
    });

    it('awards multiple ticks for longer deltas', () => {
      const player = makePlayer();
      scoreManager.update(0.5, player, []);
      expect(scoreManager.getScore()).toBe(SCORE_PER_TICK * 5);
    });

    it('accumulates across updates', () => {
      const player = makePlayer();
      scoreManager.update(0.1, player, []);
      scoreManager.update(0.1, player, []);
      scoreManager.update(0.1, player, []);
      expect(scoreManager.getScore()).toBe(SCORE_PER_TICK * 3);
    });
  });

  describe('obstacle pass scoring', () => {
    it('awards SCORE_OBSTACLE_PASS when obstacle passes player Y', () => {
      const player = makePlayer();
      const obs = makeObstacle(PLAYER_START_Y - 1, [
        { x: 0, y: PLAYER_START_Y - 1, w: 40, h: 3 },
      ]);
      scoreManager.update(0, player, [obs]);
      expect(obs.passed).toBe(true);
      expect(scoreManager.getScore()).toBe(SCORE_OBSTACLE_PASS);
    });

    it('does not award twice for same obstacle', () => {
      const player = makePlayer();
      const obs = makeObstacle(PLAYER_START_Y - 1, [
        { x: 0, y: PLAYER_START_Y - 1, w: 40, h: 3 },
      ]);
      scoreManager.update(0, player, [obs]);
      scoreManager.update(0, player, [obs]);
      expect(scoreManager.getScore()).toBe(SCORE_OBSTACLE_PASS);
    });

    it('does not award when obstacle is above player', () => {
      const player = makePlayer();
      const obs = makeObstacle(PLAYER_START_Y + 10, [
        { x: 0, y: PLAYER_START_Y + 10, w: 40, h: 3 },
      ]);
      scoreManager.update(0, player, [obs]);
      expect(obs.passed).toBe(false);
      expect(scoreManager.getScore()).toBe(0);
    });
  });

  describe('near-miss scoring', () => {
    it('awards SCORE_NEAR_MISS for close pass', () => {
      const player = makePlayer(50, PLAYER_START_Y);
      const obs = makeObstacle(PLAYER_START_Y - 1, [
        { x: 0, y: PLAYER_START_Y - 2, w: 48, h: 3 },
        { x: 53, y: PLAYER_START_Y - 2, w: 47, h: 3 },
      ]);
      scoreManager.update(0, player, [obs]);
      expect(scoreManager.getScore()).toBe(SCORE_OBSTACLE_PASS + SCORE_NEAR_MISS);
      expect(scoreManager.getNearMissCount()).toBe(1);
    });

    it('fires near miss callback', () => {
      const callback = vi.fn();
      scoreManager.setNearMissCallback(callback);

      const player = makePlayer(50, PLAYER_START_Y);
      const obs = makeObstacle(PLAYER_START_Y - 1, [
        { x: 0, y: PLAYER_START_Y - 2, w: 48, h: 3 },
        { x: 53, y: PLAYER_START_Y - 2, w: 47, h: 3 },
      ]);
      scoreManager.update(0, player, [obs]);
      expect(callback).toHaveBeenCalledOnce();
    });

    it('fires obstacle pass callback', () => {
      const callback = vi.fn();
      scoreManager.setObstaclePassCallback(callback);

      const player = makePlayer(50, PLAYER_START_Y);
      const obs = makeObstacle(PLAYER_START_Y - 1, [
        { x: 0, y: PLAYER_START_Y - 1, w: 40, h: 3 },
      ]);
      scoreManager.update(0, player, [obs]);
      expect(callback).toHaveBeenCalledOnce();
    });
  });

  describe('reset', () => {
    it('resets all values to 0', () => {
      const player = makePlayer();
      scoreManager.update(1.0, player, []);
      scoreManager.reset();
      expect(scoreManager.getScore()).toBe(0);
      expect(scoreManager.getSurvivalTime()).toBe(0);
      expect(scoreManager.getNearMissCount()).toBe(0);
    });
  });
});
