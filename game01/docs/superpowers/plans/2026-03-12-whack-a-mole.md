# 打地鼠 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个可在浏览器直接运行的打地鼠小游戏 MVP，包含开始页、游戏页、结束弹窗、计分、倒计时和点击反馈动画。

**Architecture:** 3 文件分离（index.html / style.css / game.js），无构建工具。所有游戏状态集中在 `gameState` 对象，通过 CSS class 切换视图，JS 驱动地鼠调度和计时器。

**Tech Stack:** 原生 HTML5 + CSS3 + Vanilla JavaScript（ES6+），无任何依赖。

**Spec:** `docs/superpowers/specs/2026-03-12-whack-a-mole-design.md`

---

## Chunk 1: HTML 结构与 CSS 样式

### Task 1: HTML 基础结构

**Files:**
- Create: `index.html`

- [ ] **Step 1: 创建 index.html，写入开始页结构**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>打地鼠</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>

  <!-- 开始页 -->
  <div id="start-screen" class="screen active">
    <h1 class="game-title">打地鼠</h1>
    <p class="subtitle">点击地鼠得分，30 秒内尽可能多打！</p>
    <button id="start-btn" class="btn-primary">开始游戏</button>
  </div>

  <!-- 游戏页 -->
  <div id="game-screen" class="screen">
    <!-- 状态栏 -->
    <div class="status-bar">
      <div class="stat">
        <span class="stat-label">分数</span>
        <span id="score-display" class="stat-value">0</span>
      </div>
      <div class="stat">
        <span class="stat-label">时间</span>
        <span id="timer-display" class="stat-value">30</span>
      </div>
    </div>
    <!-- 3×3 地鼠格 -->
    <div class="mole-grid">
      <!-- 9 个洞，由 JS 动态绑定点击事件 -->
      <!-- 注意：此处对设计规格 Section 5.2 做了扩展：增加了 .mole-face 容器包裹
           眼睛和鼻子，CSS 中 .mole-eye/.mole-nose 的坐标均基于 .mole-face 计算。
           若参考设计文档的原始结构（无 .mole-face），需同步调整 CSS 数值。-->
      <div class="hole"><div class="mole"><div class="mole-ear left"></div><div class="mole-ear right"></div><div class="mole-face"><div class="mole-eye left"></div><div class="mole-eye right"></div><div class="mole-nose"></div></div></div></div>
      <div class="hole"><div class="mole"><div class="mole-ear left"></div><div class="mole-ear right"></div><div class="mole-face"><div class="mole-eye left"></div><div class="mole-eye right"></div><div class="mole-nose"></div></div></div></div>
      <div class="hole"><div class="mole"><div class="mole-ear left"></div><div class="mole-ear right"></div><div class="mole-face"><div class="mole-eye left"></div><div class="mole-eye right"></div><div class="mole-nose"></div></div></div></div>
      <div class="hole"><div class="mole"><div class="mole-ear left"></div><div class="mole-ear right"></div><div class="mole-face"><div class="mole-eye left"></div><div class="mole-eye right"></div><div class="mole-nose"></div></div></div></div>
      <div class="hole"><div class="mole"><div class="mole-ear left"></div><div class="mole-ear right"></div><div class="mole-face"><div class="mole-eye left"></div><div class="mole-eye right"></div><div class="mole-nose"></div></div></div></div>
      <div class="hole"><div class="mole"><div class="mole-ear left"></div><div class="mole-ear right"></div><div class="mole-face"><div class="mole-eye left"></div><div class="mole-eye right"></div><div class="mole-nose"></div></div></div></div>
      <div class="hole"><div class="mole"><div class="mole-ear left"></div><div class="mole-ear right"></div><div class="mole-face"><div class="mole-eye left"></div><div class="mole-eye right"></div><div class="mole-nose"></div></div></div></div>
      <div class="hole"><div class="mole"><div class="mole-ear left"></div><div class="mole-ear right"></div><div class="mole-face"><div class="mole-eye left"></div><div class="mole-eye right"></div><div class="mole-nose"></div></div></div></div>
      <div class="hole"><div class="mole"><div class="mole-ear left"></div><div class="mole-ear right"></div><div class="mole-face"><div class="mole-eye left"></div><div class="mole-eye right"></div><div class="mole-nose"></div></div></div></div>
    </div>
  </div>

  <!-- 结束弹窗（覆盖在游戏页上） -->
  <div id="end-modal" class="modal hidden">
    <div class="modal-box">
      <h2>游戏结束！</h2>
      <p class="final-score-label">你的得分</p>
      <div id="final-score" class="final-score">0</div>
      <button id="restart-btn" class="btn-primary">再来一局</button>
    </div>
  </div>

  <script src="game.js"></script>
</body>
</html>
```

- [ ] **Step 2: 在浏览器打开 index.html，确认页面可以加载，无控制台报错**

预期：看到空白页面，无 JS 报错（game.js 还未创建会有 404，可忽略）。

---

### Task 2: CSS 基础样式与布局

**Files:**
- Create: `style.css`

- [ ] **Step 1: 写入全局重置、基础变量和页面背景**

```css
/* ===== CSS 变量 ===== */
:root {
  --bg: #f5e6c8;
  --grass: #7cb87a;
  --hole-color: #5c3d2e;
  --mole-body: #a0724a;
  --mole-ear-inner: #e8a0a0;
  --mole-eye: #2c1a0e;
  --mole-nose: #c45e5e;
  --btn-color: #e8743b;
  --btn-hover: #d4622a;
  --text-dark: #3a2a1a;
  --white: #fff;
}

/* ===== 全局重置 ===== */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  background: var(--bg);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

/* ===== 屏幕切换 ===== */
.screen {
  display: none;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 100vh;
}

.screen.active {
  display: flex;
}
```

- [ ] **Step 2: 写入开始页样式**

```css
/* ===== 开始页 ===== */
.game-title {
  font-size: 3.5rem;
  color: var(--text-dark);
  text-shadow: 3px 3px 0 rgba(0,0,0,0.12);
  margin-bottom: 0.5rem;
  letter-spacing: 0.1em;
}

.subtitle {
  color: #6b5040;
  font-size: 1rem;
  margin-bottom: 2.5rem;
}

.btn-primary {
  padding: 0.9rem 2.8rem;
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--white);
  background: var(--btn-color);
  border: none;
  border-radius: 50px;
  cursor: pointer;
  box-shadow: 0 4px 0 var(--btn-hover);
  transition: transform 80ms, box-shadow 80ms;
  letter-spacing: 0.05em;
}

.btn-primary:active {
  transform: translateY(3px);
  box-shadow: 0 1px 0 var(--btn-hover);
}
```

- [ ] **Step 3: 写入游戏页状态栏样式**

```css
/* ===== 状态栏 ===== */
.status-bar {
  display: flex;
  gap: 3rem;
  margin-bottom: 1.8rem;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(255,255,255,0.55);
  border-radius: 12px;
  padding: 0.5rem 1.6rem;
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
}

.stat-label {
  font-size: 0.75rem;
  color: #7a5c40;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: var(--text-dark);
  line-height: 1.2;
}
```

- [ ] **Step 4: 写入 3×3 格子布局**

```css
/* ===== 地鼠格 ===== */
.mole-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.2rem;
  padding: 1.8rem;
  background: var(--grass);
  border-radius: 20px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15), inset 0 2px 6px rgba(255,255,255,0.2);
}
```

- [ ] **Step 5: 在浏览器刷新，确认开始页样式正确（大标题、橙色按钮）**

预期：米黄背景，居中标题和按钮，没有排版错乱。

---

### Task 3: CSS 地鼠绘制

**Files:**
- Modify: `style.css`（追加）

- [ ] **Step 1: 写入洞和地鼠容器样式**

```css
/* ===== 洞 ===== */
.hole {
  position: relative;
  width: 110px;
  height: 80px;
  background: var(--hole-color);
  border-radius: 50%;
  overflow: hidden;            /* 裁切未出现的地鼠 */
  box-shadow: inset 0 8px 16px rgba(0,0,0,0.5),
              0 4px 8px rgba(0,0,0,0.25);
  cursor: pointer;
}

/* ===== 地鼠容器（默认藏于洞下方）===== */
.mole {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%) translateY(100%); /* 藏起来 */
  width: 70px;
  height: 75px;
  transition: transform 150ms ease;
}

/* 地鼠出现状态 */
.hole.active .mole {
  transform: translateX(-50%) translateY(10%);
}
```

- [ ] **Step 2: 写入地鼠耳朵**

```css
/* ===== 耳朵 ===== */
.mole-ear {
  position: absolute;
  top: 4px;
  width: 22px;
  height: 22px;
  background: var(--mole-body);
  border-radius: 50%;
  z-index: 1;
}

.mole-ear.left  { left: 4px; }
.mole-ear.right { right: 4px; }

/* 耳朵内圈 */
.mole-ear::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 12px;
  height: 12px;
  background: var(--mole-ear-inner);
  border-radius: 50%;
}
```

- [ ] **Step 3: 写入地鼠脸部（头、眼睛、鼻子）**

```css
/* ===== 脸部 ===== */
/* position: absolute 同时满足两个需求：
   1) 相对 .mole 进行绝对定位
   2) 作为 .mole-eye/.mole-nose 的定位包含块（非 static 元素均可）*/
.mole-face {
  position: absolute;
  top: 14px;
  left: 50%;
  transform: translateX(-50%);
  width: 62px;
  height: 58px;
  background: var(--mole-body);
  border-radius: 50% 50% 45% 45%;
  z-index: 2;
}

/* 脸部高光 */
.mole-face::before {
  content: '';
  position: absolute;
  top: 8px;
  left: 12px;
  width: 18px;
  height: 10px;
  background: rgba(255,255,255,0.18);
  border-radius: 50%;
  transform: rotate(-20deg);
}

/* ===== 眼睛 ===== */
.mole-eye {
  position: absolute;
  top: 14px;
  width: 10px;
  height: 11px;
  background: var(--mole-eye);
  border-radius: 50%;
}

.mole-eye.left  { left: 12px; }
.mole-eye.right { right: 12px; }

/* 眼睛反光 */
.mole-eye::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 4px;
  height: 4px;
  background: rgba(255,255,255,0.7);
  border-radius: 50%;
}

/* ===== 鼻子 ===== */
.mole-nose {
  position: absolute;
  bottom: 14px;
  left: 50%;
  transform: translateX(-50%);
  width: 16px;
  height: 10px;
  background: var(--mole-nose);
  border-radius: 50%;
}
```

- [ ] **Step 4: 临时修改 HTML，在浏览器验证地鼠外观**

在 `index.html` 中做两处临时改动（验证完毕后全部还原）：
1. 把 `<div id="game-screen" class="screen">` 改为 `<div id="game-screen" class="screen active">`（让游戏页可见）
2. 把第一个 `<div class="hole">` 改为 `<div class="hole active">`（让地鼠出现）

预期：第一个洞里露出棕色圆头地鼠，有耳朵、眼睛、鼻子，其余洞为空。

验证完毕后把上述两处改动都还原（`game-screen` 去掉 `active`，第一个洞去掉 `active`）。

---

### Task 4: CSS 动画与弹窗

**Files:**
- Modify: `style.css`（追加）

- [ ] **Step 1: 写入命中反馈 +1 浮动动画**

```css
/* ===== 命中反馈浮动文字 ===== */
@keyframes float-up {
  0%   { opacity: 1; transform: translateY(0) scale(1); }
  100% { opacity: 0; transform: translateY(-40px) scale(1.3); }
}

.hit-feedback {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  color: #fff;
  font-size: 1.2rem;
  font-weight: bold;
  text-shadow: 0 1px 3px rgba(0,0,0,0.4);
  pointer-events: none;
  z-index: 10;
  animation: float-up 600ms ease forwards;
}
```

- [ ] **Step 2: 写入结束弹窗样式**

```css
/* ===== 结束弹窗 ===== */
.modal {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal.hidden {
  display: none;
}

.modal-box {
  background: var(--bg);
  border-radius: 20px;
  padding: 2.5rem 3rem;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  min-width: 280px;
}

.modal-box h2 {
  font-size: 1.8rem;
  color: var(--text-dark);
  margin-bottom: 0.5rem;
}

.final-score-label {
  color: #7a5c40;
  font-size: 0.9rem;
  margin-bottom: 0.2rem;
}

.final-score {
  font-size: 4rem;
  font-weight: bold;
  color: var(--btn-color);
  line-height: 1.1;
  margin-bottom: 1.8rem;
}
```

- [ ] **Step 3: 在浏览器中临时验证弹窗样式**

在 `index.html` 中把 `<div id="end-modal" class="modal hidden">` 改为 `<div id="end-modal" class="modal">`（从 HTML 标签上移除 `hidden` class，不是修改 CSS）。

预期：页面上出现半透明黑色遮罩 + 居中米黄卡片，显示"游戏结束！"字样和橙色大分数区域。

验证完毕后将 `class` 还原为 `"modal hidden"`。

- [ ] **Step 4: Chunk 1 完成，提交**

提交前确认以下临时改动均已还原：
- `index.html` 中 `#game-screen` 的 class 是 `"screen"`（不含 `active`）
- `index.html` 中所有 `.hole` 的 class 是 `"hole"`（不含 `active`）
- `index.html` 中 `#end-modal` 的 class 是 `"modal hidden"`

```bash
cd /Users/centurygame/work/games-challenge
# 若目录还不是 git repo 则初始化；已是 repo 则跳过
git rev-parse --git-dir > /dev/null 2>&1 || git init
git add index.html style.css
git commit -m "feat: add HTML structure and complete CSS styles"
```

---

## Chunk 2: JavaScript 游戏逻辑

### Task 5: 游戏状态与初始化骨架

**Files:**
- Create: `game.js`

- [ ] **Step 1: 写入 gameState 和所有函数骨架**

```javascript
// ===== 游戏状态 =====
const gameState = {
  score: 0,
  timeLeft: 30,
  activeMoles: new Set(),   // 存放当前显示地鼠的洞 DOM 元素
  isRunning: false,
  timers: [],               // 存放所有 setTimeout/setInterval ID，便于统一清除
};

// ===== DOM 引用缓存 =====
const startScreen   = document.getElementById('start-screen');
const gameScreen    = document.getElementById('game-screen');
const endModal      = document.getElementById('end-modal');
const scoreDisplay  = document.getElementById('score-display');
const timerDisplay  = document.getElementById('timer-display');
const finalScore    = document.getElementById('final-score');
const startBtn      = document.getElementById('start-btn');
const restartBtn    = document.getElementById('restart-btn');
const holes         = Array.from(document.querySelectorAll('.hole'));

// ===== 初始化入口 =====
function init() {
  startBtn.addEventListener('click', startGame);
  restartBtn.addEventListener('click', startGame);
  // 地鼠点击事件委托到各个洞
  holes.forEach(hole => {
    hole.addEventListener('click', () => {
      if (hole.classList.contains('active')) {
        hitMole(hole);
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', init);
```

- [ ] **Step 2: 在浏览器打开，确认无控制台报错**

预期：开始页正常显示，控制台无 undefined 等报错。

---

### Task 6: 视图切换与 startGame

**Files:**
- Modify: `game.js`（补全函数）

- [ ] **Step 1: 实现 showScreen 辅助函数和 startGame**

```javascript
// ===== 视图切换 =====
function showScreen(screen) {
  startScreen.classList.remove('active');
  gameScreen.classList.remove('active');
  screen.classList.add('active');
}

// ===== 开始游戏 =====
function startGame() {
  // 清除所有遗留计时器
  gameState.timers.forEach(id => clearTimeout(id));
  gameState.timers.forEach(id => clearInterval(id));
  gameState.timers = [];

  // 重置状态
  gameState.score     = 0;
  gameState.timeLeft  = 30;
  gameState.isRunning = true;
  gameState.activeMoles.clear();

  // 重置 DOM
  holes.forEach(h => h.classList.remove('active'));
  endModal.classList.add('hidden');
  scoreDisplay.textContent = '0';
  timerDisplay.textContent = '30';

  // 切换到游戏页
  showScreen(gameScreen);

  // 启动计时器和地鼠调度
  startCountdown();
  scheduleNextMole();
  scheduleNextMole(); // 启动两条调度链，实现最多 2 只并发
}
```

- [ ] **Step 2: 在浏览器点击"开始游戏"，确认切换到游戏页**

预期：游戏页显示，状态栏显示"分数 0 / 时间 30"。地鼠调度函数未实现时会报错，可忽略。

---

### Task 7: 倒计时

**Files:**
- Modify: `game.js`（补全函数）

- [ ] **Step 1: 实现 startCountdown**

```javascript
// ===== 倒计时 =====
function startCountdown() {
  const intervalId = setInterval(() => {
    if (!gameState.isRunning) {
      clearInterval(intervalId);
      return;
    }
    gameState.timeLeft--;
    timerDisplay.textContent = gameState.timeLeft;

    if (gameState.timeLeft <= 0) {
      clearInterval(intervalId);
      endGame();
    }
  }, 1000);

  gameState.timers.push(intervalId);
}
```

- [ ] **Step 2: 在浏览器验证倒计时**

预期：点击开始后，时间每秒减 1，从 30 倒到 0。到 0 后 endGame 被调用（还未实现时控制台报错，可忽略）。

---

### Task 8: 地鼠调度

**Files:**
- Modify: `game.js`（补全函数）

- [ ] **Step 1: 实现 showMole 和 scheduleNextMole**

```javascript
// ===== 地鼠调度 =====

// 让指定洞的地鼠出现，停留随机时长后自动隐藏（链 A 在此延续）
function showMole(hole) {
  hole.classList.add('active');
  gameState.activeMoles.add(hole);

  // 随机停留 800~1400ms 后自动隐藏
  const stayMs = 800 + Math.random() * 600;
  const hideId = setTimeout(() => {
    // guard：若已被玩家命中（active 已移除），跳过，避免产生多余调度链
    if (!hole.classList.contains('active')) return;
    hole.classList.remove('active');
    gameState.activeMoles.delete(hole);
    scheduleNextMole(); // 链 A 在此继续
  }, stayMs);

  gameState.timers.push(hideId);
}

// 随机选一个空闲洞让地鼠出现；调用 showMole 后继续维持链 B
function scheduleNextMole() {
  if (!gameState.isRunning) return;

  const delayMs = 600 + Math.random() * 600; // 600~1200ms 后选下一个洞

  const schedId = setTimeout(() => {
    if (!gameState.isRunning) return;

    // 已达最大并发数（2）则等 300ms 后重试（固定延迟，与设计规格一致）
    if (gameState.activeMoles.size >= 2) {
      const retryId = setTimeout(scheduleNextMole, 300);
      gameState.timers.push(retryId);
      return;
    }

    // 从空闲洞中随机选一个
    const idleHoles = holes.filter(h => !gameState.activeMoles.has(h));
    if (idleHoles.length > 0) {
      const hole = idleHoles[Math.floor(Math.random() * idleHoles.length)];
      showMole(hole); // 链 A：showMole 内部负责本次地鼠隐藏后的调度
    }

    // 链 B：scheduleNextMole 自身在调用 showMole 后继续延续
    scheduleNextMole();
  }, delayMs);

  gameState.timers.push(schedId);
}
```

- [ ] **Step 2: 在浏览器验证地鼠出现**

预期：游戏开始后，地鼠随机从洞里冒出来，最多同时有 2 只，每只停留 800ms~1.4s 后缩回去。

---

### Task 9: 命中逻辑与点击反馈

**Files:**
- Modify: `game.js`（补全函数）

- [ ] **Step 1: 实现 hitMole（加分 + 浮动 +1）**

```javascript
// ===== 命中地鼠 =====
function hitMole(hole) {
  if (!gameState.isRunning) return;

  // 加分
  gameState.score++;
  scoreDisplay.textContent = gameState.score;

  // 立即隐藏地鼠
  hole.classList.remove('active');
  gameState.activeMoles.delete(hole);

  // 显示浮动 +1 反馈
  const feedback = document.createElement('span');
  feedback.className = 'hit-feedback';
  feedback.textContent = '+1';
  hole.appendChild(feedback);

  // 动画结束后移除 DOM
  const removeId = setTimeout(() => feedback.remove(), 620);
  gameState.timers.push(removeId);
}
```

- [ ] **Step 2: 在浏览器点击地鼠，验证命中逻辑**

预期：
- 点中地鼠：分数 +1，地鼠立即缩回，出现向上飘动的"+1"文字
- 点空洞：无任何反馈
- 分数正确累加

---

### Task 10: 结束游戏

**Files:**
- Modify: `game.js`（补全函数）

- [ ] **Step 1: 实现 endGame**

```javascript
// ===== 结束游戏 =====
function endGame() {
  gameState.isRunning = false;

  // 停止所有计时器
  gameState.timers.forEach(id => {
    clearTimeout(id);
    clearInterval(id);
  });
  gameState.timers = [];

  // 隐藏所有地鼠
  holes.forEach(h => {
    h.classList.remove('active');
    // 移除可能残留的 hit-feedback 元素
    h.querySelectorAll('.hit-feedback').forEach(el => el.remove());
  });
  gameState.activeMoles.clear();

  // 显示结束弹窗
  finalScore.textContent = gameState.score;
  endModal.classList.remove('hidden');
}
```

- [ ] **Step 2: 完整流程验证**

在浏览器完整玩一局，检查以下全部通过：

| 验证点 | 预期结果 |
|--------|----------|
| 开始页 → 点击开始 | 切换到游戏页 |
| 地鼠出现 | 随机冒出，最多 2 只同时出现 |
| 点中地鼠 | 分数+1，地鼠消失，+1 飘动动画 |
| 倒计时 | 每秒-1，从 30 到 0 |
| 时间到 | 弹出结束弹窗，显示正确总分 |
| 点击"再来一局" | 重置一切，重新开始 |
| 重新开始后倒计时 | 从 30 重新开始，无计时器叠加 |

- [ ] **Step 3: 提交完整代码**

```bash
cd /Users/centurygame/work/games-challenge
git add game.js
git commit -m "feat: complete game logic - state, scheduling, scoring, endgame"
```

---

## 验收标准

- [ ] 浏览器直接打开 `index.html` 可运行，无需服务器
- [ ] 开始页 → 游戏页 → 结束弹窗 → 重新开始，流程完整
- [ ] 地鼠随机出现，最多 2 只并发，能正常命中和得分
- [ ] 倒计时 30 秒，重新开始后不叠加计时器
- [ ] "+1" 浮动动画正常显示
- [ ] 代码文件仅 3 个（index.html / style.css / game.js）
