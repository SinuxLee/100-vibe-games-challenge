import Phaser from 'phaser';
import {
  ENEMY_BASE_HP, ENEMY_BASE_SPEED, ENEMY_BASE_DAMAGE, ENEMY_BASE_XP, ENEMY_SIZE,
} from '../config';
import { GameScene } from '../scenes/GameScene';
import { SoundManager } from '../systems/SoundManager';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  xpReward: number;
  protected gameScene: GameScene;

  constructor(scene: GameScene, x: number, y: number, hpMul: number = 1, speedMul: number = 1) {
    super(scene, x, y, 'enemy');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.gameScene = scene;

    this.maxHp = Math.floor(ENEMY_BASE_HP * hpMul);
    this.hp = this.maxHp;
    this.speed = ENEMY_BASE_SPEED * speedMul;
    this.damage = ENEMY_BASE_DAMAGE;
    this.xpReward = ENEMY_BASE_XP;

    this.setCircle(ENEMY_SIZE, 0, 0);
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

    const deathSprite = this.scene.add.circle(this.x, this.y, ENEMY_SIZE, 0xffffff, 0.8);
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
