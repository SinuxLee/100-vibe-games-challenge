import Phaser from 'phaser';
import { COLOR_HIGHLIGHT_WHITE, COLOR_ELECTRIC_BLUE, COLOR_LASER_RED, COLOR_NEON_PURPLE, COLOR_COMBO_YELLOW, COLOR_COMBO_RED, CSS_HIGHLIGHT_WHITE, CSS_ELECTRIC_BLUE, CSS_LASER_RED, CSS_COMBO_YELLOW, CSS_COMBO_RED, CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants';
import { AudioManager } from './AudioManager';

export class VFXManager {
  private scene: Phaser.Scene;
  private trailEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private nearMissTexts: Phaser.GameObjects.Text[] = [];
  private speedLines: Phaser.GameObjects.Graphics | null = null;
  private currentTrauma = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.setupTrailEmitter();
    try {
      this.speedLines = scene.add.graphics();
      this.speedLines.setDepth(3);
    } catch {
      this.speedLines = null;
    }
  }

  private setupTrailEmitter(): void {
    try {
      this.trailEmitter = this.scene.add.particles(0, 0, 'particle_spark', {
        speed: { min: 10, max: 50 },
        scale: { start: 1.0, end: 0 },
        alpha: { start: 0.8, end: 0 },
        lifespan: 400,
        frequency: 25,
        blendMode: Phaser.BlendModes.ADD,
        tint: [COLOR_ELECTRIC_BLUE, COLOR_HIGHLIGHT_WHITE],
        angle: { min: 160, max: 200 },
      });
      this.trailEmitter.setDepth(9);
      this.trailEmitter.stop();
    } catch {
      this.trailEmitter = null;
    }
  }

  updateTrail(x: number, y: number, active: boolean, speed = 0): void {
    if (!this.trailEmitter) return;
    this.trailEmitter.setPosition(x, y + 10);
    if (active && !this.trailEmitter.emitting) {
      this.trailEmitter.start();
    } else if (!active && this.trailEmitter.emitting) {
      this.trailEmitter.stop();
    }

    if (active && speed > 0) {
      const intensity = Math.min(1, speed / 18);
      this.trailEmitter.setFrequency(Math.max(10, 25 - intensity * 15));
      this.trailEmitter.setParticleSpeed(10 + intensity * 40, 50 + intensity * 80);
      this.trailEmitter.setParticleLifespan(400 + intensity * 200);
    }
  }

  showPassFlash(x: number, y: number): void {
    // Horizontal light sweep
    const flash = this.scene.add.rectangle(x, y, 120, 12, COLOR_HIGHLIGHT_WHITE, 0.5);
    flash.setBlendMode(Phaser.BlendModes.ADD).setDepth(12);
    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      scaleX: 3.0,
      scaleY: 0.2,
      duration: 250,
      onComplete: () => flash.destroy(),
    });

    // Floating "+5" text
    const scoreText = this.scene.add.text(x + 30, y - 20, '+5', {
      fontFamily: 'monospace',
      fontSize: '26px',
      color: CSS_ELECTRIC_BLUE,
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(20).setBlendMode(Phaser.BlendModes.ADD);

    this.scene.tweens.add({
      targets: scoreText,
      y: y - 80,
      alpha: 0,
      duration: 500,
      ease: 'Sine.easeOut',
      onComplete: () => scoreText.destroy(),
    });

    // Trail burst
    if (this.trailEmitter) {
      const origFreq = this.trailEmitter.frequency;
      this.trailEmitter.setFrequency(5);
      this.scene.time.delayedCall(200, () => {
        if (this.trailEmitter) this.trailEmitter.setFrequency(origFreq);
      });
    }

    AudioManager.playPassThrough();
  }

  showNearMiss(x: number, y: number): void {
    // Strong camera shake via trauma
    this.addTrauma(0.35);
    AudioManager.vibrate([40, 20, 60]);

    // Big "NEAR MISS +8" text with scale pop
    const text = this.scene.add.text(x, y - 50, 'NEAR MISS +8', {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: CSS_HIGHLIGHT_WHITE,
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(20).setScale(1.5).setAlpha(1);

    this.nearMissTexts.push(text);

    // Pop in then float up
    this.scene.tweens.add({
      targets: text,
      scaleX: 1,
      scaleY: 1,
      duration: 100,
      ease: 'Back.easeOut',
    });

    this.scene.tweens.add({
      targets: text,
      y: y - 160,
      alpha: 0,
      duration: 800,
      delay: 100,
      ease: 'Sine.easeIn',
      onComplete: () => {
        text.destroy();
        this.nearMissTexts = this.nearMissTexts.filter(t => t !== text);
      },
    });

    // Spark burst — 20 particles radiating out
    try {
      const burst = this.scene.add.particles(x, y, 'particle_spark', {
        speed: { min: 120, max: 350 },
        scale: { start: 0.8, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: 350,
        quantity: 20,
        blendMode: Phaser.BlendModes.ADD,
        tint: [COLOR_HIGHLIGHT_WHITE, COLOR_ELECTRIC_BLUE, COLOR_NEON_PURPLE],
        emitting: false,
      });
      burst.setDepth(15);
      burst.explode(20);
      this.scene.time.delayedCall(400, () => burst.destroy());
    } catch {}

    // Brief screen flash
    this.scene.cameras.main.flash(80, 245, 247, 255, true);

    // Momentary slow-mo hint (time dilation)
    this.scene.time.timeScale = 0.6;
    this.scene.time.delayedCall(120, () => {
      this.scene.time.timeScale = 1;
    });
  }

  playDeathEffect(x: number, y: number, onComplete: () => void): void {
    AudioManager.vibrate([50, 30, 100, 30, 80]);

    // Freeze frame — use real setTimeout since scene clock will be paused
    this.scene.time.timeScale = 0;

    window.setTimeout(() => {
      this.scene.time.timeScale = 1;

      try {
        // Big particle explosion — 40 particles
        const explosion = this.scene.add.particles(x, y, 'particle_spark', {
          speed: { min: 150, max: 500 },
          scale: { start: 1.5, end: 0 },
          alpha: { start: 1, end: 0 },
          lifespan: 700,
          quantity: 40,
          blendMode: Phaser.BlendModes.ADD,
          tint: [COLOR_LASER_RED, COLOR_ELECTRIC_BLUE, COLOR_HIGHLIGHT_WHITE, COLOR_NEON_PURPLE],
          emitting: false,
          angle: { min: 0, max: 360 },
        });
        explosion.setDepth(20);
        explosion.explode(40);

        // Heavy screen shake
        this.addTrauma(0.6);

        // Red flash
        this.scene.cameras.main.flash(200, 255, 59, 92, true);

        // Glitch effect — offset + chromatic bars
        this.showGlitchEffect();

        this.scene.time.delayedCall(900, () => {
          explosion.destroy();
          onComplete();
        });
      } catch {
        this.scene.time.delayedCall(400, onComplete);
      }
    }, 80);
  }

  private showGlitchEffect(): void {
    try {
      const gfx = this.scene.add.graphics().setDepth(50);
      // Draw random horizontal glitch bars
      for (let i = 0; i < 8; i++) {
        const y = Math.random() * CANVAS_HEIGHT;
        const h = 4 + Math.random() * 12;
        const offset = (Math.random() - 0.5) * 40;
        const color = [COLOR_LASER_RED, COLOR_ELECTRIC_BLUE, COLOR_NEON_PURPLE][Math.floor(Math.random() * 3)];
        gfx.fillStyle(color, 0.4 + Math.random() * 0.3);
        gfx.fillRect(offset, y, CANVAS_WIDTH, h);
      }
      // Flash and remove
      this.scene.tweens.add({
        targets: gfx,
        alpha: 0,
        duration: 300,
        delay: 80,
        onComplete: () => gfx.destroy(),
      });
    } catch {}
  }

  // Trauma-based screen shake system
  showComboMilestone(combo: number, multiplier: number): void {
    const cx = CANVAS_WIDTH / 2;
    const cy = CANVAS_HEIGHT * 0.35;
    const color = multiplier >= 2.5 ? CSS_COMBO_RED : multiplier >= 1.75 ? CSS_COMBO_YELLOW : CSS_HIGHLIGHT_WHITE;
    const tintColor = multiplier >= 2.5 ? COLOR_COMBO_RED : multiplier >= 1.75 ? COLOR_COMBO_YELLOW : COLOR_HIGHLIGHT_WHITE;

    const text = this.scene.add.text(cx, cy, `${combo} COMBO!\nx${multiplier.toFixed(1)}`, {
      fontFamily: 'monospace',
      fontSize: '36px',
      color,
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center',
    }).setOrigin(0.5).setDepth(25).setScale(0).setAlpha(1);

    this.scene.tweens.add({
      targets: text,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 200,
      ease: 'Back.easeOut',
    });

    this.scene.tweens.add({
      targets: text,
      scaleX: 1,
      scaleY: 1,
      alpha: 0,
      y: cy - 60,
      duration: 600,
      delay: 300,
      ease: 'Sine.easeIn',
      onComplete: () => text.destroy(),
    });

    try {
      const burst = this.scene.add.particles(cx, cy, 'particle_spark', {
        speed: { min: 80, max: 250 },
        scale: { start: 0.6, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: 400,
        quantity: 15,
        blendMode: Phaser.BlendModes.ADD,
        tint: [tintColor, COLOR_ELECTRIC_BLUE],
        emitting: false,
      });
      burst.setDepth(24);
      burst.explode(15);
      this.scene.time.delayedCall(500, () => burst.destroy());
    } catch {}

    this.addTrauma(0.15);
    AudioManager.playComboMilestone();
  }

  showGemCollect(x: number, y: number, isRare: boolean, pts = 15): void {
    const color = isRare ? CSS_HIGHLIGHT_WHITE : CSS_ELECTRIC_BLUE;
    const tint = isRare ? COLOR_HIGHLIGHT_WHITE : COLOR_ELECTRIC_BLUE;
    const points = `+${pts}`;

    const text = this.scene.add.text(x, y - 20, points, {
      fontFamily: 'monospace',
      fontSize: '24px',
      color,
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(20).setBlendMode(Phaser.BlendModes.ADD);

    this.scene.tweens.add({
      targets: text,
      y: y - 80,
      alpha: 0,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 500,
      ease: 'Sine.easeOut',
      onComplete: () => text.destroy(),
    });

    try {
      const burst = this.scene.add.particles(x, y, 'particle_spark', {
        speed: { min: 60, max: 180 },
        scale: { start: 0.5, end: 0 },
        alpha: { start: 0.9, end: 0 },
        lifespan: 300,
        quantity: 10,
        blendMode: Phaser.BlendModes.ADD,
        tint: [tint, COLOR_HIGHLIGHT_WHITE],
        emitting: false,
      });
      burst.setDepth(15);
      burst.explode(10);
      this.scene.time.delayedCall(350, () => burst.destroy());
    } catch {}
  }

  showSpikeHit(x: number, y: number): void {
    const text = this.scene.add.text(x, y - 20, 'OUCH!', {
      fontFamily: 'monospace',
      fontSize: '26px',
      color: CSS_LASER_RED,
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(20);

    this.scene.tweens.add({
      targets: text,
      y: y - 70,
      alpha: 0,
      duration: 600,
      ease: 'Sine.easeOut',
      onComplete: () => text.destroy(),
    });

    this.addTrauma(0.25);
    this.scene.cameras.main.flash(100, 255, 59, 92, true);
    AudioManager.vibrate([30, 15, 50]);
  }

  addTrauma(amount: number): void {
    this.currentTrauma = Math.min(1, this.currentTrauma + amount);
  }

  updateSpeedLines(scrollSpeed: number): void {
    if (!this.speedLines) return;
    this.speedLines.clear();

    // Only show speed lines above threshold
    if (scrollSpeed < 10) return;

    const intensity = Math.min(1, (scrollSpeed - 10) / 10);
    const lineCount = Math.floor(4 + intensity * 12);

    this.speedLines.lineStyle(1, COLOR_HIGHLIGHT_WHITE, 0.08 + intensity * 0.12);
    for (let i = 0; i < lineCount; i++) {
      const x = Math.random() * CANVAS_WIDTH;
      const y = Math.random() * CANVAS_HEIGHT;
      const len = 30 + intensity * 60;
      this.speedLines.lineBetween(x, y, x, y + len);
    }
  }

  update(deltaSec: number): void {
    // Update trauma-based shake
    if (this.currentTrauma > 0) {
      const shake = this.currentTrauma * this.currentTrauma; // quadratic
      const maxOffset = 8 * shake;
      const maxAngle = 2 * shake;

      const cam = this.scene.cameras.main;
      cam.setScroll(
        (Math.random() - 0.5) * maxOffset * 2,
        (Math.random() - 0.5) * maxOffset * 2,
      );
      cam.setAngle((Math.random() - 0.5) * maxAngle * 2);

      // Decay trauma
      this.currentTrauma = Math.max(0, this.currentTrauma - deltaSec * 1.5);

      // Reset when trauma gone
      if (this.currentTrauma <= 0) {
        cam.setScroll(0, 0);
        cam.setAngle(0);
      }
    }
  }

  destroy(): void {
    this.trailEmitter?.destroy();
    this.speedLines?.destroy();
    for (const t of this.nearMissTexts) {
      t.destroy();
    }
    this.nearMissTexts = [];
    // Reset camera
    try {
      this.scene.cameras.main.setScroll(0, 0);
      this.scene.cameras.main.setAngle(0);
    } catch {}
  }
}
