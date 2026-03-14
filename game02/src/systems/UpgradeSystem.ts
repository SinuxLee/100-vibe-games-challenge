import { Player } from '../entities/Player';
import { WeaponSystem } from './WeaponSystem';
import { UPGRADE_TABLE } from '../config';
import { UpgradeConfig } from '../utils/csvLoader';
import Phaser from 'phaser';

export interface UpgradeDef {
  id: string;
  name: string;
  description: string;
  maxLevel: number;
  currentLevel: number;
  forCharacter: string;
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

function buildPoolFromTable(table: UpgradeConfig[]): UpgradeDef[] {
  return table.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    maxLevel: row.maxLevel,
    currentLevel: 0,
    forCharacter: row.forCharacter,
    apply: buildApplyFn(row.type, row.stat, row.factor),
  }));
}

let upgradePool: UpgradeDef[] = buildPoolFromTable(UPGRADE_TABLE);

export class UpgradeSystem {
  static getRandomUpgrades(count: number, player: Player, _weapons: WeaponSystem): UpgradeDef[] {
    const charId = player.characterId;
    const available = upgradePool.filter(
      (u) => u.currentLevel < u.maxLevel
        && (u.forCharacter === 'all' || u.forCharacter === charId),
    );
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
    upgradePool = buildPoolFromTable(UPGRADE_TABLE);
  }

  static getPool(): UpgradeDef[] {
    return upgradePool;
  }
}
