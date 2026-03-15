export const GAME_WIDTH = 100;
export const GAME_HEIGHT = 160;

export const CANVAS_WIDTH = 750;
export const CANVAS_HEIGHT = 1334;

export const SX = CANVAS_WIDTH / GAME_WIDTH;
export const SY = CANVAS_HEIGHT / GAME_HEIGHT;

export const PLAYER_WIDTH = 8;
export const PLAYER_HEIGHT = 5;
export const PLAYER_START_X = 50;
export const PLAYER_START_Y = 20;
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

// scrollSpeed(t) = min(22, 8 + 0.12t + 0.002t²)
export function scrollSpeed(t: number): number {
  return Math.min(22, 8 + 0.12 * t + 0.002 * t * t);
}

// spawnInterval(t) = max(0.45, 1.6 - 0.008t)
export function spawnInterval(t: number): number {
  return Math.max(0.45, 1.6 - 0.008 * t);
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
  return Math.min(6, 1.5 + 0.03 * t);
}

export function pulseInterval(t: number): number {
  return Math.max(0.4, 0.8 - 0.004 * t);
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

export const REG_SCORE = 'score';
export const REG_TIME = 'time';
export const REG_IS_PAUSED = 'isPaused';
