import { GameScene } from '../scenes/GameScene';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { XPOrb } from '../entities/XPOrb';
import { distanceBetween } from '../utils/helpers';

const KITE_HP_RATIO = 0.3;
const SAFE_DISTANCE = 200;
const ORB_CHASE_RANGE = 400;
const ENEMY_ENGAGE_RANGE = 600;

export class AutoBattleSystem {
  enabled: boolean = false;
  private scene: GameScene;

  constructor(scene: GameScene) {
    this.scene = scene;
  }

  update(): void {
    if (!this.enabled) return;

    const player = this.scene.player;
    const target = this.pickMoveTarget(player);
    if (target) {
      this.moveToward(player, target.x, target.y, target.flee);
    } else {
      player.setVelocity(0, 0);
    }
  }

  autoSelectUpgrade(): number {
    return 0;
  }

  private pickMoveTarget(player: Player): { x: number; y: number; flee: boolean } | null {
    const hpRatio = player.hp / player.maxHp;

    if (hpRatio < KITE_HP_RATIO) {
      const nearest = this.findNearestEnemy(player);
      if (nearest && distanceBetween(player.x, player.y, nearest.x, nearest.y) < SAFE_DISTANCE) {
        return { x: nearest.x, y: nearest.y, flee: true };
      }
    }

    const nearestOrb = this.findNearestOrb(player);
    if (nearestOrb) {
      const orbDist = distanceBetween(player.x, player.y, nearestOrb.x, nearestOrb.y);
      if (orbDist < ORB_CHASE_RANGE) {
        return { x: nearestOrb.x, y: nearestOrb.y, flee: false };
      }
    }

    const nearestEnemy = this.findNearestEnemy(player);
    if (nearestEnemy) {
      const eDist = distanceBetween(player.x, player.y, nearestEnemy.x, nearestEnemy.y);
      if (eDist > ENEMY_ENGAGE_RANGE) {
        return { x: nearestEnemy.x, y: nearestEnemy.y, flee: false };
      }
      if (eDist < SAFE_DISTANCE * 0.6) {
        return { x: nearestEnemy.x, y: nearestEnemy.y, flee: true };
      }
    }

    return null;
  }

  private moveToward(player: Player, tx: number, ty: number, flee: boolean): void {
    const dx = tx - player.x;
    const dy = ty - player.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 5) {
      player.setVelocity(0, 0);
      return;
    }
    const dir = flee ? -1 : 1;
    player.setVelocity(
      (dx / len) * player.speed * dir,
      (dy / len) * player.speed * dir,
    );
  }

  private findNearestEnemy(player: Player): Enemy | null {
    let nearest: Enemy | null = null;
    let minDist = Infinity;
    this.scene.enemies.getChildren().forEach((obj) => {
      const e = obj as Enemy;
      if (!e.active) return;
      const dist = distanceBetween(player.x, player.y, e.x, e.y);
      if (dist < minDist) {
        minDist = dist;
        nearest = e;
      }
    });
    return nearest;
  }

  private findNearestOrb(player: Player): XPOrb | null {
    let nearest: XPOrb | null = null;
    let minDist = Infinity;
    this.scene.xpOrbs.getChildren().forEach((obj) => {
      const orb = obj as XPOrb;
      if (!orb.active) return;
      const dist = distanceBetween(player.x, player.y, orb.x, orb.y);
      if (dist < minDist) {
        minDist = dist;
        nearest = orb;
      }
    });
    return nearest;
  }
}
