import Phaser from 'phaser';
import {
  CANVAS_WIDTH, CANVAS_HEIGHT,
  COLOR_DARK_BG, COLOR_ELECTRIC_BLUE, COLOR_NEON_PURPLE,
  CSS_ELECTRIC_BLUE, CSS_HIGHLIGHT_WHITE, CSS_NEON_PURPLE,
  PLAYER_START_X, PLAYER_START_Y, PLAYER_WIDTH,
  OBSTACLE_SPAWN_Y, NEAR_MISS_DISTANCE,
  toPixelX, toPixelY,
} from '../constants';
import { Player } from '../entities/Player';
import { InputManager } from '../systems/InputManager';
import { SingleGapWall } from '../entities/obstacles/SingleGapWall';
import { CollisionSystem } from '../systems/CollisionSystem';
import { SaveSystem } from '../systems/SaveSystem';
import { AudioManager } from '../systems/AudioManager';

const TUTORIAL_SCROLL_SPEED = 4;
const TUTORIAL_GAP_WIDE = 45;
const TUTORIAL_GAP_NEAR_MISS = 40;
const MOVE_THRESHOLD = 20;

export class TutorialScene extends Phaser.Scene {
  private tutorialStep = 0;
  private player!: Player;
  private inputManager!: InputManager;
  private collisionSystem!: CollisionSystem;
  private obstacle: SingleGapWall | null = null;
  private instructionText!: Phaser.GameObjects.Text;
  private subText!: Phaser.GameObjects.Text;
  private stepDots: Phaser.GameObjects.Arc[] = [];
  private initialX = PLAYER_START_X;
  private maxMoveDistance = 0;
  private gridGraphics!: Phaser.GameObjects.Graphics;
  private gridOffset = 0;
  private skipZone!: Phaser.GameObjects.Text;
  private fingerIcon: Phaser.GameObjects.Image | null = null;
  private arrowLeft: Phaser.GameObjects.Image | null = null;
  private arrowRight: Phaser.GameObjects.Image | null = null;
  private transitioning = false;

  constructor() {
    super({ key: 'TutorialScene' });
  }

  create(): void {
    this.tutorialStep = 0;
    this.transitioning = false;
    this.maxMoveDistance = 0;

    AudioManager.init(this);
    AudioManager.resume();

    this.cameras.main.setBackgroundColor(COLOR_DARK_BG);
    this.gridGraphics = this.add.graphics().setDepth(0);

    this.player = new Player(this);
    this.inputManager = new InputManager(this, PLAYER_START_X);
    this.collisionSystem = new CollisionSystem();
    this.initialX = PLAYER_START_X;

    this.instructionText = this.add.text(CANVAS_WIDTH / 2, CANVAS_HEIGHT * 0.3, '', {
      fontFamily: 'monospace',
      fontSize: '40px',
      color: CSS_ELECTRIC_BLUE,
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center',
      wordWrap: { width: CANVAS_WIDTH - 80 },
    }).setOrigin(0.5).setDepth(20);

    this.subText = this.add.text(CANVAS_WIDTH / 2, CANVAS_HEIGHT * 0.38, '', {
      fontFamily: 'monospace',
      fontSize: '22px',
      color: CSS_HIGHLIGHT_WHITE,
      align: 'center',
      wordWrap: { width: CANVAS_WIDTH - 80 },
    }).setOrigin(0.5).setDepth(20).setAlpha(0.7);

    this.createStepDots();

    this.skipZone = this.add.text(CANVAS_WIDTH - 30, 40, 'SKIP', {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: CSS_NEON_PURPLE,
    }).setOrigin(1, 0).setInteractive().setDepth(30).setAlpha(0.6);
    this.skipZone.on('pointerdown', () => this.finishTutorial());

    this.cameras.main.setAlpha(0);
    this.tweens.add({
      targets: this.cameras.main,
      alpha: 1,
      duration: 300,
      ease: 'Sine.easeIn',
      onComplete: () => this.startStep(0),
    });
  }

  update(_time: number, delta: number): void {
    if (this.transitioning) return;
    const deltaSec = delta / 1000;

    const targetX = this.inputManager.getTargetX();
    const currentX = this.player.logicalX;
    const newX = currentX + (targetX - currentX) * 0.18;
    this.player.setLogicalX(newX);

    this.gridOffset += deltaSec * 10;
    this.drawGrid();

    if (this.obstacle && !this.obstacle.scored) {
      this.obstacle.updateMovement(deltaSec, TUTORIAL_SCROLL_SPEED);

      if (this.obstacle.isOffScreen()) {
        this.onObstaclePassedOrMissed(false);
        return;
      }

      if (this.tutorialStep === 1 || this.tutorialStep === 2) {
        if (this.collisionSystem.checkCollision(this.player, [this.obstacle])) {
          this.onObstacleHit();
          return;
        }

        const playerRect = this.player.getCollisionRect();
        const obsRects = this.obstacle.getCollisionRects();
        if (this.obstacle.logicalY < PLAYER_START_Y && !this.obstacle.passed) {
          this.obstacle.passed = true;

          if (this.tutorialStep === 2) {
            let minEdgeDist = Infinity;
            for (const rect of obsRects) {
              const rectTop = rect.y;
              const rectBot = rect.y + rect.h;
              const playerCenterY = playerRect.y + playerRect.h / 2;
              if (playerCenterY >= rectTop && playerCenterY <= rectBot) {
                const distLeft = Math.abs(playerRect.x + playerRect.w - rect.x);
                const distRight = Math.abs(rect.x + rect.w - playerRect.x);
                minEdgeDist = Math.min(minEdgeDist, distLeft, distRight);
              }
            }
            if (minEdgeDist < NEAR_MISS_DISTANCE) {
              this.onObstaclePassedOrMissed(true);
            } else {
              this.onObstaclePassedOrMissed(false);
            }
          } else {
            this.onObstaclePassedOrMissed(false);
          }
        }
      }
    }

    if (this.tutorialStep === 0) {
      const dist = Math.abs(this.player.logicalX - this.initialX);
      if (dist > this.maxMoveDistance) this.maxMoveDistance = dist;
      if (this.maxMoveDistance >= MOVE_THRESHOLD) {
        this.advanceStep();
      }
    }
  }

  private createStepDots(): void {
    const totalSteps = 4;
    const dotSpacing = 24;
    const startX = CANVAS_WIDTH / 2 - ((totalSteps - 1) * dotSpacing) / 2;
    const dotY = CANVAS_HEIGHT * 0.92;

    for (let i = 0; i < totalSteps; i++) {
      const dot = this.add.circle(startX + i * dotSpacing, dotY, 5, COLOR_NEON_PURPLE, 0.3)
        .setDepth(20);
      this.stepDots.push(dot);
    }
  }

  private updateStepDots(): void {
    for (let i = 0; i < this.stepDots.length; i++) {
      this.stepDots[i].setFillStyle(
        i <= this.tutorialStep ? COLOR_ELECTRIC_BLUE : COLOR_NEON_PURPLE,
        i <= this.tutorialStep ? 0.9 : 0.3,
      );
    }
  }

  private startStep(step: number): void {
    this.tutorialStep = step;
    this.updateStepDots();
    this.clearObstacle();
    this.clearHints();

    switch (step) {
      case 0:
        this.showStepDragToMove();
        break;
      case 1:
        this.showStepDodge();
        break;
      case 2:
        this.showStepNearMiss();
        break;
      case 3:
        this.showStepReady();
        break;
    }
  }

  private showStepDragToMove(): void {
    this.instructionText.setText('DRAG TO MOVE');
    this.subText.setText('Slide your finger left and right');
    this.maxMoveDistance = 0;
    this.initialX = this.player.logicalX;

    const playerPixelY = toPixelY(PLAYER_START_Y);

    try {
      this.fingerIcon = this.add.image(CANVAS_WIDTH / 2, playerPixelY + 100, 'finger_icon')
        .setDepth(15).setAlpha(0.7);
      this.tweens.add({
        targets: this.fingerIcon,
        x: CANVAS_WIDTH / 2 + 80,
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      this.arrowLeft = this.add.image(CANVAS_WIDTH / 2 - 150, playerPixelY, 'arrow_right')
        .setDepth(15).setAlpha(0.5).setFlipX(true);
      this.arrowRight = this.add.image(CANVAS_WIDTH / 2 + 150, playerPixelY, 'arrow_right')
        .setDepth(15).setAlpha(0.5);

      this.tweens.add({ targets: this.arrowLeft, alpha: 0.2, duration: 600, yoyo: true, repeat: -1 });
      this.tweens.add({ targets: this.arrowRight, alpha: 0.2, duration: 600, yoyo: true, repeat: -1 });
    } catch {}
  }

  private showStepDodge(): void {
    this.instructionText.setText('DODGE!');
    this.subText.setText('Avoid the laser wall');
    this.spawnObstacle(TUTORIAL_GAP_WIDE);
  }

  private showStepNearMiss(): void {
    this.instructionText.setText('FLY CLOSE\nFOR BONUS');
    this.subText.setText('Pass near the wall edge');
    this.spawnObstacle(TUTORIAL_GAP_NEAR_MISS);
  }

  private showStepReady(): void {
    this.instructionText.setText("YOU'RE READY!");
    this.subText.setText('');

    this.tweens.add({
      targets: this.instructionText,
      scaleX: 1.15,
      scaleY: 1.15,
      duration: 400,
      yoyo: true,
      ease: 'Back.easeOut',
    });

    this.cameras.main.flash(200, 0, 229, 255, true);

    this.time.delayedCall(2000, () => this.finishTutorial());
  }

  private spawnObstacle(gapW: number): void {
    this.clearObstacle();
    const gapCenter = PLAYER_START_X;
    this.obstacle = new SingleGapWall(this, OBSTACLE_SPAWN_Y, gapCenter, gapW);
  }

  private clearObstacle(): void {
    if (this.obstacle) {
      this.obstacle.scored = true;
      this.obstacle.destroySelf();
    }
    this.obstacle = null;
  }

  private clearHints(): void {
    if (this.fingerIcon) { this.fingerIcon.destroy(); this.fingerIcon = null; }
    if (this.arrowLeft) { this.arrowLeft.destroy(); this.arrowLeft = null; }
    if (this.arrowRight) { this.arrowRight.destroy(); this.arrowRight = null; }
  }

  private onObstaclePassedOrMissed(nearMiss: boolean): void {
    this.clearObstacle();

    if (this.tutorialStep === 1) {
      this.showFlash('NICE!', CSS_ELECTRIC_BLUE);
      this.time.delayedCall(800, () => this.advanceStep());
    } else if (this.tutorialStep === 2) {
      if (nearMiss) {
        this.showFlash('NEAR MISS +8', CSS_HIGHLIGHT_WHITE);
        AudioManager.playNearMiss();
        this.time.delayedCall(800, () => this.advanceStep());
      } else {
        this.showFlash('TRY CLOSER!', CSS_NEON_PURPLE);
        this.time.delayedCall(1000, () => {
          if (this.tutorialStep === 2) {
            this.spawnObstacle(TUTORIAL_GAP_NEAR_MISS);
          }
        });
      }
    }
  }

  private onObstacleHit(): void {
    this.clearObstacle();
    this.cameras.main.shake(100, 0.005);

    this.showFlash('TRY AGAIN', CSS_NEON_PURPLE);

    this.player.setLogicalX(PLAYER_START_X);
    this.inputManager = new InputManager(this, PLAYER_START_X);

    const gapW = this.tutorialStep === 1 ? TUTORIAL_GAP_WIDE : TUTORIAL_GAP_NEAR_MISS;
    this.time.delayedCall(1000, () => {
      if (this.tutorialStep === 1 || this.tutorialStep === 2) {
        this.spawnObstacle(gapW);
      }
    });
  }

  private showFlash(msg: string, color: string): void {
    const text = this.add.text(CANVAS_WIDTH / 2, CANVAS_HEIGHT * 0.5, msg, {
      fontFamily: 'monospace',
      fontSize: '36px',
      color,
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(25);

    this.tweens.add({
      targets: text,
      y: CANVAS_HEIGHT * 0.45,
      alpha: 0,
      duration: 700,
      ease: 'Sine.easeOut',
      onComplete: () => text.destroy(),
    });
  }

  private advanceStep(): void {
    this.startStep(this.tutorialStep + 1);
  }

  private finishTutorial(): void {
    if (this.transitioning) return;
    this.transitioning = true;

    SaveSystem.completeTutorial();

    this.cameras.main.fade(300, 7, 11, 26, true, (_cam: unknown, progress: number) => {
      if (progress >= 1) {
        this.scene.start('GameScene');
      }
    });
  }

  private drawGrid(): void {
    this.gridGraphics.clear();
    const spacing = 50;
    this.gridGraphics.lineStyle(1, COLOR_NEON_PURPLE, 0.06);
    for (let x = 0; x <= CANVAS_WIDTH; x += spacing) {
      this.gridGraphics.lineBetween(x, 0, x, CANVAS_HEIGHT);
    }
    const offsetY = this.gridOffset % spacing;
    for (let y = -spacing + offsetY; y <= CANVAS_HEIGHT + spacing; y += spacing) {
      this.gridGraphics.lineBetween(0, y, CANVAS_WIDTH, y);
    }
  }
}
