# 实体类文档

所有游戏实体继承自 `Phaser.Physics.Arcade.Sprite`，拥有物理碰撞体和纹理渲染能力。

---

## Player

**文件**: `src/entities/Player.ts`  
**纹理**: `player` (40×40 蓝色圆)  
**碰撞体**: 圆形，半径 `PLAYER_SIZE` (20px)

### 属性

| 属性 | 初始值 | 来源 | 描述 |
|------|--------|------|------|
| `hp` | 100 | `PLAYER_MAX_HP` | 当前血量 |
| `maxHp` | 100 | `PLAYER_MAX_HP` | 最大血量 |
| `speed` | 200 | `PLAYER_SPEED` | 移动速度 (px/s) |
| `level` | 1 | - | 当前等级 |
| `xp` | 0 | - | 当前经验值 |
| `xpToNext` | 30 | `XP_BASE_TO_LEVEL` | 升级所需经验 |
| `invincibleUntil` | 0 | private | 无敌帧结束时间戳 |

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
  invincibleUntil = now + 500ms            // PLAYER_INVINCIBLE_MS
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
    xpToNext = floor(30 * 1.35^(level-1))  // 指数增长
    return true                 // 通知 GameScene 触发升级
  return false

recalcXPToNext():   // 存档恢复时重新计算
  xpToNext = floor(XP_BASE_TO_LEVEL * XP_LEVEL_SCALING^(level-1))
```

---

## Enemy

**文件**: `src/entities/Enemy.ts`  
**纹理**: `enemy` (32×32 红色圆)  
**碰撞体**: 圆形，半径 `ENEMY_SIZE` (16px)

### 属性

| 属性 | 基础值 | 缩放 | 描述 |
|------|--------|------|------|
| `hp` / `maxHp` | 30 | `× hpMul` | 血量（波次递增） |
| `speed` | 80 | `× speedMul` | 追踪速度 (px/s) |
| `damage` | 10 | 固定 | 接触伤害 |
| `xpReward` | 10 | 固定 | 掉落经验值 |

### AI 行为

```typescript
update():
  if (!active || !player.active) return;
  this.scene.physics.moveToObject(this, player, this.speed);
```

> **关键知识**: `Physics.moveToObject(obj, target, speed)` 计算两者之间的角度，然后设置 `obj` 的速度向量使其以恒定速度朝向 `target`。每帧调用确保持续追踪。

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
**纹理**: `boss` (96×96 紫色圆)  
**碰撞体**: 圆形，半径 `BOSS_SIZE` (48px)

### 属性缩放

| 属性 | 计算公式 | 示例 (Wave 5) |
|------|----------|---------------|
| HP | `30 × 20 × (1 + wave × 0.15)` | 30×20×1.75 = 1050 |
| 伤害 | `10 × 3` | 30 |
| 速度 | `80 × 0.6` | 48 px/s |
| 经验 | `10 × 20` | 200 |
| 体积 | `BOSS_SIZE × 2` display | 96px 直径 |

### 头顶血条

```typescript
update():
  super.update()   // 追踪 AI
  drawHPBar()      // 每帧重绘

drawHPBar():
  位置: (this.x - 30, this.y - BOSS_SIZE - 12)
  尺寸: 60×6 px
  灰色底条 + 红色填充（宽度 = 60 × hp/maxHp）
```

### 死亡效果

```typescript
die():
  销毁血条 Graphics 对象
  播放 bossSpawn 音效（低频隆隆声）
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
| `xpValue` | 经验值（敌人 10，Boss 200） |

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
  if (dist < PLAYER_PICKUP_RANGE)         // 120px
    physics.moveToObject(orb, player, XP_ATTRACT_SPEED)  // 300 px/s
});

// 实际拾取通过 physics.overlap(player, xpOrbs) 触发
```

> **设计意图**: 磁吸范围 (120px) 远大于碰撞体重叠距离。玩家靠近时经验球开始加速飞向玩家，给予"吸引"的视觉满足感。
