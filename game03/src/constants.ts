export const GAME_WIDTH = 100;
export const GAME_HEIGHT = 160;

export const CANVAS_WIDTH = 750;
export const CANVAS_HEIGHT = 1334;

export const SX = CANVAS_WIDTH / GAME_WIDTH;
export const SY = CANVAS_HEIGHT / GAME_HEIGHT;

export const PLAYER_WIDTH = 8;
export const PLAYER_HEIGHT = 5;
export const PLAYER_START_X = 50;
export const PLAYER_START_Y = 80;
export const PLAYER_MAX_SPEED = 60;

export const COLOR_ELECTRIC_BLUE = 0x00E5FF;
export const COLOR_NEON_PURPLE = 0x9D4DFF;
export const COLOR_LASER_RED = 0xFF3B5C;
export const COLOR_HIGHLIGHT_WHITE = 0xF5F7FF;
export const COLOR_DARK_BG = 0x070B1A;

export const CSS_ELECTRIC_BLUE = '#00E5FF';
export const CSS_NEON_PURPLE = '#9D4DFF';
export const CSS_LASER_RED = '#FF3B5C';
export const CSS_HIGHLIGHT_WHITE = '#F5F7FF';
export const CSS_DARK_BG = '#070B1A';

export const SCORE_PER_TICK = 1;
export const SCORE_TICK_INTERVAL = 0.1;
export const SCORE_OBSTACLE_PASS = 5;
export const SCORE_NEAR_MISS = 8;
export const NEAR_MISS_DISTANCE = 2.5;

export enum ObstacleType {
  SINGLE_GAP = 'A',
  DRIFTING_GAP = 'B',
  DUAL_GAP = 'C',
  SHRINKING_GATE = 'D',
  PULSE_GRID = 'E',
}

export const OBSTACLE_UNLOCK: Record<ObstacleType, number> = {
  [ObstacleType.SINGLE_GAP]: 0,
  [ObstacleType.DRIFTING_GAP]: 15,
  [ObstacleType.DUAL_GAP]: 30,
  [ObstacleType.SHRINKING_GATE]: 50,
  [ObstacleType.PULSE_GRID]: 75,
};

export const OBSTACLE_SPAWN_Y = 170;
export const OBSTACLE_DESTROY_Y = -10;
export const OBSTACLE_HEIGHT = 3;
export const MAX_CONSECUTIVE_SAME = 2;
export const EASY_PERIOD = 10;
export const MIN_WALL_WIDTH = 20;
export const INITIAL_SPAWN_DELAY = 2.0;
export const SHRINKING_GATE_MIN_GAP_EXTRA = 4;
export const DRIFT_MAX_LATERAL_SPEED = PLAYER_MAX_SPEED * 1.2;

// scrollSpeed(t) = min(65, 15 + 0.3t + 0.003t²)
export function scrollSpeed(t: number): number {
  return Math.min(65, 15 + 0.3 * t + 0.003 * t * t);
}

// spawnInterval(t) = max(0.6, 3.0 - 0.015t)
export function spawnInterval(t: number): number {
  return Math.max(0.6, 3.0 - 0.015 * t);
}

// gapWidth(t) = max(14, 30 - 0.12t)
export function gapWidth(t: number): number {
  return Math.max(14, 30 - 0.12 * t);
}

export function driftSpeed(t: number): number {
  return Math.min(8, 2 + 0.05 * t);
}

export function driftRange(t: number): number {
  return Math.min(15, 5 + 0.08 * t);
}

export function shrinkRate(t: number): number {
  return Math.min(20, 4 + 0.1 * t);
}

export function pulseInterval(t: number): number {
  return Math.max(0.35, 0.6 - 0.003 * t);
}

export const REACTION_BUFFER_MIN = 0.12;
export const REACTION_BUFFER_MAX = 0.18;

// Y axis is flipped: logical Y=0 is screen bottom, pixel Y=0 is screen top
export function toPixelX(lx: number): number {
  return lx * SX;
}

export function toPixelY(ly: number): number {
  return (GAME_HEIGHT - ly) * SY;
}

export function toPixelW(lw: number): number {
  return lw * SX;
}

export function toPixelH(lh: number): number {
  return lh * SY;
}

export function toLogicalX(px: number): number {
  return px / SX;
}

export function toLogicalY(py: number): number {
  return GAME_HEIGHT - py / SY;
}

export const LEVEL_LABEL_DISPLAY_TIME = 2.0;
export const LEVEL_TRANSITION_FLASH_DURATION = 0.3;

export const COMBO_INCREMENT = 0.15;
export const COMBO_BASE = 1.0;
export const COMBO_MERCY_MULTIPLIER = 0.5;
export const COMBO_MERCY_MIN = 1.0;
export const COMBO_MILESTONE_INTERVAL = 5;

export const CSS_COMBO_WHITE = '#FFFFFF';
export const CSS_COMBO_YELLOW = '#FFD700';
export const CSS_COMBO_RED = '#FF4444';
export const COLOR_COMBO_YELLOW = 0xFFD700;
export const COLOR_COMBO_RED = 0xFF4444;

export const REG_SCORE = 'score';
export const REG_TIME = 'time';
export const REG_IS_PAUSED = 'isPaused';
export const REG_LEVEL = 'hud_level';
export const REG_LEVEL_LABEL = 'hud_level_label';
export const REG_COMBO = 'hud_combo';
export const REG_COMBO_COUNT = 'hud_combo_count';

// Collectibles
export enum CollectibleType {
  GEM_NORMAL = 'gem_normal',
  GEM_RARE = 'gem_rare',
  SPIKE = 'spike',
  SHIELD = 'shield',
  MAGNET = 'magnet',
  SCORE_MULTI = 'score_multi',
}
export const COLLECTIBLE_SIZE = 4;
export const COLLECTIBLE_SPAWN_CHANCE = 0.6;
export const COLLECTIBLE_GEM_RATIO_BASE = 0.85;
export const COLLECTIBLE_GEM_RATIO_MIN = 0.6;
export const COLLECTIBLE_RARE_CHANCE = 0.2;
export const SCORE_GEM_NORMAL = 15;
export const SCORE_GEM_RARE = 30;
export const SCORE_SPIKE_PENALTY = -10;
export const SPIKE_SLOW_DURATION = 1.5;
export const SPIKE_SLOW_FACTOR = 0.5;
export const SHIELD_COLOR = 0x00FF88;
export const MAGNET_COLOR = 0xFFD700;
export const SCORE_MULTI_COLOR = 0xFFAA00;
export const MAGNET_DURATION = 3.0;
export const MAGNET_RANGE = 15;
export const SCORE_MULTI_DURATION = 5.0;
export const SCORE_MULTI_FACTOR = 2.0;

export interface CollectibleLevelConfig {
  level: number;
  spawnChance: number;
  weights: Record<CollectibleType, number>;
  gemScore: number;
  rareGemScore: number;
  spikePenalty: number;
}

export function parseCollectiblesCSV(csv: string): CollectibleLevelConfig[] {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];
  const configs: CollectibleLevelConfig[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    if (cols.length < 11) continue;
    configs.push({
      level: parseInt(cols[0]),
      spawnChance: parseFloat(cols[1]),
      weights: {
        [CollectibleType.GEM_NORMAL]: parseFloat(cols[2]),
        [CollectibleType.GEM_RARE]: parseFloat(cols[3]),
        [CollectibleType.SPIKE]: parseFloat(cols[4]),
        [CollectibleType.SHIELD]: parseFloat(cols[5]),
        [CollectibleType.MAGNET]: parseFloat(cols[6]),
        [CollectibleType.SCORE_MULTI]: parseFloat(cols[7]),
      } as Record<CollectibleType, number>,
      gemScore: parseInt(cols[8]),
      rareGemScore: parseInt(cols[9]),
      spikePenalty: parseInt(cols[10]),
    });
  }
  return configs;
}
