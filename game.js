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
