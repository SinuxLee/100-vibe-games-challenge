# 数值平衡与调参指南

当前数值体系已经改为 **CSV 驱动**。`src/config.ts` 会解析 `src/data/` 下的 CSV，导出带类型的配置表与查询函数，游戏逻辑按配置表读取数据。

旧的扁平常量仍然保留，用来兼容老代码路径，但它们不再是调参主入口：

- 玩家与升级经验相关常量，默认取 `player.csv` 里的 `warrior` 行
- 敌人、Boss、武器默认取各自默认 ID 的基础行
- 波次常量默认取 `wave.csv` 里的 `stage_1` 行

新的难度推进应优先看 `getWaveConfigForWave(waveNum)`。系统每 5 波进入下一 stage，超过第 5 stage 后继续复用最后一档配置。

---

## 配置文件一览

| 文件 | 作用 | 关键字段 | 说明 |
|------|------|----------|------|
| `src/data/player.csv` | 玩家角色基础属性 | `id` | 目前有 `warrior`、`ranger`、`mage` |
| `src/data/enemy.csv` | 普通敌人模板 | `id` | 不同敌人拥有独立速度、血量、伤害、体型 |
| `src/data/boss.csv` | Boss 模板 | `id` | 每个 stage 绑定不同 Boss |
| `src/data/weapon.csv` | 武器基础参数 | `id` | 包含默认武器与可成长武器模板 |
| `src/data/upgrade.csv` | 升级池配置 | `id` | 支持全角色与角色专属升级 |
| `src/data/wave.csv` | Stage 难度曲线 | `id` | 每行定义一个 5 波区间 |
| `src/data/xp.csv` | 经验球配置 | `id` | 当前为全局默认配置 |

### 显示与世界

| 常量 | 值 | 说明 |
|------|-----|------|
| `GAME_WIDTH` | 750 | 渲染宽度（移动竖屏） |
| `GAME_HEIGHT` | 1334 | 渲染高度 |
| `WORLD_WIDTH` | 4000 | 物理世界宽度 |
| `WORLD_HEIGHT` | 4000 | 物理世界高度 |

> 世界大小仍然是固定常量，不在 CSV 中。增大世界会拉长拉扯距离，通常要同步检查敌人速度、刷怪密度与拾取范围。

### 玩家

| Character | Speed | MaxHP | PickupRange | Invincible | StartWeapon | XP Base | XP Scaling |
|------|------:|------:|------------:|-----------|-------------|--------:|-----------:|
| warrior | 200 | 120 | 120 | 500ms | basic_gun | 30 | 1.35 |
| ranger | 250 | 70 | 150 | 400ms | crossbow | 25 | 1.30 |
| mage | 170 | 85 | 160 | 600ms | magic_bolt | 35 | 1.40 |

角色定位很明确：`warrior` 更稳，`ranger` 更快，`mage` 更偏爆发与拾取效率。旧常量 `PLAYER_SPEED`、`PLAYER_MAX_HP`、`XP_BASE_TO_LEVEL`、`XP_LEVEL_SCALING` 等，默认都映射到 `warrior`。

### 敌人

| Enemy | Speed | HP | Damage | XP | Size | Trait |
|------|------:|---:|-------:|---:|-----:|-------|
| basic (Slime) | 80 | 30 | 10 | 10 | 16 | Standard |
| fast (Bat) | 140 | 15 | 8 | 12 | 12 | Fast/fragile |
| tank (Golem) | 50 | 80 | 20 | 25 | 24 | Slow/tough |
| shooter (Skeleton Archer) | 70 | 25 | 14 | 15 | 18 | High damage |
| splitter (Fission Bug) | 90 | 45 | 8 | 18 | 20 | XP rich |
| ghost (Wraith) | 110 | 20 | 22 | 25 | 16 | Glass cannon |
| charger (Charger Beast) | 200 | 35 | 28 | 22 | 22 | Extremely fast |
| swarm (Swarmling) | 130 | 10 | 5 | 5 | 10 | Tiny/numerous |

敌人不再围绕单一基础敌人做乘法，而是直接从 CSV 读取独立模板。Stage 变化时，系统既会切换敌人池，也会叠加该 stage 的 HP / 速度成长。

### Boss

| Boss | Speed | HP | Damage | XP | Size | Stage |
|------|------:|---:|-------:|---:|-----:|-------|
| brute | 48 | 600 | 30 | 200 | 48 | 1-2 |
| necromancer | 40 | 900 | 25 | 350 | 44 | 3 |
| dragon | 55 | 1400 | 45 | 500 | 56 | 4 |
| overlord | 35 | 2200 | 55 | 800 | 64 | 5 |

Boss 现在不是统一倍率怪，而是每个 stage 指向独立 Boss 模板。`boss.csv` 仍保留 `waveInterval=5`，但真正的 Boss 类型由 `wave.csv` 每个 stage 的 `bossId` 决定。

### 武器

| Weapon | Damage | FireRate | BulletSpeed | Count | Pierce | Size | Default For |
|------|-------:|---------:|------------:|------:|-------:|-----:|-------------|
| basic_gun | 15 | 600 | 450 | 1 | 1 | 6 | Warrior |
| shotgun | 10 | 1000 | 350 | 5 | 1 | 5 | 无 |
| sniper | 50 | 1500 | 800 | 1 | 3 | 4 | 无 |
| magic_bolt | 20 | 500 | 380 | 2 | 2 | 7 | Mage |
| crossbow | 12 | 350 | 500 | 1 | 1 | 5 | Ranger |
| flame_cannon | 35 | 1200 | 300 | 3 | 2 | 8 | 无 |

默认开局武器已经跟角色绑定。兼容层里的 `WEAPON_BASE_DAMAGE`、`WEAPON_BASE_FIRE_RATE`、`WEAPON_BULLET_SPEED`、`BULLET_SIZE` 默认取 `basic_gun`。

### 升级

| Upgrade | 效果 | maxLevel | type | stat | factor | forCharacter |
|------|------|---------:|------|------|-------:|--------------|
| pierce | +1 穿透次数 | 3 | weapon | pierce | 1 | all |
| bullet_speed | +20% 子弹速度 | 3 | weapon | bulletSpeed | 1.2 | all |
| bullet_count | +1 子弹数量 | 4 | weapon | bulletCount | 1 | all |
| damage_up | +25% 子弹伤害 | 5 | weapon | damage | 1.25 | all |
| fire_rate_up | 射击间隔 ×0.85 | 5 | weapon | fireRate | 0.85 | all |
| speed_up | +12% 移动速度 | 5 | player | speed | 1.12 | all |
| max_hp | +25 最大生命并回复 | 5 | player | maxHp | 25 | all |
| shield | +30 maxHp | 3 | player | maxHp | 30 | warrior |
| crit_chance | ×1.3 damage | 5 | weapon | damage | 1.3 | ranger |
| multi_cast | +1 bulletCount | 3 | weapon | bulletCount | 1 | mage |
| magnet | +20 pickupRange | 5 | player | pickupRange | 20 | all |
| armor | +200ms invincibleMs | 3 | player | invincibleMs | 200 | all |

升级池已经从通用 7 项扩展到 12 项。`forCharacter` 是新筛选维度，允许保留共享成长线，同时给不同角色补上专属强项。

### 经验球与全局固定项

| 常量 | 值 | 说明 |
|------|-----|------|
| `XP_ORB_SIZE` | 8 | 经验球碰撞体半径，来自 `xp.csv` |
| `XP_ATTRACT_SPEED` | 300 | 经验球被吸引时的飞行速度 |
| `UPGRADE_CHOICES` | 3 | 每次升级展示 3 个选项 |

---

## Stage Difficulty Curve

| Stage | 波次 | 时长 | 生成间隔 | 基础生成数 | HP 成长 | 速度成长 | 敌人构成 | Boss |
|------|------|------|----------|-----------:|--------:|----------:|----------|------|
| Stage 1 | 1-5 | 30s | 2000ms → 600ms | 2 | 0.10 | 0.02 | basic:5;fast:1 | brute |
| Stage 2 | 6-10 | 30s | 1800ms → 500ms | 3 | 0.12 | 0.03 | basic:3;fast:2;tank:2;shooter:1 | brute |
| Stage 3 | 11-15 | 28s | 1600ms → 450ms | 4 | 0.15 | 0.03 | fast:2;tank:2;shooter:2;splitter:2;ghost:1 | necromancer |
| Stage 4 | 16-20 | 25s | 1400ms → 400ms | 5 | 0.18 | 0.04 | shooter:2;splitter:2;ghost:2;charger:2;swarm:3 | dragon |
| Stage 5 | 21+ | 22s | 1200ms → 350ms | 6 | 0.22 | 0.05 | ghost:2;charger:3;swarm:4;tank:1;splitter:2 | overlord |

### Stage 说明

- **Stage 1**：教学期。以 `basic` 为主，少量 `fast` 用来测试走位和瞄准节奏。Boss 为 `brute`，血厚但不快。
- **Stage 2**：开始加入 `tank` 与 `shooter`。怪群更厚，失误惩罚也更明显，仍由 `brute` 承接前两档难度。
- **Stage 3**：敌人种类明显增多，`splitter` 与 `ghost` 让经验收益和高伤威胁同时抬升。Boss 切到 `necromancer`，血量进一步拉高。
- **Stage 4**：波次更短，生成更密，`charger` 与 `swarm` 让地图压力从局部威胁变成持续围堵。Boss 为 `dragon`。
- **Stage 5**：进入终局模板。刷怪频率、基础生成数、成长系数都达到最高，并由 `overlord` 收尾。21 波之后继续沿用这套配置。

---

## 难度曲线分析

### 升级经验需求

```
公式: xpToNext = floor(xpBase × xpScaling^(level-1))

Warrior: floor(30 × 1.35^(level-1))
Lv1→2:   30 XP
Lv5→6:   99 XP
Lv10→11: 446 XP
Lv15→16: 2003 XP

Ranger: floor(25 × 1.30^(level-1))
Lv1→2:   25 XP
Lv5→6:   71 XP
Lv10→11: 265 XP
Lv15→16: 984 XP

Mage: floor(35 × 1.40^(level-1))
Lv1→2:   35 XP
Lv5→6:   134 XP
Lv10→11: 723 XP
Lv15→16: 3889 XP
```

现在升级节奏已经和角色绑定。`ranger` 最容易滚起前期等级，`warrior` 居中，`mage` 前中期升级最慢，但默认火力也最高。

### 开局火力对比

```
Warrior / basic_gun:
15 伤害 / 0.6s = 25 理论 DPS
对 Slime 需 2 发，约 1.2s

Ranger / crossbow:
12 伤害 / 0.35s ≈ 34.3 理论 DPS
对 Slime 需 3 发，约 1.05s

Mage / magic_bolt:
(20 × 2) / 0.5s = 80 理论单体 DPS
若 2 发同中，对 Slime 1 轮齐射即可击杀
```

这让三个角色的起手体验明显分化：`warrior` 靠容错，`ranger` 靠手感与机动，`mage` 靠爆发，但升级压力更大。

### Stage 压力变化

```
Stage 1: 30s / 2000ms→600ms / 2只起刷
重点压力: 基础追逐，熟悉移动和拾取

Stage 2: 30s / 1800ms→500ms / 3只起刷
重点压力: 坦怪拖时间，射手补高伤

Stage 3: 28s / 1600ms→450ms / 4只起刷
重点压力: 敌人职责分化，资源与威胁同时上升

Stage 4: 25s / 1400ms→400ms / 5只起刷
重点压力: 快速近身 + 大量小怪，走位空间缩小

Stage 5: 22s / 1200ms→350ms / 6只起刷
重点压力: 高频刷新与高成长叠加，进入持久生存考验
```

旧版曲线主要靠统一倍率拉升。现在的曲线由「敌人池切换 + stage 成长参数 + Boss 轮换」三层共同决定，后期辨识度和压迫感都更强。

### 关键平衡点

| 指标 | 描述 | 当前值 |
|------|------|--------|
| 开局最稳角色 | 高血量 + 中速 + 基础枪 | warrior: 120 HP / 200 速度 |
| 开局最快升级 | 经验门槛最低 | ranger: Lv1→2 仅需 25 XP |
| 开局最高爆发 | 双弹同中可秒基础怪 | mage: 2×20 = 40 vs Slime 30 HP |
| 最高普通敌人速度 | 追击压力上限 | charger: 200 |
| 最高普通敌人伤害 | 碰撞惩罚上限 | charger: 28 |
| 终局 Boss 压力 | 体量、伤害、经验都最高 | overlord: 2200 HP / 55 伤害 / 800 XP |
| 终局刷怪强度 | 最短波次 + 最高成长 | Stage 5: 22s / 0.22 HP / 0.05 速度 |

---

## 调参指南

现在调参应该直接改 `src/data/*.csv`，不要再把 `config.ts` 当作主配置源。`config.ts` 负责解析、导出和兼容，不负责维护真实数值。

### 想让游戏更简单

- 调高 `src/data/player.csv` 里的 `maxHp`、`pickupRange`、`invincibleMs`
- 给对应角色提高 `speed`，或换更强的 `startWeapon`
- 调低 `src/data/wave.csv` 里的 `hpScaling`、`speedScaling`
- 拉大 `spawnIntervalBase` / `spawnIntervalMin`
- 在 `src/data/upgrade.csv` 里提高防御向升级收益，例如 `shield`、`armor`、`magnet`

### 想让游戏更难

- 调低角色 `maxHp` 或 `invincibleMs`
- 在 `src/data/wave.csv` 里提高 `spawnCountBase`、`hpScaling`、`speedScaling`
- 缩短 stage `duration`
- 在 `src/data/enemy.csv` 里提高高威胁敌人的 `damage` 或 `speed`
- 提高 `player.csv` 中对应角色的 `xpScaling`，放慢成长节奏

### 想让 Boss 更有威胁

- 在 `src/data/boss.csv` 中单独调整 Boss 的 `hp`、`damage`、`speed`、`size`
- 在 `src/data/wave.csv` 中把更强 Boss 提前绑定到更早 stage
- 缩短对应 stage 的 `duration`，让玩家更快进入 Boss 波
- 提高 Boss 前一档 stage 的刷怪压力，让见 Boss 前的资源更紧张

### 想让升级更有感觉

- 在 `src/data/upgrade.csv` 直接改 `factor`
- 调整 `maxLevel`，控制成长天花板
- 用 `forCharacter` 做角色专属升级，强化差异化 build
- 新增升级时，补齐 `id`、`type`、`stat`、`factor`、`forCharacter`

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
