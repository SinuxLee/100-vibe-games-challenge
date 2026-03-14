#!/usr/bin/env bun
/**
 * Serve _site on port 3000. Run from repo root after build:pages.
 */
import { join, dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { existsSync, statSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const siteDir = resolve(root, "_site");
const PORT_ENV = process.env.PORT ? parseInt(process.env.PORT, 10) : null;
const PORT_MIN = PORT_ENV ?? 3000;
const PORT_MAX = PORT_ENV ?? 3010;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ogg": "audio/ogg",
  ".mp3": "audio/mpeg",
  ".webmanifest": "application/manifest+json",
};

function getMime(pathname) {
  const ext = pathname.replace(/\?.*$/, "").slice(pathname.lastIndexOf("."));
  return MIME[ext] || "application/octet-stream";
}

/** Returns { filePath, redirectTo } — redirectTo set when request path has no trailing slash but resolves to a directory index (so relative URLs like ./assets/ work). */
function resolvePath(pathname) {
  const pathOnly = pathname.replace(/\?.*$/, "");
  const decoded = decodeURIComponent(pathOnly).replace(/^\//, "") || "index.html";
  if (decoded.includes("..")) return { filePath: null, redirectTo: null };
  const resolved = resolve(siteDir, decoded);
  if (!resolved.startsWith(siteDir)) return { filePath: null, redirectTo: null };
  if (existsSync(resolved)) {
    if (statSync(resolved).isDirectory()) {
      const idx = join(resolved, "index.html");
      if (!existsSync(idx)) return { filePath: null, redirectTo: null };
      const needsSlash = !pathOnly.endsWith("/") && pathOnly !== "" && pathOnly !== "/";
      return { filePath: idx, redirectTo: needsSlash ? pathOnly + "/" : null };
    }
    return { filePath: resolved, redirectTo: null };
  }
  if (existsSync(resolved + ".html")) return { filePath: resolved + ".html", redirectTo: null };
  return { filePath: null, redirectTo: null };
}

if (!existsSync(siteDir)) {
  console.error("_site not found. Run: bun run build:pages");
  process.exit(1);
}

function startServer(port) {
  return Bun.serve({
    port,
    async fetch(req) {
      const pathname = new URL(req.url).pathname;
      const { filePath, redirectTo } = resolvePath(pathname);
      if (redirectTo) {
        return new Response(null, { status: 301, headers: { Location: redirectTo } });
      }
      if (!filePath || !existsSync(filePath)) {
        return new Response("Not Found", { status: 404 });
      }
      const file = Bun.file(filePath);
      const mime = getMime(filePath);
      return new Response(file, {
        headers: { "Content-Type": mime },
      });
    },
  });
}

let server;
let port = PORT_MIN;
for (; port <= PORT_MAX; port++) {
  try {
    server = startServer(port);
    break;
  } catch (e) {
    if (e?.code === "EADDRINUSE" && port < PORT_MAX) continue;
    console.error(port === PORT_MIN ? `Port ${port} in use. Try: PORT=3001 bun run preview:pages` : e?.message || e);
    process.exit(1);
  }
}

console.log(`\n  Local:   http://localhost:${server.port}/\n`);
if (server.port !== PORT_MIN) console.log(`  (Port ${PORT_MIN} was in use.)\n`);
console.log("  Press Ctrl+C to stop.\n");
