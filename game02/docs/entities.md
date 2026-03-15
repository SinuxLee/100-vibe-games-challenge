# 实体类文档

所有游戏实体继承自 `Phaser.Physics.Arcade.Sprite`，拥有物理碰撞体和纹理渲染能力。

---

## Player

**文件**: `src/entities/Player.ts`  
**纹理**: 来自 `PlayerConfig.texture`，当前有 `player_warrior`、`player_ranger`、`player_mage`  
**碰撞体**: 圆形，半径来自 `PlayerConfig.size`，默认以 warrior 的 `20px` 为参考

### 属性

| 属性 | 初始值 | 来源 | 描述 |
|------|--------|------|------|
| `characterId` | `warrior` | `PlayerConfig.id` | 当前角色 ID，用于角色专属升级和存档恢复 |
| `hp` | 120 | `PlayerConfig.maxHp` | 当前血量，初始等于最大血量 |
| `maxHp` | 120 | `PlayerConfig.maxHp` | 最大血量 |
| `speed` | 200 | `PlayerConfig.speed` | 移动速度 (px/s) |
| `level` | 1 | - | 当前等级 |
| `xp` | 0 | - | 当前经验值 |
| `xpBase` | 30 | `PlayerConfig.xpBase` | 当前角色的经验曲线基础值 |
| `xpScaling` | 1.35 | `PlayerConfig.xpScaling` | 当前角色的经验曲线缩放系数 |
| `xpToNext` | 30 | `PlayerConfig.xpBase` | 下一次升级所需经验 |
| `pickupRange` | 120 | `PlayerConfig.pickupRange` | 经验球磁吸范围 |
| `invincibleMs` | 500 | `PlayerConfig.invincibleMs` | 单次受伤后的无敌时长，公开属性，升级系统可直接修改 |
| `invincibleUntil` | 0 | private runtime | 无敌帧结束时间戳 |

> **说明**: 上表默认值以 warrior 为参考。实际创建玩家时会把 `PlayerConfig` 直接传入构造函数，不同角色会得到不同的初始属性和纹理。

### 角色配置

| 角色 | `characterId` | 速度 | 最大生命 | 拾取范围 | 无敌时长 | 起始武器 | XP 曲线 |
|------|---------------|------|----------|----------|----------|----------|---------|
| Warrior | `warrior` | 200 | 120 | 120 | 500ms | `basic_gun` | `xpBase=30`, `xpScaling=1.35` |
| Ranger | `ranger` | 250 | 70 | 150 | 400ms | `crossbow` | `xpBase=25`, `xpScaling=1.30` |
| Mage | `mage` | 170 | 85 | 160 | 600ms | `magic_bolt` | `xpBase=35`, `xpScaling=1.40` |

> **关键变化**: 玩家不再是单一固定模板。`MenuScene` 选择角色后，`GameScene` 会按 `characterId` 从 CSV 读取对应 `PlayerConfig`，再创建 `Player`。

### 输入处理

```typescript
update():
  1. 读取 WASD 键盘状态 → vx, vy ∈ {-1, 0, 1}
  2. 读取 joystickVector（优先级高于键盘，如果摇杆有输入则覆盖）
  3. 对角线归一化：len = sqrt(vx² + vy²), velocity = (vx/len * speed, vy/len * speed)
  4. 无输入时 → setVelocity(0, 0)
```

> **关键知识**: 对角线归一化确保 8 方向移动速度一致。不归一化的话，左上 (−1,−1) 的实际速度是 √2 倍，约 1.414 倍正常速度。

### 受伤机制

```typescript
takeDamage(amount):
  if (当前时间 < invincibleUntil) return;  // 无敌帧内免伤
  hp -= amount
  invincibleUntil = now + invincibleMs     // 来自当前角色/升级后的无敌时长
  播放 playerHit 音效
  摄像机震动 (80ms, intensity 0.004)
  红色染色 + alpha 闪烁补间 (0.3→1, 重复3次)
```

### 经验与升级

```typescript
addXP(amount) → boolean:
  xp += amount
  if (xp >= xpToNext):
    xp -= xpToNext              // 溢出经验保留
    level++
    xpToNext = floor(xpBase * xpScaling^(level-1))  // 每个角色曲线不同
    return true                 // 通知 GameScene 触发升级
  return false

recalcXPToNext():   // 存档恢复时重新计算
  xpToNext = floor(xpBase * xpScaling^(level-1))
```

---

## Enemy

**文件**: `src/entities/Enemy.ts`  
**纹理**: 来自 `EnemyConfig.texture`，当前有 `enemy_basic`、`enemy_fast`、`enemy_tank`、`enemy_shooter`、`enemy_splitter`、`enemy_ghost`、`enemy_charger`、`enemy_swarm`  
**碰撞体**: 圆形，半径来自 `EnemyConfig.size`，默认以 basic 的 `16px` 为参考

### 属性

| 属性 | 基础值 | 来源 | 描述 |
|------|--------|------|------|
| `enemyId` | `basic` | `EnemyConfig.id` | 敌人类型 ID |
| `hp` / `maxHp` | 30 | `EnemyConfig.hp × hpMul` | 基础血量来自 CSV，运行时再吃波次血量倍率 |
| `speed` | 80 | `EnemyConfig.speed × speedMul` | 基础速度来自 CSV，运行时再吃波次速度倍率 |
| `damage` | 10 | `EnemyConfig.damage` | 接触伤害 |
| `xpReward` | 10 | `EnemyConfig.xpReward` | 死亡后掉落的经验值 |

### 敌人类型

| 类型 | 名称 | 速度 | HP | 伤害 | XP | 纹理 | 视觉特征 | 定位 |
|------|------|------|----|------|----|------|----------|------|
| `basic` | Slime | 80 | 30 | 10 | 10 | `enemy_basic` | 基础怪纹理 | Standard chaser |
| `fast` | Bat | 140 | 15 | 8 | 12 | `enemy_fast` | 轻型快速纹理 | Fast but fragile |
| `tank` | Golem | 50 | 80 | 20 | 25 | `enemy_tank` | 重型厚实纹理 | Slow and tough |
| `shooter` | Skeleton Archer | 70 | 25 | 14 | 15 | `enemy_shooter` | 菱形 / 钻石轮廓 | High damage |
| `splitter` | Fission Bug | 90 | 45 | 8 | 18 | `enemy_splitter` | 六边形轮廓 | XP bonus concept |
| `ghost` | Wraith | 110 | 20 | 22 | 25 | `enemy_ghost` | 带尾巴的幽灵造型 | Glass cannon |
| `charger` | Charger Beast | 200 | 35 | 28 | 22 | `enemy_charger` | 前冲楔形 / 箭头形 | Extremely fast |
| `swarm` | Swarmling | 130 | 10 | 5 | 5 | `enemy_swarm` | 微型星形 | Tiny, comes in huge numbers |

> **关键变化**: 8 种敌人的区别只在数值、体型、纹理和掉落，不在 AI。即使名字叫 shooter、charger、ghost，它们当前也都使用同一套追踪玩家逻辑，没有额外射击、分裂、冲刺或穿墙行为。

### AI 行为

```typescript
update():
  if (!active || !player.active) return;
  this.scene.physics.moveToObject(this, player, this.speed);
```

> **关键知识**: `Physics.moveToObject(obj, target, speed)` 计算两者之间的角度，然后设置 `obj` 的速度向量使其以恒定速度朝向 `target`。每帧调用确保持续追踪。

> **补充**: 程序化纹理里，新增敌人的视觉区分非常直接，`enemy_shooter` 是菱形，`enemy_splitter` 是六边形，`enemy_ghost` 带幽灵尾巴，`enemy_charger` 是楔形，`enemy_swarm` 是星形。它们看起来不同，但行为代码完全相同。

### 受击与死亡

```typescript
takeDamage(amount):
  hp -= amount
  setTint(0xffffff)                  // 白色闪烁
  60ms 后 clearTint()

die():
  playEnemyDeath() 音效
  白色圆形扩散消散效果 (scale 1→2.5, alpha 1→0, 200ms)
  this.destroy()
```

---

## BossEnemy

**文件**: `src/entities/BossEnemy.ts`  
**继承**: `Enemy`  
**纹理**: 来自 `BossConfig.texture`，当前有 `boss_brute`、`boss_necromancer`、`boss_dragon`、`boss_overlord`  
**碰撞体**: 圆形，半径来自 `BossConfig.size`

### 属性配置

| Boss ID | 名称 | 速度 | HP | 伤害 | XP | Size | 纹理 | 所属阶段 |
|---------|------|------|----|------|----|------|------|----------|
| `brute` | Brute | 48 | 600 | 30 | 200 | 48 | `boss_brute` | Stage 1-2 Boss |
| `necromancer` | Necromancer | 40 | 900 | 25 | 350 | 44 | `boss_necromancer` | Stage 3 Boss |
| `dragon` | Young Dragon | 55 | 1400 | 45 | 500 | 56 | `boss_dragon` | Stage 4 Boss |
| `overlord` | Overlord | 35 | 2200 | 55 | 800 | 64 | `boss_overlord` | Stage 5 Boss |

> **关键变化**: Boss 的核心数值现在由 `boss.csv` 的 `BossConfig` 直接定义，文档不再使用旧版的通用倍率推导公式。

### 阶段对应关系

每个阶段的 `WaveConfig.bossId` 会指定该阶段刷新的 Boss：

| 阶段 | `bossId` | 说明 |
|------|----------|------|
| Stage 1 | `brute` | 1-5 波使用 |
| Stage 2 | `brute` | 6-10 波继续使用 |
| Stage 3 | `necromancer` | 11-15 波使用 |
| Stage 4 | `dragon` | 16-20 波使用 |
| Stage 5 | `overlord` | 21 波以后使用 |

> **视觉特征**: `boss_necromancer` 是紫色五边形，`boss_dragon` 是红色翼状轮廓，`boss_overlord` 是 8 角星。`boss_brute` 仍是基础 Boss 贴图。

### 头顶血条

```typescript
update():
  super.update()   // 追踪 AI
  drawHPBar()      // 每帧重绘

drawHPBar():
  位置: (this.x - 30, this.y - bossSize - 12)
  尺寸: 60×6 px
  灰色底条 + 红色填充（宽度 = 60 × hp/maxHp）
```

### 死亡效果

```typescript
die():
  销毁血条 Graphics 对象
  播放 bossDeath 音效（低频隆隆声）
  摄像机震动 (400ms, intensity 0.012)
  8 个紫色粒子径向扩散 (80px, 400ms, 缩小+淡出)
  大号白色闪光圆 (scale 1→4, alpha 1→0, 350ms)
  this.destroy()
```

> **注意**: Boss 死亡时必须手动 `destroy()` 血条的两个 Graphics 对象（`hpBarBg` 和 `hpBarFill`），否则会出现残留的悬浮血条。

---

## Bullet

**文件**: `src/entities/Bullet.ts`  
**纹理**: `bullet` (12×12 黄色发光圆)  
**碰撞体**: 圆形，半径 `BULLET_SIZE` (6px)

### 属性

| 属性 | 描述 |
|------|------|
| `damage` | 命中伤害（来自 WeaponDef） |
| `pierce` | 剩余穿透次数（命中一次 -1，≤0 销毁） |

### 发射

```typescript
fire(targetX, targetY, damage, pierce, speed):
  this.damage = damage
  this.pierce = pierce
  angle = atan2(targetY - this.y, targetX - this.x)
  setVelocity(cos(angle) * speed, sin(angle) * speed)
```

### 自动回收

```typescript
update():
  if (超出世界边界 ±100px) → this.destroy()
```

> **关键知识**: 子弹需要主动检查边界并销毁自己。`setCollideWorldBounds(true)` 不适合子弹（会弹回来）。额外 100px 余量避免高速子弹在边界处闪烁。

---

## XPOrb

**文件**: `src/entities/XPOrb.ts`  
**纹理**: `xp_orb` (16×16 绿色发光圆)  
**碰撞体**: 圆形，半径 `XP_ORB_SIZE` (8px)

### 属性

| 属性 | 描述 |
|------|------|
| `xpValue` | 经验值，来自击杀目标的 `xpReward`（普通敌人约 5-25，Boss 200-800） |

### 视觉效果

```typescript
constructor():
  // 无限脉冲缩放动画
  scene.tweens.add({
    targets: this,
    scaleX: 1.3, scaleY: 1.3,
    duration: 600,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut'
  });
```

### 磁吸拾取

磁吸逻辑在 `GameScene.attractXPOrbs()` 中，非 XPOrb 自身：

```typescript
// GameScene.update() 每帧执行：
xpOrbs.forEach(orb => {
  dist = distanceBetween(player, orb)
  if (dist < player.pickupRange)          // 由当前角色决定
    physics.moveToObject(orb, player, XP_ATTRACT_SPEED)  // 300 px/s
});

// 实际拾取通过 physics.overlap(player, xpOrbs) 触发
```

> **设计意图**: 磁吸范围明显大于碰撞体重叠距离。玩家靠近时经验球开始加速飞向玩家，给予"吸引"的视觉满足感。当前范围由角色配置决定，warrior 为 120px，ranger 为 150px，mage 为 160px。
