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

    if (gameScene.autoBattle?.enabled && upgrades.length > 0) {
      const pickIndex = gameScene.autoBattle.autoSelectUpgrade();
      const chosenIdx = Math.min(pickIndex, upgrades.length - 1);

      this.add.text(width / 2, height * 0.21, 'AUTO-PICK', {
        fontSize: '16px',
        fontFamily: 'monospace',
        color: '#90a4ae',
      }).setOrigin(0.5);

      upgrades.forEach((upg, i) => {
        const y = startY + i * (cardHeight + gap);
        const isChosen = i === chosenIdx;
        this.createStaticCard(width / 2, y, cardWidth, cardHeight, upg, isChosen);
      });

      this.time.delayedCall(1200, () => {
        UpgradeSystem.apply(upgrades[chosenIdx], gameScene.player, gameScene.weaponSystem);
        SoundManager.playClick();
        this.scene.stop();
        gameScene.resumeFromLevelUp();
      });
      return;
    }

    upgrades.forEach((upg, i) => {
      const y = startY + i * (cardHeight + gap);
      this.createCard(width / 2, y, cardWidth, cardHeight, upg, gameScene);
    });
  }

  private createStaticCard(
    x: number, y: number, w: number, h: number,
    upgrade: UpgradeDef, highlighted: boolean,
  ): void {
    const card = this.add.graphics();
    const bgColor = highlighted ? 0x1b5e20 : COLORS.upgradeCard;
    const borderColor = highlighted ? 0x66bb6a : COLORS.gold;
    const borderAlpha = highlighted ? 1 : 0.3;

    card.fillStyle(bgColor, 0.95);
    card.fillRoundedRect(x - w / 2, y, w, h, 12);
    card.lineStyle(highlighted ? 3 : 2, borderColor, borderAlpha);
    card.strokeRoundedRect(x - w / 2, y, w, h, 12);

    const nameColor = highlighted ? '#66bb6a' : '#78909c';
    this.add.text(x, y + 20, upgrade.name + (highlighted ? '  ✦' : ''), {
      fontSize: '24px',
      fontFamily: 'monospace',
      color: nameColor,
      fontStyle: 'bold',
    }).setOrigin(0.5, 0);

    this.add.text(x, y + 55, upgrade.description, {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: highlighted ? '#a5d6a7' : '#607d8b',
      wordWrap: { width: w - 40 },
    }).setOrigin(0.5, 0);

    if (highlighted) {
      this.tweens.add({
        targets: card,
        alpha: { from: 0.7, to: 1 },
        duration: 400,
        yoyo: true,
        repeat: -1,
      });
    }
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
