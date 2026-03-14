import { WEAPON_BASE_DAMAGE, WEAPON_BASE_FIRE_RATE, WEAPON_BULLET_SPEED } from '../config';
import { GameScene } from '../scenes/GameScene';
import { Bullet } from '../entities/Bullet';
import { Enemy } from '../entities/Enemy';
import { distanceBetween } from '../utils/helpers';
import { SoundManager } from './SoundManager';

export interface WeaponDef {
  name: string;
  damage: number;
  fireRate: number;
  bulletSpeed: number;
  bulletCount: number;
  pierce: number;
  level: number;
}

export class WeaponSystem {
  private scene: GameScene;
  private lastFired: number = 0;

  weapons: WeaponDef[] = [
    {
      name: 'Basic Gun',
      damage: WEAPON_BASE_DAMAGE,
      fireRate: WEAPON_BASE_FIRE_RATE,
      bulletSpeed: WEAPON_BULLET_SPEED,
      bulletCount: 1,
      pierce: 1,
      level: 1,
    },
  ];

  constructor(scene: GameScene) {
    this.scene = scene;
  }

  update(time: number): void {
    const weapon = this.weapons[0];
    if (time - this.lastFired < weapon.fireRate) return;

    const target = this.findNearestEnemy();
    if (!target) return;

    this.lastFired = time;
    this.fire(weapon, target);
  }

  private fire(weapon: WeaponDef, target: Enemy): void {
    const player = this.scene.player;
    const spread = weapon.bulletCount > 1 ? 0.3 : 0;
    const baseAngle = Math.atan2(target.y - player.y, target.x - player.x);

    SoundManager.playShoot();

    for (let i = 0; i < weapon.bulletCount; i++) {
      const offset = weapon.bulletCount > 1
        ? (i - (weapon.bulletCount - 1) / 2) * spread
        : 0;
      const angle = baseAngle + offset;
      const tx = player.x + Math.cos(angle) * 300;
      const ty = player.y + Math.sin(angle) * 300;

      const bullet = new Bullet(this.scene, player.x, player.y);
      this.scene.bullets.add(bullet);
      bullet.fire(tx, ty, weapon.damage, weapon.pierce, weapon.bulletSpeed);
    }
  }

  private findNearestEnemy(): Enemy | null {
    let nearest: Enemy | null = null;
    let minDist = Infinity;

    this.scene.enemies.getChildren().forEach((obj) => {
      const e = obj as Enemy;
      if (!e.active) return;
      const dist = distanceBetween(this.scene.player.x, this.scene.player.y, e.x, e.y);
      if (dist < minDist) {
        minDist = dist;
        nearest = e;
      }
    });

    return nearest;
  }
}
