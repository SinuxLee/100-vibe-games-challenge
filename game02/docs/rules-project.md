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
| player.csv | id, speed, maxHp, startWeapon, xpBase, xpScaling | 3 characters: warrior, ranger, mage. Each has its own startWeapon and XP curve |
| enemy.csv | id, speed, hp, damage, xpReward, color | 8 types: basic, fast, tank, shooter, splitter, ghost, charger, swarm |
| boss.csv | id, speed, hp, damage, waveInterval | 4 bosses: brute, necromancer, dragon, overlord. Stats are absolute, not multipliers |
| weapon.csv | id, damage, fireRate, bulletSpeed, bulletCount, pierce | 6 weapons: basic_gun, shotgun, sniper, magic_bolt, crossbow, flame_cannon |
| upgrade.csv | id, type, stat, factor, maxLevel, forCharacter | 12 upgrades total. Current CSV has 9 universal rows and 3 character-specific rows |
| wave.csv | id, enemies ("basic:5;fast:1"), bossId | 5 stages: stage_1 through stage_5. Enemy weights use `;` separator and each stage has its own bossId |
| xp.csv | id, orbSize, attractSpeed | Per-orb-type config |

## Config Loading Chain

```
CSV files ──?raw import──> config.ts ──parseTableCsv()──> typed arrays
                                      ──lookupById()──> getPlayerById()/getEnemyById()/getBossById()/getWeaponById()
                                      ──getWaveConfigForWave(waveNum)──> stage-based wave lookup
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
Boot → Preload → Menu ──┬── CharSelect → GameScene
                        └── Continue → GameScene
GameScene parallel: HUDScene, LevelUpScene, GMScene, TutorialScene(first-time)
```

`CharSelect` is a phase inside `MenuScene`, not a standalone Phaser scene. `GameOverScene` starts after player death.

## i18n System

- `src/i18n.ts` defines `type Lang = 'zh' | 'en'`
- Current language is stored in `localStorage` under `survivor_lang`
- `t(key, params?)` handles dictionary lookup plus `{placeholder}` interpolation
- `tUpgradeName(id)` and `tUpgradeDesc(id)` wrap upgrade-specific translation keys
- All player-facing scenes use i18n text. `GMScene` stays English for developer readability

## Stage Progression System

- `wave.csv` has 5 rows, each row represents one stage
- Every 5 waves advances to the next stage. Later waves reuse the last stage row
- Each stage defines its own enemy composition, boss, and difficulty parameters
- `WaveSystem` emits a `stageChanged` event when stage index changes
- `HUDScene` listens for that event and shows a stage banner

## Known Constraints

- `UpgradeSystem.upgradePool` is module-level mutable state → MUST call `reset()` on new game
- `scene.pause()` does NOT pause physics → must call `physics.pause()` separately
- AudioContext requires user gesture → init in MenuScene pointerdown
- Phaser `generateTexture()` leaks Graphics object → must `destroy()` after
- Boss multipliers in config.ts are computed ratios (boss.hp / enemy.hp) for legacy compat
- AutoBattle directly sets player velocity → bypasses WASD/joystick in Player.update()
- Wave `enemies` field uses `;` separator, not `,`. `parseEnemyWeights()` handles both for compatibility
- i18n dictionary keys must match between `zh` and `en`
