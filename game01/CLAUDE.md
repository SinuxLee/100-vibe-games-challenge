# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 运行方式

无构建工具，无依赖，无需安装：

```bash
# 直接用浏览器打开
open index.html

# 或启动本地 HTTP 服务器
python3 -m http.server 8000
```

## 架构概览

纯前端打地鼠游戏，三文件架构：

- `index.html` — 页面结构，包含三个视图状态
- `style.css` — 所有样式（含纯 CSS 绘制的地鼠图形）
- `game.js` — 全部游戏逻辑

### 状态管理

`gameState` 是唯一状态源（`game.js` 顶部），包含：

| 字段 | 说明 |
|------|------|
| `score` | 当前分数 |
| `timeLeft` | 剩余秒数（初始 30） |
| `activeMoles` | `Set<HTMLElement>`，当前显示地鼠的洞，用于防重复选洞 |
| `isRunning` | 布尔守卫，游戏结束后阻止加分 |
| `timers` | 所有 `setTimeout/setInterval` ID 池，用于统一清理 |

### 视图状态机

三个视图通过 CSS class 切换，无路由：

| 视图 | DOM ID | 显示条件 |
|------|--------|---------|
| 开始页 | `start-screen` | 初始 / 重新开始 |
| 游戏页 | `game-screen` | 点击"开始游戏" |
| 结束弹窗 | `end-modal` | 倒计时归零（通过 `.hidden` 控制） |

### 地鼠调度（双链并发）

`startGame()` 调用两次 `scheduleNextMole()` 启动两条独立调度链，每条链自我递归——无论本次是否让地鼠出现，都继续延迟调度自身（600~1200ms 随机间隔）。`showMole()` 内部**不再调用** `scheduleNextMole()`，避免链增殖。

关键参数：最多 2 只地鼠同时出现，停留 800~1400ms 后自动隐藏。

### 计时器管理

所有 `setTimeout`/`setInterval` ID 统一 push 进 `gameState.timers`，`startGame()` 和 `endGame()` 时统一清除，防止游戏重启时遗留幽灵计时器。

### 命中反馈

`hitMole()` 动态创建 `<span class="hit-feedback">+1</span>` 附加到洞元素上，CSS `@keyframes float-up` 动画 600ms 后由 `setTimeout` 移除 DOM。

## 设计文档

`docs/superpowers/specs/2026-03-12-whack-a-mole-design.md` 包含完整设计规格（配色、参数、架构决策）。

## MVP 范围限制

以下功能明确不在当前范围：音效、难度等级、历史最高分、移动端触控优化、特殊地鼠。
