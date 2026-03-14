import { Player } from '../entities/Player';
import { WeaponSystem } from './WeaponSystem';

export interface UpgradeDef {
  id: string;
  name: string;
  description: string;
  maxLevel: number;
  currentLevel: number;
  apply: (player: Player, weapons: WeaponSystem) => void;
}

const upgradePool: UpgradeDef[] = [
  {
    id: 'damage_up',
    name: 'Power Shot',
    description: '+25% bullet damage',
    maxLevel: 5,
    currentLevel: 0,
    apply: (_p, w) => { w.weapons[0].damage = Math.floor(w.weapons[0].damage * 1.25); },
  },
  {
    id: 'fire_rate_up',
    name: 'Rapid Fire',
    description: '-15% fire cooldown',
    maxLevel: 5,
    currentLevel: 0,
    apply: (_p, w) => { w.weapons[0].fireRate = Math.floor(w.weapons[0].fireRate * 0.85); },
  },
  {
    id: 'bullet_count',
    name: 'Multi Shot',
    description: '+1 bullet per shot',
    maxLevel: 4,
    currentLevel: 0,
    apply: (_p, w) => { w.weapons[0].bulletCount += 1; },
  },
  {
    id: 'pierce',
    name: 'Piercing Rounds',
    description: '+1 enemy pierced per bullet',
    maxLevel: 3,
    currentLevel: 0,
    apply: (_p, w) => { w.weapons[0].pierce += 1; },
  },
  {
    id: 'speed_up',
    name: 'Swift Feet',
    description: '+12% movement speed',
    maxLevel: 5,
    currentLevel: 0,
    apply: (p) => { p.speed = Math.floor(p.speed * 1.12); },
  },
  {
    id: 'max_hp',
    name: 'Vitality',
    description: '+25 max HP and heal',
    maxLevel: 5,
    currentLevel: 0,
    apply: (p) => { p.maxHp += 25; p.hp = Math.min(p.hp + 25, p.maxHp); },
  },
  {
    id: 'bullet_speed',
    name: 'Velocity Rounds',
    description: '+20% bullet speed',
    maxLevel: 3,
    currentLevel: 0,
    apply: (_p, w) => { w.weapons[0].bulletSpeed = Math.floor(w.weapons[0].bulletSpeed * 1.2); },
  },
];

export class UpgradeSystem {
  static getRandomUpgrades(count: number, _player: Player, _weapons: WeaponSystem): UpgradeDef[] {
    const available = upgradePool.filter((u) => u.currentLevel < u.maxLevel);
    const shuffled = Phaser.Utils.Array.Shuffle([...available]);
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }

  static apply(upgrade: UpgradeDef, player: Player, weapons: WeaponSystem): void {
    upgrade.apply(player, weapons);
    upgrade.currentLevel++;
  }

  static applyById(id: string, player: Player, weapons: WeaponSystem): void {
    const upg = upgradePool.find((u) => u.id === id);
    if (upg) this.apply(upg, player, weapons);
  }

  static reset(): void {
    upgradePool.forEach((u) => (u.currentLevel = 0));
  }
}

import Phaser from 'phaser';
