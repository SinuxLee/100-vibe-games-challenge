import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SaveSystem } from '../../src/systems/SaveSystem';

describe('SaveSystem', () => {
  let storage: Record<string, string>;

  beforeEach(() => {
    storage = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => storage[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        storage[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete storage[key];
      }),
    });
  });

  describe('load', () => {
    it('returns defaults when no save exists', () => {
      const data = SaveSystem.load();
      expect(data.bestScore).toBe(0);
      expect(data.longestTime).toBe(0);
      expect(data.soundEnabled).toBe(true);
      expect(data.vibrateEnabled).toBe(true);
    });

    it('returns defaults on corrupted data', () => {
      storage['neon_dodge_save'] = 'not valid json';
      const data = SaveSystem.load();
      expect(data.bestScore).toBe(0);
    });

    it('loads saved data correctly', () => {
      storage['neon_dodge_save'] = JSON.stringify({
        bestScore: 500,
        longestTime: 60.5,
        soundEnabled: false,
        vibrateEnabled: true,
      });
      const data = SaveSystem.load();
      expect(data.bestScore).toBe(500);
      expect(data.longestTime).toBe(60.5);
      expect(data.soundEnabled).toBe(false);
    });

    it('merges partial data with defaults', () => {
      storage['neon_dodge_save'] = JSON.stringify({ bestScore: 200 });
      const data = SaveSystem.load();
      expect(data.bestScore).toBe(200);
      expect(data.longestTime).toBe(0);
      expect(data.soundEnabled).toBe(true);
    });
  });

  describe('updateBest', () => {
    it('returns true and updates when new best score', () => {
      const isNew = SaveSystem.updateBest(100, 30);
      expect(isNew).toBe(true);
      const data = SaveSystem.load();
      expect(data.bestScore).toBe(100);
    });

    it('returns false when score is not a new best', () => {
      SaveSystem.updateBest(100, 30);
      const isNew = SaveSystem.updateBest(50, 20);
      expect(isNew).toBe(false);
      const data = SaveSystem.load();
      expect(data.bestScore).toBe(100);
    });

    it('updates longest time independently of score', () => {
      SaveSystem.updateBest(100, 30);
      SaveSystem.updateBest(50, 60);
      const data = SaveSystem.load();
      expect(data.bestScore).toBe(100);
      expect(data.longestTime).toBe(60);
    });

    it('returns true on first ever save', () => {
      expect(SaveSystem.updateBest(1, 0.5)).toBe(true);
    });
  });

  describe('toggleSound', () => {
    it('toggles from default true to false', () => {
      const result = SaveSystem.toggleSound();
      expect(result).toBe(false);
      const data = SaveSystem.load();
      expect(data.soundEnabled).toBe(false);
    });

    it('toggles back to true', () => {
      SaveSystem.toggleSound();
      const result = SaveSystem.toggleSound();
      expect(result).toBe(true);
    });
  });

  describe('toggleVibrate', () => {
    it('toggles from default true to false', () => {
      const result = SaveSystem.toggleVibrate();
      expect(result).toBe(false);
    });

    it('toggles back to true', () => {
      SaveSystem.toggleVibrate();
      const result = SaveSystem.toggleVibrate();
      expect(result).toBe(true);
    });
  });
});
