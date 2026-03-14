import { parseConfigCsv } from './utils/csvLoader';

import playerCsv from './data/player.csv?raw';
import enemyCsv from './data/enemy.csv?raw';
import bossCsv from './data/boss.csv?raw';
import weaponCsv from './data/weapon.csv?raw';
import xpCsv from './data/xp.csv?raw';
import waveCsv from './data/wave.csv?raw';

const p = parseConfigCsv(playerCsv);
const e = parseConfigCsv(enemyCsv);
const b = parseConfigCsv(bossCsv);
const w = parseConfigCsv(weaponCsv);
const x = parseConfigCsv(xpCsv);
const wv = parseConfigCsv(waveCsv);

export const GAME_WIDTH = 750;
export const GAME_HEIGHT = 1334;
export const WORLD_WIDTH = 4000;
export const WORLD_HEIGHT = 4000;

export const PLAYER_SPEED = p.PLAYER_SPEED;
export const PLAYER_MAX_HP = p.PLAYER_MAX_HP;
export const PLAYER_PICKUP_RANGE = p.PLAYER_PICKUP_RANGE;
export const PLAYER_INVINCIBLE_MS = p.PLAYER_INVINCIBLE_MS;
export const PLAYER_SIZE = p.PLAYER_SIZE;

export const ENEMY_BASE_SPEED = e.ENEMY_BASE_SPEED;
export const ENEMY_BASE_HP = e.ENEMY_BASE_HP;
export const ENEMY_BASE_DAMAGE = e.ENEMY_BASE_DAMAGE;
export const ENEMY_BASE_XP = e.ENEMY_BASE_XP;
export const ENEMY_SIZE = e.ENEMY_SIZE;

export const BOSS_HP_MULTIPLIER = b.BOSS_HP_MULTIPLIER;
export const BOSS_DAMAGE_MULTIPLIER = b.BOSS_DAMAGE_MULTIPLIER;
export const BOSS_SPEED_MULTIPLIER = b.BOSS_SPEED_MULTIPLIER;
export const BOSS_SIZE = b.BOSS_SIZE;
export const BOSS_XP_MULTIPLIER = b.BOSS_XP_MULTIPLIER;
export const BOSS_WAVE_INTERVAL = b.BOSS_WAVE_INTERVAL;

export const WEAPON_BASE_DAMAGE = w.WEAPON_BASE_DAMAGE;
export const WEAPON_BASE_FIRE_RATE = w.WEAPON_BASE_FIRE_RATE;
export const WEAPON_BULLET_SPEED = w.WEAPON_BULLET_SPEED;
export const BULLET_SIZE = w.BULLET_SIZE;

export const XP_ORB_SIZE = x.XP_ORB_SIZE;
export const XP_BASE_TO_LEVEL = x.XP_BASE_TO_LEVEL;
export const XP_LEVEL_SCALING = x.XP_LEVEL_SCALING;
export const XP_ATTRACT_SPEED = x.XP_ATTRACT_SPEED;

export const WAVE_DURATION = wv.WAVE_DURATION;
export const SPAWN_INTERVAL_BASE = wv.SPAWN_INTERVAL_BASE;
export const SPAWN_INTERVAL_MIN = wv.SPAWN_INTERVAL_MIN;
export const SPAWN_COUNT_BASE = wv.SPAWN_COUNT_BASE;
export const ENEMY_HP_SCALING = wv.ENEMY_HP_SCALING;
export const ENEMY_SPEED_SCALING = wv.ENEMY_SPEED_SCALING;
export const SPAWN_INTERVAL_REDUCTION = wv.SPAWN_INTERVAL_REDUCTION;

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
