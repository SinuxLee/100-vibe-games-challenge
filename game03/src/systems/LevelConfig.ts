import { ObstacleType } from '../constants';

export interface LevelData {
  level: number;
  scrollSpeed: number;
  spawnInterval: number;
  gapWidth: number;
  driftSpeed: number;
  driftRange: number;
  shrinkRate: number;
  pulseInterval: number;
  obstacleTypes: ObstacleType[];
  duration: number;
  label: string;
}

const TYPE_MAP: Record<string, ObstacleType> = {
  A: ObstacleType.SINGLE_GAP,
  B: ObstacleType.DRIFTING_GAP,
  C: ObstacleType.DUAL_GAP,
  D: ObstacleType.SHRINKING_GATE,
  E: ObstacleType.PULSE_GRID,
};

function parseObstacleTypes(raw: string): ObstacleType[] {
  const types: ObstacleType[] = [];
  for (const token of raw.split('|')) {
    const trimmed = token.trim();
    if (TYPE_MAP[trimmed]) {
      types.push(TYPE_MAP[trimmed]);
    }
  }
  return types.length > 0 ? types : [ObstacleType.SINGLE_GAP];
}

export function parseLevelsCSV(csvText: string): LevelData[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV must have a header row and at least one data row');
  }

  const header = lines[0].split(',').map(h => h.trim().toLowerCase());

  const colIndex = (name: string): number => {
    const idx = header.indexOf(name);
    if (idx === -1) throw new Error(`Missing CSV column: ${name}`);
    return idx;
  };

  const iLevel = colIndex('level');
  const iScrollSpeed = colIndex('scrollspeed');
  const iSpawnInterval = colIndex('spawninterval');
  const iGapWidth = colIndex('gapwidth');
  const iDriftSpeed = colIndex('driftspeed');
  const iDriftRange = colIndex('driftrange');
  const iShrinkRate = colIndex('shrinkrate');
  const iPulseInterval = colIndex('pulseinterval');
  const iObstacleTypes = colIndex('obstacletypes');
  const iDuration = colIndex('duration');
  const iLabel = colIndex('label');

  const levels: LevelData[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split(',').map(c => c.trim());

    const level = parseInt(cols[iLevel], 10);
    const scrollSpeed = parseFloat(cols[iScrollSpeed]);
    const spawnInterval = parseFloat(cols[iSpawnInterval]);
    const gapWidth = parseFloat(cols[iGapWidth]);
    const driftSpeed = parseFloat(cols[iDriftSpeed]);
    const driftRange = parseFloat(cols[iDriftRange]);
    const shrinkRate = parseFloat(cols[iShrinkRate]);
    const pulseInterval = parseFloat(cols[iPulseInterval]);
    const obstacleTypes = parseObstacleTypes(cols[iObstacleTypes]);
    const duration = parseFloat(cols[iDuration]);
    const label = cols[iLabel] || '';

    if (isNaN(level) || level < 1) {
      throw new Error(`Invalid level number at row ${i + 1}`);
    }
    if (scrollSpeed <= 0 || isNaN(scrollSpeed)) {
      throw new Error(`Invalid scrollSpeed at level ${level}`);
    }
    if (spawnInterval <= 0 || isNaN(spawnInterval)) {
      throw new Error(`Invalid spawnInterval at level ${level}`);
    }
    if (gapWidth < 10 || isNaN(gapWidth)) {
      throw new Error(`Invalid gapWidth at level ${level}`);
    }

    levels.push({
      level, scrollSpeed, spawnInterval, gapWidth,
      driftSpeed, driftRange, shrinkRate, pulseInterval,
      obstacleTypes, duration, label,
    });
  }

  if (levels.length === 0) {
    throw new Error('CSV contains no valid level data');
  }

  return levels;
}
