import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { GameScene } from './GameScene';

interface GMParam {
  label: string;
  getter: () => number;
  setter: (v: number) => void;
  min: number;
  max: number;
  step: number;
  category: string;
}

export class GMScene extends Phaser.Scene {
  private paramRows: {
    param: GMParam;
    valueText: Phaser.GameObjects.Text;
  }[] = [];
  private scrollY: number = 0;
  private contentHeight: number = 0;
  private panelHeight: number = 0;
  private scrollContainer!: Phaser.GameObjects.Container;
  private maskGraphics!: Phaser.GameObjects.Graphics;
  private categories: string[] = [];
  private activeCategory: string = 'Player';
  private categoryButtons: Phaser.GameObjects.Text[] = [];
  private allParams: GMParam[] = [];
  private contentTop: number = 0;
  private contentAreaHeight: number = 0;

  private godMode: boolean = false;
  private oneShot: boolean = false;

  constructor() {
    super({ key: 'GMScene' });
  }

  create(): void {
    const gameScene = this.getGameScene();
    if (!gameScene) return;

    this.scene.bringToTop();

    this.scrollY = 0;

    const panelW = GAME_WIDTH - 20;
    this.panelHeight = Math.floor(GAME_HEIGHT * 0.5);
    const panelX = 10;
    const panelY = 0;

    const backdrop = this.add.rectangle(
      GAME_WIDTH / 2, GAME_HEIGHT / 2,
      GAME_WIDTH, GAME_HEIGHT,
      0x000000, 0.3,
    ).setInteractive().setDepth(0);

    const bg = this.add.graphics().setDepth(1);
    bg.fillStyle(0x0d1117, 0.97);
    bg.fillRoundedRect(panelX, panelY, panelW, this.panelHeight, 12);
    bg.lineStyle(1, 0x30363d);
    bg.strokeRoundedRect(panelX, panelY, panelW, this.panelHeight, 12);

    const titleBar = this.add.graphics().setDepth(2);
    titleBar.fillStyle(0x161b22, 1);
    titleBar.fillRoundedRect(panelX, panelY, panelW, 40, { tl: 12, tr: 12, bl: 0, br: 0 });

    const title = this.add.text(panelX + 14, panelY + 10, '⚙ GM PANEL', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#58a6ff',
      fontStyle: 'bold',
    }).setDepth(3);

    const closeBtn = this.add.text(panelX + panelW - 14, panelY + 10, '✕', {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#f85149',
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true }).setDepth(3);
    closeBtn.on('pointerdown', () => this.closeGM());
    closeBtn.on('pointerover', () => closeBtn.setColor('#ff7b72'));
    closeBtn.on('pointerout', () => closeBtn.setColor('#f85149'));

    this.allParams = this.buildParams(gameScene);
    this.categories = [...new Set(this.allParams.map(p => p.category))];
    this.activeCategory = this.categories[0] || 'Player';

    const tabY = panelY + 46;
    let tabX = panelX + 10;
    this.categoryButtons = [];
    this.categories.forEach((cat) => {
      const isActive = cat === this.activeCategory;
      const btn = this.add.text(tabX, tabY, cat, {
        fontSize: '12px',
        fontFamily: 'monospace',
        color: isActive ? '#58a6ff' : '#8b949e',
        backgroundColor: isActive ? '#1f2937' : '#21262d',
        padding: { x: 8, y: 4 },
      }).setInteractive({ useHandCursor: true }).setDepth(3);

      btn.on('pointerdown', () => {
        this.activeCategory = cat;
        this.scrollY = 0;
        this.refreshContent();
        this.refreshCategoryTabs();
      });

      this.categoryButtons.push(btn);
      tabX += btn.width + 4;
    });

    const qY = tabY + 28;
    this.createQuickActions(panelX, qY, panelW, gameScene);

    this.contentTop = qY + 34;
    this.contentAreaHeight = panelY + this.panelHeight - this.contentTop - 10;

    this.maskGraphics = this.add.graphics().setDepth(4);
    this.maskGraphics.fillStyle(0xffffff);
    this.maskGraphics.fillRect(panelX, this.contentTop, panelW, this.contentAreaHeight);
    const mask = this.maskGraphics.createGeometryMask();

    this.scrollContainer = this.add.container(0, this.contentTop).setDepth(5);
    this.scrollContainer.setMask(mask);

    this.refreshContent();

    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gx: number[], _gy: number[], _gz: number, deltaY: number) => {
      const maxScroll = Math.max(0, this.contentHeight - this.contentAreaHeight);
      this.scrollY = Phaser.Math.Clamp(this.scrollY + deltaY * 0.5, 0, maxScroll);
      this.scrollContainer.setY(this.contentTop - this.scrollY);
    });

    let touchStartY = 0;
    let touchScrollStart = 0;
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.x > panelX && pointer.x < panelX + panelW && pointer.y > this.contentTop) {
        touchStartY = pointer.y;
        touchScrollStart = this.scrollY;
      }
    });
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown && touchStartY > 0) {
        const dy = touchStartY - pointer.y;
        const maxScroll = Math.max(0, this.contentHeight - this.contentAreaHeight);
        this.scrollY = Phaser.Math.Clamp(touchScrollStart + dy, 0, maxScroll);
        this.scrollContainer.setY(this.contentTop - this.scrollY);
      }
    });
    this.input.on('pointerup', () => {
      touchStartY = 0;
    });

    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-ESC', () => this.closeGM());
      const backtick = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.BACKTICK);
      backtick.on('down', () => this.closeGM());
    }

    this.time.addEvent({
      delay: 200,
      loop: true,
      callback: () => {
        this.paramRows.forEach(r => {
          const val = r.param.getter();
          r.valueText.setText(val.toFixed(r.param.step < 1 ? 2 : 0));
        });
      },
    });
  }

  private createQuickActions(panelX: number, y: number, _panelW: number, gameScene: GameScene): void {
    const actions = [
      { label: 'GOD', active: () => this.godMode, toggle: () => this.toggleGodMode(gameScene) },
      { label: '1-HIT', active: () => this.oneShot, toggle: () => this.toggleOneShot(gameScene) },
      { label: '+10LV', active: () => false as boolean, toggle: () => this.addLevels(gameScene, 10) },
      { label: 'HEAL', active: () => false as boolean, toggle: () => this.healFull(gameScene) },
      { label: 'NUKE', active: () => false as boolean, toggle: () => this.killAllEnemies(gameScene) },
      { label: '+WAVE', active: () => false as boolean, toggle: () => this.skipWave(gameScene) },
    ];

    let btnX = panelX + 10;
    actions.forEach((action) => {
      const btn = this.add.text(btnX, y, action.label, {
        fontSize: '11px',
        fontFamily: 'monospace',
        color: action.active() ? '#3fb950' : '#c9d1d9',
        backgroundColor: action.active() ? '#1a3a2a' : '#21262d',
        padding: { x: 6, y: 3 },
      }).setInteractive({ useHandCursor: true }).setDepth(3);

      btn.on('pointerdown', () => {
        action.toggle();
        btn.setColor(action.active() ? '#3fb950' : '#c9d1d9');
        btn.setBackgroundColor(action.active() ? '#1a3a2a' : '#21262d');
        this.refreshContent();
      });

      btn.on('pointerover', () => btn.setBackgroundColor('#30363d'));
      btn.on('pointerout', () => btn.setBackgroundColor(action.active() ? '#1a3a2a' : '#21262d'));

      btnX += btn.width + 6;
    });
  }

  private refreshCategoryTabs(): void {
    this.categoryButtons.forEach((btn) => {
      const cat = btn.text;
      if (cat === this.activeCategory) {
        btn.setColor('#58a6ff');
        btn.setBackgroundColor('#1f2937');
      } else {
        btn.setColor('#8b949e');
        btn.setBackgroundColor('#21262d');
      }
    });
  }

  private refreshContent(): void {
    this.scrollContainer.removeAll(true);
    this.paramRows = [];

    const filtered = this.allParams.filter(p => p.category === this.activeCategory);
    const rowH = 52;
    const panelW = GAME_WIDTH - 20;
    const rowW = panelW - 20;

    filtered.forEach((param, i) => {
      const y = i * rowH;

      const rowBg = this.add.graphics();
      if (i % 2 === 0) {
        rowBg.fillStyle(0x161b22, 0.5);
        rowBg.fillRect(10, y, rowW, rowH);
      }

      const label = this.add.text(16, y + 4, param.label, {
        fontSize: '13px',
        fontFamily: 'monospace',
        color: '#c9d1d9',
      });

      const currentVal = param.getter();
      const valueText = this.add.text(rowW - 10, y + 4, currentVal.toFixed(param.step < 1 ? 2 : 0), {
        fontSize: '13px',
        fontFamily: 'monospace',
        color: '#58a6ff',
        fontStyle: 'bold',
      }).setOrigin(1, 0);

      const sliderX = 16;
      const sliderW = rowW - 26;
      const sliderY = y + 26;
      const sliderH = 14;

      const track = this.add.graphics();
      track.fillStyle(0x30363d, 1);
      track.fillRoundedRect(sliderX, sliderY, sliderW, sliderH, 4);

      const fill = this.add.graphics();
      const ratio = Phaser.Math.Clamp((currentVal - param.min) / (param.max - param.min), 0, 1);
      fill.fillStyle(0x1f6feb, 1);
      fill.fillRoundedRect(sliderX, sliderY, Math.max(8, sliderW * ratio), sliderH, 4);

      const hitZone = this.add.rectangle(sliderX + sliderW / 2, sliderY + sliderH / 2, sliderW, sliderH + 20, 0x000000, 0);
      hitZone.setInteractive({ useHandCursor: true, draggable: false });

      const updateSlider = (pointerX: number) => {
        const localX = pointerX - sliderX;
        const t = Phaser.Math.Clamp(localX / sliderW, 0, 1);
        let newVal = param.min + t * (param.max - param.min);
        newVal = Math.round(newVal / param.step) * param.step;
        newVal = Phaser.Math.Clamp(newVal, param.min, param.max);
        param.setter(newVal);
        valueText.setText(newVal.toFixed(param.step < 1 ? 2 : 0));
        fill.clear();
        const newRatio = Phaser.Math.Clamp((newVal - param.min) / (param.max - param.min), 0, 1);
        fill.fillStyle(0x1f6feb, 1);
        fill.fillRoundedRect(sliderX, sliderY, Math.max(8, sliderW * newRatio), sliderH, 4);
      };

      hitZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        updateSlider(pointer.x);
      });
      hitZone.on('pointermove', (pointer: Phaser.Input.Pointer) => {
        if (pointer.isDown) {
          updateSlider(pointer.x);
        }
      });

      const minLabel = this.add.text(sliderX, sliderY + sliderH + 2, String(param.min), {
        fontSize: '9px', fontFamily: 'monospace', color: '#484f58',
      });
      const maxLabel = this.add.text(sliderX + sliderW, sliderY + sliderH + 2, String(param.max), {
        fontSize: '9px', fontFamily: 'monospace', color: '#484f58',
      }).setOrigin(1, 0);

      this.scrollContainer.add([rowBg, label, valueText, track, fill, hitZone, minLabel, maxLabel]);
      this.paramRows.push({ param, valueText });
    });

    this.contentHeight = filtered.length * rowH;
  }

  private buildParams(gs: GameScene): GMParam[] {
    const player = gs.player;
    const weapon = gs.weaponSystem.weapons[0];
    const wave = gs.waveSystem;

    return [
      { label: 'HP', getter: () => player.hp, setter: (v) => { player.hp = v; }, min: 0, max: 1000, step: 10, category: 'Player' },
      { label: 'Max HP', getter: () => player.maxHp, setter: (v) => { player.maxHp = v; player.hp = Math.min(player.hp, v); }, min: 10, max: 2000, step: 10, category: 'Player' },
      { label: 'Speed', getter: () => player.speed, setter: (v) => { player.speed = v; }, min: 50, max: 800, step: 10, category: 'Player' },
      { label: 'Level', getter: () => player.level, setter: (v) => { player.level = v; player.recalcXPToNext(); }, min: 1, max: 100, step: 1, category: 'Player' },
      { label: 'XP', getter: () => player.xp, setter: (v) => { player.xp = v; }, min: 0, max: 10000, step: 10, category: 'Player' },

      { label: 'Damage', getter: () => weapon.damage, setter: (v) => { weapon.damage = v; }, min: 1, max: 500, step: 1, category: 'Weapon' },
      { label: 'Fire Rate (ms)', getter: () => weapon.fireRate, setter: (v) => { weapon.fireRate = v; }, min: 50, max: 2000, step: 25, category: 'Weapon' },
      { label: 'Bullet Speed', getter: () => weapon.bulletSpeed, setter: (v) => { weapon.bulletSpeed = v; }, min: 100, max: 1500, step: 25, category: 'Weapon' },
      { label: 'Bullet Count', getter: () => weapon.bulletCount, setter: (v) => { weapon.bulletCount = Math.floor(v); }, min: 1, max: 20, step: 1, category: 'Weapon' },
      { label: 'Pierce', getter: () => weapon.pierce, setter: (v) => { weapon.pierce = Math.floor(v); }, min: 0, max: 20, step: 1, category: 'Weapon' },

      { label: 'Current Wave', getter: () => wave.currentWave, setter: (v) => { wave.currentWave = Math.floor(v); }, min: 1, max: 100, step: 1, category: 'Wave' },

      { label: 'Enemy Count', getter: () => gs.enemies.countActive(), setter: () => {}, min: 0, max: 200, step: 1, category: 'Enemy' },
      { label: 'XP Orbs', getter: () => gs.xpOrbs.countActive(), setter: () => {}, min: 0, max: 500, step: 1, category: 'Enemy' },

      { label: 'Kills', getter: () => gs.kills, setter: (v) => { gs.kills = Math.floor(v); }, min: 0, max: 99999, step: 1, category: 'Stats' },
      { label: 'Time (sec)', getter: () => Math.floor(gs.elapsedTime / 1000), setter: (v) => { gs.elapsedTime = v * 1000; }, min: 0, max: 36000, step: 10, category: 'Stats' },
    ];
  }

  private toggleGodMode(gs: GameScene): void {
    this.godMode = !this.godMode;
    if (this.godMode) {
      gs.player.hp = 99999;
      gs.player.maxHp = 99999;
    } else {
      gs.player.maxHp = 100;
      gs.player.hp = 100;
    }
  }

  private toggleOneShot(gs: GameScene): void {
    this.oneShot = !this.oneShot;
    if (this.oneShot) {
      gs.weaponSystem.weapons[0].damage = 99999;
    } else {
      gs.weaponSystem.weapons[0].damage = 15;
    }
  }

  private addLevels(gs: GameScene, count: number): void {
    for (let i = 0; i < count; i++) {
      gs.player.level++;
    }
    gs.player.recalcXPToNext();
    gs.player.xp = 0;
  }

  private healFull(gs: GameScene): void {
    gs.player.hp = gs.player.maxHp;
  }

  private killAllEnemies(gs: GameScene): void {
    gs.enemies.getChildren().forEach((obj) => {
      const e = obj as any;
      if (e.active) {
        gs.kills++;
        if (e.die) e.die();
      }
    });
  }

  private skipWave(gs: GameScene): void {
    gs.waveSystem.currentWave++;
  }

  private getGameScene(): GameScene | null {
    return this.scene.get('GameScene') as GameScene;
  }

  closeGM(): void {
    this.scene.stop('GMScene');
  }
}
