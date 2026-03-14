import Phaser from 'phaser';
import {
  ENEMY_BASE_HP, ENEMY_BASE_SPEED, ENEMY_BASE_DAMAGE,
  ENEMY_BASE_XP, ENEMY_HP_SCALING,
} from '../config';
import { BossConfig, EnemyConfig } from '../utils/csvLoader';
import { Enemy } from './Enemy';
import { GameScene } from '../scenes/GameScene';
import { SoundManager } from '../systems/SoundManager';

export class BossEnemy extends Enemy {
  private hpBarBg!: Phaser.GameObjects.Graphics;
  private hpBarFill!: Phaser.GameObjects.Graphics;
  private bossSize: number;

  constructor(scene: GameScene, x: number, y: number, wave: number, bossCfg?: BossConfig) {
    const dummyEnemyCfg: EnemyConfig = {
      id: bossCfg?.id ?? 'brute',
      name: bossCfg?.name ?? 'Boss',
      speed: bossCfg?.speed ?? ENEMY_BASE_SPEED * 0.6,
      hp: bossCfg?.hp ?? ENEMY_BASE_HP * 20,
      damage: bossCfg?.damage ?? ENEMY_BASE_DAMAGE * 3,
      xpReward: bossCfg?.xpReward ?? ENEMY_BASE_XP * 20,
      size: bossCfg?.size ?? 48,
      texture: bossCfg?.texture ?? 'boss',
      color: bossCfg?.color ?? 0x8e24aa,
      desc: bossCfg?.desc ?? '',
    };

    const waveMul = 1 + wave * ENEMY_HP_SCALING;
    const scaledHp = Math.floor(dummyEnemyCfg.hp * waveMul);

    super(scene, x, y, 1, 1, { ...dummyEnemyCfg, hp: scaledHp });

    this.setTexture(dummyEnemyCfg.texture);
    this.bossSize = dummyEnemyCfg.size;
    this.setCircle(this.bossSize, 0, 0);
    this.setDisplaySize(this.bossSize * 2, this.bossSize * 2);

    this.hpBarBg = scene.add.graphics();
    this.hpBarFill = scene.add.graphics();
  }

  update(): void {
    super.update();
    this.drawHPBar();
  }

  private drawHPBar(): void {
    const barW = 60;
    const barH = 6;
    const x = this.x - barW / 2;
    const y = this.y - this.bossSize - 12;

    this.hpBarBg.clear();
    this.hpBarBg.fillStyle(0x424242, 0.8);
    this.hpBarBg.fillRect(x, y, barW, barH);

    const ratio = Math.max(0, this.hp / this.maxHp);
    this.hpBarFill.clear();
    this.hpBarFill.fillStyle(0xe53935, 1);
    this.hpBarFill.fillRect(x, y, barW * ratio, barH);
  }

  die(): void {
    this.hpBarBg.destroy();
    this.hpBarFill.destroy();

    SoundManager.playBossSpawn();
    this.gameScene.cameras.main.shake(400, 0.012);

    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      const px = this.x + Math.cos(angle) * 20;
      const py = this.y + Math.sin(angle) * 20;
      const particle = this.scene.add.circle(px, py, 8, 0x8e24aa, 1);
      this.scene.tweens.add({
        targets: particle,
        x: px + Math.cos(angle) * 80,
        y: py + Math.sin(angle) * 80,
        alpha: 0,
        scaleX: 0.2,
        scaleY: 0.2,
        duration: 400,
        ease: 'Quad.easeOut',
        onComplete: () => particle.destroy(),
      });
    }

    const flash = this.scene.add.circle(this.x, this.y, this.bossSize, 0xffffff, 0.9);
    this.scene.tweens.add({
      targets: flash,
      scaleX: 4,
      scaleY: 4,
      alpha: 0,
      duration: 350,
      ease: 'Quad.easeOut',
      onComplete: () => flash.destroy(),
    });

    this.destroy();
  }
}
