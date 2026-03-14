# 100 Games Challenge

A collection of **100 web games** built with **vibe coding**. Each game is a self-contained, playable project—tech stack varies from vanilla HTML/CSS/JS to Phaser, Vite + TypeScript, and more.

## Hub & How to Play

- **Game hub**: Open the root [index.html](../index.html) in a browser to see the entry page that lists all games.
- If you hit CORS or `file://` limitations, run a local static server, e.g.:
  ```bash
  python3 -m http.server 8080
  # or: npx serve .
  ```
  Then open `http://localhost:8080`.

## Completed Games

### Game 01 — Whack-a-Mole (打地鼠)

- **Path**: `game01/`
- **Genre**: Casual, reaction
- **Tech**: Pure front-end, no build, no dependencies (HTML + CSS + JS)
- **Play**: Score by clicking moles within 30 seconds; aim for a high score.
- **Run**: Open `game01/index.html` directly, or serve that path via any HTTP server.

### Game 02 — Survivor

- **Path**: `game02/`
- **Genre**: Survivor-like (Vampire Survivors-style), top-down shooter
- **Tech**: Phaser 3 + TypeScript + Vite, mobile-first (portrait 750×1334)
- **Play**: Move with WASD or on-screen joystick; auto-aim and shoot. Kill enemies for XP orbs, level up and pick one of three upgrades. Waves increase in difficulty; boss every 5 waves. Local save supported.
- **Run**:
  ```bash
  cd game02
  bun install
  bun run dev
  ```
  Open http://localhost:3000. For production: `bun run build` → output in `game02/dist/`.

## Goals & Conventions

- **Goal**: Ship 100 small, playable web games, each with a clear entry point and gameplay.
- **Style**: Vibe coding—fast iteration, small steps, always playable.
- **Structure**: One directory per game (game01, game02, …) with a single hub page and multi-language docs at the repo root.

## Languages

- This file is the English readme: `docs/README.en.md`
- 中文说明：`docs/README.zh-CN.md`
- Root [README.md](../README.md) is a short overview with links to both.

## GitHub Pages deployment

The repo is set up to build and deploy to GitHub Pages. The hub, static games, and all TypeScript (or other built) games are built in CI and published together.

### Steps

1. Push the repo to GitHub.
2. In the repo go to **Settings → Pages**. Set **Source** to **GitHub Actions**.
3. On every push to `main`, the workflow will:
   - Copy the hub `index.html`, `docs/`, and static games (e.g. game01) into the publish directory;
   - For each game directory that has a `package.json` with a `build` script (e.g. game02), install deps, run build, and copy that game's `dist/` into the publish directory under the same name.
4. The site will be available at `https://<username>.github.io/<repo>/`.

### Local build and preview

From the repo root (requires [Bun](https://bun.sh)). **Recommended one-shot local test** (build then serve on port 3000):

```bash
bun run test:pages
```

Then open http://localhost:3000/ in the browser; the hub and game01 / game02 should all work.

Or run step by step: `bun run build:pages` (output in `_site/`), then `bun run preview:pages` (Bun-built server on port 3000).

### Convention for future TypeScript games

- One directory per game: `game01`, `game02`, `game03`, …
- **Static games** (no build): add the directory name to the `staticGames` array in `scripts/build-pages.js`; the script will copy the whole directory to `_site/<name>/`.
- **Games that need a build**: add a `package.json` in the game directory with a `scripts.build` (e.g. `vite build`). The build script will detect it, install deps, run build, and copy that directory's `dist/` to `_site/<name>/`.
- Use relative asset paths in the game (e.g. Vite `base: './'`) so the game works under the GitHub Pages subpath.

## Upcoming (03–100)

Slots 03–100 will be filled over time and shown on the root [index.html](../index.html) hub; unfinished slots appear as “Coming soon”.
