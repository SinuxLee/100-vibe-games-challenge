# 100 Games Challenge / 百款游戏挑战

A collection of **100 web games** built with vibe coding. Each game is a small, playable project—some vanilla HTML/CSS/JS, some with Phaser or other stacks.

| Language | Readme |
|----------|--------|
| **中文** | [docs/README.zh-CN.md](docs/README.zh-CN.md) |
| **English** | [docs/README.en.md](docs/README.en.md) |

## Quick start

- **Play now**: open [index.html](index.html) in a browser for the game hub (or run a local server).
- **Game 01** (打地鼠): open [game01/index.html](game01/index.html) — no build.
- **Game 02** (Survivor): `cd game02 && bun install && bun run dev` then open http://localhost:3000, or `bun run build` and open `game02/dist/index.html`.

## Progress

| # | Game | Status |
|---|------|--------|
| 01 | [打地鼠 Whack-a-Mole](game01/index.html) | ✅ Done |
| 02 | [Survivor](game02/) | ✅ Done |
| 03–100 | — | 🔜 Coming soon |

See the [game hub](index.html) for the full list.

## Deploy to GitHub Pages

1. Push the repo to GitHub.
2. In repo **Settings → Pages**: set **Source** to **GitHub Actions**.
3. On every push to `main`, the workflow builds the hub + game01 (static) + all games that have a `build` script (e.g. game02), and deploys to `https://<username>.github.io/<repo>/`.

Local test: run `bun run test:pages` at repo root (builds then serves `_site` at http://localhost:3000). Or run `bun run build:pages` then `bun run preview:pages` (uses Bun's built-in server, no extra deps). See [docs/README.zh-CN.md](docs/README.zh-CN.md) / [docs/README.en.md](docs/README.en.md) for details.
