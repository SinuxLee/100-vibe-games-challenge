interface SaveData {
  bestScore: number;
  longestTime: number;
  soundEnabled: boolean;
  vibrateEnabled: boolean;
}

const STORAGE_KEY = 'neon_dodge_save';

const DEFAULTS: SaveData = {
  bestScore: 0,
  longestTime: 0,
  soundEnabled: true,
  vibrateEnabled: true,
};

export class SaveSystem {
  static load(): SaveData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULTS };
      return { ...DEFAULTS, ...JSON.parse(raw) };
    } catch {
      return { ...DEFAULTS };
    }
  }

  static save(data: SaveData): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {}
  }

  static updateBest(score: number, time: number): boolean {
    const data = SaveSystem.load();
    let isNewBest = false;
    if (score > data.bestScore) {
      data.bestScore = score;
      isNewBest = true;
    }
    if (time > data.longestTime) {
      data.longestTime = time;
    }
    SaveSystem.save(data);
    return isNewBest;
  }

  static toggleSound(): boolean {
    const data = SaveSystem.load();
    data.soundEnabled = !data.soundEnabled;
    SaveSystem.save(data);
    return data.soundEnabled;
  }

  static toggleVibrate(): boolean {
    const data = SaveSystem.load();
    data.vibrateEnabled = !data.vibrateEnabled;
    SaveSystem.save(data);
    return data.vibrateEnabled;
  }
}
