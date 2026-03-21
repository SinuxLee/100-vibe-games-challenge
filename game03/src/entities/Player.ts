import Phaser from 'phaser';
import {
  PLAYER_WIDTH, PLAYER_HEIGHT, PLAYER_START_X, PLAYER_START_Y,
  GAME_WIDTH,
  toPixelX, toPixelY, toPixelW, toPixelH,
  COLOR_ELECTRIC_BLUE,
} from '../constants';

export class Player extends Phaser.Physics.Arcade.Sprite {
  logicalX: number;
  logicalY: number;

  private static readonly HALF_W = PLAYER_WIDTH / 2;
  private static readonly MIN_X = PLAYER_WIDTH / 2;
  private static readonly MAX_X = GAME_WIDTH - PLAYER_WIDTH / 2;

  private prevLogicalX: number;
  private tiltAngle = 0;
  private glowSprite: Phaser.GameObjects.Image | null = null;
  private glowPulseTime = 0;

  constructor(scene: Phaser.Scene) {
    const px = toPixelX(PLAYER_START_X);
    const py = toPixelY(PLAYER_START_Y);

    super(scene, px, py, 'player_shuttle');

    this.logicalX = PLAYER_START_X;
    this.logicalY = PLAYER_START_Y;
    this.prevLogicalX = PLAYER_START_X;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(toPixelW(PLAYER_WIDTH), toPixelH(PLAYER_HEIGHT));
    body.setImmovable(true);
    body.setAllowGravity(false);

    this.setDepth(10);

    try {
      this.glowSprite = scene.add.image(px, py, 'neon_glow');
      this.glowSprite.setDepth(9);
      this.glowSprite.setBlendMode(Phaser.BlendModes.ADD);
      this.glowSprite.setScale(2.5);
      this.glowSprite.setAlpha(0.4);
      this.glowSprite.setTint(COLOR_ELECTRIC_BLUE);
    } catch {
      this.glowSprite = null;
    }
  }

  setLogicalX(x: number): void {
    this.prevLogicalX = this.logicalX;
    this.logicalX = Phaser.Math.Clamp(x, Player.MIN_X, Player.MAX_X);
    this.x = toPixelX(this.logicalX);
  }

  updateVisuals(deltaSec: number): void {
    const dx = this.logicalX - this.prevLogicalX;
    const targetTilt = Phaser.Math.Clamp(dx * -3, -15, 15);
    this.tiltAngle += (targetTilt - this.tiltAngle) * 0.15;
    this.setAngle(this.tiltAngle);

    this.glowPulseTime += deltaSec;
    if (this.glowSprite) {
      const pulse = 0.3 + 0.15 * Math.sin(this.glowPulseTime * 5);
      const speedBoost = Math.min(0.2, Math.abs(dx) * 0.02);
      this.glowSprite.setAlpha(pulse + speedBoost);
      this.glowSprite.setPosition(this.x, this.y);
      this.glowSprite.setScale(2.5 + speedBoost * 3);
    }
  }

  syncPixelPosition(): void {
    this.x = toPixelX(this.logicalX);
    this.y = toPixelY(this.logicalY);
    if (this.glowSprite) {
      this.glowSprite.setPosition(this.x, this.y);
    }
  }

  getCollisionRect(): { x: number; y: number; w: number; h: number } {
    return {
      x: this.logicalX - Player.HALF_W,
      y: this.logicalY - PLAYER_HEIGHT / 2,
      w: PLAYER_WIDTH,
      h: PLAYER_HEIGHT,
    };
  }

  hideForDeath(): void {
    this.setVisible(false);
    if (this.glowSprite) {
      this.glowSprite.setVisible(false);
    }
  }
}
