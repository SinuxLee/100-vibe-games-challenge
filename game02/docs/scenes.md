# 场景系统详解

## 场景流转图

```text
BootScene → PreloadScene → MenuScene ─┬─ [新游戏] → CharSelect → GameScene ──→ GameOverScene
                                       └─ [继续游戏] → GameScene (loadSave)
                                           │   ↑            │
                                           │   └────────────┘
                                           ├── HUDScene      (并行叠加层)
                                           ├── LevelUpScene  (暂停弹窗)
                                           ├── GMScene       (dev tools)
                                           └── TutorialScene (首次进入)
```

---

## BootScene

**文件**: `src/scenes/BootScene.ts`  
**职责**: 最早加载的场景，显示 "Loading..." 文字后立即跳转  
**生命周期**: `create()` → 显示文字 → `this.scene.start('PreloadScene')`

> 在真实项目中可在此加载 loading bar 所需的最小资产。当前项目所有资产都是程序化生成或本地图片资源，所以 BootScene 只是一个跳板。

---

## PreloadScene

**文件**: `src/scenes/PreloadScene.ts`  
**职责**: 预加载图片与音频资源，并补齐程序化生成的纹理

### 纹理生成清单

| Key | 来源 | 尺寸 | 描述 |
|-----|------|------|------|
| `player_warrior` | 图片 | 原图尺寸 | 战士角色贴图，角色选择卡片与玩家实体共用 |
| `player_ranger` | 图片 | 原图尺寸 | 游侠角色贴图，速度型角色 |
| `player_mage` | 图片 | 原图尺寸 | 法师角色贴图，法术型角色 |
| `enemy_basic` | 图片 | 原图尺寸 | 基础追击敌人 |
| `enemy_fast` | 图片 | 原图尺寸 | 高速脆皮敌人 |
| `enemy_tank` | 图片 | 原图尺寸 | 低速高血敌人 |
| `enemy_shooter` | 程序化 | 36×36 | 菱形远程敌人，黄绿色双层菱形 |
| `enemy_splitter` | 程序化 | 40×40 | 六边形分裂敌人，青色双层多边形 |
| `enemy_ghost` | 程序化 | 32×38 | 幽灵敌人，圆头加尾摆造型 |
| `enemy_charger` | 程序化 | 44×36 | 冲锋敌人，橙色箭头楔形 |
| `enemy_swarm` | 程序化 | 20×20 | 群体敌人，亮绿色星形 |
| `boss_brute` | 图片 | 原图尺寸 | Boss，标准重型首领 |
| `boss_necromancer` | 程序化 | 88×88 | 五边形死灵法师，带内层紫色发光 |
| `boss_dragon` | 程序化 | 112×80 | 红色巨龙，双翼外形加双眼高光 |
| `boss_overlord` | 程序化 | 128×128 | 八角星霸主，红色外层加黑色核心 |
| `tile_floor` | 图片 | 原图尺寸 | 地面平铺背景 |
| `player` | 程序化 | 40×40 | 旧版通用玩家纹理，兼容保留 |
| `enemy` | 程序化 | 32×32 | 旧版通用敌人纹理，兼容保留 |
| `boss` | 程序化 | 96×96 | 旧版通用 Boss 纹理，兼容保留 |
| `bullet` | 程序化 | 12×12 | 黄色发光圆，子弹纹理 |
| `xp_orb` | 程序化 | 16×16 | 绿色发光圆，经验球纹理 |
| `joystick_base` | 程序化 | 120×120 | 半透明摇杆底座 |
| `joystick_thumb` | 程序化 | 50×50 | 半透明摇杆把手 |

### 核心方法

```typescript
private generateTexture(key: string, w: number, h: number, draw: (g: Graphics) => void): void {
  const g = this.add.graphics();
  draw(g);
  g.generateTexture(key, w, h);  // 转为 Phaser 纹理
  g.destroy();                    // 释放 Graphics 对象
}
```

> **关键知识**: `Graphics.generateTexture()` 会把矢量图形光栅化成可复用纹理，之后可直接作为 Sprite 的 texture key 使用。生成完成后要及时 `destroy()`，避免留下临时 Graphics 对象。

---

## MenuScene

**文件**: `src/scenes/MenuScene.ts`  
**职责**: 主菜单与角色选择入口

### 界面阶段

- `phase: 'main' | 'charSelect'`
- 所有内容都挂在 `this.container` 上，切换阶段时先 `clearContainer()` 再重建界面

### main 阶段

- 显示标题 `t('title')` 与副标题 `t('subtitle')`
- **New Game** 按钮
  - 点击后执行 `SoundManager.init(this)`、`SoundManager.resume()`、`SoundManager.playClick()`
  - 先 `SaveSystem.deleteSave()` 清理旧存档
  - 再进入 `showCharSelect()`
- **Continue** 按钮
  - 仅在 `SaveSystem.hasSave()` 为真时显示
  - 点击后直接 `this.scene.start('GameScene', { loadSave: true })`
- **语言切换** 按钮
  - 文案固定为 `中文 / EN`
  - 通过 `getLang()` / `setLang()` 在 `zh` 与 `en` 间切换
  - 切换后 `this.scene.restart()`，整页文本立即刷新

### charSelect 阶段

- 顶部标题为 `t('select_char')`
- 遍历 `PLAYER_TABLE` 渲染 3 张角色卡片
- 每张卡片包含
  - 角色图标，来自 `cfg.texture`
  - 彩色名字，使用 `t(\`char_${cfg.id}\`)`
  - 角色描述，使用 `t(\`char_${cfg.id}_desc\`)`
  - 两行属性信息，显示 HP、Speed、Weapon
- 角色主色映射
  - `warrior = 0x4fc3f7`
  - `ranger = 0x66bb6a`
  - `mage = 0xce93d8`
- 点击卡片后直接开始游戏

```typescript
this.scene.start('GameScene', { characterId: cfg.id });
```

- 底部 `Back` 按钮会返回 `main` 阶段

### 音频上下文初始化

```typescript
// 浏览器要求用户手势后才能启动 AudioContext
// 在按钮点击时调用：
SoundManager.init(this);
SoundManager.resume();
```

---

## GameScene

**文件**: `src/scenes/GameScene.ts`  
**职责**: 核心游戏循环，所有战斗逻辑的枢纽

### 属性

| 属性 | 类型 | 描述 |
|------|------|------|
| `player` | `Player` | 玩家实体 |
| `enemies` | `Phaser.Physics.Arcade.Group` | 敌人物理组 |
| `bullets` | `Phaser.Physics.Arcade.Group` | 子弹物理组 |
| `xpOrbs` | `Phaser.Physics.Arcade.Group` | 经验球物理组 |
| `weaponSystem` | `WeaponSystem` | 武器系统实例 |
| `waveSystem` | `WaveSystem` | 波次系统实例 |
| `autoBattle` | `AutoBattleSystem` | 自动战斗与自动选升级 |
| `kills` | `number` | 击杀计数 |
| `elapsedTime` | `number` | 游戏已经过时间（ms） |
| `isPaused` | `boolean` | 暂停标志（升级、教程、ESC） |
| `joystickVector` | `Vector2` | 虚拟摇杆方向，公开给 `Player` 读取 |

### create() 流程

```
1. SoundManager.init() + resume()
2. 设置物理世界边界 (4000×4000)
3. 绘制地面 tileSprite 背景
4. 读取传入参数 `{ loadSave?, characterId? }`
5. 用 `getPlayerById(charId)` 取得角色配置并创建 Player
6. 创建 Physics Groups (enemies, bullets, xpOrbs)
7. 用角色的 `startWeapon` 初始化 WeaponSystem
8. 创建 WaveSystem，按当前波次自动映射 stage 配置
9. 创建 AutoBattleSystem
10. 注册物理碰撞：
   - bullets ↔ enemies → onBulletHitEnemy
   - player ↔ enemies → onPlayerHitEnemy
   - player ↔ xpOrbs → onPlayerCollectOrb
11. 设置摄像机跟随 + 世界边界
12. 初始化虚拟摇杆
13. 启动 HUDScene（并行叠加）
14. 如有存档 → `loadSaveData()`
15. 初始化 registry 数据（供 HUD 读取）
16. 首次新开局且 `TutorialScene.shouldShow()` 为真时，暂停游戏并 launch TutorialScene
```

### 角色初始化

```typescript
create(data?: { loadSave?: boolean; characterId?: string }): void {
  const charId = data?.characterId ?? DEFAULT_PLAYER_ID;
  const playerCfg = getPlayerById(charId);
  this.player = new Player(this, WORLD_WIDTH / 2, WORLD_HEIGHT / 2, playerCfg);

  const startWeapon = playerCfg?.startWeapon;
  this.weaponSystem = new WeaponSystem(this, startWeapon);
}
```

### update() 循环

```
if (isPaused) return;
1. 累加 elapsedTime
2. player.update()      -> 读取输入并设置速度
3. autoBattle.update()  -> 处理自动战斗逻辑
4. weaponSystem.update() -> 检查射击间隔并自动开火
5. waveSystem.update()   -> 按 stage 配置推进波次与刷怪
6. attractXPOrbs()       -> 吸引范围内的经验球
7. updateRegistry()      -> 同步数据给 HUD
```

### Stage 事件转发

- `WaveSystem.advanceWave()` 在章切换时执行 `this.scene.events.emit('stageChanged', newStage)`
- `HUDScene` 在 `create()` 中监听这个事件，更新顶部 Stage 文案并播放章节横幅

### 物理碰撞回调

**onBulletHitEnemy**:
```
bullet 命中 enemy
→ enemy.takeDamage(bullet.damage)
→ bullet.pierce--
→ 播放命中音效 + 火花粒子 + 白色闪光
→ pierce <= 0 → bullet.destroy()
→ enemy.hp <= 0 → kills++, 生成 XPOrb, enemy.die()
```

**onPlayerHitEnemy**:
```
player 接触 enemy → player.takeDamage(enemy.damage)
→ hp <= 0 → gameOver()
```

**onPlayerCollectOrb**:
```
player 接触 xp_orb → playPickup()
→ player.addXP(orb.xpValue)
→ orb.destroy()
→ 如果升级 → triggerLevelUp()
```

### 虚拟摇杆实现

- **触发区域**: 屏幕左半部分 (`pointer.x < width * 0.5`)
- **pointerdown**: 记录触控点为摇杆圆心，显示底座和把手
- **pointermove**: 计算偏移量，把手位置限制在 50px 半径内，偏移 > 10px 时更新方向向量
- **pointerup**: 重置向量为 `(0, 0)`，隐藏摇杆

### 暂停与恢复

```typescript
triggerLevelUp():
  isPaused = true
  physics.pause()
  playLevelUp() 音效 + 金色闪光
  scene.launch('LevelUpScene')

resumeFromLevelUp():
  updateRegistry()  // 立即同步升级后的数据
  检查是否需要连续升级（同帧收集多个 XP 球）
  isPaused = false
  physics.resume()
```

---

## HUDScene

**文件**: `src/scenes/HUDScene.ts`  
**职责**: 游戏信息叠加层，与 GameScene 并行运行

### UI 元素布局

```text
┌──────────────────────────────────┐
│ [====HP 血条=====]               │  y=20, 全宽-40px
│ [==XP 经验条===]                 │  y=42, 全宽-40px
│ Lv.3        第1章        Wave 2  │  y=60
│ Kills: 47             01:23      │  y=88
│ GM             FPS:60  SOUND     │  y=116
│                                  │
│                                  │
│         (游戏画面)                │
│                                  │
└──────────────────────────────────┘
```

### 数据同步机制

使用 Phaser Registry 实现跨场景响应式通信：

```typescript
// GameScene 写入:
this.registry.set('hp', this.player.hp);

// HUDScene 监听:
this.registry.events.on('changedata', (parent, key, value) => {
  switch (key) {
    case 'hp': updateHPBar(); break;
    case 'kills': updateKillsText(); break;
    // ...
  }
});
```

> **关键知识**: `registry.events.on('changedata')` 会在任何 `registry.set()` 时触发，不需要手动轮询。场景 shutdown 时要 `off` 取消监听。

### Stage 显示

- 顶部新增 `stageText`，位置在等级与波次之间
- 文案通过 `t('stage', { n })` 生成
  - 中文示例: `第1章`
  - 英文示例: `Stage 1`
- HUD 直接监听 `GameScene` 的 `stageChanged` 事件

```typescript
const gameScene = this.scene.get('GameScene');
gameScene.events.on('stageChanged', this.onStageChanged, this);
```

### `showStageBanner()`

- 进入新章时显示横幅，文本来自 `t('stage_enter', { n, name })`
- 动画节奏
  - 淡入 `400ms`
  - 停留 `1800ms`
  - 淡出 `600ms`
- 横幅由半透明黑色背景和金色标题文字组成，结束后自动销毁

### 暂停功能

- **ESC 键** 监听: `this.input.keyboard.on('keydown-ESC', () => this.togglePause())`
- 暂停时: 创建 Container，包含暗色遮罩、`t('paused')` 与 `t('pause_hint')`
- 恢复时: 销毁 Container，恢复 GameScene 物理

---

## LevelUpScene

**文件**: `src/scenes/LevelUpScene.ts`  
**职责**: 升级弹窗，暂停游戏并展示三个升级选项

### 流程

```
1. GameScene.triggerLevelUp() → 暂停物理 + launch LevelUpScene
2. 半透明黑色遮罩覆盖画面
3. `t('level_up')` 金色标题
4. UpgradeSystem.getRandomUpgrades(3) → 获取 3 个可用升级
5. 渲染 3 张卡片（名称 + 描述 + hover 效果）
6. 点击卡片 → UpgradeSystem.apply() → scene.stop() → GameScene.resumeFromLevelUp()
```

### i18n 文案

- 升级名称统一通过 `tUpgradeName(id)` 渲染
- 升级描述统一通过 `tUpgradeDesc(id)` 渲染
- 自动战斗高亮卡片与手动选择卡片都走同一套 i18n 命名规则

### 卡片交互

- **布局**: 垂直排列，卡片宽度 80% 屏幕，高度 120px，间距 20px
- **hover**: 改变卡片背景色（`upgradeCard` → `upgradeCardHover`），边框高亮
- **点击**: 播放 click 音效，应用升级，关闭弹窗

---

## TutorialScene

**文件**: `src/scenes/TutorialScene.ts`  
**职责**: 首次进入新游戏时显示的新手引导弹层

### 显示时机

- 只在首次新开局时显示，不会在 `loadSave` 流程里弹出
- 使用 localStorage 键 `survivor_tutorial_done` 记录是否已完成

### 静态方法

```typescript
static shouldShow(): boolean {
  return !localStorage.getItem('survivor_tutorial_done');
}

static markDone(): void {
  localStorage.setItem('survivor_tutorial_done', '1');
}
```

### 引导内容

- 共 5 步
- 每一步都由 `titleKey` 和 `bodyKey` 驱动 i18n 文案
- 当前内置步骤为
  1. 移动
  2. 自动攻击
  3. 收集经验
  4. 升级
  5. 生存目标

### 交互

- 点击屏幕、空格键、回车键都可进入下一步
- 第二步开始右上角出现跳过按钮
- 最后一步完成后调用 `markDone()`，恢复 GameScene 物理并关闭场景

---

## GameOverScene

**文件**: `src/scenes/GameOverScene.ts`  
**职责**: 游戏结束画面

### 接收数据

```typescript
// 从 GameScene 传入：
this.scene.start('GameOverScene', {
  kills: number,
  time: number,      // ms
  wave: number,
  level: number
});
```

### 功能

- 所有可见文案都走 i18n，包含标题、统计项、最佳成绩、按钮文字
- 统计数据通过 `t('stat_kills')`、`t('stat_time')`、`t('stat_wave')`、`t('stat_level')` 生成
- 最佳成绩使用 localStorage `survivor_best_kills` 与 `survivor_best_time`
- `Restart` 按钮 → `scene.start('GameScene')`
- `Menu` 按钮 → `scene.start('MenuScene')`
- 游戏结束前已在 GameScene 中自动删除存档 `SaveSystem.deleteSave()`
