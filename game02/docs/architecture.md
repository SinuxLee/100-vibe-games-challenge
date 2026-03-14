# 系统架构总览

## 技术栈

| 层 | 技术 | 作用 |
|---|---|---|
| 引擎 | Phaser 3 (Arcade Physics) | 渲染、物理碰撞、输入、补间动画 |
| 语言 | TypeScript (strict mode) | 类型安全 |
| 构建 | Vite | 开发热更新 + 生产构建 |
| 包管理 | Bun | 快速安装依赖 |
| 音频 | Web Audio API | 程序化音效合成 |
| 存储 | localStorage | 本地存档 |

## 目录结构

```
src/
├── main.ts              # 游戏入口：Phaser.Game 配置与启动
├── config.ts            # 所有数值常量（平衡调参唯一入口）
├── scenes/              # Phaser 场景（生命周期管理）
│   ├── BootScene.ts     # 启动 → PreloadScene
│   ├── PreloadScene.ts  # 程序化纹理生成
│   ├── MenuScene.ts     # 主菜单
│   ├── GameScene.ts     # 核心游戏循环（物理、碰撞、摇杆）
│   ├── HUDScene.ts      # 叠加层 UI（血条、经验、暂停）
│   ├── LevelUpScene.ts  # 升级选择弹窗
│   └── GameOverScene.ts # 结算画面
├── entities/            # 游戏实体（继承 Phaser.Physics.Arcade.Sprite）
│   ├── Player.ts        # 玩家
│   ├── Enemy.ts         # 基础敌人
│   ├── BossEnemy.ts     # Boss 敌人
│   ├── Bullet.ts        # 子弹
│   └── XPOrb.ts         # 经验球
├── systems/             # 游戏系统（纯逻辑，不继承 Phaser 类）
│   ├── WeaponSystem.ts  # 自动射击
│   ├── WaveSystem.ts    # 波次与难度
│   ├── UpgradeSystem.ts # 升级池
│   ├── SaveSystem.ts    # 存档
│   └── SoundManager.ts  # 程序化音效
└── utils/
    └── helpers.ts       # 数学工具
```

## 数据流架构

```
┌─────────────────────────────────────────────────────────┐
│                       main.ts                           │
│  Phaser.Game config → 注册所有 Scene → 启动 BootScene    │
└───────────────────────────┬─────────────────────────────┘
                            │
                            ▼
┌─────────────┐  ┌────────────────┐  ┌──────────────┐
│  BootScene  │→ │  PreloadScene  │→ │  MenuScene   │
│ "Loading..."│  │ 生成纹理资产    │  │ 新游戏/继续   │
└─────────────┘  └────────────────┘  └──────┬───────┘
                                            │
                                            ▼
┌───────────────────────────────────────────────────────────────┐
│                       GameScene                               │
│  ┌─────────┐  ┌──────────────┐  ┌───────────────┐            │
│  │ Player  │  │ WeaponSystem │  │  WaveSystem   │            │
│  │ WASD +  │  │ 自动射击      │  │ 波次 + 难度    │            │
│  │ 摇杆    │  │ → Bullet     │  │ → Enemy/Boss  │            │
│  └────┬────┘  └──────┬───────┘  └───────┬───────┘            │
│       │              │                  │                     │
│       │    Physics.overlap              │                     │
│       │  ┌───────────┴──────────────────┘                     │
│       │  │  Bullet ↔ Enemy → die() → XPOrb                   │
│       │  │  Player ↔ Enemy → takeDamage()                     │
│       │  │  Player ↔ XPOrb → addXP() → level up?             │
│       │  └──────────────────────────────┐                     │
│       │                                 │                     │
│       │  registry.set('hp', ...)  ←─────┘                     │
│       │          │                                            │
└───────│──────────│────────────────────────────────────────────┘
        │          │
        │          ▼
        │  ┌──────────────┐       ┌─────────────────┐
        │  │   HUDScene   │       │  LevelUpScene   │
        │  │ registry →   │       │ 暂停 + 三选一    │
        │  │ 响应式 UI     │       │ → UpgradeSystem │
        │  └──────────────┘       └────────┬────────┘
        │                                  │
        └──────── hp <= 0 ─────────────────│──────┐
                                           │      │
                                           ▼      ▼
                                    ┌──────────────────┐
                                    │  GameOverScene    │
                                    │ 统计 + 最高分     │
                                    └──────────────────┘
```

## 场景生命周期

```
BootScene → PreloadScene → MenuScene → GameScene ──→ GameOverScene
                                          │   ↑            │
                                          │   └────────────┘
                                          │       restart
                                          ├── HUDScene (并行叠加)
                                          └── LevelUpScene (暂停弹窗)
```

- **并行场景**: HUDScene 在 GameScene 之上同时运行，通过 `registry` 事件通信
- **弹窗场景**: LevelUpScene 在升级时 launch，暂停 GameScene 物理，选择后 stop 自身

## 关键设计决策

| 决策 | 方案 | 原因 |
|------|------|------|
| 渲染分辨率 | 750×1334 | 移动端竖屏比例（iPhone 6/7/8 标准） |
| 物理引擎 | Arcade | 轻量、足够满足 AABB 碰撞需求 |
| 资产策略 | 全部程序化生成 | 零外部文件依赖，无需加载 |
| 音效方案 | Web Audio API 合成 | 零音频文件，体积极小 |
| 输入方式 | WASD + 虚拟摇杆 | 同时适配桌面和移动端 |
| UI 通信 | Phaser Registry | 跨场景响应式数据绑定 |
| 存档格式 | JSON in localStorage | 简单直接，无需后端 |
| 数值管理 | 单文件 config.ts | 调参不需要找多个文件 |

## 入口配置 (main.ts)

```typescript
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,           // 优先 WebGL，回退 Canvas
  width: 750,                  // 移动竖屏宽度
  height: 1334,                // 移动竖屏高度
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: 0 } }  // 俯视角，无重力
  },
  scale: {
    mode: Phaser.Scale.FIT,              // 等比缩放适配屏幕
    autoCenter: Phaser.Scale.CENTER_BOTH  // 居中显示
  },
  input: { activePointers: 2 }  // 支持多点触控（摇杆 + 其他交互）
};
```
