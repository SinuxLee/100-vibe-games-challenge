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
  bulletSize: number;  // 子弹尺寸
  bulletTexture: string; // 子弹纹理
  level: number;       // 当前等级
}
```

构造函数签名：`new WeaponSystem(scene, weaponId?)`

- 若传入 `weaponId`，会通过 `getWeaponById(weaponId)` 从 CSV 配置表读取武器数据
- 读取结果由 `buildWeaponDef(cfg)` 转成运行时 `WeaponDef`
- 若未传入或查找失败，则回退到 `Basic Gun` 默认值

### 当前武器表

| ID | 名称 | 伤害 | 射击间隔 | 子弹数 | 穿透 | 说明 |
|----|------|------|----------|--------|------|------|
| `basic_gun` | Basic Gun | 15 | 600ms | 1 | 1 | Warrior 默认武器 |
| `shotgun` | Shotgun | 10 | 1000ms | 5 | 1 | 当前不作为初始武器 |
| `sniper` | Sniper | 50 | 1500ms | 1 | 3 | 当前不作为初始武器 |
| `magic_bolt` | Magic Bolt | 20 | 500ms | 2 | 2 | Mage 默认武器 |
| `crossbow` | Crossbow | 12 | 350ms | 1 | 1 | Ranger 默认武器 |
| `flame_cannon` | Flame Cannon | 35 | 1200ms | 3 | 2 | 后续可获得武器 |

补充数值：

- `basic_gun`: bulletSpeed=450
- `shotgun`: bulletSpeed=350
- `sniper`: bulletSpeed=800
- `magic_bolt`: bulletSpeed=380
- `crossbow`: bulletSpeed=500
- `flame_cannon`: bulletSpeed=300

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

管理波次推进、阶段切换、敌人生成节奏、难度递增、Boss 触发

### 状态

| 属性 | 初始值 | 描述 |
|------|--------|------|
| `currentWave` | 1 | 当前波次 |
| `waveElapsed` | 0 | 当前波次已过时间 (ms) |
| `spawnTimer` | 0 | 生成计时器 (ms) |
| `_lastStage` | 1 | 记录上一次阶段号，用于检测阶段切换 |

### 阶段切换

WaveSystem 不再用单一 `getWaveConfig()` 固定配置，而是每次按当前波次调用：

```typescript
getWaveConfigForWave(waveNum)
```

规则如下：

- 每 5 波进入下一阶段
- Wave 1-5 对应 Stage 1
- Wave 6-10 对应 Stage 2
- Wave 11-15 对应 Stage 3
- Wave 16-20 对应 Stage 4
- Wave 21+ 固定使用 Stage 5 配置

同时提供只读访问器：

```typescript
get currentStage(): number
```

其内部通过 `getStageForWave(currentWave)` 计算当前阶段。

### update 循环

```
1. wc = getWaveConfigForWave(currentWave)
2. waveElapsed += delta, spawnTimer += delta
3. 计算当前生成间隔: max(wc.spawnIntervalMin, wc.spawnIntervalBase - (wave-1) × wc.intervalReduction)
4. if (spawnTimer >= 间隔) → 生成一批敌人, 重置计时器
5. if (waveElapsed >= wc.duration) → 推进波次
```

### 5 段关卡配置

每个阶段都从 `src/data/wave.csv` 读取一行，包含持续时间、生成间隔、基础生成数量、成长系数、敌人权重和 Boss ID。

| 阶段 | 波次 | 敌人组成 | Boss | duration | spawnIntervalBase / Min | spawnCountBase | hpScaling | speedScaling | intervalReduction |
|------|------|----------|------|----------|-------------------------|----------------|-----------|--------------|------------------|
| Stage 1 | 1-5 | `basic:5;fast:1` | `brute` | 30000ms | 2000 / 600 | 2 | 0.10 | 0.02 | 50 |
| Stage 2 | 6-10 | `basic:3;fast:2;tank:2;shooter:1` | `brute` | 30000ms | 1800 / 500 | 3 | 0.12 | 0.03 | 50 |
| Stage 3 | 11-15 | `fast:2;tank:2;shooter:2;splitter:2;ghost:1` | `necromancer` | 28000ms | 1600 / 450 | 4 | 0.15 | 0.03 | 45 |
| Stage 4 | 16-20 | `shooter:2;splitter:2;ghost:2;charger:2;swarm:3` | `dragon` | 25000ms | 1400 / 400 | 5 | 0.18 | 0.04 | 40 |
| Stage 5 | 21+ | `ghost:2;charger:3;swarm:4;tank:1;splitter:2` | `overlord` | 22000ms | 1200 / 350 | 6 | 0.22 | 0.05 | 35 |

### 敌人生成规则

每次生成数量：

```typescript
count = wc.spawnCountBase + floor(currentWave * 0.5)
```

敌人属性成长：

```typescript
hpMul = 1 + (currentWave - 1) * wc.hpScaling
speedMul = 1 + (currentWave - 1) * wc.speedScaling
```

敌人种类不是写死的，而是读取 `wc.enemies`，再通过 `parseEnemyWeights()` 解析权重字符串，例如：

```typescript
basic:5;fast:1
```

随后按权重随机抽取本批次每一个敌人类型。

示例：Wave 16 属于 Stage 4，使用 `spawnCountBase=5`、`hpScaling=0.18`、`speedScaling=0.04`。

- 本批数量：`5 + floor(16 × 0.5) = 13`
- HP 乘数：`1 + 15 × 0.18 = 3.7`
- 速度乘数：`1 + 15 × 0.04 = 1.6`

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
advanceWave():
  1. currentWave++
  2. 播放 playWaveStart()
  3. 若阶段变化，emit('stageChanged', newStage)
  4. 读取新阶段 wc.bossId
  5. 用 bossCfg.waveInterval 判断是否在该波生成 Boss
  6. spawnBoss() → 摄像机震动 (300ms) + Boss 音效
```

Boss ID 现在来自当前阶段配置 `wc.bossId`，不是全局常量。也就是说：

- Stage 1-2 使用 `brute`
- Stage 3 使用 `necromancer`
- Stage 4 使用 `dragon`
- Stage 5 使用 `overlord`

`advanceWave()` 会比较 `newStage` 和 `_lastStage`。若阶段切换成功，就更新 `_lastStage` 并发出：

```typescript
scene.events.emit('stageChanged', newStage)
```

HUD 等系统可以据此更新阶段提示。

### 自动存档

每次 `advanceWave()` 自动调用 `SaveSystem.save()` 保存当前状态。

---

## UpgradeSystem

**文件**: `src/systems/UpgradeSystem.ts`  
**模式**: 静态类（无需实例化）

### 职责

管理升级池、随机抽取、应用升级效果

### 升级池

| ID | 名称 | 描述 | 效果 | 上限 | `forCharacter` |
|----|------|------|------|------|----------------|
| `pierce` | Piercing Rounds | +1 enemy pierced per bullet | `weapon.pierce += 1` | 3 | `all` |
| `bullet_speed` | Velocity Rounds | +20% bullet speed | `weapon.bulletSpeed *= 1.2` | 3 | `all` |
| `bullet_count` | Multi Shot | +1 bullet per shot | `weapon.bulletCount += 1` | 4 | `all` |
| `damage_up` | Power Shot | +25% bullet damage | `weapon.damage *= 1.25` | 5 | `all` |
| `fire_rate_up` | Rapid Fire | -15% fire cooldown | `weapon.fireRate *= 0.85` | 5 | `all` |
| `speed_up` | Swift Feet | +12% movement speed | `player.speed *= 1.12` | 5 | `all` |
| `max_hp` | Vitality | +25 max HP and heal | `player.maxHp += 25, hp += 25` | 5 | `all` |
| `shield` | Iron Will | +30 max HP | `player.maxHp += 30` | 3 | `warrior` |
| `crit_chance` | Deadly Aim | +30% bullet damage | `weapon.damage *= 1.3` | 5 | `ranger` |
| `multi_cast` | Arcane Burst | +1 bullet per shot | `weapon.bulletCount += 1` | 3 | `mage` |
| `magnet` | Magnetic Aura | +20 pickup range | `player.pickupRange += 20` | 5 | `all` |
| `armor` | Tough Skin | +200ms invincibility | `player.invincibleMs += 200` | 3 | `all` |

### 角色过滤

升级池由 CSV 表生成，每条升级都带有 `forCharacter` 字段。

- `all` 表示所有角色都能抽到
- 其他值需要与 `player.characterId` 完全匹配
- 当前实现支持 `warrior`、`ranger`、`mage` 专属升级

筛选逻辑：

```typescript
u.currentLevel < u.maxLevel
&& (u.forCharacter === 'all' || u.forCharacter === player.characterId)
```

### 核心方法

```typescript
// 随机抽取（排除已满级 + 按角色过滤 + 按权重抽取）
static getRandomUpgrades(count, player, weapons): UpgradeDef[]
  → 过滤 currentLevel < maxLevel
  → 过滤 forCharacter
  → weightedRandomPick()

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

### 加权随机

升级不再是简单洗牌后截取，而是：

1. `calcWeight(upgrade, player, weapons)` 根据当前血量、移速、子弹数、穿透、射速等上下文计算权重
2. `weightedRandomPick()` 每轮按权重随机抽 1 个
3. 被抽中的升级会从临时池移除，同一次三选一不会重复

一些明显的偏好例子：

- 低血量时，`max_hp`、`shield`、`armor` 权重更高
- 子弹较多时，`damage_up`、`pierce`、`crit_chance` 更容易出现
- `multi_cast` 对 Mage 可用，`crit_chance` 对 Ranger 可用，`shield` 对 Warrior 可用
- 已升过多次的升级会吃 `currentLevel * 0.15` 的权重惩罚，避免同一条升级过度连刷

### 升级叠加示例

以 Warrior 默认 `basic_gun` 为例：

- Power Shot 满级 (Lv5): `15 × 1.25^5 ≈ 46` 伤害  
- Rapid Fire 满级 (Lv5): `600 × 0.85^5 ≈ 266ms` 射击间隔  
- Multi Shot 满级 (Lv4): `1 + 4 = 5` 发子弹  
- Piercing Rounds 满级 (Lv3): `1 + 3 = 4` 次穿透  
- Magnet 满级 (Lv5): `120 + 20 × 5 = 220` 拾取范围  
- Armor 满级 (Lv3): `500 + 200 × 3 = 1100ms` 受伤无敌时间  

角色专属示例：

- Warrior 的 Iron Will 满级 (Lv3): `120 + 30 × 3 = 210` 最大生命  
- Ranger 的 Deadly Aim 满级 (Lv5): `12 × 1.3^5 ≈ 44` 伤害  
- Mage 的 Arcane Burst 满级 (Lv3): `2 + 3 = 5` 发子弹

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

> 详见 `rules-generic.md` #11 (Procedural Assets)。标准模式: Oscillator → Gain → masterGain → destination。
> `exponentialRampToValueAtTime` 目标值必须 > 0。OscillatorNode 是一次性对象。
