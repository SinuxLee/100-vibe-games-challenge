import {
  parseTableCsv, lookupById,
  PlayerConfig, EnemyConfig, BossConfig, WeaponConfig,
  UpgradeConfig, WaveConfig, XPConfig,
} from './utils/csvLoader';

import playerCsv from './data/player.csv?raw';
import enemyCsv from './data/enemy.csv?raw';
import bossCsv from './data/boss.csv?raw';
import weaponCsv from './data/weapon.csv?raw';
import upgradeCsv from './data/upgrade.csv?raw';
import waveCsv from './data/wave.csv?raw';
import xpCsv from './data/xp.csv?raw';

export const PLAYER_TABLE = parseTableCsv<PlayerConfig>(playerCsv, 'player');
export const ENEMY_TABLE = parseTableCsv<EnemyConfig>(enemyCsv, 'enemy');
export const BOSS_TABLE = parseTableCsv<BossConfig>(bossCsv, 'boss');
export const WEAPON_TABLE = parseTableCsv<WeaponConfig>(weaponCsv, 'weapon');
export const UPGRADE_TABLE = parseTableCsv<UpgradeConfig>(upgradeCsv, 'upgrade');
export const WAVE_TABLE = parseTableCsv<WaveConfig>(waveCsv, 'wave');
export const XP_TABLE = parseTableCsv<XPConfig>(xpCsv, 'xp');

export function getPlayerById(id: string): PlayerConfig | undefined { return lookupById(PLAYER_TABLE, id); }
export function getEnemyById(id: string): EnemyConfig | undefined { return lookupById(ENEMY_TABLE, id); }
export function getBossById(id: string): BossConfig | undefined { return lookupById(BOSS_TABLE, id); }
export function getWeaponById(id: string): WeaponConfig | undefined { return lookupById(WEAPON_TABLE, id); }
/** Get stage config for a given wave number. Each stage covers 5 waves; last stage repeats. */
export function getWaveConfigForWave(waveNum: number): WaveConfig {
  const idx = Math.min(Math.floor((waveNum - 1) / 5), WAVE_TABLE.length - 1);
  return WAVE_TABLE[idx];
}
/** @deprecated use getWaveConfigForWave instead */
export function getWaveConfig(id?: string): WaveConfig | undefined {
  if (id) return lookupById(WAVE_TABLE, id);
  return WAVE_TABLE[0];
}
export function getXPConfig(id: string = 'default'): XPConfig | undefined { return lookupById(XP_TABLE, id); }
/** Get the current stage number (1-based) for a given wave */
export function getStageForWave(waveNum: number): number {
  return Math.min(Math.floor((waveNum - 1) / 5) + 1, WAVE_TABLE.length);
}

export const DEFAULT_PLAYER_ID = 'warrior';
export const DEFAULT_ENEMY_ID = 'basic';
export const DEFAULT_BOSS_ID = 'brute';
export const DEFAULT_WEAPON_ID = 'basic_gun';

const dp = getPlayerById(DEFAULT_PLAYER_ID)!;
const de = getEnemyById(DEFAULT_ENEMY_ID)!;
const db = getBossById(DEFAULT_BOSS_ID)!;
const dw = getWeaponById(DEFAULT_WEAPON_ID)!;
const dwv = WAVE_TABLE[0];
const dxp = getXPConfig()!;

export const GAME_WIDTH = 750;
export const GAME_HEIGHT = 1334;
export const WORLD_WIDTH = 4000;
export const WORLD_HEIGHT = 4000;

export const PLAYER_SPEED = dp.speed;
export const PLAYER_MAX_HP = dp.maxHp;
export const PLAYER_PICKUP_RANGE = dp.pickupRange;
export const PLAYER_INVINCIBLE_MS = dp.invincibleMs;
export const PLAYER_SIZE = dp.size;

export const ENEMY_BASE_SPEED = de.speed;
export const ENEMY_BASE_HP = de.hp;
export const ENEMY_BASE_DAMAGE = de.damage;
export const ENEMY_BASE_XP = de.xpReward;
export const ENEMY_SIZE = de.size;

export const BOSS_HP_MULTIPLIER = db.hp / de.hp;
export const BOSS_DAMAGE_MULTIPLIER = db.damage / de.damage;
export const BOSS_SPEED_MULTIPLIER = db.speed / de.speed;
export const BOSS_SIZE = db.size;
export const BOSS_XP_MULTIPLIER = db.xpReward / de.xpReward;
export const BOSS_WAVE_INTERVAL = db.waveInterval;

export const WEAPON_BASE_DAMAGE = dw.damage;
export const WEAPON_BASE_FIRE_RATE = dw.fireRate;
export const WEAPON_BULLET_SPEED = dw.bulletSpeed;
export const BULLET_SIZE = dw.bulletSize;

export const XP_ORB_SIZE = dxp.orbSize;
export const XP_BASE_TO_LEVEL = dp.xpBase;
export const XP_LEVEL_SCALING = dp.xpScaling;
export const XP_ATTRACT_SPEED = dxp.attractSpeed;

export const WAVE_DURATION = dwv.duration;
export const SPAWN_INTERVAL_BASE = dwv.spawnIntervalBase;
export const SPAWN_INTERVAL_MIN = dwv.spawnIntervalMin;
export const SPAWN_COUNT_BASE = dwv.spawnCountBase;
export const ENEMY_HP_SCALING = dwv.hpScaling;
export const ENEMY_SPEED_SCALING = dwv.speedScaling;
export const SPAWN_INTERVAL_REDUCTION = dwv.intervalReduction;

export const UPGRADE_CHOICES = 3;

export const COLORS = {
  background: 0x1a1a2e,
  player: 0x4fc3f7,
  playerOutline: 0x0288d1,
  enemy: 0xe53935,
  enemyOutline: 0xb71c1c,
  boss: 0x8e24aa,
  bossOutline: 0x4a148c,
  bullet: 0xffd54f,
  bulletGlow: 0xffab00,
  xpOrb: 0x69f0ae,
  xpOrbGlow: 0x00c853,
  hpBar: 0xe53935,
  hpBarBg: 0x424242,
  xpBar: 0x42a5f5,
  xpBarBg: 0x1a237e,
  uiText: 0xffffff,
  uiPanel: 0x16213e,
  uiPanelLight: 0x0f3460,
  upgradeCard: 0x1a237e,
  upgradeCardHover: 0x283593,
  gold: 0xffd700,
};
