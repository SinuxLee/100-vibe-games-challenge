# 游戏系统文档

系统类是纯逻辑对象（非 Phaser 类继承），由 GameScene 持有并在 update 循环中调用。

---

## WeaponSystem

**文件**: `src/systems/WeaponSystem.ts`  
**持有者**: `GameScene.weaponSystem`

### 职责

自动检测最近敌人 → 按射击间隔发射子弹

### 武器定义

```typescript
interface WeaponDef {
  name: string;        // 武器名
  damage: number;      // 子弹伤害
  fireRate: number;    // 射击间隔 (ms)
  bulletSpeed: number; // 子弹速度 (px/s)
  bulletCount: number; // 每次射击子弹数
  pierce: number;      // 穿透次数
  level: number;       // 当前等级
}
```

默认武器 "Basic Gun": damage=15, fireRate=600ms, bulletSpeed=450, bulletCount=1, pierce=1

### update 循环

```
1. 时间间隔检查: if (time - lastFired < fireRate) return
2. 查找最近敌人: findNearestEnemy()
3. 无敌人 → return
4. 更新 lastFired = time
5. fire(weapon, target)
```

### 多弹射击

当 `bulletCount > 1` 时，子弹以扇形散射：

```typescript
const spread = bulletCount > 1 ? 0.3 : 0;  // 弧度散射角
const baseAngle = atan2(target.y - player.y, target.x - player.x);

for (i = 0; i < bulletCount; i++) {
  offset = (i - (bulletCount - 1) / 2) * spread;
  angle = baseAngle + offset;
  // 创建子弹 → fire(targetX, targetY)
}
```

> **关键知识**: 散射偏移量以基准角为中心对称分布。例如 3 发子弹的偏移为 [-0.3, 0, +0.3] 弧度。`spread` 值 0.3 约等于 17°。

### 最近敌人查找

遍历 `enemies.getChildren()`，计算距离取最小值。时间复杂度 O(n)，对于几百个敌人没有性能问题。如果敌人数量达到数千级别，可考虑空间分区优化。

---

## WaveSystem

**文件**: `src/systems/WaveSystem.ts`  
**持有者**: `GameScene.waveSystem`

### 职责

管理波次推进、敌人生成节奏、难度递增、Boss 触发

### 状态

| 属性 | 初始值 | 描述 |
|------|--------|------|
| `currentWave` | 1 | 当前波次 |
| `waveElapsed` | 0 | 当前波次已过时间 (ms) |
| `spawnTimer` | 0 | 生成计时器 (ms) |

### update 循环

```
1. waveElapsed += delta, spawnTimer += delta
2. 计算当前生成间隔: max(300ms, 1500 - (wave-1) × 50)
3. if (spawnTimer >= 间隔) → 生成一批敌人, 重置计时器
4. if (waveElapsed >= 30000ms) → 推进波次
```

### 敌人生成规则

每次生成 `count = 1 + floor(wave × 0.5)` 个敌人：

| 波次 | count | 生成间隔 | 敌人 HP 乘数 | 敌人速度乘数 |
|------|-------|----------|-------------|-------------|
| 1 | 1 | 1500ms | 1.0× | 1.0× |
| 3 | 2 | 1400ms | 1.3× | 1.1× |
| 5 | 3 | 1300ms | 1.6× | 1.2× |
| 10 | 6 | 1050ms | 2.35× | 1.45× |
| 20 | 11 | 550ms | 3.85× | 1.95× |
| 25 | 13 | 300ms (min) | 4.6× | 2.2× |

### 生成位置

```typescript
randomEdgePoint(playerX, playerY, halfW, halfH, margin=80):
  随机选择上/下/左/右边
  在该边上随机取一点
  距离摄像机中心 = 半屏宽/高 + margin(80px)
```

> 敌人始终在玩家视野之外生成，避免突然出现在画面中。

### Boss 触发

```
每 5 波 (BOSS_WAVE_INTERVAL = 5) 生成 Boss：
  Wave 5, 10, 15, 20, ...
  → spawnBoss() → 摄像机震动 (300ms) + 低频隆隆音效
```

### 自动存档

每次 `advanceWave()` 自动调用 `SaveSystem.save()` 保存当前状态。

---

## UpgradeSystem

**文件**: `src/systems/UpgradeSystem.ts`  
**模式**: 静态类（无需实例化）

### 职责

管理升级池、随机抽取、应用升级效果

### 升级池

| ID | 名称 | 描述 | 效果 | 上限 |
|----|------|------|------|------|
| `damage_up` | Power Shot | +25% 子弹伤害 | `weapon.damage *= 1.25` | 5 |
| `fire_rate_up` | Rapid Fire | -15% 射击冷却 | `weapon.fireRate *= 0.85` | 5 |
| `bullet_count` | Multi Shot | +1 子弹数量 | `weapon.bulletCount += 1` | 4 |
| `pierce` | Piercing Rounds | +1 穿透次数 | `weapon.pierce += 1` | 3 |
| `speed_up` | Swift Feet | +12% 移动速度 | `player.speed *= 1.12` | 5 |
| `max_hp` | Vitality | +25 最大血量并回复 | `player.maxHp += 25, hp += 25` | 5 |
| `bullet_speed` | Velocity Rounds | +20% 子弹速度 | `weapon.bulletSpeed *= 1.2` | 3 |

### 核心方法

```typescript
// 随机抽取（排除已满级的升级）
static getRandomUpgrades(count, player, weapons): UpgradeDef[]
  → 过滤 currentLevel < maxLevel
  → Phaser.Utils.Array.Shuffle()
  → 取前 count 个

// 应用升级
static apply(upgrade, player, weapons): void
  → upgrade.apply(player, weapons)  // 执行效果函数
  → upgrade.currentLevel++

// 按 ID 应用（存档恢复用）
static applyById(id, player, weapons): void

// 重置所有升级等级（新游戏用）
static reset(): void
```

> **注意**: `upgradePool` 是模块级数组，`currentLevel` 是可变状态。新游戏必须调用 `reset()` 清零，否则上一局的升级等级会残留。

### 升级叠加示例

Power Shot 满级 (Lv5): `15 × 1.25^5 ≈ 46` 伤害  
Rapid Fire 满级 (Lv5): `600 × 0.85^5 ≈ 266ms` 射击间隔  
Multi Shot 满级 (Lv4): `1 + 4 = 5` 发子弹  
Piercing Rounds 满级 (Lv3): `1 + 3 = 4` 次穿透

---

## SaveSystem

**文件**: `src/systems/SaveSystem.ts`  
**模式**: 静态类  
**存储键**: `survivor_save`

### SaveData 结构

```typescript
interface SaveData {
  playerLevel: number;
  playerXP: number;
  playerHP: number;
  playerMaxHP: number;
  currentWave: number;
  kills: number;
  elapsedTime: number;           // ms
  weaponLevels: Record<string, number>;  // 预留字段
  appliedUpgrades: string[];     // 已应用的升级 ID 列表
  playerPosition: { x: number; y: number };
}
```

### API

| 方法 | 描述 |
|------|------|
| `save(data)` | `JSON.stringify` → `localStorage.setItem` |
| `load()` | `localStorage.getItem` → `JSON.parse`，无数据返回 `null` |
| `hasSave()` | 检查是否有存档 |
| `deleteSave()` | `localStorage.removeItem` |

### 存档触发时机

| 时机 | 操作 |
|------|------|
| 波次推进 | `WaveSystem.autoSave()` 自动保存 |
| 游戏结束 | `SaveSystem.deleteSave()` 删除存档 |
| 新游戏开始 | 不操作（覆盖存档） |
| 加载存档 | `GameScene.loadSaveData()` 恢复状态 |

### 存档恢复流程

```
1. 设置玩家位置
2. 恢复 hp, maxHp, level, xp
3. 重算 xpToNext
4. 恢复 kills, elapsedTime, currentWave
5. 遍历 appliedUpgrades → 逐个调用 UpgradeSystem.applyById()
```

---

## SoundManager

**文件**: `src/systems/SoundManager.ts`  
**模式**: 静态类  
**后端**: Web Audio API (`AudioContext`)

### 设计原则

- **零外部文件**: 所有音效由 OscillatorNode + GainNode 实时合成
- **延迟初始化**: 必须在用户手势（pointerdown）后调用 `init()` + `resume()`
- **全局音量**: masterGain = 0.3
- **静音切换**: 通过 masterGain.value 在 0 和 0.3 之间切换

### 音效清单

| 方法 | 触发场景 | 合成方式 |
|------|---------|---------|
| `playShoot()` | 子弹发射 | square 880→440 Hz, 80ms |
| `playHit()` | 子弹命中 | 白噪声 buffer, 线性衰减, 50ms |
| `playPickup()` | 拾取经验球 | sine 600→1200 Hz, 120ms |
| `playLevelUp()` | 升级 | C-E-G 三音和弦 (523/659/784 Hz), 450ms |
| `playPlayerHit()` | 玩家受伤 | sawtooth 300→80 Hz, 180ms |
| `playEnemyDeath()` | 敌人死亡 | sine 400→100 Hz, 120ms |
| `playBossSpawn()` | Boss 出场 | sawtooth 60→40 + square 55→35 双振荡器, 600ms |
| `playGameOver()` | 游戏结束 | G-F-D (392/349/294 Hz) triangle 下行, 900ms |
| `playClick()` | UI 按钮点击 | sine 1000→600 Hz, 50ms |
| `playWaveStart()` | 新波次开始 | A-C# (440/554 Hz) square 上行, 350ms |

### Web Audio 音效合成模式

```typescript
// 标准模式: Oscillator → Gain → masterGain → destination
static playXxx(): void {
  const t = this.ctx.currentTime;
  
  const osc = this.ctx.createOscillator();
  osc.type = 'sine' | 'square' | 'sawtooth' | 'triangle';
  osc.frequency.setValueAtTime(startFreq, t);
  osc.frequency.exponentialRampToValueAtTime(endFreq, t + duration);
  
  const gain = this.ctx.createGain();
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  
  osc.connect(gain);
  gain.connect(this.masterGain);
  osc.start(t);
  osc.stop(t + duration);
}
```

> **关键知识**:
> - `exponentialRampToValueAtTime` 的目标值必须 > 0（用 0.001 代替 0）
> - `OscillatorNode` 只能 start/stop 一次，是一次性对象
> - 不需要手动断开连接，stop 后 GC 会自动回收
> - 白噪声通过 `AudioBufferSourceNode` + 随机采样数据实现
