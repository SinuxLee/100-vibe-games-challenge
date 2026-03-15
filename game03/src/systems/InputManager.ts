import Phaser from 'phaser';
import { toLogicalX, PLAYER_WIDTH, GAME_WIDTH } from '../constants';

export class InputManager {
  private targetX: number;
  private isDragging = false;
  private readonly minX = PLAYER_WIDTH / 2;
  private readonly maxX = GAME_WIDTH - PLAYER_WIDTH / 2;

  constructor(scene: Phaser.Scene, initialX: number) {
    this.targetX = initialX;

    scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.isDragging = true;
      this.updateTarget(pointer);
    });

    scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isDragging) {
        this.updateTarget(pointer);
      }
    });

    scene.input.on('pointerup', () => {
      this.isDragging = false;
    });
  }

  private updateTarget(pointer: Phaser.Input.Pointer): void {
    const lx = toLogicalX(pointer.x);
    this.targetX = Phaser.Math.Clamp(lx, this.minX, this.maxX);
  }

  getTargetX(): number {
    return this.targetX;
  }

  getIsDragging(): boolean {
    return this.isDragging;
  }
}
