import { describe, it, expect, beforeEach } from 'vitest';
import { CollisionSystem } from '../../src/systems/CollisionSystem';
import { NEAR_MISS_DISTANCE, PLAYER_WIDTH, PLAYER_HEIGHT } from '../../src/constants';

function makePlayer(logicalX: number, logicalY: number) {
  return {
    logicalX,
    logicalY,
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

function makeObstacle(rects: { x: number; y: number; w: number; h: number }[], opts?: { nearMissChecked?: boolean }) {
  return {
    logicalY: rects[0]?.y ?? 0,
    passed: false,
    nearMissChecked: opts?.nearMissChecked ?? false,
    getCollisionRects: () => rects,
  } as any;
}

describe('CollisionSystem', () => {
  let collision: CollisionSystem;

  beforeEach(() => {
    collision = new CollisionSystem();
  });

  describe('checkCollision', () => {
    it('returns false when no obstacles', () => {
      const player = makePlayer(50, 20);
      expect(collision.checkCollision(player, [])).toBe(false);
    });

    it('returns false when player is in the gap', () => {
      const player = makePlayer(50, 20);
      const obs = makeObstacle([
        { x: 0, y: 18, w: 40, h: 3 },
        { x: 60, y: 18, w: 40, h: 3 },
      ]);
      expect(collision.checkCollision(player, [obs])).toBe(false);
    });

    it('returns true when player overlaps left wall', () => {
      const player = makePlayer(15, 20);
      const obs = makeObstacle([
        { x: 0, y: 18, w: 20, h: 3 },
        { x: 80, y: 18, w: 20, h: 3 },
      ]);
      expect(collision.checkCollision(player, [obs])).toBe(true);
    });

    it('returns true when player overlaps right wall', () => {
      const player = makePlayer(85, 20);
      const obs = makeObstacle([
        { x: 0, y: 18, w: 20, h: 3 },
        { x: 80, y: 18, w: 20, h: 3 },
      ]);
      expect(collision.checkCollision(player, [obs])).toBe(true);
    });

    it('returns false when obstacle is above player (no vertical overlap)', () => {
      const player = makePlayer(50, 20);
      const obs = makeObstacle([
        { x: 0, y: 30, w: 100, h: 3 },
      ]);
      expect(collision.checkCollision(player, [obs])).toBe(false);
    });

    it('detects collision with exact edge contact', () => {
      const player = makePlayer(50, 20);
      const obs = makeObstacle([
        { x: 0, y: 18, w: 47, h: 5 },
      ]);
      expect(collision.checkCollision(player, [obs])).toBe(true);
    });

    it('handles multiple obstacles — detects first collision', () => {
      const player = makePlayer(50, 20);
      const obs1 = makeObstacle([{ x: 0, y: 50, w: 100, h: 3 }]);
      const obs2 = makeObstacle([{ x: 0, y: 18, w: 100, h: 3 }]);
      expect(collision.checkCollision(player, [obs1, obs2])).toBe(true);
    });
  });

  describe('checkNearMiss', () => {
    it('returns true when player passes very close to wall edge', () => {
      const player = makePlayer(50, 20);
      const obs = makeObstacle([
        { x: 0, y: 18, w: 48, h: 3 },
        { x: 53, y: 18, w: 47, h: 3 },
      ]);
      expect(collision.checkNearMiss(player, obs)).toBe(true);
    });

    it('returns false when player is far from wall edges', () => {
      const player = makePlayer(50, 20);
      const obs = makeObstacle([
        { x: 0, y: 18, w: 40, h: 3 },
        { x: 60, y: 18, w: 40, h: 3 },
      ]);
      expect(collision.checkNearMiss(player, obs)).toBe(false);
    });

    it('returns false when no vertical overlap', () => {
      const player = makePlayer(50, 20);
      const obs = makeObstacle([
        { x: 0, y: 30, w: 48, h: 3 },
        { x: 53, y: 30, w: 47, h: 3 },
      ]);
      expect(collision.checkNearMiss(player, obs)).toBe(false);
    });
  });
});
