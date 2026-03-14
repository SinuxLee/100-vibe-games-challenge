import {
  WAVE_DURATION, SPAWN_INTERVAL_BASE, SPAWN_INTERVAL_MIN,
  SPAWN_COUNT_BASE, ENEMY_HP_SCALING, ENEMY_SPEED_SCALING,
  SPAWN_INTERVAL_REDUCTION, BOSS_WAVE_INTERVAL,
  GAME_WIDTH, GAME_HEIGHT,
} from '../config';
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
    this.waveElapsed += delta;
    this.spawnTimer += delta;

    const spawnInterval = Math.max(
      SPAWN_INTERVAL_MIN,
      SPAWN_INTERVAL_BASE - (this.currentWave - 1) * SPAWN_INTERVAL_REDUCTION,
    );

    if (this.spawnTimer >= spawnInterval) {
      this.spawnTimer = 0;
      this.spawnWaveEnemies();
    }

    if (this.waveElapsed >= WAVE_DURATION) {
      this.advanceWave();
    }
  }

  private spawnWaveEnemies(): void {
    const player = this.scene.player;
    const count = SPAWN_COUNT_BASE + Math.floor(this.currentWave * 0.5);
    const hpMul = 1 + (this.currentWave - 1) * ENEMY_HP_SCALING;
    const speedMul = 1 + (this.currentWave - 1) * ENEMY_SPEED_SCALING;
    const halfW = GAME_WIDTH / 2;
    const halfH = GAME_HEIGHT / 2;

    for (let i = 0; i < count; i++) {
      const pos = randomEdgePoint(player.x, player.y, halfW, halfH);
      const clampedX = Phaser.Math.Clamp(pos.x, 0, this.scene.physics.world.bounds.width);
      const clampedY = Phaser.Math.Clamp(pos.y, 0, this.scene.physics.world.bounds.height);
      this.scene.spawnEnemy(clampedX, clampedY, hpMul, speedMul);
    }
  }

  private advanceWave(): void {
    this.currentWave++;
    this.waveElapsed = 0;

    SoundManager.playWaveStart();

    if (this.currentWave % BOSS_WAVE_INTERVAL === 0) {
      this.spawnBoss();
    }

    this.autoSave();
  }

  private spawnBoss(): void {
    const player = this.scene.player;
    const halfW = GAME_WIDTH / 2;
    const halfH = GAME_HEIGHT / 2;
    const pos = randomEdgePoint(player.x, player.y, halfW, halfH, 150);
    const clampedX = Phaser.Math.Clamp(pos.x, 0, this.scene.physics.world.bounds.width);
    const clampedY = Phaser.Math.Clamp(pos.y, 0, this.scene.physics.world.bounds.height);
    this.scene.spawnBoss(clampedX, clampedY, this.currentWave);

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
