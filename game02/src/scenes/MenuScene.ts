import Phaser from 'phaser';
import { COLORS, PLAYER_TABLE } from '../config';
import { SaveSystem } from '../systems/SaveSystem';
import { SoundManager } from '../systems/SoundManager';
import { t, getLang, setLang } from '../i18n';

type Phase = 'main' | 'charSelect';

export class MenuScene extends Phaser.Scene {
  private phase: Phase = 'main';
  private container!: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    this.container = this.add.container(0, 0);
    this.phase = 'main';
    this.showMainMenu();
  }

  private clearContainer(): void {
    this.container.removeAll(true);
  }

  private showMainMenu(): void {
    this.clearContainer();
    this.phase = 'main';
    const { width, height } = this.scale;

    const title = this.add.text(width / 2, height * 0.25, t('title'), {
      fontSize: '64px',
      fontFamily: 'monospace',
      color: '#4fc3f7',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const subtitle = this.add.text(width / 2, height * 0.33, t('subtitle'), {
      fontSize: '20px',
      fontFamily: 'monospace',
      color: '#90a4ae',
    }).setOrigin(0.5);

    const startBtn = this.createButton(width / 2, height * 0.52, t('new_game'));
    startBtn.on('pointerdown', () => {
      SoundManager.init(this);
      SoundManager.resume();
      SoundManager.playClick();
      SaveSystem.deleteSave();
      this.showCharSelect();
    });

    this.container.add([title, subtitle, startBtn]);

    if (SaveSystem.hasSave()) {
      const continueBtn = this.createButton(width / 2, height * 0.62, t('continue_game'));
      continueBtn.on('pointerdown', () => {
        SoundManager.init(this);
        SoundManager.resume();
        SoundManager.playClick();
        this.scene.start('GameScene', { loadSave: true });
      });
      this.container.add(continueBtn);
    }

    const langBtn = this.add.text(width / 2, height * 0.78, t('lang_toggle'), {
      fontSize: '22px',
      fontFamily: 'monospace',
      color: '#90a4ae',
      backgroundColor: '#16213e',
      padding: { x: 18, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    langBtn.on('pointerover', () => langBtn.setStyle({ backgroundColor: '#1a237e' }));
    langBtn.on('pointerout', () => langBtn.setStyle({ backgroundColor: '#16213e' }));
    langBtn.on('pointerdown', () => {
      const next = getLang() === 'zh' ? 'en' : 'zh';
      setLang(next);
      SoundManager.init(this);
      SoundManager.playClick();
      this.scene.restart();
    });

    this.container.add(langBtn);
  }

  private showCharSelect(): void {
    this.clearContainer();
    this.phase = 'charSelect';
    const { width, height } = this.scale;

    const header = this.add.text(width / 2, height * 0.08, t('select_char'), {
      fontSize: '36px',
      fontFamily: 'monospace',
      color: '#ffd700',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.container.add(header);

    const charColors: Record<string, number> = {
      warrior: 0x4fc3f7,
      ranger: 0x66bb6a,
      mage: 0xce93d8,
    };

    const cardW = width * 0.82;
    const cardH = 160;
    const startY = height * 0.17;
    const gap = 18;

    PLAYER_TABLE.forEach((cfg, i) => {
      const y = startY + i * (cardH + gap);
      const color = charColors[cfg.id] ?? 0xffffff;
      const hexColor = '#' + color.toString(16).padStart(6, '0');

      const card = this.add.graphics();
      card.fillStyle(COLORS.upgradeCard, 0.92);
      card.fillRoundedRect(width / 2 - cardW / 2, y, cardW, cardH, 14);
      card.lineStyle(2, color, 0.7);
      card.strokeRoundedRect(width / 2 - cardW / 2, y, cardW, cardH, 14);

      const iconSize = 50;
      const iconX = width / 2 - cardW / 2 + 50;
      const iconY = y + cardH / 2;
      const icon = this.add.image(iconX, iconY, cfg.texture)
        .setDisplaySize(iconSize, iconSize);

      const textX = iconX + iconSize / 2 + 24;
      const charName = this.add.text(textX, y + 18, t(`char_${cfg.id}`), {
        fontSize: '26px',
        fontFamily: 'monospace',
        color: hexColor,
        fontStyle: 'bold',
      });

      const desc = this.add.text(textX, y + 50, t(`char_${cfg.id}_desc`), {
        fontSize: '14px',
        fontFamily: 'monospace',
        color: '#90a4ae',
        wordWrap: { width: cardW - 140 },
      });

      const weaponName = t(`weapon_${cfg.startWeapon}`);
      const statsLine = this.add.text(textX, y + 80, [
        t('char_hp', { n: cfg.maxHp }) + '    ' + t('char_speed', { n: cfg.speed }),
        t('char_weapon', { n: weaponName }),
      ].join('\n'), {
        fontSize: '14px',
        fontFamily: 'monospace',
        color: '#78909c',
        lineSpacing: 4,
      });

      const hitArea = this.add.rectangle(width / 2, y + cardH / 2, cardW, cardH, 0xffffff, 0)
        .setInteractive({ useHandCursor: true });

      hitArea.on('pointerover', () => {
        card.clear();
        card.fillStyle(COLORS.upgradeCardHover, 0.95);
        card.fillRoundedRect(width / 2 - cardW / 2, y, cardW, cardH, 14);
        card.lineStyle(3, color, 1);
        card.strokeRoundedRect(width / 2 - cardW / 2, y, cardW, cardH, 14);
      });

      hitArea.on('pointerout', () => {
        card.clear();
        card.fillStyle(COLORS.upgradeCard, 0.92);
        card.fillRoundedRect(width / 2 - cardW / 2, y, cardW, cardH, 14);
        card.lineStyle(2, color, 0.7);
        card.strokeRoundedRect(width / 2 - cardW / 2, y, cardW, cardH, 14);
      });

      hitArea.on('pointerdown', () => {
        SoundManager.playClick();
        this.scene.start('GameScene', { characterId: cfg.id });
      });

      this.container.add([card, icon, charName, desc, statsLine, hitArea]);
    });

    const backBtn = this.createButton(width / 2, height * 0.88, t('back'));
    backBtn.on('pointerdown', () => {
      SoundManager.playClick();
      this.showMainMenu();
    });
    this.container.add(backBtn);
  }

  private createButton(x: number, y: number, label: string): Phaser.GameObjects.Text {
    const btn = this.add.text(x, y, label, {
      fontSize: '32px',
      fontFamily: 'monospace',
      color: '#ffffff',
      backgroundColor: '#0f3460',
      padding: { x: 30, y: 14 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#1a237e' }));
    btn.on('pointerout', () => btn.setStyle({ backgroundColor: '#0f3460' }));
    return btn;
  }
}
