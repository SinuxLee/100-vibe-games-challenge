# Game Dev Generic Rules

Reusable patterns for building action/survivor-type games. Engine-agnostic where noted.

---

## 1. Data-Driven Config

**Rule**: All gameplay numbers live in external data files (CSV/JSON), not code.

- One file per domain: player, enemy, weapon, wave, upgrade, xp
- Multi-row ID-based tables, not flat key-value (day-1 extensibility)
- Number columns auto-converted by loader; string columns stay as-is
- Code reads config by ID lookup, never hardcodes values
- Backward compat: export legacy flat constants from default row

```
player.csv:
id,name,speed,maxHp,startWeapon,...
warrior,Warrior,200,100,basic_gun,...
ranger,Ranger,240,70,shotgun,...
```

**Why**: Designers edit CSV in Excel. Devs never touch balance code.

---

## 2. Entity-Config Binding

**Rule**: Entity constructors accept optional config objects; fallback to global defaults.

```ts
constructor(scene, x, y, config?: PlayerConfig) {
  this.speed = config?.speed ?? PLAYER_SPEED;
}
```

**Why**: Same class, different stats. Add a new character = add a CSV row, not a new class.

---

## 3. Upgrade System as Data

**Rule**: Upgrades are data-driven with `type + stat + factor`.

```
id,name,type,stat,factor,maxLevel,forCharacter
damage_up,Power Shot,multiply,damage,1.25,5,all
bullet_count,Multi Shot,add,bulletCount,1,4,warrior
```

- `type`: multiply | add | set
- `stat`: maps to entity/weapon field
- `forCharacter`: "all" or specific character ID
- Apply function built from data, not hardcoded per-upgrade
- Store applied upgrade IDs in save; replay on load

**Why**: Add upgrades without writing apply functions.

---

## 4. Wave Composition

**Rule**: Wave config specifies enemy types + weights, not just "spawn more."

```
enemies: "basic:3,fast:1,tank:0.5"
```

- Weighted random selection per spawn tick
- Boss reference by ID in wave config (`bossId`)
- HP/speed scaling per wave as multiplier columns
- Spawn interval decreases per wave (with floor)

**Why**: Each wave feels different. Designers control pacing.

---

## 5. Auto-Battle / AI Playtest

**Rule**: Implement player AI early; toggle via GM panel.

Priority-based decision tree:
1. Low HP → flee nearest enemy (kite)
2. XP orb nearby → chase it
3. Enemy far → move toward (engage range)
4. Enemy too close → dodge
5. Otherwise → idle (weapon auto-fires)

Auto-select upgrades: pick index 0 (or weighted by strategy).

**Why**: Free QA. Balance testing at 10x speed. Catches softlocks, death spirals, infinite loops.

---

## 6. GM Panel

**Rule**: Runtime parameter tuning panel, NOT just debug log.

- Categorized tabs (Player, Weapon, Wave, etc.)
- Sliders with min/max/step for each tunable param
- Quick actions: god mode, one-hit kill, nuke all, skip wave, heal, add levels
- Auto-refresh displayed values (200ms poll)
- Toggle via hotkey (backtick) + UI button
- Depth/layer above game, below nothing

**Why**: Iterate balance without restarting. Show to designers live.

---

## 7. Invincibility Frames

**Rule**: Timestamp comparison, not boolean + timer.

```ts
if (now < this.invincibleUntil) return;
this.invincibleUntil = now + INVINCIBLE_MS;
```

**Why**: No timer object to manage. Serializable (save/restore trivially).

---

## 8. Save/Load via Replay

**Rule**: Save state + ordered upgrade IDs. Restore by re-applying.

```ts
save: { hp, level, xp, wave, kills, time, position, appliedUpgrades: ['id1','id2',...] }
load: set fields → forEach(id => UpgradeSystem.applyById(id))
```

- Save on wave transitions (auto)
- Delete on game over
- Upgrade `currentLevel` increments on each `applyById` call — ordering matters

**Why**: No need to serialize computed weapon stats. Replay is source of truth.

---

## 9. Edge Spawning

**Rule**: Spawn outside camera bounds, uniform across 4 edges.

```
1. Pick random edge (0-3 = top/bottom/left/right)
2. Random position along that edge
3. Offset by margin (80px) beyond camera half-extent
4. Clamp to world bounds
```

Center on **player position**, not world center.

---

## 10. Consecutive Level-Up Handling

**Rule**: After level-up popup closes, check if enough XP for another level.

```ts
resume(): void {
  if (player.xp >= player.xpToNext) {
    // consume XP, level++, recalc, re-trigger popup
    return; // don't unpause physics yet
  }
  unpause();
}
```

**Why**: Multiple XP orbs collected same frame → multiple level-ups queued. Must be recursive/iterative.

---

## 11. Procedural Assets (Zero-File Strategy)

**Rule**: Generate all textures + audio at runtime for prototyping.

- Textures: `Graphics.generateTexture()` → destroy Graphics object
- Audio: Web Audio API oscillators (Osc → Gain → Master → destination)
- Frequency ramps for pitch variation; white noise buffer for impacts
- AudioContext must init on user gesture (browser policy)

**Why**: Zero asset pipeline. Instant iteration. Replace with real assets later.

---

## 12. Parallel Scene Architecture

**Rule**: Game logic and HUD in separate scenes running simultaneously.

- GameScene: physics, entities, world camera follows player
- HUDScene: fixed-position UI, no camera follow
- Communication: Registry (`set`/`changedata` event)
- Popup scenes: launch + pause physics, stop + resume on close
- `physics.pause()` is separate from `scene.pause()` — must call both

---

## 13. Low-Coupling System Design

**Rule**: Systems are plain classes, not engine subclasses. Scene owns them.

```ts
class WeaponSystem {
  constructor(scene: GameScene, weaponId?: string) {}
  update(time: number): void {}
}
// GameScene.create():
this.weaponSystem = new WeaponSystem(this, 'basic_gun');
// GameScene.update():
this.weaponSystem.update(time);
```

Toggle-able systems (AutoBattle) have `enabled: boolean` checked in update().

**Why**: Swap, disable, test in isolation. No inheritance chains.
