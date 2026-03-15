import Phaser from 'phaser';
import {
  PLAYER_WIDTH, PLAYER_HEIGHT, PLAYER_START_X, PLAYER_START_Y,
  GAME_WIDTH,
  toPixelX, toPixelY, toPixelW, toPixelH,
} from '../constants';

export class Player extends Phaser.Physics.Arcade.Sprite {
  logicalX: number;
  logicalY: number;

  private static readonly HALF_W = PLAYER_WIDTH / 2;
  private static readonly MIN_X = PLAYER_WIDTH / 2;
  private static readonly MAX_X = GAME_WIDTH - PLAYER_WIDTH / 2;

  constructor(scene: Phaser.Scene) {
    const px = toPixelX(PLAYER_START_X);
    const py = toPixelY(PLAYER_START_Y);

    super(scene, px, py, 'player_shuttle');

    this.logicalX = PLAYER_START_X;
    this.logicalY = PLAYER_START_Y;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(toPixelW(PLAYER_WIDTH), toPixelH(PLAYER_HEIGHT));
    body.setImmovable(true);
    body.setAllowGravity(false);

    this.setDepth(10);
  }

  setLogicalX(x: number): void {
    this.logicalX = Phaser.Math.Clamp(x, Player.MIN_X, Player.MAX_X);
    this.x = toPixelX(this.logicalX);
  }

  syncPixelPosition(): void {
    this.x = toPixelX(this.logicalX);
    this.y = toPixelY(this.logicalY);
  }

  getCollisionRect(): { x: number; y: number; w: number; h: number } {
    return {
      x: this.logicalX - Player.HALF_W,
      y: this.logicalY - PLAYER_HEIGHT / 2,
      w: PLAYER_WIDTH,
      h: PLAYER_HEIGHT,
    };
  }
}
