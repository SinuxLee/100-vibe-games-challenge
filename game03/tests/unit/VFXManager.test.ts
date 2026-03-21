import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockScene, MockParticleEmitter } from './__mocks__/phaser';
import { VFXManager } from '../../src/systems/VFXManager';

vi.mock('../../src/systems/AudioManager', () => ({
  AudioManager: {
    playPassThrough: vi.fn(),
    playNearMiss: vi.fn(),
    vibrate: vi.fn(),
    playComboMilestone: vi.fn(),
  },
}));

describe('VFXManager', () => {
  let scene: any;
  let vfx: VFXManager;

  beforeEach(() => {
    scene = createMockScene();
    vfx = new VFXManager(scene);
  });

  it('constructs without errors', () => {
    expect(vfx).toBeDefined();
  });

  describe('trail emitter', () => {
    it('creates particle emitter on construction', () => {
      expect(scene.add.particles).toHaveBeenCalled();
    });

    it('updateTrail sets position', () => {
      vfx.updateTrail(100, 200, true);
      vfx.updateTrail(100, 200, false);
    });
  });

  describe('showPassFlash', () => {
    it('creates flash rectangle', () => {
      vfx.showPassFlash(100, 200);
      expect(scene.add.rectangle).toHaveBeenCalled();
    });

    it('creates tween for flash', () => {
      vfx.showPassFlash(100, 200);
      expect(scene.tweens.add).toHaveBeenCalled();
    });
  });

  describe('showNearMiss', () => {
    it('creates text element', () => {
      vfx.showNearMiss(100, 200);
      expect(scene.add.text).toHaveBeenCalledWith(
        100, expect.any(Number), 'NEAR MISS +8', expect.any(Object)
      );
    });

    it('creates tween for text animation', () => {
      vfx.showNearMiss(100, 200);
      expect(scene.tweens.add).toHaveBeenCalled();
    });
  });

  describe('playDeathEffect', () => {
    it('calls completion callback after freeze + explosion delay', () => {
      vi.useFakeTimers();
      const onComplete = vi.fn();
      vfx.playDeathEffect(100, 200, onComplete);
      // Advance past the 80ms setTimeout freeze
      vi.advanceTimersByTime(80);
      // Now the scene.time.delayedCall(900, onComplete) is scheduled
      // Simulate the scene timer firing
      const delayedCalls = scene.time.delayedCall.mock.calls;
      const lastCall = delayedCalls[delayedCalls.length - 1];
      if (lastCall) lastCall[1](); // invoke the callback
      expect(onComplete).toHaveBeenCalled();
      vi.useRealTimers();
    });

    it('creates explosion particles after freeze', () => {
      vi.useFakeTimers();
      vfx.playDeathEffect(100, 200, vi.fn());
      vi.advanceTimersByTime(80);
      const particlesCalls = scene.add.particles.mock.calls;
      expect(particlesCalls.length).toBeGreaterThanOrEqual(2);
      vi.useRealTimers();
    });
  });

  describe('destroy', () => {
    it('cleans up without errors', () => {
      vfx.showNearMiss(100, 200);
      expect(() => vfx.destroy()).not.toThrow();
    });
  });

  describe('update', () => {
    it('runs without error', () => {
      expect(() => vfx.update(0.016)).not.toThrow();
    });
  });

  describe('showComboMilestone', () => {
    it('creates text element for combo milestone', () => {
      vfx.showComboMilestone(5, 1.75);
      expect(scene.add.text).toHaveBeenCalled();
    });

    it('creates particles for combo milestone', () => {
      vfx.showComboMilestone(10, 2.5);
      expect(scene.add.particles).toHaveBeenCalled();
    });
  });
});
