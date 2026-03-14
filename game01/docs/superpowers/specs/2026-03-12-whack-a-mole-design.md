# 打地鼠游戏设计文档

**日期：** 2026-03-12
**状态：** 已审核

---

## 1. 项目概述

一个可在浏览器中直接运行的打地鼠小游戏 MVP。目标是展示流畅的交互、计分、倒计时和简单动画，风格简洁好看。

---

## 2. 文件结构

```
games-challenge/
├── index.html    # 页面结构，包含三个视图状态
├── style.css     # 所有样式与动画
└── game.js       # 游戏逻辑
```

文件数量不超过 3 个，无需构建工具，浏览器直接打开 `index.html` 运行。

---

## 3. 架构

### 3.1 页面状态（视图层）

| 状态 | 描述 | 触发条件 |
|------|------|----------|
| `start` | 开始页，显示标题和开始按钮 | 初始加载 / 重新开始 |
| `playing` | 游戏主界面，显示地鼠格+状态栏 | 点击"开始游戏" |
| `ended` | 结束弹窗（覆盖在游戏页上） | 倒计时归零 |

使用 CSS class 切换显示/隐藏，不做 SPA 路由。

### 3.2 JS 模块划分（game.js）

```
game.js
├── gameState          对象：{ score, timeLeft, activeMoles, isRunning }
├── startGame()        重置状态与 DOM，切换到游戏页，启动计时器和地鼠调度
├── endGame()          设 isRunning=false，停止所有计时器，隐藏所有地鼠，显示结束弹窗
├── startCountdown()   每秒递减 timeLeft 并更新 UI，到 0 调用 endGame()
├── scheduleNextMole() 调度下一只地鼠出现
├── showMole(hole)     让指定洞的地鼠出现，停留随机时长后自动隐藏，并调度下一只
├── hitMole(hole)      命中逻辑：加分 + 地鼠下沉 + 显示浮动"✓"
└── init()             DOMContentLoaded 后绑定所有事件
```

**gameState 字段说明：**
- `score`：当前分数（整数）
- `timeLeft`：剩余秒数（整数，初始 30）
- `activeMoles`：当前已出现地鼠的洞 DOM 元素集合（`Set<HTMLElement>`），用于防止重复选洞
- `isRunning`：布尔值，游戏进行中为 `true`；用于守卫——游戏结束后点击地鼠不触发加分

所有状态集中在 `gameState` 对象，便于后续扩展（如难度级别、连击加成等）。

### 3.3 地鼠调度逻辑

`scheduleNextMole()` 使用单循环链式调度：
1. 若 `activeMoles.size >= 2` 或 `!isRunning`，跳过本次，延迟 300ms 后重试
2. 否则从 9 个洞中随机选一个未在 `activeMoles` 中的洞，调用 `showMole(hole)`
3. `showMole()` 将洞加入 `activeMoles`，添加 CSS class 使地鼠出现，随机停留 800~1400ms 后自动隐藏（移除 class，从 `activeMoles` 删除），然后再次调用 `scheduleNextMole()`
4. 同时，`scheduleNextMole()` 在调用 `showMole()` 后等待 600~1200ms 再次调用自身，形成双链并发（最多 2 只）

### 3.4 重新开始流程

点击"重新开始"按钮时：
1. 调用 `startGame()`（无需先调用 `endGame()`）
2. `startGame()` 内部：清除所有 timer、重置 `gameState`、隐藏所有地鼠、隐藏结束弹窗、切换视图到游戏页、启动计时器和地鼠调度

---

## 4. 核心玩法参数

| 参数 | 值 |
|------|----|
| 游戏时长 | 30 秒 |
| 洞的数量 | 9 个（3×3） |
| 每次命中得分 | +1 分 |
| 地鼠出现间隔 | 600ms ~ 1200ms（随机） |
| 地鼠停留时长 | 800ms ~ 1400ms（随机） |
| 同时出现地鼠数 | 最多 2 只 |

---

## 5. 视觉设计

### 5.1 配色方案

| 用途 | 颜色 |
|------|------|
| 页面背景 | `#f5e6c8`（米黄大地色） |
| 草地/格子背景 | `#7cb87a`（草绿） |
| 地洞 | `#5c3d2e`（深棕） |
| 地鼠头部 | `#a0724a`（棕色） |
| 地鼠耳朵内 | `#e8a0a0`（粉红） |
| 按钮主色 | `#e8743b`（暖橙） |

### 5.2 纯 CSS 地鼠结构

```html
<div class="hole">
  <div class="mole">
    <div class="mole-ear left"></div>
    <div class="mole-ear right"></div>
    <div class="mole-eye left"></div>
    <div class="mole-eye right"></div>
    <div class="mole-nose"></div>
  </div>
</div>
```

- 洞：深棕椭圆，`overflow: hidden` 裁切地鼠
- 地鼠默认 `translateY(100%)` 藏于洞下，出现时 `translateY(0)`
- 过渡：`transition: transform 150ms ease`

### 5.3 点击反馈动画

**命中地鼠：**
1. 立即调用 `hitMole()`，地鼠强制下沉（移除出现 class，从 `activeMoles` 删除）
2. 在被点击的洞上动态创建一个 `<span class="hit-feedback">+1</span>` 元素
3. 该元素通过 CSS `@keyframes` 向上飘动并 fade out，持续 600ms
4. 动画结束后用 JS `setTimeout` 移除该 DOM 元素

**错击空洞：** 无任何反馈

**游戏结束时已出现的地鼠：** `endGame()` 调用时立即移除所有洞的出现 class，地鼠全部隐藏，不保留任何可见地鼠

---

## 6. HTML 结构概览

```html
<div id="start-screen">   <!-- 开始页 -->
<div id="game-screen">    <!-- 游戏页：状态栏 + 3×3 格子 -->
<div id="end-modal">      <!-- 结束弹窗：分数 + 重新开始 -->
```

---

## 7. 不在范围内（MVP 不做）

- 音效
- 难度等级
- 历史最高分持久化
- 移动端触控优化
- 地鼠种类/特殊地鼠

---

## 8. 运行方式

```
浏览器直接打开 index.html
```

无需安装任何依赖，无需服务器。
