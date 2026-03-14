# 数值平衡与调参指南

所有游戏数值集中在 `src/config.ts` 中，修改后无需改动任何逻辑代码。

---

## 配置文件一览

### 显示与世界

| 常量 | 值 | 说明 |
|------|-----|------|
| `GAME_WIDTH` | 750 | 渲染宽度（移动竖屏） |
| `GAME_HEIGHT` | 1334 | 渲染高度 |
| `WORLD_WIDTH` | 4000 | 物理世界宽度 |
| `WORLD_HEIGHT` | 4000 | 物理世界高度 |

> 世界大小决定了可探索范围。增大世界会让敌人追踪距离更长，需要同步调整敌人速度。

### 玩家

| 常量 | 值 | 调参建议 |
|------|-----|---------|
| `PLAYER_SPEED` | 200 | 移动速度。建议范围 150~300。过快会让游戏太简单 |
| `PLAYER_MAX_HP` | 100 | 初始最大血量。与敌人伤害对比：100/10 = 可承受 10 次碰撞 |
| `PLAYER_PICKUP_RANGE` | 120 | 经验球磁吸范围 (px)。增大 = 更容易收集 |
| `PLAYER_INVINCIBLE_MS` | 500 | 受伤后无敌时间 (ms)。过长会让游戏太简单 |
| `PLAYER_SIZE` | 20 | 碰撞体半径 (px)。影响被命中的判定 |

### 敌人

| 常量 | 值 | 调参建议 |
|------|-----|---------|
| `ENEMY_BASE_SPEED` | 80 | 基础追踪速度。必须 < PLAYER_SPEED，否则无法逃脱 |
| `ENEMY_BASE_HP` | 30 | 基础血量。与武器伤害对比：30/15 = 2 发击杀 |
| `ENEMY_BASE_DAMAGE` | 10 | 碰撞伤害 |
| `ENEMY_BASE_XP` | 10 | 击杀经验。与 XP_BASE_TO_LEVEL 对比：30/10 = 3 只升 1 级 |
| `ENEMY_SIZE` | 16 | 碰撞体半径 |

### Boss

| 常量 | 值 | 调参建议 |
|------|-----|---------|
| `BOSS_HP_MULTIPLIER` | 20 | Boss HP = 敌人基础 HP × 20 = 600 |
| `BOSS_DAMAGE_MULTIPLIER` | 3 | Boss 伤害 = 10 × 3 = 30 |
| `BOSS_SPEED_MULTIPLIER` | 0.6 | Boss 速度 = 80 × 0.6 = 48 (比普通敌人慢) |
| `BOSS_SIZE` | 48 | Boss 碰撞体半径 (是普通敌人的 3 倍) |
| `BOSS_XP_MULTIPLIER` | 20 | Boss 经验 = 10 × 20 = 200 |
| `BOSS_WAVE_INTERVAL` | 5 | 每 5 波出一个 Boss |

### 武器

| 常量 | 值 | 调参建议 |
|------|-----|---------|
| `WEAPON_BASE_DAMAGE` | 15 | 子弹伤害。与敌人 HP 对比决定击杀速度 |
| `WEAPON_BASE_FIRE_RATE` | 600 | 射击间隔 (ms)。越小越快 |
| `WEAPON_BULLET_SPEED` | 450 | 子弹飞行速度 (px/s)。必须远大于敌人速度 |
| `BULLET_SIZE` | 6 | 子弹碰撞体半径 |

### 经验与升级

| 常量 | 值 | 调参建议 |
|------|-----|---------|
| `XP_ORB_SIZE` | 8 | 经验球碰撞体半径 |
| `XP_BASE_TO_LEVEL` | 30 | Lv1→Lv2 所需经验 |
| `XP_LEVEL_SCALING` | 1.35 | 每级经验需求乘数 (指数增长) |
| `XP_ATTRACT_SPEED` | 300 | 经验球被吸引时的飞行速度 |

### 波次

| 常量 | 值 | 调参建议 |
|------|-----|---------|
| `WAVE_DURATION` | 30000 | 每波持续时间 (ms) |
| `SPAWN_INTERVAL_BASE` | 1500 | 初始生成间隔 (ms) |
| `SPAWN_INTERVAL_MIN` | 300 | 最小生成间隔 (ms)，下限 |
| `SPAWN_COUNT_BASE` | 1 | 基础每次生成数量 |
| `ENEMY_HP_SCALING` | 0.15 | 每波敌人 HP 增长 15% |
| `ENEMY_SPEED_SCALING` | 0.05 | 每波敌人速度增长 5% |
| `SPAWN_INTERVAL_REDUCTION` | 50 | 每波生成间隔减少 50ms |

### 其他

| 常量 | 值 | 说明 |
|------|-----|------|
| `UPGRADE_CHOICES` | 3 | 升级时显示几个选项 |

---

## 难度曲线分析

### 升级经验需求

```
公式: xpToNext = floor(30 × 1.35^(level-1))

Lv1→2:  30 XP  (3 只敌人)
Lv2→3:  40 XP  (4 只)
Lv3→4:  55 XP  (6 只)
Lv5→6:  100 XP (10 只)
Lv10→11: 352 XP (35 只)
Lv15→16: 1239 XP (124 只)
Lv20→21: 4361 XP (436 只)
```

### 敌人强度随波次

```
波次 1:  HP 30, 速度 80, 间隔 1500ms, 1只/次
波次 5:  HP 48, 速度 96, 间隔 1300ms, 3只/次
波次 10: HP 71, 速度 116, 间隔 1050ms, 6只/次
波次 15: HP 93, 速度 136, 间隔 800ms, 8只/次
波次 20: HP 116, 速度 156, 间隔 550ms, 11只/次
波次 25: HP 138, 速度 176, 间隔 300ms, 13只/次
```

### 玩家 DPS 与升级

```
基础 DPS: 15 伤害 / 0.6s = 25 DPS

Power Shot Lv5: 46 伤害 → 77 DPS (单发)
Rapid Fire Lv5: 266ms → 56 DPS (单发)
Multi Shot Lv4: 5 发 → 125 DPS (全满级)
全满级理论: 46 × 5 / 0.266 = 865 DPS
```

### 关键平衡点

| 指标 | 描述 | 当前值 |
|------|------|--------|
| 初期击杀速度 | 2 发击杀普通敌人 | 15×2=30 vs HP 30 |
| 玩家生存次数 | 可承受 10 次碰撞 | HP 100 / 伤害 10 |
| 逃脱能力 | 玩家速度 / 敌人速度 | 200/80 = 2.5× |
| 首次升级 | 需击杀 3 只敌人 | 30 XP / 10 XP |
| Boss 击杀时间 | 约 24 秒 (基础武器) | HP 600 / DPS 25 |

---

## 调参指南

### 想让游戏更简单

- 增大 `PLAYER_SPEED` (逃脱更容易)
- 增大 `PLAYER_INVINCIBLE_MS` (容错更高)
- 减小 `XP_LEVEL_SCALING` (升级更快)
- 减小 `ENEMY_BASE_SPEED` (敌人更慢)
- 增大 `PLAYER_PICKUP_RANGE` (更容易吸收经验)

### 想让游戏更难

- 减小 `SPAWN_INTERVAL_MIN` (后期更密集)
- 增大 `ENEMY_HP_SCALING` (敌人成长更快)
- 增大 `ENEMY_BASE_DAMAGE` (碰一下更疼)
- 减小 `WAVE_DURATION` (波次推进更快)
- 增大 `XP_LEVEL_SCALING` (升级更慢)

### 想让 Boss 更有威胁

- 增大 `BOSS_HP_MULTIPLIER` (更肉)
- 增大 `BOSS_DAMAGE_MULTIPLIER` (碰一下更疼)
- 增大 `BOSS_SPEED_MULTIPLIER` 接近 1.0 (更快)
- 减小 `BOSS_WAVE_INTERVAL` (更频繁出现)

### 想让升级更有感觉

- 修改 `UpgradeSystem` 中各升级的效果系数（如把 +25% 改为 +50%）
- 增大 `maxLevel` 上限
- 添加新升级到 `upgradePool` 数组

---

## 颜色主题

```typescript
COLORS = {
  background:       0x1a1a2e,  // 深蓝灰（地面背景）
  player:           0x4fc3f7,  // 浅蓝（玩家内圈）
  playerOutline:    0x0288d1,  // 深蓝（玩家外圈）
  enemy:            0xe53935,  // 亮红（敌人）
  enemyOutline:     0xb71c1c,  // 暗红（敌人外圈）
  boss:             0x8e24aa,  // 紫色（Boss）
  bossOutline:      0x4a148c,  // 深紫
  bullet:           0xffd54f,  // 黄色（子弹）
  bulletGlow:       0xffab00,  // 橙黄（子弹光晕）
  xpOrb:            0x69f0ae,  // 绿色（经验球）
  xpOrbGlow:        0x00c853,  // 深绿（经验球光晕）
  hpBar:            0xe53935,  // 红色（血条）
  hpBarBg:          0x424242,  // 灰色（血条背景）
  xpBar:            0x42a5f5,  // 蓝色（经验条）
  xpBarBg:          0x1a237e,  // 深蓝（经验条背景）
  uiText:           0xffffff,  // 白色（UI 文字）
  uiPanel:          0x16213e,  // 深蓝面板
  uiPanelLight:     0x0f3460,  // 亮蓝面板
  upgradeCard:      0x1a237e,  // 升级卡背景
  upgradeCardHover: 0x283593,  // 升级卡 hover
  gold:             0xffd700,  // 金色（升级标题、边框）
}
```
