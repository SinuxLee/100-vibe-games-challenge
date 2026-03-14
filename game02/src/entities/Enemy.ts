import Phaser from 'phaser';
import {
  ENEMY_BASE_HP, ENEMY_BASE_SPEED, ENEMY_BASE_DAMAGE, ENEMY_BASE_XP, ENEMY_SIZE,
} from '../config';
import { EnemyConfig } from '../utils/csvLoader';
import { GameScene } from '../scenes/GameScene';
import { SoundManager } from '../systems/SoundManager';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  xpReward: number;
  enemyId: string;
  protected gameScene: GameScene;

  constructor(
    scene: GameScene,
    x: number,
    y: number,
    hpMul: number = 1,
    speedMul: number = 1,
    cfg?: EnemyConfig,
  ) {
    super(scene, x, y, cfg?.texture ?? 'enemy');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.gameScene = scene;

    this.enemyId = cfg?.id ?? 'basic';
    const baseHp = cfg?.hp ?? ENEMY_BASE_HP;
    const baseSpeed = cfg?.speed ?? ENEMY_BASE_SPEED;
    this.maxHp = Math.floor(baseHp * hpMul);
    this.hp = this.maxHp;
    this.speed = baseSpeed * speedMul;
    this.damage = cfg?.damage ?? ENEMY_BASE_DAMAGE;
    this.xpReward = cfg?.xpReward ?? ENEMY_BASE_XP;

    const size = cfg?.size ?? ENEMY_SIZE;
    this.setCircle(size, 0, 0);
  }

  update(): void {
    if (!this.active || !this.gameScene.player?.active) return;
    this.scene.physics.moveToObject(this, this.gameScene.player, this.speed);
  }

  takeDamage(amount: number): void {
    this.hp -= amount;
    this.setTint(0xffffff);
    this.scene.time.delayedCall(60, () => {
      if (this.active) this.clearTint();
    });
  }

  die(): void {
    SoundManager.playEnemyDeath();

    const size = (this.body as Phaser.Physics.Arcade.Body)?.radius ?? ENEMY_SIZE;
    const deathSprite = this.scene.add.circle(this.x, this.y, size, 0xffffff, 0.8);
    this.scene.tweens.add({
      targets: deathSprite,
      scaleX: 2.5,
      scaleY: 2.5,
      alpha: 0,
      duration: 200,
      ease: 'Quad.easeOut',
      onComplete: () => deathSprite.destroy(),
    });

    this.destroy();
  }
}
