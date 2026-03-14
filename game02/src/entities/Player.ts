import Phaser from 'phaser';
import {
  PLAYER_SPEED, PLAYER_MAX_HP, PLAYER_INVINCIBLE_MS, PLAYER_SIZE,
  XP_BASE_TO_LEVEL, XP_LEVEL_SCALING,
} from '../config';
import { GameScene } from '../scenes/GameScene';
import { SoundManager } from '../systems/SoundManager';

export class Player extends Phaser.Physics.Arcade.Sprite {
  hp: number;
  maxHp: number;
  speed: number;
  level: number;
  xp: number;
  xpToNext: number;
  private invincibleUntil: number = 0;
  private keys!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private gameScene: GameScene;

  constructor(scene: GameScene, x: number, y: number) {
    super(scene, x, y, 'player');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.gameScene = scene;

    this.hp = PLAYER_MAX_HP;
    this.maxHp = PLAYER_MAX_HP;
    this.speed = PLAYER_SPEED;
    this.level = 1;
    this.xp = 0;
    this.xpToNext = XP_BASE_TO_LEVEL;

    this.setCollideWorldBounds(true);
    this.setCircle(PLAYER_SIZE, 0, 0);

    if (scene.input.keyboard) {
      this.keys = {
        W: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      };
    }
  }

  update(): void {
    let vx = 0;
    let vy = 0;

    if (this.keys) {
      if (this.keys.A.isDown) vx -= 1;
      if (this.keys.D.isDown) vx += 1;
      if (this.keys.W.isDown) vy -= 1;
      if (this.keys.S.isDown) vy += 1;
    }

    const joy = this.gameScene.joystickVector;
    if (joy.x !== 0 || joy.y !== 0) {
      vx = joy.x;
      vy = joy.y;
    }

    if (vx !== 0 || vy !== 0) {
      const len = Math.sqrt(vx * vx + vy * vy);
      this.setVelocity((vx / len) * this.speed, (vy / len) * this.speed);
    } else {
      this.setVelocity(0, 0);
    }
  }

  takeDamage(amount: number): void {
    const now = this.scene.time.now;
    if (now < this.invincibleUntil) return;

    this.hp = Math.max(0, this.hp - amount);
    this.invincibleUntil = now + PLAYER_INVINCIBLE_MS;

    SoundManager.playPlayerHit();
    this.scene.cameras.main.shake(80, 0.004);

    this.setTint(0xff0000);
    this.scene.tweens.add({
      targets: this,
      alpha: 0.3,
      duration: 60,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        if (this.active) {
          this.clearTint();
          this.setAlpha(1);
        }
      },
    });
  }

  heal(amount: number): void {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  addXP(amount: number): boolean {
    this.xp += amount;
    if (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.level++;
      this.xpToNext = Math.floor(XP_BASE_TO_LEVEL * Math.pow(XP_LEVEL_SCALING, this.level - 1));
      return true;
    }
    return false;
  }

  recalcXPToNext(): void {
    this.xpToNext = Math.floor(XP_BASE_TO_LEVEL * Math.pow(XP_LEVEL_SCALING, this.level - 1));
  }
}
