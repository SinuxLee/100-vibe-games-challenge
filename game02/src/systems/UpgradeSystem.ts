import { Player } from '../entities/Player';
import { WeaponSystem } from './WeaponSystem';
import { parseCsv } from '../utils/csvLoader';
import upgradeCsv from '../data/upgrade.csv?raw';
import Phaser from 'phaser';

export interface UpgradeDef {
  id: string;
  name: string;
  description: string;
  maxLevel: number;
  currentLevel: number;
  apply: (player: Player, weapons: WeaponSystem) => void;
}

function buildApplyFn(type: string, stat: string, factor: number): (p: Player, w: WeaponSystem) => void {
  if (type === 'player' && stat === 'speed') {
    return (p) => { p.speed = Math.floor(p.speed * factor); };
  }
  if (type === 'player' && stat === 'maxHp') {
    return (p) => { p.maxHp += factor; p.hp = Math.min(p.hp + factor, p.maxHp); };
  }
  if (type === 'weapon' && stat === 'damage') {
    return (_p, w) => { w.weapons[0].damage = Math.floor(w.weapons[0].damage * factor); };
  }
  if (type === 'weapon' && stat === 'fireRate') {
    return (_p, w) => { w.weapons[0].fireRate = Math.floor(w.weapons[0].fireRate * factor); };
  }
  if (type === 'weapon' && stat === 'bulletCount') {
    return (_p, w) => { w.weapons[0].bulletCount += factor; };
  }
  if (type === 'weapon' && stat === 'pierce') {
    return (_p, w) => { w.weapons[0].pierce += factor; };
  }
  if (type === 'weapon' && stat === 'bulletSpeed') {
    return (_p, w) => { w.weapons[0].bulletSpeed = Math.floor(w.weapons[0].bulletSpeed * factor); };
  }
  return () => {};
}

function loadUpgradePool(): UpgradeDef[] {
  const rows = parseCsv(upgradeCsv);
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    maxLevel: Number(row.maxLevel),
    currentLevel: 0,
    apply: buildApplyFn(row.type, row.stat, Number(row.factor)),
  }));
}

let upgradePool: UpgradeDef[] = loadUpgradePool();

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
    upgradePool = loadUpgradePool();
  }

  static getPool(): UpgradeDef[] {
    return upgradePool;
  }
}
