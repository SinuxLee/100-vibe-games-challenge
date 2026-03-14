export interface SaveData {
  playerLevel: number;
  playerXP: number;
  playerHP: number;
  playerMaxHP: number;
  currentWave: number;
  kills: number;
  elapsedTime: number;
  weaponLevels: Record<string, number>;
  appliedUpgrades: string[];
  playerPosition: { x: number; y: number };
}

const SAVE_KEY = 'survivor_save';

export class SaveSystem {
  static save(data: SaveData): void {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  }

  static load(): SaveData | null {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  static hasSave(): boolean {
    return localStorage.getItem(SAVE_KEY) !== null;
  }

  static deleteSave(): void {
    localStorage.removeItem(SAVE_KEY);
  }
}
