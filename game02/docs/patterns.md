# 关键设计模式与技术方案

本文档沉淀项目中使用的 Phaser 3 模式和通用游戏开发技巧，可复用于未来项目。

---

## 1. 程序化纹理生成

**问题**: 不想依赖外部图片资源，需要在运行时生成所有游戏图形  
**方案**: `Phaser.GameObjects.Graphics` + `generateTexture()`

```typescript
// PreloadScene.ts
const g = this.add.graphics();

// 用 Graphics API 绘制矢量图形
g.fillStyle(0x4fc3f7);
g.fillCircle(20, 20, 20);

// 光栅化为纹理，注册到 TextureManager
g.generateTexture('player', 40, 40);

// 必须销毁 Graphics 对象（否则内存泄漏）
g.destroy();

// 之后可在任何 Sprite 中使用
new Phaser.Physics.Arcade.Sprite(scene, x, y, 'player');
```

**适用场景**: 原型开发、Game Jam、极简风格游戏  
**限制**: 不适合复杂的精灵动画（需要 spritesheet）

---

## 2. 并行场景模式

**问题**: UI 层（HUD）需要固定在屏幕上，不随游戏摄像机移动  
**方案**: 多场景并行运行

```typescript
// GameScene.create()
this.scene.launch('HUDScene');  // HUDScene 在 GameScene 之上并行运行

// 两个场景各自有独立的：
// - 摄像机（HUD 不跟随玩家）
// - 输入系统
// - 对象树
```

**数据通信**: 通过 `Phaser.Data.DataManager` (Registry)

```typescript
// GameScene 写入
this.registry.set('hp', player.hp);

// HUDScene 监听
this.registry.events.on('changedata', (parent, key, value) => { ... });

// 必须在场景关闭时取消监听
this.events.on('shutdown', () => {
  this.registry.events.off('changedata', handler, this);
});
```

**弹窗场景** (如升级界面):
```typescript
// 暂停底层场景 + 启动弹窗
this.isPaused = true;
this.physics.pause();
this.scene.launch('LevelUpScene');

// 弹窗关闭后恢复
this.scene.stop('LevelUpScene');
this.isPaused = false;
this.physics.resume();
```

> **坑**: `scene.pause()` 只暂停 update 循环，不暂停物理。必须单独调用 `physics.pause()`。

---

## 3. 虚拟摇杆

**问题**: 移动端需要触控输入替代键盘  
**方案**: Pointer 事件驱动的虚拟摇杆

```typescript
// 配置多点触控支持
input: { activePointers: 2 }

// pointerdown: 触控点在屏幕左半 → 激活摇杆
if (pointer.x < width * 0.5 && !joystickPointer) {
  joystickPointer = pointer;
  // 在触控点显示摇杆底座和把手
}

// pointermove: 计算方向向量
const dx = pointer.x - base.x;
const dy = pointer.y - base.y;
const dist = sqrt(dx² + dy²);
const maxDist = 50;  // 最大拖拽半径

// 限制把手在圆形区域内
const clampDist = min(dist, maxDist);
const angle = atan2(dy, dx);
thumb.setPosition(base.x + cos(angle) * clampDist, base.y + sin(angle) * clampDist);

// 死区过滤（避免手指静止时的微小偏移）
if (dist > 10) {
  joystickVector.set(cos(angle), sin(angle));  // 归一化方向
} else {
  joystickVector.set(0, 0);
}

// pointerup: 重置
joystickPointer = null;
joystickVector.set(0, 0);
```

**要点**:
- 按 `pointer.id` 追踪特定手指，不会被其他触控干扰
- 摇杆底座在触控时才出现（`setAlpha(0/1)`），更移动友好
- 方向向量暴露为公共属性，Player 在 update 中读取

---

## 4. Arcade Physics 碰撞模式

**overlap vs collider**:
- `collider`: 有物理碰撞响应（弹开、推挤）
- `overlap`: 只触发回调，不产生物理效果

```typescript
// 子弹命中敌人：overlap（子弹穿过，不需要弹开）
this.physics.add.overlap(bullets, enemies, onBulletHitEnemy);

// 玩家碰撞敌人：overlap（通过代码控制伤害和击退）
this.physics.add.overlap(player, enemies, onPlayerHitEnemy);

// 经验球拾取：overlap（接触即收集）
this.physics.add.overlap(player, xpOrbs, onPlayerCollectOrb);
```

**Physics Group**:
```typescript
// runChildUpdate: true → 自动调用每个子对象的 update()
this.enemies = this.physics.add.group({ classType: Enemy, runChildUpdate: true });
this.bullets = this.physics.add.group({ classType: Bullet, runChildUpdate: true });

// runChildUpdate: false → 需要手动遍历更新（或无需更新）
this.xpOrbs = this.physics.add.group({ classType: XPOrb, runChildUpdate: false });
```

---

## 5. 无敌帧模式

**问题**: 玩家受伤后需要短暂无敌，避免被连续伤害秒杀  
**方案**: 时间戳比较

```typescript
private invincibleUntil: number = 0;

takeDamage(amount: number): void {
  const now = this.scene.time.now;
  if (now < this.invincibleUntil) return;  // 无敌期间跳过

  this.hp -= amount;
  this.invincibleUntil = now + PLAYER_INVINCIBLE_MS;  // 设置无敌结束时间
  // 视觉反馈：闪烁 + 染色
}
```

> **为什么不用 boolean + timer**: 时间戳方式无需维护额外的 timer 对象，且可以在存档恢复时轻松重置。

---

## 6. 补间动画（Tween）模式

Phaser Tween 是实现视觉反馈的核心工具。

### 闪烁效果（受伤）
```typescript
this.scene.tweens.add({
  targets: this,
  alpha: 0.3,        // 半透明
  duration: 60,
  yoyo: true,        // 自动反向
  repeat: 3,         // 重复 3 次
  onComplete: () => { this.setAlpha(1); }
});
```

### 扩散消散效果（死亡）
```typescript
const circle = this.scene.add.circle(x, y, 16, 0xffffff, 0.8);
this.scene.tweens.add({
  targets: circle,
  scaleX: 2.5, scaleY: 2.5,  // 放大
  alpha: 0,                    // 淡出
  duration: 200,
  ease: 'Quad.easeOut',
  onComplete: () => circle.destroy()  // 必须销毁临时对象
});
```

### 脉冲动画（经验球）
```typescript
scene.tweens.add({
  targets: orb,
  scaleX: 1.3, scaleY: 1.3,
  duration: 600,
  yoyo: true,
  repeat: -1,           // -1 = 无限循环
  ease: 'Sine.easeInOut'
});
```

> **关键知识**: Tween 创建的临时 GameObject（如死亡闪光）必须在 `onComplete` 中 `destroy()`，否则会累积导致内存泄漏和性能下降。

---

## 7. Web Audio 程序化音效

**问题**: 不想依赖外部音频文件  
**方案**: AudioContext + OscillatorNode 实时合成

### 基本模式

```
OscillatorNode → GainNode → MasterGainNode → AudioContext.destination
     (音高)        (音量)       (全局音量)         (扬声器)
```

### 音高滑动（频率变化）

```typescript
osc.frequency.setValueAtTime(startFreq, time);
osc.frequency.exponentialRampToValueAtTime(endFreq, time + duration);
```

- 升调：startFreq < endFreq（如拾取音效 600→1200）
- 降调：startFreq > endFreq（如受伤音效 300→80）

### 音量包络

```typescript
gain.gain.setValueAtTime(volume, time);
gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
// 注意：exponentialRamp 目标值必须 > 0
```

### 白噪声

```typescript
const bufferSize = sampleRate * duration;
const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
const data = buffer.getChannelData(0);
for (let i = 0; i < bufferSize; i++) {
  data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);  // 线性衰减
}
const source = ctx.createBufferSource();
source.buffer = buffer;
```

### 和弦

```typescript
[523, 659, 784].forEach((freq, i) => {
  const osc = ctx.createOscillator();
  osc.frequency.setValueAtTime(freq, time + i * 0.08);  // 错开时间 = 琶音
  osc.start(time + i * 0.08);
  osc.stop(time + 0.45);
});
```

### AudioContext 初始化

浏览器要求在用户手势后才能启动 AudioContext：

```typescript
// 必须在 pointerdown/click 回调中调用
SoundManager.init();     // new AudioContext()
SoundManager.resume();   // ctx.resume() 解除 suspended 状态
```

---

## 8. 存档恢复模式

**问题**: 升级效果是通过函数执行的（`weapon.damage *= 1.25`），存档只保存 ID 列表  
**方案**: 存储升级 ID → 恢复时按序重新执行

```typescript
// 存档
appliedUpgrades: ['damage_up', 'damage_up', 'bullet_count']  // 按应用顺序

// 恢复
save.appliedUpgrades.forEach(id => {
  UpgradeSystem.applyById(id, player, weaponSystem);
});
```

> **重要**: 升级的 `currentLevel` 也需要正确恢复。当前实现通过 `applyById` 递增 `currentLevel`，所以重复应用相同 ID 会正确累积等级。

---

## 9. 边缘生成模式

**问题**: 敌人需要从玩家视野外生成，且均匀分布在各方向  
**方案**: 随机选择四个边，在边上随机取点

```typescript
function randomEdgePoint(cx, cy, halfW, halfH, margin = 80) {
  const side = Math.floor(Math.random() * 4);  // 0=上, 1=下, 2=左, 3=右
  switch (side) {
    case 0: return { x: cx + random(-halfW, halfW), y: cy - halfH - margin };
    case 1: return { x: cx + random(-halfW, halfW), y: cy + halfH + margin };
    case 2: return { x: cx - halfW - margin, y: cy + random(-halfH, halfH) };
    case 3: return { x: cx + halfW + margin, y: cy + random(-halfH, halfH) };
  }
}
```

- `cx/cy` = 玩家位置（非世界中心）
- `halfW/halfH` = 摄像机半宽/半高
- `margin` = 额外偏移，确保在视野外
- 结果需要 `Phaser.Math.Clamp()` 限制在世界边界内

---

## 10. 连续升级处理

**问题**: 同帧内收集多个 XP 球可能触发多次升级  
**方案**: 升级弹窗关闭后检查是否需要再次升级

```typescript
resumeFromLevelUp(): void {
  this.updateRegistry();

  // 检查剩余经验是否足够再升一级
  if (this.player.xp >= this.player.xpToNext) {
    this.player.xp -= this.player.xpToNext;
    this.player.level++;
    this.player.recalcXPToNext();
    this.triggerLevelUp();  // 再次弹出升级界面
    return;                  // 不恢复物理
  }

  this.isPaused = false;
  this.physics.resume();
}
```

> **为什么不在 addXP 中循环处理**: 升级需要弹出 UI 让玩家选择，必须是异步交互。所以在每次弹窗关闭后检查，形成递归调用链。
