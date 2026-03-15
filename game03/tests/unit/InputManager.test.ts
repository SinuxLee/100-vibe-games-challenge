import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockScene } from './__mocks__/phaser';
import { InputManager } from '../../src/systems/InputManager';
import { PLAYER_WIDTH, GAME_WIDTH, toLogicalX, SX } from '../../src/constants';

describe('InputManager', () => {
  let scene: any;
  let input: InputManager;

  beforeEach(() => {
    scene = createMockScene();
    input = new InputManager(scene, 50);
  });

  it('initializes with given target X', () => {
    expect(input.getTargetX()).toBe(50);
  });

  it('isDragging is false initially', () => {
    expect(input.getIsDragging()).toBe(false);
  });

  describe('pointer events', () => {
    it('pointerdown sets dragging and updates target', () => {
      const pixelX = 50 * SX;
      scene.input._emit('pointerdown', { x: pixelX });
      expect(input.getIsDragging()).toBe(true);
      expect(input.getTargetX()).toBeCloseTo(50);
    });

    it('pointermove updates target when dragging', () => {
      scene.input._emit('pointerdown', { x: 50 * SX });
      scene.input._emit('pointermove', { x: 30 * SX });
      expect(input.getTargetX()).toBeCloseTo(30);
    });

    it('pointermove does not update when not dragging', () => {
      scene.input._emit('pointermove', { x: 30 * SX });
      expect(input.getTargetX()).toBe(50);
    });

    it('pointerup stops dragging', () => {
      scene.input._emit('pointerdown', { x: 50 * SX });
      expect(input.getIsDragging()).toBe(true);
      scene.input._emit('pointerup');
      expect(input.getIsDragging()).toBe(false);
    });

    it('target holds position after release', () => {
      scene.input._emit('pointerdown', { x: 30 * SX });
      const targetAtRelease = input.getTargetX();
      scene.input._emit('pointerup');
      expect(input.getTargetX()).toBe(targetAtRelease);
    });
  });

  describe('clamping', () => {
    it('clamps to min (left edge)', () => {
      scene.input._emit('pointerdown', { x: 0 });
      expect(input.getTargetX()).toBe(PLAYER_WIDTH / 2);
    });

    it('clamps to max (right edge)', () => {
      scene.input._emit('pointerdown', { x: GAME_WIDTH * SX + 100 });
      expect(input.getTargetX()).toBe(GAME_WIDTH - PLAYER_WIDTH / 2);
    });

    it('allows valid center positions', () => {
      scene.input._emit('pointerdown', { x: 50 * SX });
      expect(input.getTargetX()).toBeCloseTo(50);
    });
  });

  it('registers 3 input listeners', () => {
    expect(scene.input.on).toHaveBeenCalledTimes(3);
    expect(scene.input.on).toHaveBeenCalledWith('pointerdown', expect.any(Function));
    expect(scene.input.on).toHaveBeenCalledWith('pointermove', expect.any(Function));
    expect(scene.input.on).toHaveBeenCalledWith('pointerup', expect.any(Function));
  });
});
