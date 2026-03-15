import Phaser from 'phaser';
import {
  CANVAS_WIDTH, CANVAS_HEIGHT,
  COLOR_DARK_BG, COLOR_NEON_PURPLE, COLOR_ELECTRIC_BLUE,
  PLAYER_START_X,
  REG_SCORE, REG_TIME, REG_IS_PAUSED,
} from '../constants';
import { Player } from '../entities/Player';
import { InputManager } from '../systems/InputManager';
import { DifficultyDirector } from '../systems/DifficultyDirector';
import { ObstacleManager } from '../systems/ObstacleManager';
import { CollisionSystem } from '../systems/CollisionSystem';
import { ScoreManager } from '../systems/ScoreManager';
import { VFXManager } from '../systems/VFXManager';
import { AudioManager } from '../systems/AudioManager';
import { SaveSystem } from '../systems/SaveSystem';

export class GameScene extends Phaser.Scene {
  player!: Player;
  private inputManager!: InputManager;
  private director!: DifficultyDirector;
  obstacleManager!: ObstacleManager;
  private collisionSystem!: CollisionSystem;
  private scoreManager!: ScoreManager;
  private vfxManager!: VFXManager;
  private dead = false;
  private paused = false;
  private readonly LERP_FACTOR = 0.18;

  private gridGraphics!: Phaser.GameObjects.Graphics;
  private tunnelGraphics!: Phaser.GameObjects.Graphics;
  private gridScrollOffset = 0;
  private starField: { x: number; y: number; alpha: number; speed: number }[] = [];

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.dead = false;
    this.paused = false;

    AudioManager.init(this);
    AudioManager.resume();

    this.director = new DifficultyDirector();
    this.drawBackground();

    this.player = new Player(this);
    this.inputManager = new InputManager(this, PLAYER_START_X);
    this.collisionSystem = new CollisionSystem();
    this.scoreManager = new ScoreManager(this.collisionSystem);
    this.obstacleManager = new ObstacleManager(this, this.director);
    this.vfxManager = new VFXManager(this);

    this.scoreManager.setNearMissCallback(() => {
      this.vfxManager.showNearMiss(this.player.x, this.player.y);
      AudioManager.playNearMiss();
    });

    this.scoreManager.setObstaclePassCallback((x, y) => {
      this.vfxManager.showPassFlash(x, y);
    });

    this.registry.set(REG_SCORE, 0);
    this.registry.set(REG_TIME, 0);
    this.registry.set(REG_IS_PAUSED, false);

    this.scene.launch('HUDScene');

    this.registry.events.on('changedata-isPaused', (_: unknown, value: boolean) => {
      this.paused = value;
    });

    this.events.on('shutdown', () => {
      this.registry.events.off('changedata-isPaused');
      this.vfxManager.destroy();
    });
  }

  update(_time: number, delta: number): void {
    if (this.dead || this.paused) return;

    const deltaSec = delta / 1000;

    const targetX = this.inputManager.getTargetX();
    const currentX = this.player.logicalX;
    const newX = currentX + (targetX - currentX) * this.LERP_FACTOR;
    this.player.setLogicalX(newX);

    this.director.update(deltaSec);
    this.obstacleManager.update(deltaSec);

    const obstacles = this.obstacleManager.getObstacles();
    if (this.collisionSystem.checkCollision(this.player, obstacles)) {
      this.triggerDeath();
      return;
    }

    this.scoreManager.update(deltaSec, this.player, obstacles);
    this.vfxManager.updateTrail(this.player.x, this.player.y, true);
    this.vfxManager.update(deltaSec);

    this.updateBackground(deltaSec);

    this.registry.set(REG_SCORE, this.scoreManager.getScore());
    this.registry.set(REG_TIME, this.scoreManager.getSurvivalTime());
  }

  private triggerDeath(): void {
    this.dead = true;
    this.vfxManager.updateTrail(this.player.x, this.player.y, false);
    this.player.setVisible(false);

    const score = this.scoreManager.getScore();
    const time = this.scoreManager.getSurvivalTime();
    const isNewBest = SaveSystem.updateBest(score, time);

    AudioManager.playDeathExplosion();

    this.vfxManager.playDeathEffect(this.player.x, this.player.y, () => {
      this.scene.stop('HUDScene');
      this.scene.start('GameOverScene', { score, time, isNewBest });
    });
  }

  private drawBackground(): void {
    this.cameras.main.setBackgroundColor(COLOR_DARK_BG);

    this.initStarField();
    const starGfx = this.add.graphics();
    starGfx.setDepth(0);
    for (const star of this.starField) {
      starGfx.fillStyle(COLOR_ELECTRIC_BLUE, star.alpha);
      starGfx.fillCircle(star.x, star.y, 1);
    }

    this.gridGraphics = this.add.graphics();
    this.gridGraphics.setDepth(1);

    this.tunnelGraphics = this.add.graphics();
    this.tunnelGraphics.setDepth(1);

    this.drawGrid();
    this.drawTunnel();
  }

  private initStarField(): void {
    this.starField = [];
    for (let i = 0; i < 40; i++) {
      this.starField.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        alpha: 0.05 + Math.random() * 0.15,
        speed: 10 + Math.random() * 30,
      });
    }
  }

  private drawGrid(): void {
    this.gridGraphics.clear();
    const t = this.director.getElapsedTime();
    const tintLerp = Math.min(1, t / 120);
    const r = Math.round(0x9D + (0x00 - 0x9D) * (1 - tintLerp));
    const g = Math.round(0x4D + (0xE5 - 0x4D) * (1 - tintLerp));
    const b = Math.round(0xFF + (0xFF - 0xFF) * (1 - tintLerp));
    const tintColor = (r << 16) | (g << 8) | b;

    const spacing = 50;
    const alpha = 0.06;

    this.gridGraphics.lineStyle(1, tintColor, alpha);
    for (let x = 0; x <= CANVAS_WIDTH; x += spacing) {
      this.gridGraphics.lineBetween(x, 0, x, CANVAS_HEIGHT);
    }

    const offsetY = this.gridScrollOffset % spacing;
    for (let y = -spacing + offsetY; y <= CANVAS_HEIGHT + spacing; y += spacing) {
      this.gridGraphics.lineBetween(0, y, CANVAS_WIDTH, y);
    }
  }

  private drawTunnel(): void {
    this.tunnelGraphics.clear();
    const cx = CANVAS_WIDTH / 2;
    const vanishY = -50;
    const numLines = 14;

    this.tunnelGraphics.lineStyle(1, COLOR_ELECTRIC_BLUE, 0.04);
    for (let i = 0; i < numLines; i++) {
      const x = (i / (numLines - 1)) * CANVAS_WIDTH;
      this.tunnelGraphics.lineBetween(x, CANVAS_HEIGHT, cx, vanishY);
    }

    const numHoriz = 8;
    for (let i = 1; i <= numHoriz; i++) {
      const frac = i / (numHoriz + 1);
      const perspY = CANVAS_HEIGHT - (CANVAS_HEIGHT - vanishY) * frac;
      const spread = 1 - frac * 0.7;
      const left = cx - (CANVAS_WIDTH / 2) * spread;
      const right = cx + (CANVAS_WIDTH / 2) * spread;
      this.tunnelGraphics.lineStyle(1, COLOR_NEON_PURPLE, 0.03 + frac * 0.02);
      this.tunnelGraphics.lineBetween(left, perspY, right, perspY);
    }
  }

  private updateBackground(deltaSec: number): void {
    const speed = this.director.getScrollSpeed();
    this.gridScrollOffset += speed * deltaSec * 4;
    this.drawGrid();
  }
}
