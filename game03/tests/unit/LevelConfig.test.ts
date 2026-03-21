import { describe, it, expect } from 'vitest';
import { parseLevelsCSV, LevelData } from '../../src/systems/LevelConfig';
import { ObstacleType } from '../../src/constants';

const VALID_HEADER = 'level,scrollSpeed,spawnInterval,gapWidth,driftSpeed,driftRange,shrinkRate,pulseInterval,obstacleTypes,duration,label';

function makeCSV(rows: string[]): string {
  return [VALID_HEADER, ...rows].join('\n');
}

describe('parseLevelsCSV', () => {
  describe('valid input', () => {
    it('parses a single-row CSV correctly', () => {
      const csv = makeCSV(['1,6,2.0,35,0,0,0,0,A,15,START']);
      const levels = parseLevelsCSV(csv);
      expect(levels).toHaveLength(1);
      expect(levels[0]).toEqual({
        level: 1,
        scrollSpeed: 6,
        spawnInterval: 2.0,
        gapWidth: 35,
        driftSpeed: 0,
        driftRange: 0,
        shrinkRate: 0,
        pulseInterval: 0,
        obstacleTypes: [ObstacleType.SINGLE_GAP],
        duration: 15,
        label: 'START',
      });
    });

    it('parses multiple rows', () => {
      const csv = makeCSV([
        '1,6,2.0,35,0,0,0,0,A,15,START',
        '2,7,1.8,32,0,0,0,0,A,15,',
        '3,8,1.6,30,1.5,8,0,0,A|B,20,DRIFT!',
      ]);
      const levels = parseLevelsCSV(csv);
      expect(levels).toHaveLength(3);
      expect(levels[0].level).toBe(1);
      expect(levels[1].level).toBe(2);
      expect(levels[2].level).toBe(3);
    });

    it('parses pipe-separated obstacle types', () => {
      const csv = makeCSV(['1,10,1.0,20,0,0,0,0,A|B|C,30,']);
      const levels = parseLevelsCSV(csv);
      expect(levels[0].obstacleTypes).toEqual([
        ObstacleType.SINGLE_GAP,
        ObstacleType.DRIFTING_GAP,
        ObstacleType.DUAL_GAP,
      ]);
    });

    it('parses all 5 obstacle types (A|B|C|D|E)', () => {
      const csv = makeCSV(['1,10,1.0,20,0,0,0,0,A|B|C|D|E,0,ALL']);
      const levels = parseLevelsCSV(csv);
      expect(levels[0].obstacleTypes).toHaveLength(5);
      expect(levels[0].obstacleTypes).toContain(ObstacleType.SINGLE_GAP);
      expect(levels[0].obstacleTypes).toContain(ObstacleType.DRIFTING_GAP);
      expect(levels[0].obstacleTypes).toContain(ObstacleType.DUAL_GAP);
      expect(levels[0].obstacleTypes).toContain(ObstacleType.SHRINKING_GATE);
      expect(levels[0].obstacleTypes).toContain(ObstacleType.PULSE_GRID);
    });

    it('handles duration=0 as endless level', () => {
      const csv = makeCSV(['13,20,0.6,14,5,20,7,0.7,A|B|C|D|E,0,ENDLESS']);
      const levels = parseLevelsCSV(csv);
      expect(levels[0].duration).toBe(0);
      expect(levels[0].label).toBe('ENDLESS');
    });

    it('handles empty label gracefully', () => {
      const csv = makeCSV(['2,7,1.8,32,0,0,0,0,A,15,']);
      const levels = parseLevelsCSV(csv);
      expect(levels[0].label).toBe('');
    });

    it('skips empty lines', () => {
      const csv = makeCSV(['1,6,2.0,35,0,0,0,0,A,15,START', '', '2,7,1.8,32,0,0,0,0,A,15,']);
      const levels = parseLevelsCSV(csv);
      expect(levels).toHaveLength(2);
    });

    it('trims whitespace from fields', () => {
      const csv = VALID_HEADER + '\n 1 , 6 , 2.0 , 35 , 0 , 0 , 0 , 0 , A , 15 , START ';
      const levels = parseLevelsCSV(csv);
      expect(levels[0].level).toBe(1);
      expect(levels[0].scrollSpeed).toBe(6);
      expect(levels[0].label).toBe('START');
    });

    it('defaults unknown obstacle type tokens to SINGLE_GAP', () => {
      const csv = makeCSV(['1,6,2.0,35,0,0,0,0,Z|X,15,']);
      const levels = parseLevelsCSV(csv);
      expect(levels[0].obstacleTypes).toEqual([ObstacleType.SINGLE_GAP]);
    });
  });

  describe('validation errors', () => {
    it('throws on header-only CSV (no data rows)', () => {
      expect(() => parseLevelsCSV(VALID_HEADER)).toThrow('header row and at least one data row');
    });

    it('throws on empty string', () => {
      expect(() => parseLevelsCSV('')).toThrow('header row');
    });

    it('throws on missing required column', () => {
      const badHeader = 'level,scrollSpeed,gapWidth';
      expect(() => parseLevelsCSV(badHeader + '\n1,6,35')).toThrow('Missing CSV column');
    });

    it('throws on invalid level number (0)', () => {
      const csv = makeCSV(['0,6,2.0,35,0,0,0,0,A,15,']);
      expect(() => parseLevelsCSV(csv)).toThrow('Invalid level number');
    });

    it('throws on negative level number', () => {
      const csv = makeCSV(['-1,6,2.0,35,0,0,0,0,A,15,']);
      expect(() => parseLevelsCSV(csv)).toThrow('Invalid level number');
    });

    it('throws on non-numeric level', () => {
      const csv = makeCSV(['abc,6,2.0,35,0,0,0,0,A,15,']);
      expect(() => parseLevelsCSV(csv)).toThrow('Invalid level number');
    });

    it('throws on scrollSpeed <= 0', () => {
      const csv = makeCSV(['1,0,2.0,35,0,0,0,0,A,15,']);
      expect(() => parseLevelsCSV(csv)).toThrow('Invalid scrollSpeed');
    });

    it('throws on negative scrollSpeed', () => {
      const csv = makeCSV(['1,-5,2.0,35,0,0,0,0,A,15,']);
      expect(() => parseLevelsCSV(csv)).toThrow('Invalid scrollSpeed');
    });

    it('throws on spawnInterval <= 0', () => {
      const csv = makeCSV(['1,6,0,35,0,0,0,0,A,15,']);
      expect(() => parseLevelsCSV(csv)).toThrow('Invalid spawnInterval');
    });

    it('throws on gapWidth < 10', () => {
      const csv = makeCSV(['1,6,2.0,9,0,0,0,0,A,15,']);
      expect(() => parseLevelsCSV(csv)).toThrow('Invalid gapWidth');
    });

    it('throws on NaN scrollSpeed', () => {
      const csv = makeCSV(['1,abc,2.0,35,0,0,0,0,A,15,']);
      expect(() => parseLevelsCSV(csv)).toThrow('Invalid scrollSpeed');
    });
  });

  describe('full CSV integration', () => {
    it('parses the actual levels.csv format with 13 levels', () => {
      const csv = [
        VALID_HEADER,
        '1,4,3.0,50,0,0,0,0,A,45,START',
        '2,4.5,2.8,48,0,0,0,0,A,40,',
        '3,5.2,2.5,45,0,0,0,0,A,35,WARMING UP',
        '4,6,2.2,42,1.5,6,0,0,A|B,35,DRIFT!',
        '5,7,2.0,40,2.0,8,0,0,A|B,30,',
        '6,7.5,1.8,38,2.0,8,0,0,A|B|C,30,DUAL GAP',
        '7,8.5,1.6,35,2.5,10,0,0,A|B|C,30,',
        '8,9.5,1.5,32,2.5,10,2.5,0,A|B|C|D,30,SHRINK!',
        '9,10.5,1.4,28,3.0,12,3.0,0,A|B|C|D,30,',
        '10,12,1.2,25,3.0,12,3.5,1.2,A|B|C|D|E,35,PULSE!',
        '11,13.5,1.1,22,3.5,14,4.0,1.0,A|B|C|D|E,35,INTENSE',
        '12,15,0.9,20,4.0,16,4.5,0.9,A|B|C|D|E,40,HARDCORE',
        '13,16.5,0.8,18,4.5,18,5.0,0.8,A|B|C|D|E,0,ENDLESS',
      ].join('\n');

      const levels = parseLevelsCSV(csv);
      expect(levels).toHaveLength(13);

      expect(levels[0].scrollSpeed).toBe(4);
      expect(levels[0].gapWidth).toBe(50);
      expect(levels[0].obstacleTypes).toEqual([ObstacleType.SINGLE_GAP]);
      expect(levels[0].duration).toBe(45);

      expect(levels[3].obstacleTypes).toContain(ObstacleType.DRIFTING_GAP);
      expect(levels[3].driftSpeed).toBe(1.5);

      expect(levels[7].obstacleTypes).toContain(ObstacleType.SHRINKING_GATE);
      expect(levels[7].shrinkRate).toBe(2.5);

      expect(levels[9].obstacleTypes).toContain(ObstacleType.PULSE_GRID);
      expect(levels[9].pulseInterval).toBe(1.2);

      expect(levels[12].duration).toBe(0);

      for (let i = 1; i < levels.length; i++) {
        expect(levels[i].scrollSpeed).toBeGreaterThanOrEqual(levels[i - 1].scrollSpeed);
      }

      for (let i = 1; i < levels.length; i++) {
        expect(levels[i].gapWidth).toBeLessThanOrEqual(levels[i - 1].gapWidth);
      }
    });
  });
});
