import { describe, it, expect, beforeEach } from 'vitest';
import { createMockScene } from './__mocks__/phaser';
import { Player } from '../../src/entities/Player';
import {
  PLAYER_WIDTH, PLAYER_HEIGHT, PLAYER_START_X, PLAYER_START_Y,
  GAME_WIDTH, toPixelX, toPixelY,
} from '../../src/constants';

describe('Player', () => {
  let scene: any;
  let player: Player;

  beforeEach(() => {
    scene = createMockScene();
    player = new Player(scene);
  });

  it('initializes at start position', () => {
    expect(player.logicalX).toBe(PLAYER_START_X);
    expect(player.logicalY).toBe(PLAYER_START_Y);
  });

  it('registers with scene add and physics', () => {
    expect(scene.add.existing).toHaveBeenCalledWith(player);
    expect(scene.physics.add.existing).toHaveBeenCalledWith(player);
  });

  it('sets pixel position from logical start', () => {
    expect(player.x).toBe(toPixelX(PLAYER_START_X));
    expect(player.y).toBe(toPixelY(PLAYER_START_Y));
  });

  describe('setLogicalX', () => {
    it('sets logicalX and updates pixel x', () => {
      player.setLogicalX(30);
      expect(player.logicalX).toBe(30);
      expect(player.x).toBe(toPixelX(30));
    });

    it('clamps to min (left edge)', () => {
      player.setLogicalX(0);
      expect(player.logicalX).toBe(PLAYER_WIDTH / 2);
      expect(player.x).toBe(toPixelX(PLAYER_WIDTH / 2));
    });

    it('clamps to max (right edge)', () => {
      player.setLogicalX(200);
      expect(player.logicalX).toBe(GAME_WIDTH - PLAYER_WIDTH / 2);
      expect(player.x).toBe(toPixelX(GAME_WIDTH - PLAYER_WIDTH / 2));
    });

    it('allows exact min', () => {
      player.setLogicalX(PLAYER_WIDTH / 2);
      expect(player.logicalX).toBe(PLAYER_WIDTH / 2);
    });

    it('allows exact max', () => {
      const maxX = GAME_WIDTH - PLAYER_WIDTH / 2;
      player.setLogicalX(maxX);
      expect(player.logicalX).toBe(maxX);
    });

    it('allows center position', () => {
      player.setLogicalX(50);
      expect(player.logicalX).toBe(50);
    });
  });

  describe('syncPixelPosition', () => {
    it('syncs both x and y from logical coords', () => {
      player.logicalX = 75;
      player.logicalY = 30;
      player.syncPixelPosition();
      expect(player.x).toBe(toPixelX(75));
      expect(player.y).toBe(toPixelY(30));
    });
  });

  describe('getCollisionRect', () => {
    it('returns centered rect around logical position', () => {
      player.setLogicalX(50);
      const rect = player.getCollisionRect();
      expect(rect.x).toBe(50 - PLAYER_WIDTH / 2);
      expect(rect.y).toBe(PLAYER_START_Y - PLAYER_HEIGHT / 2);
      expect(rect.w).toBe(PLAYER_WIDTH);
      expect(rect.h).toBe(PLAYER_HEIGHT);
    });

    it('updates when position changes', () => {
      player.setLogicalX(20);
      const rect = player.getCollisionRect();
      expect(rect.x).toBe(20 - PLAYER_WIDTH / 2);
    });
  });

  it('sets depth to 10', () => {
    expect(player.depth).toBe(10);
  });

  it('configures physics body correctly', () => {
    const body = player.body as any;
    expect(body.immovable).toBe(true);
    expect(body.allowGravity).toBe(false);
  });
});
