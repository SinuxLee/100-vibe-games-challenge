import Phaser from 'phaser';
import {
  GAME_WIDTH, GAME_HEIGHT,
  getWaveConfig, getEnemyById, getBossById,
  DEFAULT_ENEMY_ID, DEFAULT_BOSS_ID,
} from '../config';
import { parseEnemyWeights } from '../utils/csvLoader';
import { GameScene } from '../scenes/GameScene';
import { randomEdgePoint } from '../utils/helpers';
import { SaveSystem } from './SaveSystem';
import { SoundManager } from './SoundManager';

export class WaveSystem {
  currentWave: number = 1;
  private waveElapsed: number = 0;
  private spawnTimer: number = 0;
  private scene: GameScene;

  constructor(scene: GameScene) {
    this.scene = scene;
  }

  update(_time: number, delta: number): void {
    const wc = getWaveConfig()!;
    this.waveElapsed += delta;
    this.spawnTimer += delta;

    const spawnInterval = Math.max(
      wc.spawnIntervalMin,
      wc.spawnIntervalBase - (this.currentWave - 1) * wc.intervalReduction,
    );

    if (this.spawnTimer >= spawnInterval) {
      this.spawnTimer = 0;
      this.spawnWaveEnemies();
    }

    if (this.waveElapsed >= wc.duration) {
      this.advanceWave();
    }
  }

  private spawnWaveEnemies(): void {
    const wc = getWaveConfig()!;
    const player = this.scene.player;
    const count = wc.spawnCountBase + Math.floor(this.currentWave * 0.5);
    const hpMul = 1 + (this.currentWave - 1) * wc.hpScaling;
    const speedMul = 1 + (this.currentWave - 1) * wc.speedScaling;
    const halfW = GAME_WIDTH / 2;
    const halfH = GAME_HEIGHT / 2;

    const weights = parseEnemyWeights(wc.enemies);
    const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);

    for (let i = 0; i < count; i++) {
      const pos = randomEdgePoint(player.x, player.y, halfW, halfH);
      const clampedX = Phaser.Math.Clamp(pos.x, 0, this.scene.physics.world.bounds.width);
      const clampedY = Phaser.Math.Clamp(pos.y, 0, this.scene.physics.world.bounds.height);

      let roll = Math.random() * totalWeight;
      let selectedEnemyId = DEFAULT_ENEMY_ID;
      for (const w of weights) {
        roll -= w.weight;
        if (roll <= 0) {
          selectedEnemyId = w.enemyId;
          break;
        }
      }

      const enemyCfg = getEnemyById(selectedEnemyId);
      this.scene.spawnEnemy(clampedX, clampedY, hpMul, speedMul, enemyCfg);
    }
  }

  private advanceWave(): void {
    this.currentWave++;
    this.waveElapsed = 0;

    SoundManager.playWaveStart();

    const wc = getWaveConfig()!;
    const bossCfg = getBossById(wc.bossId || DEFAULT_BOSS_ID);
    const bossInterval = bossCfg?.waveInterval ?? 5;

    if (this.currentWave % bossInterval === 0) {
      this.spawnBoss(bossCfg);
    }

    this.autoSave();
  }

  private spawnBoss(bossCfg?: ReturnType<typeof getBossById>): void {
    const player = this.scene.player;
    const halfW = GAME_WIDTH / 2;
    const halfH = GAME_HEIGHT / 2;
    const pos = randomEdgePoint(player.x, player.y, halfW, halfH, 150);
    const clampedX = Phaser.Math.Clamp(pos.x, 0, this.scene.physics.world.bounds.width);
    const clampedY = Phaser.Math.Clamp(pos.y, 0, this.scene.physics.world.bounds.height);
    this.scene.spawnBoss(clampedX, clampedY, this.currentWave, bossCfg ?? undefined);

    SoundManager.playBossSpawn();
    this.scene.cameras.main.shake(300, 0.008);
  }

  private autoSave(): void {
    const s = this.scene;
    SaveSystem.save({
      playerLevel: s.player.level,
      playerXP: s.player.xp,
      playerHP: s.player.hp,
      playerMaxHP: s.player.maxHp,
      currentWave: this.currentWave,
      kills: s.kills,
      elapsedTime: s.elapsedTime,
      weaponLevels: {},
      appliedUpgrades: [],
      playerPosition: { x: s.player.x, y: s.player.y },
    });
  }
}
