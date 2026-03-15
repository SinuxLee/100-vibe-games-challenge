import { describe, it, expect, beforeEach } from 'vitest';
import { GameManager, GameState } from '../../src/systems/GameManager';

describe('GameManager', () => {
  let gm: GameManager;

  beforeEach(() => {
    gm = new GameManager();
  });

  describe('initial state', () => {
    it('starts in BOOT state', () => {
      expect(gm.getState()).toBe(GameState.BOOT);
    });
  });

  describe('valid transitions', () => {
    it('BOOT → MENU', () => {
      expect(gm.canTransition(GameState.MENU)).toBe(true);
      expect(gm.transition(GameState.MENU)).toBe(true);
      expect(gm.getState()).toBe(GameState.MENU);
    });

    it('MENU → READY', () => {
      gm.transition(GameState.MENU);
      expect(gm.canTransition(GameState.READY)).toBe(true);
      expect(gm.transition(GameState.READY)).toBe(true);
      expect(gm.getState()).toBe(GameState.READY);
    });

    it('READY → PLAYING', () => {
      gm.transition(GameState.MENU);
      gm.transition(GameState.READY);
      expect(gm.transition(GameState.PLAYING)).toBe(true);
      expect(gm.getState()).toBe(GameState.PLAYING);
    });

    it('PLAYING → PAUSED', () => {
      gm.transition(GameState.MENU);
      gm.transition(GameState.READY);
      gm.transition(GameState.PLAYING);
      expect(gm.transition(GameState.PAUSED)).toBe(true);
      expect(gm.getState()).toBe(GameState.PAUSED);
    });

    it('PAUSED → PLAYING (resume)', () => {
      gm.transition(GameState.MENU);
      gm.transition(GameState.READY);
      gm.transition(GameState.PLAYING);
      gm.transition(GameState.PAUSED);
      expect(gm.transition(GameState.PLAYING)).toBe(true);
      expect(gm.getState()).toBe(GameState.PLAYING);
    });

    it('PAUSED → MENU (quit)', () => {
      gm.transition(GameState.MENU);
      gm.transition(GameState.READY);
      gm.transition(GameState.PLAYING);
      gm.transition(GameState.PAUSED);
      expect(gm.transition(GameState.MENU)).toBe(true);
      expect(gm.getState()).toBe(GameState.MENU);
    });

    it('PLAYING → GAME_OVER', () => {
      gm.transition(GameState.MENU);
      gm.transition(GameState.READY);
      gm.transition(GameState.PLAYING);
      expect(gm.transition(GameState.GAME_OVER)).toBe(true);
      expect(gm.getState()).toBe(GameState.GAME_OVER);
    });

    it('GAME_OVER → RESULT', () => {
      gm.transition(GameState.MENU);
      gm.transition(GameState.READY);
      gm.transition(GameState.PLAYING);
      gm.transition(GameState.GAME_OVER);
      expect(gm.transition(GameState.RESULT)).toBe(true);
      expect(gm.getState()).toBe(GameState.RESULT);
    });

    it('RESULT → READY (restart)', () => {
      gm.transition(GameState.MENU);
      gm.transition(GameState.READY);
      gm.transition(GameState.PLAYING);
      gm.transition(GameState.GAME_OVER);
      gm.transition(GameState.RESULT);
      expect(gm.transition(GameState.READY)).toBe(true);
    });

    it('RESULT → MENU (back)', () => {
      gm.transition(GameState.MENU);
      gm.transition(GameState.READY);
      gm.transition(GameState.PLAYING);
      gm.transition(GameState.GAME_OVER);
      gm.transition(GameState.RESULT);
      expect(gm.transition(GameState.MENU)).toBe(true);
    });
  });

  describe('invalid transitions', () => {
    it('BOOT cannot go to PLAYING', () => {
      expect(gm.canTransition(GameState.PLAYING)).toBe(false);
      expect(gm.transition(GameState.PLAYING)).toBe(false);
      expect(gm.getState()).toBe(GameState.BOOT);
    });

    it('MENU cannot go to GAME_OVER', () => {
      gm.transition(GameState.MENU);
      expect(gm.transition(GameState.GAME_OVER)).toBe(false);
      expect(gm.getState()).toBe(GameState.MENU);
    });

    it('PLAYING cannot go to MENU directly', () => {
      gm.transition(GameState.MENU);
      gm.transition(GameState.READY);
      gm.transition(GameState.PLAYING);
      expect(gm.transition(GameState.MENU)).toBe(false);
      expect(gm.getState()).toBe(GameState.PLAYING);
    });

    it('PAUSED cannot go to GAME_OVER', () => {
      gm.transition(GameState.MENU);
      gm.transition(GameState.READY);
      gm.transition(GameState.PLAYING);
      gm.transition(GameState.PAUSED);
      expect(gm.transition(GameState.GAME_OVER)).toBe(false);
    });

    it('GAME_OVER cannot go to PLAYING', () => {
      gm.transition(GameState.MENU);
      gm.transition(GameState.READY);
      gm.transition(GameState.PLAYING);
      gm.transition(GameState.GAME_OVER);
      expect(gm.transition(GameState.PLAYING)).toBe(false);
    });
  });

  describe('reset', () => {
    it('resets state back to BOOT', () => {
      gm.transition(GameState.MENU);
      gm.transition(GameState.READY);
      gm.transition(GameState.PLAYING);
      gm.reset();
      expect(gm.getState()).toBe(GameState.BOOT);
    });
  });

  describe('full game lifecycle', () => {
    it('completes a full play → death → restart cycle', () => {
      expect(gm.transition(GameState.MENU)).toBe(true);
      expect(gm.transition(GameState.READY)).toBe(true);
      expect(gm.transition(GameState.PLAYING)).toBe(true);
      expect(gm.transition(GameState.GAME_OVER)).toBe(true);
      expect(gm.transition(GameState.RESULT)).toBe(true);
      expect(gm.transition(GameState.READY)).toBe(true);
      expect(gm.transition(GameState.PLAYING)).toBe(true);
      expect(gm.getState()).toBe(GameState.PLAYING);
    });

    it('completes play → pause → resume → death cycle', () => {
      gm.transition(GameState.MENU);
      gm.transition(GameState.READY);
      gm.transition(GameState.PLAYING);
      gm.transition(GameState.PAUSED);
      gm.transition(GameState.PLAYING);
      gm.transition(GameState.GAME_OVER);
      expect(gm.getState()).toBe(GameState.GAME_OVER);
    });
  });
});
