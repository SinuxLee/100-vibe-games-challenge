/**
 * Minimal Phaser mock for unit testing game entities and systems.
 * Provides just enough API surface to construct and test our classes.
 */

// --- Mock Rectangle ---
export class MockRectangle {
  x = 0;
  y = 0;
  width = 0;
  height = 0;
  alpha = 1;
  visible = true;
  depth = 0;
  blendMode = 0;

  constructor(
    _scene?: any,
    x = 0,
    y = 0,
    width = 0,
    height = 0,
    _fillColor?: number,
    _fillAlpha?: number,
  ) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  setPosition(x: number, y: number): this {
    this.x = x;
    this.y = y;
    return this;
  }

  setSize(w: number, h: number): this {
    this.width = w;
    this.height = h;
    return this;
  }

  setVisible(v: boolean): this {
    this.visible = v;
    return this;
  }

  setAlpha(a: number): this {
    this.alpha = a;
    return this;
  }

  setDepth(d: number): this {
    this.depth = d;
    return this;
  }

  setBlendMode(m: number): this {
    this.blendMode = m;
    return this;
  }

  setOrigin(_ox?: number, _oy?: number): this {
    return this;
  }

  destroy(): void {}
}

// --- Mock Text ---
export class MockText {
  x = 0;
  y = 0;
  text = '';
  alpha = 1;
  depth = 0;
  scaleX = 1;
  scaleY = 1;
  blendMode = 0;

  constructor(_scene?: any, x = 0, y = 0, text = '', _style?: any) {
    this.x = x;
    this.y = y;
    this.text = text;
  }

  setOrigin(_ox?: number, _oy?: number): this {
    return this;
  }

  setDepth(d: number): this {
    this.depth = d;
    return this;
  }

  setScale(s: number): this {
    this.scaleX = s;
    this.scaleY = s;
    return this;
  }

  setAlpha(a: number): this {
    this.alpha = a;
    return this;
  }

  setBlendMode(m: number): this {
    this.blendMode = m;
    return this;
  }

  setColor(_c: string): this {
    return this;
  }

  setText(t: string): this {
    this.text = t;
    return this;
  }

  destroy(): void {}
}

// --- Mock ParticleEmitter ---
export class MockParticleEmitter {
  emitting = false;
  depth = 0;
  x = 0;
  y = 0;
  frequency = 30;

  setDepth(d: number): this {
    this.depth = d;
    return this;
  }

  setPosition(x: number, y: number): this {
    this.x = x;
    this.y = y;
    return this;
  }

  setFrequency(f: number): this {
    this.frequency = f;
    return this;
  }

  setParticleSpeed(_min: number, _max: number): this {
    return this;
  }

  setParticleLifespan(_lifespan: number): this {
    return this;
  }

  start(): this {
    this.emitting = true;
    return this;
  }

  stop(): this {
    this.emitting = false;
    return this;
  }

  explode(_count?: number): this {
    return this;
  }

  destroy(): void {
    this.emitting = false;
  }
}

// --- Mock Physics Body ---
export class MockBody {
  width = 0;
  height = 0;
  immovable = false;
  allowGravity = true;

  setSize(w: number, h: number): this {
    this.width = w;
    this.height = h;
    return this;
  }

  setImmovable(v: boolean): this {
    this.immovable = v;
    return this;
  }

  setAllowGravity(v: boolean): this {
    this.allowGravity = v;
    return this;
  }
}

// --- Mock Camera ---
export class MockCamera {
  scrollX = 0;
  scrollY = 0;
  rotation = 0;
  shake(_duration?: number, _intensity?: number): void {}
  flash(_duration?: number, _r?: number, _g?: number, _b?: number, _force?: boolean): void {}
  setScroll(x: number, y: number): void { this.scrollX = x; this.scrollY = y; }
  setRotation(r: number): void { this.rotation = r; }
}

// --- Mock Scene ---
export function createMockScene(): any {
  const inputListeners: Record<string, Function[]> = {};

  return {
    add: {
      existing: vi.fn(),
      rectangle: vi.fn((_x: number, _y: number, _w: number, _h: number, _color?: number, _alpha?: number) => {
        return new MockRectangle(null, _x, _y, _w, _h, _color, _alpha);
      }),
      text: vi.fn((_x: number, _y: number, _text: string, _style?: any) => {
        return new MockText(null, _x, _y, _text, _style);
      }),
      particles: vi.fn((_x: number, _y: number, _key: string, _config?: any) => {
        return new MockParticleEmitter();
      }),
      graphics: vi.fn(() => {
        return {
          setDepth: vi.fn().mockReturnThis(),
          setBlendMode: vi.fn().mockReturnThis(),
          setAlpha: vi.fn().mockReturnThis(),
          setRotation: vi.fn().mockReturnThis(),
          clear: vi.fn().mockReturnThis(),
          lineStyle: vi.fn().mockReturnThis(),
          lineBetween: vi.fn().mockReturnThis(),
          fillStyle: vi.fn().mockReturnThis(),
          fillCircle: vi.fn().mockReturnThis(),
          fillRect: vi.fn().mockReturnThis(),
          beginPath: vi.fn().mockReturnThis(),
          moveTo: vi.fn().mockReturnThis(),
          lineTo: vi.fn().mockReturnThis(),
          closePath: vi.fn().mockReturnThis(),
          fillPath: vi.fn().mockReturnThis(),
          strokePath: vi.fn().mockReturnThis(),
          destroy: vi.fn(),
        };
      }),
    },
    physics: {
      add: {
        existing: vi.fn(),
      },
    },
    input: {
      on: vi.fn((event: string, fn: Function) => {
        if (!inputListeners[event]) inputListeners[event] = [];
        inputListeners[event].push(fn);
      }),
      // Helper to emit mock input events in tests
      _emit(event: string, ...args: any[]) {
        (inputListeners[event] || []).forEach((fn: Function) => fn(...args));
      },
    },
    cameras: {
      main: new MockCamera(),
    },
    tweens: {
      add: vi.fn((_config: any) => ({ getValue: () => 0 })),
    },
    time: {
      delayedCall: vi.fn((_delay: number, cb: Function) => {
        cb();
      }),
      addEvent: vi.fn((_config: any) => {
        if (_config && _config.callback) _config.callback();
      }),
      timeScale: 1,
    },
    sound: {
      play: vi.fn(),
      mute: false,
    },
    // Expose listeners map for test introspection
    _inputListeners: inputListeners,
  };
}

// --- Phaser namespace mock ---
const PhaserMock = {
  Scene: class MockSceneClass {
    add: any;
    physics: any;
    input: any;
    cameras: any;
    tweens: any;
    time: any;
    sound: any;
  },

  GameObjects: {
    Container: class MockContainer {
      scene: any;
      x = 0;
      y = 0;
      depth = 0;
      children: any[] = [];

      constructor(scene: any, x = 0, y = 0) {
        this.scene = scene;
        this.x = x;
        this.y = y;
      }

      add(child: any): this {
        this.children.push(child);
        return this;
      }

      setDepth(d: number): this {
        this.depth = d;
        return this;
      }

      destroy(): void {
        this.children = [];
      }
    },
    Rectangle: MockRectangle,
    Text: MockText,
    Particles: {
      ParticleEmitter: MockParticleEmitter,
    },
  },

  Physics: {
    Arcade: {
      Sprite: class MockSprite {
        scene: any;
        x: number;
        y: number;
        texture: string;
        body: MockBody;
        depth = 0;
        active = true;

        constructor(scene: any, x: number, y: number, texture: string) {
          this.scene = scene;
          this.x = x;
          this.y = y;
          this.texture = texture;
          this.body = new MockBody();
        }

        setDepth(d: number): this {
          this.depth = d;
          return this;
        }

        setAngle(_a: number): this {
          return this;
        }

        setVisible(_v: boolean): this {
          return this;
        }

        destroy(): void {
          this.active = false;
        }
      },
      Body: MockBody,
    },
  },

  Math: {
    Clamp: (value: number, min: number, max: number) => {
      return Math.max(min, Math.min(max, value));
    },
  },

  BlendModes: {
    ADD: 1,
    NORMAL: 0,
  },

  Scale: {
    FIT: 1,
    CENTER_BOTH: 1,
  },

  AUTO: 0,
};

export default PhaserMock;
