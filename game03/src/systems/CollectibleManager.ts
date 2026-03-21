import Phaser from 'phaser';
import { BaseCollectible } from '../entities/collectibles/BaseCollectible';
import { Gem } from '../entities/collectibles/Gem';
import { Spike } from '../entities/collectibles/Spike';
import { Shield } from '../entities/collectibles/Shield';
import { Magnet } from '../entities/collectibles/Magnet';
import { ScoreMulti } from '../entities/collectibles/ScoreMulti';
import { DifficultyDirector } from './DifficultyDirector';
import {
  CollectibleType, CollectibleLevelConfig,
  OBSTACLE_SPAWN_Y, GAME_WIDTH, COLLECTIBLE_SIZE,
  COLLECTIBLE_SPAWN_CHANCE, MAGNET_RANGE,
} from '../constants';

export class CollectibleManager {
  private scene: Phaser.Scene;
  private director: DifficultyDirector;
  private collectibles: BaseCollectible[] = [];
  private configs: CollectibleLevelConfig[] = [];
  magnetTimer = 0;

  constructor(scene: Phaser.Scene, director: DifficultyDirector, configs?: CollectibleLevelConfig[]) {
    this.scene = scene;
    this.director = director;
    if (configs && configs.length > 0) {
      this.configs = configs;
    }
  }

  private getConfig(): CollectibleLevelConfig | null {
    const level = this.director.getCurrentLevel();
    return this.configs.find(c => c.level === level)
      ?? this.configs[this.configs.length - 1]
      ?? null;
  }

  onObstacleSpawned(gapCenterX: number, gapWidth: number): void {
    const cfg = this.getConfig();
    const spawnChance = cfg?.spawnChance ?? COLLECTIBLE_SPAWN_CHANCE;
    if (Math.random() > spawnChance) return;

    const type = this.pickType(cfg);
    const halfGap = gapWidth / 2;
    const halfC = COLLECTIBLE_SIZE / 2;
    const safeMin = gapCenterX - halfGap + halfC + 1;
    const safeMax = gapCenterX + halfGap - halfC - 1;
    const spawnY = OBSTACLE_SPAWN_Y + 5;

    let logicalX: number;

    switch (type) {
      case CollectibleType.GEM_RARE: {
        const edgeOffset = halfGap * 0.7;
        logicalX = Math.random() < 0.5
          ? gapCenterX - edgeOffset
          : gapCenterX + edgeOffset;
        logicalX = Phaser.Math.Clamp(logicalX, halfC, GAME_WIDTH - halfC);
        this.collectibles.push(new Gem(this.scene, logicalX, spawnY, true));
        break;
      }
      case CollectibleType.SPIKE:
        logicalX = safeMin + Math.random() * Math.max(0, safeMax - safeMin);
        this.collectibles.push(new Spike(this.scene, logicalX, spawnY));
        break;
      case CollectibleType.SHIELD:
        logicalX = safeMin + Math.random() * Math.max(0, safeMax - safeMin);
        this.collectibles.push(new Shield(this.scene, logicalX, spawnY));
        break;
      case CollectibleType.MAGNET:
        logicalX = safeMin + Math.random() * Math.max(0, safeMax - safeMin);
        this.collectibles.push(new Magnet(this.scene, logicalX, spawnY));
        break;
      case CollectibleType.SCORE_MULTI:
        logicalX = safeMin + Math.random() * Math.max(0, safeMax - safeMin);
        this.collectibles.push(new ScoreMulti(this.scene, logicalX, spawnY));
        break;
      case CollectibleType.GEM_NORMAL:
      default:
        logicalX = safeMin + Math.random() * Math.max(0, safeMax - safeMin);
        this.collectibles.push(new Gem(this.scene, logicalX, spawnY, false));
        break;
    }
  }

  private pickType(cfg: CollectibleLevelConfig | null): CollectibleType {
    if (!cfg) {
      return Math.random() < 0.8 ? CollectibleType.GEM_NORMAL : CollectibleType.SPIKE;
    }

    const entries = Object.entries(cfg.weights) as [CollectibleType, number][];
    const totalWeight = entries.reduce((sum, [, w]) => sum + w, 0);
    if (totalWeight <= 0) return CollectibleType.GEM_NORMAL;

    let roll = Math.random() * totalWeight;
    for (const [type, weight] of entries) {
      roll -= weight;
      if (roll <= 0) return type;
    }
    return CollectibleType.GEM_NORMAL;
  }

  update(deltaSec: number): void {
    const scrollSpd = this.director.getScrollSpeed();

    if (this.magnetTimer > 0) {
      this.magnetTimer -= deltaSec;
    }

    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const c = this.collectibles[i];
      if (c.collected || c.isOffScreen()) {
        c.destroySelf();
        this.collectibles.splice(i, 1);
        continue;
      }
      c.updateMovement(deltaSec, scrollSpd);
    }
  }

  attractGemsToward(playerX: number, playerY: number, deltaSec: number): void {
    if (this.magnetTimer <= 0) return;
    for (const c of this.collectibles) {
      if (c.collected) continue;
      if (c.collectibleType !== CollectibleType.GEM_NORMAL && c.collectibleType !== CollectibleType.GEM_RARE) continue;
      const dx = playerX - c.logicalX;
      const dy = playerY - c.logicalY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < MAGNET_RANGE && dist > 0.5) {
        const speed = 40 * deltaSec;
        c.logicalX += (dx / dist) * speed;
        c.logicalY += (dy / dist) * speed;
      }
    }
  }

  getGemScore(isRare: boolean): number {
    const cfg = this.getConfig();
    if (!cfg) return isRare ? 30 : 15;
    return isRare ? cfg.rareGemScore : cfg.gemScore;
  }

  getSpikePenalty(): number {
    const cfg = this.getConfig();
    return cfg?.spikePenalty ?? -10;
  }

  getCollectibles(): BaseCollectible[] {
    return this.collectibles;
  }

  reset(): void {
    for (const c of this.collectibles) {
      c.destroySelf();
    }
    this.collectibles = [];
    this.magnetTimer = 0;
  }
}
