import Phaser from 'phaser';
import {
  ENEMY_BASE_HP, BOSS_HP_MULTIPLIER, BOSS_DAMAGE_MULTIPLIER,
  BOSS_SPEED_MULTIPLIER, ENEMY_BASE_SPEED, ENEMY_BASE_DAMAGE,
  BOSS_XP_MULTIPLIER, ENEMY_BASE_XP, BOSS_SIZE, ENEMY_HP_SCALING, ENEMY_SIZE,
} from '../config';
import { Enemy } from './Enemy';
import { GameScene } from '../scenes/GameScene';
import { SoundManager } from '../systems/SoundManager';

export class BossEnemy extends Enemy {
  private hpBarBg!: Phaser.GameObjects.Graphics;
  private hpBarFill!: Phaser.GameObjects.Graphics;

  constructor(scene: GameScene, x: number, y: number, wave: number) {
    super(scene, x, y, 1, 1);

    this.setTexture('boss');
    const waveMul = 1 + wave * ENEMY_HP_SCALING;
    this.maxHp = Math.floor(ENEMY_BASE_HP * BOSS_HP_MULTIPLIER * waveMul);
    this.hp = this.maxHp;
    this.speed = ENEMY_BASE_SPEED * BOSS_SPEED_MULTIPLIER;
    this.damage = Math.floor(ENEMY_BASE_DAMAGE * BOSS_DAMAGE_MULTIPLIER);
    this.xpReward = ENEMY_BASE_XP * BOSS_XP_MULTIPLIER;

    this.setCircle(BOSS_SIZE, 0, 0);
    this.setDisplaySize(BOSS_SIZE * 2, BOSS_SIZE * 2);

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
    const y = this.y - BOSS_SIZE - 12;

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

    const flash = this.scene.add.circle(this.x, this.y, BOSS_SIZE, 0xffffff, 0.9);
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
