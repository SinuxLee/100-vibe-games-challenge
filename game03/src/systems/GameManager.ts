export enum GameState {
  BOOT = 'Boot',
  MENU = 'Menu',
  READY = 'Ready',
  PLAYING = 'Playing',
  PAUSED = 'Paused',
  GAME_OVER = 'GameOver',
  RESULT = 'Result',
}

export class GameManager {
  private state: GameState = GameState.BOOT;

  getState(): GameState {
    return this.state;
  }

  canTransition(to: GameState): boolean {
    const transitions: Record<GameState, GameState[]> = {
      [GameState.BOOT]: [GameState.MENU],
      [GameState.MENU]: [GameState.READY],
      [GameState.READY]: [GameState.PLAYING],
      [GameState.PLAYING]: [GameState.PAUSED, GameState.GAME_OVER],
      [GameState.PAUSED]: [GameState.PLAYING, GameState.MENU],
      [GameState.GAME_OVER]: [GameState.RESULT],
      [GameState.RESULT]: [GameState.READY, GameState.MENU],
    };
    return transitions[this.state]?.includes(to) ?? false;
  }

  transition(to: GameState): boolean {
    if (this.canTransition(to)) {
      this.state = to;
      return true;
    }
    return false;
  }

  reset(): void {
    this.state = GameState.BOOT;
  }
}
