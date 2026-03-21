import Phaser from 'phaser';
import {
  CANVAS_WIDTH, CANVAS_HEIGHT,
  COLOR_DARK_BG, COLOR_NEON_PURPLE, COLOR_ELECTRIC_BLUE, COLOR_HIGHLIGHT_WHITE,
  PLAYER_START_X,
  REG_SCORE, REG_TIME, REG_IS_PAUSED, REG_LEVEL, REG_LEVEL_LABEL,
  REG_COMBO, REG_COMBO_COUNT,
  CollectibleType, CollectibleLevelConfig,
  SPIKE_SLOW_DURATION, SPIKE_SLOW_FACTOR,
  MAGNET_DURATION, SCORE_MULTI_DURATION, SCORE_MULTI_FACTOR,
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
import { CollectibleManager } from '../systems/CollectibleManager';
import { LevelData } from '../systems/LevelConfig';

export class GameScene extends Phaser.Scene {
  player!: Player;
  private inputManager!: InputManager;
  private director!: DifficultyDirector;
  obstacleManager!: ObstacleManager;
  private collisionSystem!: CollisionSystem;
  private scoreManager!: ScoreManager;
  private vfxManager!: VFXManager;
  private collectibleManager!: CollectibleManager;
  private dead = false;
  private paused = false;
  private spikeSlowTimer = 0;
  private shieldActive = false;
  private scoreMultiTimer = 0;
  private readonly LERP_FACTOR = 0.18;

  private gridGraphics!: Phaser.GameObjects.Graphics;
  private tunnelGraphics!: Phaser.GameObjects.Graphics;
  private starGraphics!: Phaser.GameObjects.Graphics;
  private gridScrollOffset = 0;
  private tunnelFlowOffset = 0;
  private starField: { x: number; y: number; alpha: number; speed: number; size: number }[] = [];

  constructor() {
    super({ key: 'GameScene' });
  }

  create(data?: { resumeFromLevel?: number }): void {
    this.dead = false;
    this.paused = false;

    AudioManager.init(this);
    AudioManager.resume();

    const levelData: LevelData[] = this.registry.get('levelData') || [];
    this.director = new DifficultyDirector(levelData);

    if (data?.resumeFromLevel && data.resumeFromLevel > 1) {
      const targetIdx = levelData.findIndex(l => l.level === data.resumeFromLevel);
      if (targetIdx > 0) {
        for (let i = 0; i < targetIdx; i++) {
          this.director.advanceToNextLevel();
        }
      }
    }
    this.director.setLevelChangedCallback((level, label) => {
      this.registry.set(REG_LEVEL, level);
      if (label) {
        this.registry.set(REG_LEVEL_LABEL, label);
        this.showLevelLabel(label);
      }
    });

    this.director.setLevelCompleteCallback((completedLevel, nextLevel) => {
      this.triggerLevelComplete(completedLevel, nextLevel);
    });

    this.director.setAllLevelsCompleteCallback((finalLevel) => {
      this.triggerLevelComplete(finalLevel, -1);
    });

    this.drawBackground();

    this.player = new Player(this);
    this.inputManager = new InputManager(this, PLAYER_START_X);
    this.collisionSystem = new CollisionSystem();
    this.scoreManager = new ScoreManager(this.collisionSystem);
    this.obstacleManager = new ObstacleManager(this, this.director);
    const collectibleConfigs: CollectibleLevelConfig[] = this.registry.get('collectibleConfigs') || [];
    this.collectibleManager = new CollectibleManager(this, this.director, collectibleConfigs);
    this.obstacleManager.setOnSpawnCallback((gapX, gapW) => {
      this.collectibleManager.onObstacleSpawned(gapX, gapW);
    });
    this.vfxManager = new VFXManager(this);

    this.scoreManager.setNearMissCallback(() => {
      this.vfxManager.showNearMiss(this.player.x, this.player.y);
      AudioManager.playNearMiss();
    });

    this.scoreManager.setObstaclePassCallback((x, y) => {
      this.vfxManager.showPassFlash(x, y);
      AudioManager.playPassThrough();
    });

    this.scoreManager.setComboMilestoneCallback((combo, multiplier) => {
      this.vfxManager.showComboMilestone(combo, multiplier);
    });

    this.registry.set(REG_SCORE, 0);
    this.registry.set(REG_TIME, 0);
    this.registry.set(REG_LEVEL, this.director.getCurrentLevel());
    this.registry.set(REG_LEVEL_LABEL, '');
    this.registry.set(REG_IS_PAUSED, false);
    this.registry.set(REG_COMBO, 1.0);
    this.registry.set(REG_COMBO_COUNT, 0);

    this.scene.launch('HUDScene');

    this.registry.events.on('changedata-isPaused', (_: unknown, value: boolean) => {
      this.paused = value;
      if (value) {
        AudioManager.stopBGM();
      } else {
        AudioManager.startBGM();
      }
    });

    AudioManager.startBGM();

    this.events.on('shutdown', () => {
      this.registry.events.off('changedata-isPaused');
      AudioManager.stopBGM();
      this.vfxManager.destroy();
    });
  }

  update(_time: number, delta: number): void {
    if (this.dead || this.paused) return;

    const deltaSec = delta / 1000;

    const targetX = this.inputManager.getTargetX();
    const currentX = this.player.logicalX;
    const lerpBase = this.spikeSlowTimer > 0 ? this.LERP_FACTOR * SPIKE_SLOW_FACTOR : this.LERP_FACTOR;
    const factor = 1 - Math.pow(1 - lerpBase, deltaSec * 60);
    const newX = currentX + (targetX - currentX) * factor;
    this.player.setLogicalX(newX);
    this.player.updateVisuals(deltaSec);

    if (this.inputManager.getIsDragging()) {
      AudioManager.playSlide();
    }

    if (this.spikeSlowTimer > 0) this.spikeSlowTimer -= deltaSec;
    if (this.scoreMultiTimer > 0) this.scoreMultiTimer -= deltaSec;

    this.director.update(deltaSec);
    this.obstacleManager.update(deltaSec);

    const obstacles = this.obstacleManager.getObstacles();
    if (this.collisionSystem.checkCollision(this.player, obstacles)) {
      if (this.shieldActive) {
        this.shieldActive = false;
        this.vfxManager.showSpikeHit(this.player.x, this.player.y);
        AudioManager.playNearMiss();
      } else {
        this.triggerDeath();
        return;
      }
    }

    this.checkCollectibles();
    this.collectibleManager.attractGemsToward(this.player.logicalX, this.player.logicalY, deltaSec);
    this.collectibleManager.update(deltaSec);

    this.scoreManager.update(deltaSec, this.player, obstacles);

    const scrollSpeed = this.director.getScrollSpeed();
    this.vfxManager.updateTrail(this.player.x, this.player.y, true, scrollSpeed);
    this.vfxManager.updateSpeedLines(scrollSpeed);
    this.vfxManager.update(deltaSec);

    const intensity = Math.min(1, scrollSpeed / 18);
    AudioManager.updateBGMIntensity(intensity);

    this.updateBackground(deltaSec);

    this.registry.set(REG_SCORE, this.scoreManager.getScore());
    this.registry.set(REG_TIME, this.scoreManager.getSurvivalTime());
    this.registry.set(REG_LEVEL, this.director.getCurrentLevel());
    this.registry.set(REG_COMBO, this.scoreManager.getComboMultiplier());
    this.registry.set(REG_COMBO_COUNT, this.scoreManager.getComboCount());
  }

  private showLevelLabel(label: string): void {
    const text = this.add.text(CANVAS_WIDTH / 2, CANVAS_HEIGHT * 0.4, label, {
      fontFamily: 'monospace',
      fontSize: '56px',
      color: '#00E5FF',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(50).setAlpha(0);

    this.tweens.add({
      targets: text,
      alpha: 1,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 300,
      ease: 'Back.easeOut',
      yoyo: true,
      hold: 800,
      onComplete: () => text.destroy(),
    });

    this.cameras.main.flash(150, 0, 229, 255, true);
  }

  private checkCollectibles(): void {
    const collectibles = this.collectibleManager.getCollectibles();
    let collected = this.collisionSystem.checkCollectible(this.player, collectibles);
    while (collected) {
      const px = this.player.x;
      const py = this.player.y;
      const type = collected.collectibleType;

      switch (type) {
        case CollectibleType.SPIKE: {
          const penalty = this.collectibleManager.getSpikePenalty();
          this.scoreManager.addScore(penalty);
          this.scoreManager.breakCombo();
          this.spikeSlowTimer = SPIKE_SLOW_DURATION;
          this.vfxManager.showSpikeHit(px, py);
          AudioManager.playDeathExplosion();
          break;
        }
        case CollectibleType.GEM_NORMAL:
        case CollectibleType.GEM_RARE: {
          const isRare = type === CollectibleType.GEM_RARE;
          let points = this.collectibleManager.getGemScore(isRare);
          if (this.scoreMultiTimer > 0) points = Math.round(points * SCORE_MULTI_FACTOR);
          this.scoreManager.addScore(points);
          this.vfxManager.showGemCollect(px, py, isRare, points);
          AudioManager.playNearMiss();
          break;
        }
        case CollectibleType.SHIELD:
          this.shieldActive = true;
          this.vfxManager.showGemCollect(px, py, true, 0);
          AudioManager.playPassThrough();
          break;
        case CollectibleType.MAGNET:
          this.collectibleManager.magnetTimer = MAGNET_DURATION;
          this.vfxManager.showGemCollect(px, py, false, 0);
          AudioManager.playPassThrough();
          break;
        case CollectibleType.SCORE_MULTI:
          this.scoreMultiTimer = SCORE_MULTI_DURATION;
          this.vfxManager.showGemCollect(px, py, true, 0);
          AudioManager.playPassThrough();
          break;
      }

      collected = this.collisionSystem.checkCollectible(this.player, collectibles);
    }
  }

  private triggerDeath(): void {
    this.dead = true;
    this.vfxManager.updateTrail(this.player.x, this.player.y, false, 0);
    this.player.hideForDeath();

    this.scoreManager.breakCombo();

    const score = this.scoreManager.getScore();
    const time = this.scoreManager.getSurvivalTime();
    const isNewBest = SaveSystem.updateBest(score, time);
    const levelReached = this.director.getCurrentLevel();
    const totalLevels = this.director.getTotalLevelCount();
    const maxCombo = this.scoreManager.getMaxCombo();

    AudioManager.playDeathExplosion();

    this.vfxManager.playDeathEffect(this.player.x, this.player.y, () => {
      this.scene.stop('HUDScene');
      this.scene.start('GameOverScene', { score, time, isNewBest, levelReached, totalLevels, maxCombo });
    });
  }

  private triggerLevelComplete(completedLevel: number, nextLevel: number): void {
    this.dead = true;
    this.vfxManager.updateTrail(this.player.x, this.player.y, false, 0);

    const score = this.scoreManager.getScore();
    const time = this.scoreManager.getSurvivalTime();
    const maxCombo = this.scoreManager.getMaxCombo();

    AudioManager.stopBGM();

    this.scene.stop('HUDScene');

    if (nextLevel === -1) {
      const isNewBest = SaveSystem.updateBest(score, time);
      this.scene.start('GameOverScene', {
        score, time, isNewBest,
        levelReached: completedLevel,
        totalLevels: this.director.getTotalLevelCount(),
        maxCombo,
        allComplete: true,
      });
    } else {
      this.scene.start('LevelCompleteScene', {
        completedLevel,
        nextLevel,
        score,
        time,
        maxCombo,
      });
    }
  }

  private drawBackground(): void {
    this.cameras.main.setBackgroundColor(COLOR_DARK_BG);

    this.initStarField();
    this.starGraphics = this.add.graphics();
    this.starGraphics.setDepth(0);
    this.drawStars();

    this.gridGraphics = this.add.graphics();
    this.gridGraphics.setDepth(1);

    this.tunnelGraphics = this.add.graphics();
    this.tunnelGraphics.setDepth(1);

    this.drawGrid();
    this.drawTunnel();
  }

  private initStarField(): void {
    this.starField = [];
    for (let i = 0; i < 60; i++) {
      this.starField.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        alpha: 0.08 + Math.random() * 0.25,
        speed: 15 + Math.random() * 45,
        size: 0.5 + Math.random() * 1.5,
      });
    }
  }

  private drawStars(): void {
    this.starGraphics.clear();
    for (const star of this.starField) {
      this.starGraphics.fillStyle(COLOR_ELECTRIC_BLUE, star.alpha);
      this.starGraphics.fillCircle(star.x, star.y, star.size);
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
    const alpha = 0.08;

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
    const flowPhase = this.tunnelFlowOffset;

    this.tunnelGraphics.lineStyle(1, COLOR_ELECTRIC_BLUE, 0.06);
    for (let i = 0; i < numLines; i++) {
      const x = (i / (numLines - 1)) * CANVAS_WIDTH;
      this.tunnelGraphics.lineBetween(x, CANVAS_HEIGHT, cx, vanishY);
    }

    const numHoriz = 10;
    for (let i = 1; i <= numHoriz; i++) {
      const baseFrac = i / (numHoriz + 1);
      const frac = (baseFrac + flowPhase) % 1.0;
      const perspY = CANVAS_HEIGHT - (CANVAS_HEIGHT - vanishY) * frac;
      const spread = 1 - frac * 0.7;
      const left = cx - (CANVAS_WIDTH / 2) * spread;
      const right = cx + (CANVAS_WIDTH / 2) * spread;
      const a = 0.03 + frac * 0.04;
      this.tunnelGraphics.lineStyle(1, COLOR_NEON_PURPLE, a);
      this.tunnelGraphics.lineBetween(left, perspY, right, perspY);
    }
  }

  private updateBackground(deltaSec: number): void {
    const speed = this.director.getScrollSpeed();

    for (const star of this.starField) {
      star.y += star.speed * deltaSec;
      if (star.y > CANVAS_HEIGHT) {
        star.y = -2;
        star.x = Math.random() * CANVAS_WIDTH;
      }
    }
    this.drawStars();

    this.gridScrollOffset += speed * deltaSec * 4;
    this.drawGrid();

    this.tunnelFlowOffset += speed * deltaSec * 0.02;
    if (this.tunnelFlowOffset > 1) this.tunnelFlowOffset -= 1;
    this.drawTunnel();
  }
}
