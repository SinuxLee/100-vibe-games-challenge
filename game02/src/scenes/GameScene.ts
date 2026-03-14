import Phaser from 'phaser';
import {
  WORLD_WIDTH, WORLD_HEIGHT,
  XP_ATTRACT_SPEED, getPlayerById, DEFAULT_PLAYER_ID,
} from '../config';
import { EnemyConfig, BossConfig } from '../utils/csvLoader';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { BossEnemy } from '../entities/BossEnemy';
import { Bullet } from '../entities/Bullet';
import { XPOrb } from '../entities/XPOrb';
import { WeaponSystem } from '../systems/WeaponSystem';
import { WaveSystem } from '../systems/WaveSystem';
import { SaveSystem } from '../systems/SaveSystem';
import { UpgradeSystem } from '../systems/UpgradeSystem';
import { SoundManager } from '../systems/SoundManager';
import { AutoBattleSystem } from '../systems/AutoBattleSystem';
import { TutorialScene } from './TutorialScene';
import { distanceBetween } from '../utils/helpers';

export class GameScene extends Phaser.Scene {
  player!: Player;
  enemies!: Phaser.Physics.Arcade.Group;
  bullets!: Phaser.Physics.Arcade.Group;
  xpOrbs!: Phaser.Physics.Arcade.Group;

  weaponSystem!: WeaponSystem;
  waveSystem!: WaveSystem;
  autoBattle!: AutoBattleSystem;

  kills: number = 0;
  elapsedTime: number = 0;
  isPaused: boolean = false;

  private joystickBase?: Phaser.GameObjects.Image;
  private joystickThumb?: Phaser.GameObjects.Image;
  private joystickPointer?: Phaser.Input.Pointer | null = null;
  joystickVector: Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, 0);

  constructor() {
    super({ key: 'GameScene' });
  }

  init(): void {
    this.kills = 0;
    this.elapsedTime = 0;
    this.isPaused = false;
    this.joystickVector.set(0, 0);
    this.joystickPointer = null;
  }

  create(data?: { loadSave?: boolean; characterId?: string }): void {
    SoundManager.init(this);
    SoundManager.resume();

    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.drawBackground();

    const charId = data?.characterId ?? DEFAULT_PLAYER_ID;
    const playerCfg = getPlayerById(charId);
    this.player = new Player(this, WORLD_WIDTH / 2, WORLD_HEIGHT / 2, playerCfg);
    this.enemies = this.physics.add.group({ classType: Enemy, runChildUpdate: true });
    this.bullets = this.physics.add.group({ classType: Bullet, runChildUpdate: true });
    this.xpOrbs = this.physics.add.group({ classType: XPOrb, runChildUpdate: false });

    const startWeapon = playerCfg?.startWeapon;
    this.weaponSystem = new WeaponSystem(this, startWeapon);
    this.waveSystem = new WaveSystem(this);
    this.autoBattle = new AutoBattleSystem(this);

    this.physics.add.overlap(this.bullets, this.enemies, this.onBulletHitEnemy as any, undefined, this);
    this.physics.add.overlap(this.player, this.enemies, this.onPlayerHitEnemy as any, undefined, this);
    this.physics.add.overlap(this.player, this.xpOrbs, this.onPlayerCollectOrb as any, undefined, this);

    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    this.setupJoystick();

    this.scene.launch('HUDScene');

    if (data?.loadSave) {
      this.loadSaveData();
    }

    this.registry.set('hp', this.player.hp);
    this.registry.set('maxHp', this.player.maxHp);
    this.registry.set('level', this.player.level);
    this.registry.set('xp', this.player.xp);
    this.registry.set('xpToNext', this.player.xpToNext);
    this.registry.set('kills', this.kills);
    this.registry.set('time', this.elapsedTime);
    this.registry.set('wave', this.waveSystem.currentWave);

    if (!data?.loadSave && TutorialScene.shouldShow()) {
      this.isPaused = true;
      this.physics.pause();
      this.scene.launch('TutorialScene');
    }
  }

  update(time: number, delta: number): void {
    if (this.isPaused) return;

    this.elapsedTime += delta;
    this.player.update();
    this.autoBattle.update();
    this.weaponSystem.update(time);
    this.waveSystem.update(time, delta);
    this.attractXPOrbs();
    this.updateRegistry();
  }

  private drawBackground(): void {
    this.add.tileSprite(
      WORLD_WIDTH / 2, WORLD_HEIGHT / 2,
      WORLD_WIDTH, WORLD_HEIGHT,
      'tile_floor',
    );
  }

  private setupJoystick(): void {
    const { width, height } = this.scale;
    const baseX = 150;
    const baseY = height - 180;

    this.joystickBase = this.add.image(baseX, baseY, 'joystick_base')
      .setScrollFactor(0).setDepth(100).setAlpha(0);
    this.joystickThumb = this.add.image(baseX, baseY, 'joystick_thumb')
      .setScrollFactor(0).setDepth(101).setAlpha(0);

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.x < width * 0.5 && !this.joystickPointer) {
        this.joystickPointer = pointer;
        this.joystickBase!.setPosition(pointer.x, pointer.y).setAlpha(1);
        this.joystickThumb!.setPosition(pointer.x, pointer.y).setAlpha(1);
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.joystickPointer && pointer.id === this.joystickPointer.id) {
        const maxDist = 50;
        const dx = pointer.x - this.joystickBase!.x;
        const dy = pointer.y - this.joystickBase!.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const clampDist = Math.min(dist, maxDist);
        const angle = Math.atan2(dy, dx);

        this.joystickThumb!.setPosition(
          this.joystickBase!.x + Math.cos(angle) * clampDist,
          this.joystickBase!.y + Math.sin(angle) * clampDist,
        );

        if (dist > 10) {
          this.joystickVector.set(Math.cos(angle), Math.sin(angle));
        } else {
          this.joystickVector.set(0, 0);
        }
      }
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (this.joystickPointer && pointer.id === this.joystickPointer.id) {
        this.joystickPointer = null;
        this.joystickVector.set(0, 0);
        this.joystickBase!.setAlpha(0);
        this.joystickThumb!.setAlpha(0);
      }
    });
  }

  private attractXPOrbs(): void {
    this.xpOrbs.getChildren().forEach((obj) => {
      const orb = obj as XPOrb;
      if (!orb.active) return;
      const dist = distanceBetween(this.player.x, this.player.y, orb.x, orb.y);
      if (dist < this.player.pickupRange) {
        this.physics.moveToObject(orb, this.player, XP_ATTRACT_SPEED);
      }
    });
  }

  private onBulletHitEnemy(
    bulletObj: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    enemyObj: Phaser.Types.Physics.Arcade.GameObjectWithBody,
  ): void {
    const bullet = bulletObj as Bullet;
    const enemy = enemyObj as Enemy;
    if (!bullet.active || !enemy.active) return;

    enemy.takeDamage(bullet.damage);
    bullet.pierce--;

    SoundManager.playHit();

    const hitFlash = this.add.circle(enemy.x, enemy.y, 10, 0xffffff, 0.6);
    this.tweens.add({
      targets: hitFlash,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 120,
      ease: 'Quad.easeOut',
      onComplete: () => hitFlash.destroy(),
    });

    if (bullet.pierce <= 0) {
      bullet.destroy();
    }

    if (enemy.hp <= 0) {
      this.kills++;
      this.spawnXPOrb(enemy.x, enemy.y, enemy.xpReward);
      enemy.die();
    }
  }

  private onPlayerHitEnemy(
    playerObj: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    enemyObj: Phaser.Types.Physics.Arcade.GameObjectWithBody,
  ): void {
    const player = playerObj as Player;
    const enemy = enemyObj as Enemy;
    if (!player.active || !enemy.active) return;

    player.takeDamage(enemy.damage);
    if (player.hp <= 0) {
      this.gameOver();
    }
  }

  private onPlayerCollectOrb(
    _playerObj: Phaser.Types.Physics.Arcade.GameObjectWithBody,
    orbObj: Phaser.Types.Physics.Arcade.GameObjectWithBody,
  ): void {
    const orb = orbObj as XPOrb;
    if (!orb.active) return;

    SoundManager.playPickup();

    const leveled = this.player.addXP(orb.xpValue);
    orb.destroy();

    if (leveled) {
      this.triggerLevelUp();
    }
  }

  spawnXPOrb(x: number, y: number, value: number): void {
    const orb = new XPOrb(this, x, y, value);
    this.xpOrbs.add(orb);
  }

  spawnEnemy(x: number, y: number, hpMul: number, speedMul: number, cfg?: EnemyConfig): void {
    const enemy = new Enemy(this, x, y, hpMul, speedMul, cfg);
    this.enemies.add(enemy);
  }

  spawnBoss(x: number, y: number, wave: number, bossCfg?: BossConfig): void {
    const boss = new BossEnemy(this, x, y, wave, bossCfg);
    this.enemies.add(boss);
  }

  triggerLevelUp(): void {
    this.isPaused = true;
    this.physics.pause();
    SoundManager.playLevelUp();

    this.cameras.main.flash(300, 255, 215, 0);

    this.scene.launch('LevelUpScene');
  }

  resumeFromLevelUp(): void {
    this.updateRegistry();

    if (this.player.xp >= this.player.xpToNext) {
      this.player.xp -= this.player.xpToNext;
      this.player.level++;
      this.player.recalcXPToNext();
      this.triggerLevelUp();
      return;
    }

    this.isPaused = false;
    this.physics.resume();
  }

  gameOver(): void {
    SoundManager.playGameOver();
    SaveSystem.deleteSave();
    this.scene.stop('HUDScene');
    this.scene.start('GameOverScene', {
      kills: this.kills,
      time: this.elapsedTime,
      wave: this.waveSystem.currentWave,
      level: this.player.level,
    });
  }

  private loadSaveData(): void {
    const save = SaveSystem.load();
    if (!save) return;

    this.player.setPosition(save.playerPosition.x, save.playerPosition.y);
    this.player.hp = save.playerHP;
    this.player.maxHp = save.playerMaxHP;
    this.player.level = save.playerLevel;
    this.player.xp = save.playerXP;
    this.player.recalcXPToNext();
    this.kills = save.kills;
    this.elapsedTime = save.elapsedTime;
    this.waveSystem.currentWave = save.currentWave;

    save.appliedUpgrades.forEach((id) => {
      UpgradeSystem.applyById(id, this.player, this.weaponSystem);
    });
  }

  private updateRegistry(): void {
    this.registry.set('hp', this.player.hp);
    this.registry.set('maxHp', this.player.maxHp);
    this.registry.set('level', this.player.level);
    this.registry.set('xp', this.player.xp);
    this.registry.set('xpToNext', this.player.xpToNext);
    this.registry.set('kills', this.kills);
    this.registry.set('time', this.elapsedTime);
    this.registry.set('wave', this.waveSystem.currentWave);
  }
}
