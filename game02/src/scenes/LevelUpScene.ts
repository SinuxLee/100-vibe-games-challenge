import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT, UPGRADE_CHOICES } from '../config';
import { UpgradeSystem, UpgradeDef } from '../systems/UpgradeSystem';
import { SoundManager } from '../systems/SoundManager';
import { GameScene } from './GameScene';

export class LevelUpScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LevelUpScene' });
  }

  create(): void {
    const { width, height } = this.scale;
    const gameScene = this.scene.get('GameScene') as GameScene;
    const upgrades = UpgradeSystem.getRandomUpgrades(UPGRADE_CHOICES, gameScene.player, gameScene.weaponSystem);

    if (gameScene.autoBattle?.enabled && upgrades.length > 0) {
      const pickIndex = gameScene.autoBattle.autoSelectUpgrade();
      const chosen = upgrades[Math.min(pickIndex, upgrades.length - 1)];
      UpgradeSystem.apply(chosen, gameScene.player, gameScene.weaponSystem);
      SoundManager.playClick();
      this.scene.stop();
      gameScene.resumeFromLevelUp();
      return;
    }

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.65);
    overlay.fillRect(0, 0, width, height);

    this.add.text(width / 2, height * 0.15, 'LEVEL UP!', {
      fontSize: '42px',
      fontFamily: 'monospace',
      color: '#ffd700',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const cardWidth = width * 0.8;
    const cardHeight = 120;
    const startY = height * 0.28;
    const gap = 20;

    upgrades.forEach((upg, i) => {
      const y = startY + i * (cardHeight + gap);
      this.createCard(width / 2, y, cardWidth, cardHeight, upg, gameScene);
    });
  }

  private createCard(
    x: number, y: number, w: number, h: number,
    upgrade: UpgradeDef, gameScene: GameScene,
  ): void {
    const card = this.add.graphics();
    card.fillStyle(COLORS.upgradeCard, 0.95);
    card.fillRoundedRect(x - w / 2, y, w, h, 12);
    card.lineStyle(2, COLORS.gold, 0.6);
    card.strokeRoundedRect(x - w / 2, y, w, h, 12);

    this.add.text(x, y + 20, upgrade.name, {
      fontSize: '24px',
      fontFamily: 'monospace',
      color: '#ffd700',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0);

    this.add.text(x, y + 55, upgrade.description, {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#b0bec5',
      wordWrap: { width: w - 40 },
    }).setOrigin(0.5, 0);

    const hitArea = this.add.rectangle(x, y + h / 2, w, h, 0xffffff, 0)
      .setInteractive({ useHandCursor: true });

    hitArea.on('pointerover', () => {
      card.clear();
      card.fillStyle(COLORS.upgradeCardHover, 0.95);
      card.fillRoundedRect(x - w / 2, y, w, h, 12);
      card.lineStyle(2, COLORS.gold, 1);
      card.strokeRoundedRect(x - w / 2, y, w, h, 12);
    });

    hitArea.on('pointerout', () => {
      card.clear();
      card.fillStyle(COLORS.upgradeCard, 0.95);
      card.fillRoundedRect(x - w / 2, y, w, h, 12);
      card.lineStyle(2, COLORS.gold, 0.6);
      card.strokeRoundedRect(x - w / 2, y, w, h, 12);
    });

    hitArea.on('pointerdown', () => {
      SoundManager.playClick();
      UpgradeSystem.apply(upgrade, gameScene.player, gameScene.weaponSystem);
      this.scene.stop();
      gameScene.resumeFromLevelUp();
    });
  }
}
