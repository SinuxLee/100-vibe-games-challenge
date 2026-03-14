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
  if (type === 'player' && stat === 'pickupRange') {
    return (p) => { p.pickupRange += factor; };
  }
  if (type === 'player' && stat === 'invincibleMs') {
    return (p) => { p.invincibleMs += factor; };
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

function calcWeight(upgrade: UpgradeDef, player: Player, weapons: WeaponSystem): number {
  let weight = 1.0;
  const hpRatio = player.hp / player.maxHp;
  const weapon = weapons.weapons[0];

  switch (upgrade.id) {
    case 'max_hp':
      if (hpRatio < 0.5) weight += 1.0;
      else if (hpRatio < 0.8) weight += 0.3;
      break;
    case 'damage_up':
      if (weapon.bulletCount > 2) weight += 0.5;
      if (weapon.pierce > 1) weight += 0.3;
      break;
    case 'pierce':
      if (weapon.bulletCount > 1) weight += 0.5;
      break;
    case 'fire_rate_up':
      if (weapon.fireRate > 400) weight += 0.5;
      break;
    case 'speed_up':
      if (player.speed > 300) weight -= 0.3;
      else weight += 0.2;
      break;
    case 'bullet_count':
      weight += 0.3;
      break;
    case 'bullet_speed':
      if (weapon.bulletSpeed < 400) weight += 0.3;
      break;
    case 'shield':
      if (hpRatio < 0.6) weight += 0.8;
      break;
    case 'crit_chance':
      if (weapon.bulletCount > 2) weight += 0.5;
      weight += 0.2;
      break;
    case 'multi_cast':
      weight += 0.4;
      break;
    case 'magnet':
      weight += 0.2;
      break;
    case 'armor':
      if (hpRatio < 0.5) weight += 0.6;
      break;
  }

  const levelPenalty = upgrade.currentLevel * 0.15;
  weight -= levelPenalty;

  return Math.max(0.1, weight);
}

function weightedRandomPick(candidates: UpgradeDef[], count: number, player: Player, weapons: WeaponSystem): UpgradeDef[] {
  const pool = [...candidates];
  const result: UpgradeDef[] = [];

  for (let i = 0; i < count && pool.length > 0; i++) {
    const weights = pool.map((u) => calcWeight(u, player, weapons));
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);

    let roll = Math.random() * totalWeight;
    let picked = 0;
    for (let j = 0; j < weights.length; j++) {
      roll -= weights[j];
      if (roll <= 0) {
        picked = j;
        break;
      }
    }

    result.push(pool[picked]);
    pool.splice(picked, 1);
  }

  return result;
}

export class UpgradeSystem {
  static getRandomUpgrades(count: number, player: Player, weapons: WeaponSystem): UpgradeDef[] {
    const charId = player.characterId;
    const available = upgradePool.filter(
      (u) => u.currentLevel < u.maxLevel
        && (u.forCharacter === 'all' || u.forCharacter === charId),
    );
    return weightedRandomPick(available, Math.min(count, available.length), player, weapons);
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
