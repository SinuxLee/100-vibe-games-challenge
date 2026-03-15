import Phaser from 'phaser';
import { COLOR_HIGHLIGHT_WHITE, COLOR_ELECTRIC_BLUE, COLOR_LASER_RED, CSS_HIGHLIGHT_WHITE } from '../constants';
import { AudioManager } from './AudioManager';

export class VFXManager {
  private scene: Phaser.Scene;
  private trailEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private nearMissTexts: Phaser.GameObjects.Text[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.setupTrailEmitter();
  }

  private setupTrailEmitter(): void {
    try {
      this.trailEmitter = this.scene.add.particles(0, 0, 'particle_spark', {
        speed: { min: 5, max: 20 },
        scale: { start: 0.8, end: 0 },
        alpha: { start: 0.6, end: 0 },
        lifespan: 300,
        frequency: 30,
        blendMode: Phaser.BlendModes.ADD,
        tint: COLOR_ELECTRIC_BLUE,
      });
      this.trailEmitter.setDepth(9);
      this.trailEmitter.stop();
    } catch {
      this.trailEmitter = null;
    }
  }

  updateTrail(x: number, y: number, active: boolean): void {
    if (!this.trailEmitter) return;
    this.trailEmitter.setPosition(x, y);
    if (active && !this.trailEmitter.emitting) {
      this.trailEmitter.start();
    } else if (!active && this.trailEmitter.emitting) {
      this.trailEmitter.stop();
    }
  }

  showPassFlash(x: number, y: number): void {
    if (this.trailEmitter) {
      const origFreq = this.trailEmitter.frequency;
      this.trailEmitter.setFrequency(10);
      this.scene.time.delayedCall(150, () => {
        if (this.trailEmitter) this.trailEmitter.setFrequency(origFreq);
      });
    }

    const flash = this.scene.add.rectangle(x, y, 60, 8, COLOR_HIGHLIGHT_WHITE, 0.4);
    flash.setBlendMode(Phaser.BlendModes.ADD).setDepth(12);
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      scaleX: 2.5,
      scaleY: 0.3,
      duration: 200,
      onComplete: () => flash.destroy(),
    });

    AudioManager.playPassThrough();
  }

  showNearMiss(x: number, y: number): void {
    this.scene.cameras.main.shake(120, 0.005);
    AudioManager.vibrate(30);

    const text = this.scene.add.text(x, y - 40, 'NEAR MISS +8', {
      fontFamily: 'monospace',
      fontSize: '22px',
      color: CSS_HIGHLIGHT_WHITE,
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(20);

    this.nearMissTexts.push(text);

    this.scene.tweens.add({
      targets: text,
      y: y - 120,
      alpha: 0,
      duration: 600,
      onComplete: () => {
        text.destroy();
        this.nearMissTexts = this.nearMissTexts.filter(t => t !== text);
      },
    });

    if (this.trailEmitter) {
      try {
        const burst = this.scene.add.particles(x, y, 'particle_spark', {
          speed: { min: 80, max: 200 },
          scale: { start: 0.6, end: 0 },
          alpha: { start: 1, end: 0 },
          lifespan: 250,
          quantity: 8,
          blendMode: Phaser.BlendModes.ADD,
          tint: [COLOR_HIGHLIGHT_WHITE, COLOR_ELECTRIC_BLUE],
          emitting: false,
        });
        burst.setDepth(15);
        burst.explode(8);
        this.scene.time.delayedCall(300, () => burst.destroy());
      } catch {}
    }
  }

  playDeathEffect(x: number, y: number, onComplete: () => void): void {
    AudioManager.vibrate([50, 30, 100]);

    this.scene.time.delayedCall(60, () => {
      try {
        const explosion = this.scene.add.particles(x, y, 'particle_spark', {
          speed: { min: 100, max: 350 },
          scale: { start: 1.2, end: 0 },
          alpha: { start: 1, end: 0 },
          lifespan: 500,
          quantity: 25,
          blendMode: Phaser.BlendModes.ADD,
          tint: [COLOR_LASER_RED, COLOR_ELECTRIC_BLUE, COLOR_HIGHLIGHT_WHITE],
          emitting: false,
        });
        explosion.setDepth(20);
        explosion.explode(25);

        this.scene.cameras.main.shake(200, 0.015);
        this.scene.cameras.main.flash(150, 255, 59, 92, true);

        this.scene.time.delayedCall(800, () => {
          explosion.destroy();
          onComplete();
        });
      } catch {
        this.scene.time.delayedCall(400, onComplete);
      }
    });
  }

  update(_deltaSec: number): void {
  }

  destroy(): void {
    this.trailEmitter?.destroy();
    for (const t of this.nearMissTexts) {
      t.destroy();
    }
    this.nearMissTexts = [];
  }
}
