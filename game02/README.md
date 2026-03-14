# Survivor

一款基于 Phaser 3 的移动端幸存者类游戏（Vampire Survivors-like），使用 TypeScript + Vite 构建。

## 快速开始

```bash
# 安装依赖
bun install

# 启动开发服务器
bun run dev

# 构建生产版本
bun run build

# 预览生产构建
bun run preview
```

打开 `http://localhost:3000` 即可游玩。

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Phaser | 3.80+ | 游戏引擎（Arcade Physics） |
| TypeScript | 5.4+ | 类型安全 |
| Vite | 5.4+ | 构建与热更新 |
| Bun | - | 包管理器 |
| Web Audio API | - | 程序化音效生成 |

## 游戏玩法

- **移动**：桌面端 WASD 键盘控制，移动端左半屏虚拟摇杆
- **攻击**：自动瞄准并射击最近的敌人
- **升级**：击杀敌人掉落经验球，收集升级后从三个强化中选择一个
- **波次**：每 30 秒进入下一波，敌人数量和强度递增
- **Boss**：每 5 波出现一个 Boss 敌人
- **存档**：每波结束自动存档到 localStorage，下次打开可继续

## 功能清单

- [x] Phaser + TS + Vite 项目模板（移动端适配 750×1334）
- [x] Boot / Preload / Menu / Game / GameOver 场景
- [x] 玩家 WASD + 虚拟摇杆移动
- [x] 敌人随机从边缘生成并追踪玩家
- [x] 玩家自动攻击最近敌人
- [x] 子弹碰撞与敌人死亡
- [x] 玩家血量和 HUD（血条、经验条、等级、波次、击杀数、计时器）
- [x] 击杀计数和计时器
- [x] 经验球掉落和磁吸拾取
- [x] 升级三选一（暂停选择界面）
- [x] 武器升级和属性成长（7 种升级路线）
- [x] 波次系统（难度递增）
- [x] Boss 敌人（头顶血条、死亡特效）
- [x] 本地存档（localStorage）
- [x] 程序化音效和视觉反馈（屏幕震动、命中闪光、死亡粒子）

## 升级系统

| 升级 | 效果 | 最大等级 |
|------|------|----------|
| Power Shot | 子弹伤害 +20% | 5 |
| Rapid Fire | 射击间隔 -15% | 5 |
| Multi Shot | 子弹数量 +1 | 4 |
| Piercing Rounds | 穿透次数 +1 | 3 |
| Swift Feet | 移动速度 +10% | 5 |
| Vitality | 最大血量 +20 | 5 |
| Velocity Rounds | 子弹飞行速度 +20% | 3 |

## 项目结构

```
src/
├── main.ts                    # 游戏入口，Phaser 配置
├── config.ts                  # 游戏平衡数值常量
├── scenes/
│   ├── BootScene.ts           # 启动加载
│   ├── PreloadScene.ts        # 程序化生成所有纹理资产
│   ├── MenuScene.ts           # 主菜单（新游戏 / 继续）
│   ├── GameScene.ts           # 核心游戏逻辑
│   ├── HUDScene.ts            # 叠加层 UI（血条、经验、暂停、静音）
│   ├── LevelUpScene.ts        # 升级选择界面（三选一）
│   └── GameOverScene.ts       # 结算（统计、最高分、重开）
├── entities/
│   ├── Player.ts              # 玩家移动、受伤、经验
│   ├── Enemy.ts               # 基础敌人 AI（追踪）
│   ├── BossEnemy.ts           # Boss（高血量、头顶血条、死亡粒子）
│   ├── Bullet.ts              # 子弹飞行与穿透
│   └── XPOrb.ts               # 经验球（脉冲动画、磁吸）
├── systems/
│   ├── WeaponSystem.ts        # 自动射击与武器属性
│   ├── WaveSystem.ts          # 波次推进与难度缩放
│   ├── UpgradeSystem.ts       # 升级池与属性应用
│   ├── SaveSystem.ts          # localStorage 存读档
│   └── SoundManager.ts        # Web Audio 程序化音效
└── utils/
    └── helpers.ts             # 数学工具函数
```

## 设计说明

- **零外部资产**：所有图形通过 `Graphics.generateTexture()` 程序化生成，所有音效通过 Web Audio API 合成
- **移动优先**：750×1334 竖屏分辨率，`Scale.FIT` 自适应缩放，虚拟摇杆操控
- **数据驱动**：所有平衡数值集中在 `config.ts`，方便调参
- **场景分离**：HUD 和 LevelUp 作为独立场景叠加运行，与游戏逻辑解耦
