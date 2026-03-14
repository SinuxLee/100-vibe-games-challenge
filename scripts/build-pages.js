#!/usr/bin/env bun
/**
 * Build output for GitHub Pages: copy static hub + game01, build each
 * gameNN that has package.json with "build" script, then copy its dist to _site/gameNN.
 * Run from repo root.
 */
import { mkdir, cp, readdir, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outDir = join(root, '_site');

async function exists(path) {
  try {
    await readdir(path);
    return true;
  } catch {
    return false;
  }
}

function run(cmd, cwd = root) {
  execSync(cmd, { cwd, stdio: 'inherit', shell: true });
}

async function copyRecursive(src, dest) {
  await mkdir(dest, { recursive: true });
  await cp(src, dest, { recursive: true });
}

async function getBuildableGames() {
  const names = await readdir(root);
  const games = [];
  for (const name of names) {
    if (!/^game\d+$/.test(name)) continue;
    const pkgPath = join(root, name, 'package.json');
    let pkg;
    try {
      pkg = JSON.parse(await readFile(pkgPath, 'utf8'));
    } catch {
      continue;
    }
    if (pkg.scripts && pkg.scripts.build) games.push({ name, pkg });
  }
  return games.sort((a, b) => a.name.localeCompare(b.name));
}

async function main() {
  await mkdir(outDir, { recursive: true });

  // Hub + docs
  await cp(join(root, 'index.html'), join(outDir, 'index.html'));
  const docsSrc = join(root, 'docs');
  if (await exists(docsSrc)) await copyRecursive(docsSrc, join(outDir, 'docs'));
  const readme = join(root, 'README.md');
  try {
    await cp(readme, join(outDir, 'README.md'));
  } catch (_) {}

  // Static games (no package.json build): copy whole folder
  const staticGames = ['game01'];
  for (const name of staticGames) {
    const src = join(root, name);
    if (await exists(src)) await copyRecursive(src, join(outDir, name));
  }

  // Buildable games: Bun only — install + build, then copy dist to _site/gameNN
  const buildable = await getBuildableGames();
  for (const { name } of buildable) {
    if (staticGames.includes(name)) continue;
    const cwd = join(root, name);
    console.log(`\n[build-pages] Building ${name}...`);
    const hasLock = await exists(join(cwd, 'bun.lock'));
    const install = hasLock ? 'bun install --frozen-lockfile' : 'bun install';
    try {
      run(install, cwd);
      run('bun run build', cwd);
    } catch (e) {
      console.error(`[build-pages] ${name} build failed:`, e.message);
      throw e;
    }
    const dist = join(cwd, 'dist');
    if (await exists(dist)) {
      await copyRecursive(dist, join(outDir, name));
      console.log(`[build-pages] Copied ${name}/dist -> _site/${name}`);
    } else {
      console.warn(`[build-pages] No dist/ in ${name}, skipping copy`);
    }
  }

  console.log('\n[build-pages] Done. Output in _site/');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
