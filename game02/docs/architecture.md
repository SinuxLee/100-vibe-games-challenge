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
| i18n | Custom (src/i18n.ts) | 中英双语支持 |

## 目录结构

```
src/
├── main.ts              # 游戏入口：Phaser.Game 配置与启动
├── config.ts            # CSV 配置装载、按 ID / 波次查询、兼容旧常量导出
├── i18n.ts              # 国际化字典与翻译函数（zh / en，本地持久化）
├── data/                # 数据驱动配置表
│   ├── player.csv       # 角色配置（warrior / ranger / mage）
│   ├── enemy.csv        # 普通敌人配置（8 种敌人）
│   ├── boss.csv         # Boss 配置（4 个章节 Boss）
│   ├── weapon.csv       # 武器配置（6 种武器）
│   ├── upgrade.csv      # 升级配置（通用 + 角色专属）
│   ├── wave.csv         # 章节 / 波次配置（5 个 stage）
│   └── xp.csv           # 经验球表现参数
├── scenes/              # Phaser 场景（生命周期管理 + UI 分层）
│   ├── BootScene.ts     # 启动 → PreloadScene
│   ├── PreloadScene.ts  # 预生成程序化纹理与开局资源准备
│   ├── MenuScene.ts     # 主菜单 + 角色选择阶段 + 语言切换
│   ├── GameScene.ts     # 核心游戏循环（实体、碰撞、波次、摇杆、场景协作）
│   ├── HUDScene.ts      # 叠加层 UI（血条、经验、章节提示、暂停、GM 入口）
│   ├── LevelUpScene.ts  # 升级三选一弹窗，支持 AutoBattle 自动选项
│   ├── TutorialScene.ts # 首次进入游戏的新手引导覆盖层
│   ├── GMScene.ts       # 开发者调试面板与快捷操作
│   └── GameOverScene.ts # 结算画面
├── entities/            # 游戏实体（继承 Phaser.Physics.Arcade.Sprite）
│   ├── Player.ts        # 玩家
│   ├── Enemy.ts         # 基础敌人
│   ├── BossEnemy.ts     # Boss 敌人
│   ├── Bullet.ts        # 子弹
│   └── XPOrb.ts         # 经验球
├── systems/             # 游戏系统（纯逻辑，不继承 Phaser 类）
│   ├── WeaponSystem.ts  # 自动索敌射击与武器参数驱动
│   ├── WaveSystem.ts    # 波次推进、章节切换、Boss 刷新
│   ├── UpgradeSystem.ts # 升级池、角色过滤、属性应用
│   ├── AutoBattleSystem.ts # AI 玩家移动与自动升级决策
│   ├── SaveSystem.ts    # 存档
│   └── SoundManager.ts  # 程序化音效
└── utils/
    ├── helpers.ts       # 数学工具
    └── csvLoader.ts     # CSV 解析、类型转换、权重配置解析
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
