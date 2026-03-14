// Game configuration constants — all balance tuning in one place

// --- Display ---
export const GAME_WIDTH = 750;
export const GAME_HEIGHT = 1334;
export const WORLD_WIDTH = 4000;
export const WORLD_HEIGHT = 4000;

// --- Player ---
export const PLAYER_SPEED = 200;
export const PLAYER_MAX_HP = 100;
export const PLAYER_PICKUP_RANGE = 120;
export const PLAYER_INVINCIBLE_MS = 500;
export const PLAYER_SIZE = 20;

// --- Enemy ---
export const ENEMY_BASE_SPEED = 80;
export const ENEMY_BASE_HP = 30;
export const ENEMY_BASE_DAMAGE = 10;
export const ENEMY_BASE_XP = 10;
export const ENEMY_SIZE = 16;

// --- Boss ---
export const BOSS_HP_MULTIPLIER = 20;
export const BOSS_DAMAGE_MULTIPLIER = 3;
export const BOSS_SPEED_MULTIPLIER = 0.6;
export const BOSS_SIZE = 48;
export const BOSS_XP_MULTIPLIER = 20;
export const BOSS_WAVE_INTERVAL = 5; // Boss every N waves

// --- Weapons ---
export const WEAPON_BASE_DAMAGE = 15;
export const WEAPON_BASE_FIRE_RATE = 600; // ms
export const WEAPON_BULLET_SPEED = 450;
export const BULLET_SIZE = 6;

// --- XP / Leveling ---
export const XP_ORB_SIZE = 8;
export const XP_BASE_TO_LEVEL = 30;
export const XP_LEVEL_SCALING = 1.35; // xpNeeded = base * scaling^(level-1)
export const XP_ATTRACT_SPEED = 300;

// --- Waves ---
export const WAVE_DURATION = 30_000; // ms per wave
export const SPAWN_INTERVAL_BASE = 1500; // ms
export const SPAWN_INTERVAL_MIN = 300;
export const SPAWN_COUNT_BASE = 1;
export const ENEMY_HP_SCALING = 0.15; // +15% per wave
export const ENEMY_SPEED_SCALING = 0.05;
export const SPAWN_INTERVAL_REDUCTION = 50; // ms faster per wave

// --- Upgrades ---
export const UPGRADE_CHOICES = 3;

// --- Colors ---
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
