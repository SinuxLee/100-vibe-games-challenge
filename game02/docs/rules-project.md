# Project-Specific Rules (Survivor Game)

Decisions specific to THIS project. Not universal.

---

## Tech Choices

| Choice | Why |
|--------|-----|
| Phaser 3 Arcade Physics | Simplest 2D physics; AABB sufficient for circles/rects |
| 750x1334 portrait | iPhone 6/7/8 viewport; Scale.FIT + CENTER_BOTH |
| World 4000x4000 | ~5x screen in each direction; enough room to kite |
| Bun | Fast install; drop-in npm replacement |
| Vite | HMR for rapid iteration; `?raw` import for CSV |

## CSV Schema

7 files in `src/data/`. All use first-row headers, ID-based rows.

| File | Key Columns | Notes |
|------|-------------|-------|
| player.csv | id, speed, maxHp, startWeapon, xpBase, xpScaling | XP curve is per-character |
| enemy.csv | id, speed, hp, damage, xpReward, color | 3 types: basic, fast, tank |
| boss.csv | id, speed, hp, damage, waveInterval | Absolute stats (not multipliers) |
| weapon.csv | id, damage, fireRate, bulletSpeed, bulletCount, pierce | Bullet visual refs included |
| upgrade.csv | id, type, stat, factor, maxLevel, forCharacter | "all" or character ID |
| wave.csv | id, enemies ("basic:3,fast:1"), bossId | Weighted enemy composition |
| xp.csv | id, orbSize, attractSpeed | Per-orb-type config |

## Config Loading Chain

```
CSV files ──?raw import──> config.ts ──parseTableCsv()──> typed arrays
                                      ──lookupById()──> helper functions
                                      ──default row──> legacy flat exports
```

Legacy constants (PLAYER_SPEED, ENEMY_BASE_HP...) computed from default row for backward compat.

## Entity Hierarchy

```
Phaser.Physics.Arcade.Sprite
├── Player     (characterId, per-char XP curve)
├── Enemy      (enemyId, optional EnemyConfig)
│   └── BossEnemy  (extends Enemy, overhead HP bar, multi-particle death)
├── Bullet     (pierce counter, auto-destroy OOB)
└── XPOrb      (pulsating tween, configurable size)
```

## System Ownership

```
GameScene owns:
├── player: Player
├── enemies: Physics.Group
├── bullets: Physics.Group
├── xpOrbs: Physics.Group
├── weaponSystem: WeaponSystem
├── waveSystem: WaveSystem
├── autoBattle: AutoBattleSystem
└── physics.overlap x3 (bullet-enemy, player-enemy, player-orb)

Static singletons:
├── UpgradeSystem (pool + apply logic, reset on new game)
├── SaveSystem (localStorage CRUD)
└── SoundManager (Web Audio, init on gesture)
```

## Scene Graph

```
Boot → Preload → Menu ──┬── GameScene (physics, entities, systems)
                        ├── HUDScene (HP/XP bars, timer, mute, GM toggle, ESC pause)
                        ├── LevelUpScene (3 cards, auto-pick if AutoBattle)
                        ├── GMScene (param sliders, quick actions)
                        └── GameOverScene (stats, best score, restart/menu)
```

## Known Constraints

- `UpgradeSystem.upgradePool` is module-level mutable state → MUST call `reset()` on new game
- `scene.pause()` does NOT pause physics → must call `physics.pause()` separately
- AudioContext requires user gesture → init in MenuScene pointerdown
- Phaser `generateTexture()` leaks Graphics object → must `destroy()` after
- Boss multipliers in config.ts are computed ratios (boss.hp / enemy.hp) for legacy compat
- AutoBattle directly sets player velocity → bypasses WASD/joystick in Player.update()
