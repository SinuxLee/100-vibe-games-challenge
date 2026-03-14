export interface CsvRow {
  [key: string]: string;
}

export function parseCsv(raw: string): CsvRow[] {
  const lines = raw.trim().split('\n').filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim());
  const rows: CsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim());
    const row: CsvRow = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] ?? '';
    });
    rows.push(row);
  }

  return rows;
}

export function parseConfigCsv(raw: string): Record<string, number> {
  const rows = parseCsv(raw);
  const config: Record<string, number> = {};
  for (const row of rows) {
    if (row.key && row.value !== undefined) {
      config[row.key] = Number(row.value);
    }
  }
  return config;
}

export interface PlayerConfig {
  id: string;
  name: string;
  speed: number;
  maxHp: number;
  pickupRange: number;
  invincibleMs: number;
  size: number;
  texture: string;
  startWeapon: string;
  xpBase: number;
  xpScaling: number;
  desc: string;
}

export interface EnemyConfig {
  id: string;
  name: string;
  speed: number;
  hp: number;
  damage: number;
  xpReward: number;
  size: number;
  texture: string;
  color: number;
  desc: string;
}

export interface BossConfig {
  id: string;
  name: string;
  speed: number;
  hp: number;
  damage: number;
  xpReward: number;
  size: number;
  texture: string;
  color: number;
  waveInterval: number;
  desc: string;
}

export interface WeaponConfig {
  id: string;
  name: string;
  damage: number;
  fireRate: number;
  bulletSpeed: number;
  bulletCount: number;
  pierce: number;
  bulletSize: number;
  bulletTexture: string;
  desc: string;
}

export interface UpgradeConfig {
  id: string;
  name: string;
  description: string;
  maxLevel: number;
  type: string;
  stat: string;
  factor: number;
  forCharacter: string;
}

export interface WaveConfig {
  id: string;
  duration: number;
  spawnIntervalBase: number;
  spawnIntervalMin: number;
  spawnCountBase: number;
  hpScaling: number;
  speedScaling: number;
  intervalReduction: number;
  enemies: string;
  bossId: string;
  desc: string;
}

export interface XPConfig {
  id: string;
  orbSize: number;
  attractSpeed: number;
  desc: string;
}

const NUMBER_COLUMNS: Record<string, Set<string>> = {
  player: new Set(['speed', 'maxHp', 'pickupRange', 'invincibleMs', 'size', 'xpBase', 'xpScaling']),
  enemy: new Set(['speed', 'hp', 'damage', 'xpReward', 'size', 'color']),
  boss: new Set(['speed', 'hp', 'damage', 'xpReward', 'size', 'color', 'waveInterval']),
  weapon: new Set(['damage', 'fireRate', 'bulletSpeed', 'bulletCount', 'pierce', 'bulletSize']),
  upgrade: new Set(['maxLevel', 'factor']),
  wave: new Set(['duration', 'spawnIntervalBase', 'spawnIntervalMin', 'spawnCountBase', 'hpScaling', 'speedScaling', 'intervalReduction']),
  xp: new Set(['orbSize', 'attractSpeed']),
};

export function parseTableCsv<T>(raw: string, tableType: string): T[] {
  const rows = parseCsv(raw);
  const numCols = NUMBER_COLUMNS[tableType] ?? new Set<string>();

  return rows.map((row) => {
    const typed: Record<string, string | number> = {};
    for (const [key, value] of Object.entries(row)) {
      if (numCols.has(key)) {
        typed[key] = Number(value);
      } else {
        typed[key] = value;
      }
    }
    return typed as unknown as T;
  });
}

export function lookupById<T extends { id: string }>(rows: T[], id: string): T | undefined {
  return rows.find((r) => r.id === id);
}

export interface EnemyWeight {
  enemyId: string;
  weight: number;
}

export function parseEnemyWeights(raw: string): EnemyWeight[] {
  if (!raw || raw.trim().length === 0) return [];
  return raw.split(',').map((entry) => {
    const [enemyId, w] = entry.trim().split(':');
    return { enemyId: enemyId.trim(), weight: Number(w) || 1 };
  });
}
