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

> Data flow diagram, scene lifecycle, and design decisions → see `rules-project.md`

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
