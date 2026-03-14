# 场景系统详解

## 场景流转图

```
BootScene → PreloadScene → MenuScene → GameScene ──→ GameOverScene
                                          │   ↑            │
                                          │   └────────────┘
                                          │     restart/menu
                                          ├── HUDScene     (并行叠加层)
                                          └── LevelUpScene (暂停弹窗)
```

---

## BootScene

**文件**: `src/scenes/BootScene.ts`  
**职责**: 最早加载的场景，显示 "Loading..." 文字后立即跳转  
**生命周期**: `create()` → 显示文字 → `this.scene.start('PreloadScene')`

> 在真实项目中可在此加载 loading bar 所需的最小资产。当前项目所有资产都是程序化生成的，所以 BootScene 只是一个跳板。

---

## PreloadScene

**文件**: `src/scenes/PreloadScene.ts`  
**职责**: 使用 `Phaser.GameObjects.Graphics` 程序化生成所有游戏纹理

### 纹理生成清单

| Key | 尺寸 | 描述 |
|-----|------|------|
| `player` | 40×40 | 蓝色双层圆（外圈深蓝 + 内圈浅蓝） |
| `enemy` | 32×32 | 红色双层圆（外圈暗红 + 内圈亮红） |
| `boss` | 96×96 | 紫色双层圆 + 高光点 |
| `bullet` | 12×12 | 黄色发光圆（外圈光晕 + 内圈实心） |
| `xp_orb` | 16×16 | 绿色发光圆 |
| `joystick_base` | 120×120 | 半透明白色圆环 |
| `joystick_thumb` | 50×50 | 半透明白色实心圆 |

### 核心方法

```typescript
private generateTexture(key: string, w: number, h: number, draw: (g: Graphics) => void): void {
  const g = this.add.graphics();
  draw(g);
  g.generateTexture(key, w, h);  // 转为 Phaser 纹理
  g.destroy();                    // 释放 Graphics 对象
}
```

> **关键知识**: `Graphics.generateTexture()` 将矢量图形光栅化为可复用纹理，之后可作为 Sprite 的 texture key 使用。生成后必须 `destroy()` Graphics 对象避免内存泄漏。

---

## MenuScene

**文件**: `src/scenes/MenuScene.ts`  
**职责**: 主菜单界面

### 功能

- 显示游戏标题 "SURVIVOR" 和副标题 "Survive the Horde"
- "NEW GAME" 按钮 → `this.scene.start('GameScene')`
- 检查 `SaveSystem.hasSave()` → 有存档时显示 "CONTINUE" 按钮
- "CONTINUE" → `this.scene.start('GameScene', { loadSave: true })`
- 按钮交互：`pointerdown` 时播放 `SoundManager.playClick()` 并初始化音频上下文

### 音频上下文初始化

```typescript
// 浏览器要求用户手势后才能启动 AudioContext
// 在按钮点击时调用：
SoundManager.init();
SoundManager.resume();  // 恢复 suspended 状态
```

---

## GameScene

**文件**: `src/scenes/GameScene.ts`  
**职责**: 核心游戏循环——所有游戏逻辑的枢纽

### 属性

| 属性 | 类型 | 描述 |
|------|------|------|
| `player` | `Player` | 玩家实体 |
| `enemies` | `Phaser.Physics.Arcade.Group` | 敌人物理组 |
| `bullets` | `Phaser.Physics.Arcade.Group` | 子弹物理组 |
| `xpOrbs` | `Phaser.Physics.Arcade.Group` | 经验球物理组 |
| `weaponSystem` | `WeaponSystem` | 武器系统实例 |
| `waveSystem` | `WaveSystem` | 波次系统实例 |
| `kills` | `number` | 击杀计数 |
| `elapsedTime` | `number` | 游戏已经过时间（ms） |
| `isPaused` | `boolean` | 暂停标志（升级/ESC） |
| `joystickVector` | `Vector2` | 虚拟摇杆方向（公开给 Player 读取） |

### create() 流程

```
1. SoundManager.init() + resume()
2. 设置物理世界边界 (4000×4000)
3. 绘制网格背景
4. 创建 Player 实体
5. 创建 Physics Groups (enemies, bullets, xpOrbs)
6. 实例化 WeaponSystem, WaveSystem
7. 注册物理碰撞：
   - bullets ↔ enemies → onBulletHitEnemy
   - player ↔ enemies → onPlayerHitEnemy
   - player ↔ xpOrbs → onPlayerCollectOrb
8. 设置摄像机跟随 + 世界边界
9. 初始化虚拟摇杆
10. 启动 HUDScene（并行叠加）
11. 如有存档 → 恢复数据
12. 初始化 registry 数据（供 HUD 读取）
```

### update() 循环

```
if (isPaused) return;
1. 累加 elapsedTime
2. player.update()        — 读取输入 → 设置速度
3. weaponSystem.update()  — 检查射击间隔 → 自动开火
4. waveSystem.update()    — 检查波次计时 → 生成敌人
5. attractXPOrbs()        — 吸引范围内的经验球
6. updateRegistry()       — 同步数据给 HUD
```

### 物理碰撞回调

**onBulletHitEnemy**:
```
bullet 命中 enemy
→ enemy.takeDamage(bullet.damage)
→ bullet.pierce--
→ 播放命中音效 + 白色闪光效果
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
- **pointerup**: 重置向量为 (0,0)，隐藏摇杆
- **多点触控**: `activePointers: 2` 确保摇杆不会被其他触控干扰

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
**职责**: 游戏信息叠加层（与 GameScene 并行运行）

### UI 元素布局

```
┌──────────────────────────────────┐
│ [====HP 血条=====]               │  y=20, 全宽-40px
│ [==XP 经验条===]                 │  y=42, 全宽-40px
│ Lv.3                   Wave 2   │  y=60
│ Kills: 47             01:23     │  y=88
│                         SOUND   │  y=116 (静音切换)
│                                 │
│                                 │
│         (游戏画面)               │
│                                 │
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

> **关键知识**: `registry.events.on('changedata')` 在任何 `registry.set()` 调用时触发，无需手动轮询。场景 shutdown 时必须 `off` 取消监听。

### 暂停功能

- **ESC 键** 监听：`this.input.keyboard.on('keydown-ESC', () => this.togglePause())`
- 暂停时：创建 Container（暗色遮罩 + "PAUSED" 文字 + 提示）
- 恢复时：销毁 Container，恢复 GameScene 物理

---

## LevelUpScene

**文件**: `src/scenes/LevelUpScene.ts`  
**职责**: 升级弹窗——暂停游戏，展示三个升级选项

### 流程

```
1. GameScene.triggerLevelUp() → 暂停物理 + launch LevelUpScene
2. 半透明黑色遮罩覆盖画面
3. "LEVEL UP!" 金色标题
4. UpgradeSystem.getRandomUpgrades(3) → 获取3个可用升级
5. 渲染3张卡片（名称 + 描述 + hover 效果）
6. 点击卡片 → UpgradeSystem.apply() → scene.stop() → GameScene.resumeFromLevelUp()
```

### 卡片交互

- **布局**: 垂直排列，卡片宽度 80% 屏幕，高度 120px，间距 20px
- **hover**: 改变卡片背景色（`upgradeCard` → `upgradeCardHover`），边框高亮
- **点击**: 播放 click 音效，应用升级，关闭弹窗

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

- 显示 "GAME OVER" 标题
- 统计数据：击杀数、存活时间、到达波次、最终等级
- 最高分记录（localStorage `survivor_best`）
- "RESTART" → `scene.start('GameScene')`
- "MENU" → `scene.start('MenuScene')`
- 游戏结束时自动删除存档 `SaveSystem.deleteSave()`
