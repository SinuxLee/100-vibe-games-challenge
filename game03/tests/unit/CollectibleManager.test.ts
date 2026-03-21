import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockScene } from './__mocks__/phaser';
import { CollectibleManager } from '../../src/systems/CollectibleManager';
import { DifficultyDirector } from '../../src/systems/DifficultyDirector';
import { CollectibleType, COLLECTIBLE_SPAWN_CHANCE, GAME_WIDTH } from '../../src/constants';
import { LevelData } from '../../src/systems/LevelConfig';
import { ObstacleType } from '../../src/constants';

function makeLevel(overrides?: Partial<LevelData>): LevelData {
  return {
    level: 1, scrollSpeed: 15, spawnInterval: 3.0, gapWidth: 50,
    driftSpeed: 0, driftRange: 0, shrinkRate: 0, pulseInterval: 0,
    obstacleTypes: [ObstacleType.SINGLE_GAP], duration: 45, label: 'TEST',
    ...overrides,
  };
}

describe('CollectibleManager', () => {
  let scene: any;
  let director: DifficultyDirector;
  let manager: CollectibleManager;

  beforeEach(() => {
    scene = createMockScene();
    director = new DifficultyDirector([makeLevel()]);
    manager = new CollectibleManager(scene, director);
  });

  it('starts with no collectibles', () => {
    expect(manager.getCollectibles()).toHaveLength(0);
  });

  describe('spawning', () => {
    it('spawns collectible on obstacle spawn (with forced random)', () => {
      // Force spawn by calling many times
      for (let i = 0; i < 50; i++) {
        manager.onObstacleSpawned(50, 40);
      }
      expect(manager.getCollectibles().length).toBeGreaterThan(0);
    });

    it('collectibles are positioned within game bounds', () => {
      for (let i = 0; i < 100; i++) {
        manager.onObstacleSpawned(50, 40);
      }
      for (const c of manager.getCollectibles()) {
        expect(c.logicalX).toBeGreaterThanOrEqual(0);
        expect(c.logicalX).toBeLessThanOrEqual(GAME_WIDTH);
      }
    });

    it('spawns both gems and spikes', () => {
      for (let i = 0; i < 200; i++) {
        manager.onObstacleSpawned(50, 40);
      }
      const types = new Set(manager.getCollectibles().map(c => c.collectibleType));
      expect(types.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe('update', () => {
    it('moves collectibles downward', () => {
      for (let i = 0; i < 50; i++) {
        manager.onObstacleSpawned(50, 40);
      }
      const initialY = manager.getCollectibles()[0]?.logicalY;
      if (initialY !== undefined) {
        manager.update(1.0);
        expect(manager.getCollectibles()[0]?.logicalY).toBeLessThan(initialY);
      }
    });

    it('removes off-screen collectibles', () => {
      for (let i = 0; i < 50; i++) {
        manager.onObstacleSpawned(50, 40);
      }
      const count = manager.getCollectibles().length;
      // Move far enough to go off screen
      for (let i = 0; i < 20; i++) {
        manager.update(2.0);
      }
      expect(manager.getCollectibles().length).toBeLessThan(count);
    });

    it('removes collected collectibles', () => {
      for (let i = 0; i < 50; i++) {
        manager.onObstacleSpawned(50, 40);
      }
      if (manager.getCollectibles().length > 0) {
        manager.getCollectibles()[0].collected = true;
        manager.update(0.016);
        // The collected one should be removed
        for (const c of manager.getCollectibles()) {
          expect(c.collected).toBe(false);
        }
      }
    });
  });

  describe('reset', () => {
    it('clears all collectibles', () => {
      for (let i = 0; i < 50; i++) {
        manager.onObstacleSpawned(50, 40);
      }
      expect(manager.getCollectibles().length).toBeGreaterThan(0);
      manager.reset();
      expect(manager.getCollectibles()).toHaveLength(0);
    });
  });
});
