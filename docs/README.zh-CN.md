# 百款游戏挑战

用 **Vibe Coding** 开发的 **100 款网页小游戏** 合集。每款游戏都是独立可运行的项目，技术栈不一：有纯 HTML/CSS/JS，也有 Phaser、Vite + TypeScript 等。

## 入口与试玩

- **游戏大厅**：在浏览器中打开项目根目录的 [index.html](../index.html)，即可看到全部游戏的入口聚合页。
- 若通过 `file://` 打开有跨域限制，可本地起一个静态服务，例如：
  ```bash
  python3 -m http.server 8080
  # 或 npx serve .
  ```
  然后访问 `http://localhost:8080`。

## 已完成的游戏

### Game 01 — 打地鼠

- **路径**：`game01/`
- **类型**：休闲、反应类
- **技术**：纯前端，无构建、无依赖（HTML + CSS + JS）
- **玩法**：30 秒内点击冒头的地鼠得分，尽可能多打。
- **运行**：直接打开 `game01/index.html`，或通过任意 HTTP 服务器访问该路径。

### Game 02 — Survivor

- **路径**：`game02/`
- **类型**：幸存者类（Vampire Survivors-like）、俯视角射击
- **技术**：Phaser 3 + TypeScript + Vite，移动端优先（竖屏 750×1334）
- **玩法**：WASD/虚拟摇杆移动，自动瞄准射击；击杀敌人掉落经验球，升级三选一；波次推进，每 5 波 Boss；支持本地存档。
- **运行**：
  ```bash
  cd game02
  bun install
  bun run dev
  ```
  浏览器打开 http://localhost:3000。生产构建：`bun run build`，产物在 `game02/dist/`。

## 项目目标与规则

- **目标**：完成 100 款可玩的小游戏，每款都有明确玩法与入口。
- **风格**：Vibe coding — 快速迭代、小步交付、可随时试玩。
- **结构**：每款游戏在仓库中独立目录（game01, game02, …），根目录提供统一入口页与多语言说明。

## 多语言说明

- 本说明为中文版：`docs/README.zh-CN.md`
- 英文版：`docs/README.en.md`
- 根目录 [README.md](../README.md) 为简短总览，并附带语言切换链接。

## GitHub Pages 部署

项目支持一键部署到 GitHub Pages，入口页与所有已完成的游戏（含需编译的 TypeScript 游戏）会自动构建并发布。

### 步骤

1. 将仓库推送到 GitHub。
2. 仓库 **Settings → Pages**：**Source** 选择 **GitHub Actions**。
3. 每次推送到 `main` 分支时，Actions 会执行：
   - 复制入口页 `index.html`、文档 `docs/`、静态游戏（如 game01）到发布目录；
   - 对所有带 `package.json` 且含 `build` 脚本的游戏（如 game02）执行安装与构建，并将其 `dist/` 拷贝到发布目录对应子路径。
4. 部署完成后，站点地址为：`https://<你的用户名>.github.io/<仓库名>/`。

### 本地构建与预览

在仓库根目录执行（需安装 [Bun](https://bun.sh)）。**推荐一键本地测试**（先构建再在 3000 端口起服务）：

```bash
bun run test:pages
```

浏览器打开 http://localhost:3000/ 即可看到入口页，点击 game01 / game02 均可正常游玩。

或分步执行：`bun run build:pages`（产物在 `_site/`），再 `bun run preview:pages`（用 Bun 内置脚本起服务，端口 3000）。

### 后续 TypeScript 游戏的约定

- 每个游戏独立目录：`game01`、`game02`、`game03` …
- **纯静态游戏**（无构建）：在根目录 `scripts/build-pages.js` 的 `staticGames` 数组中加入目录名，构建时会整目录复制到 `_site/<游戏名>/`。
- **需编译的游戏**：在游戏目录下提供 `package.json` 并包含 `scripts.build`（如 `vite build`），构建脚本会自动检测、安装依赖、执行 build，并将该目录下的 `dist/` 复制到 `_site/<游戏名>/`。
- 游戏内资源请使用相对路径（如 Vite 设置 `base: './'`），以便在 GitHub Pages 子路径下正常加载。

## 后续游戏（03–100）

后续游戏将陆续补全，并在根目录 `index.html` 游戏大厅中展示；未完成的槽位会显示为「即将推出」等占位。
