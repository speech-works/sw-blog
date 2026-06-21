#!/usr/bin/env node
// Dev orchestrator — starts the `web` (Next.js) and `studio` (Sanity) dev servers
// together. It picks FREE ports dynamically (preferring 3005 / 3333) and wires each
// server to the OTHER's actual port, so visual-editing Presentation connects no
// matter which ports happen to be free. Stop both with Ctrl+C.
import { spawn } from "node:child_process";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Try `preferred`; if it's busy, let the OS assign any free port.
function freePort(preferred) {
  const listen = (port) =>
    new Promise((resolve, reject) => {
      const srv = net.createServer();
      srv.once("error", reject);
      srv.listen({ port, host: "127.0.0.1" }, () => {
        const { port: actual } = srv.address();
        srv.close(() => resolve(actual));
      });
    });
  return listen(preferred).catch(() => listen(0));
}

const [webPort, studioPort] = await Promise.all([
  freePort(3005),
  freePort(3333),
]);
const webUrl = `http://localhost:${webPort}`;
const studioUrl = `http://localhost:${studioPort}`;

const c = { web: "\x1b[36m", studio: "\x1b[35m", off: "\x1b[0m", dim: "\x1b[2m" };
console.log(
  `\n  ${c.web}● web${c.off}     ${webUrl}\n` +
    `  ${c.studio}● studio${c.off}  ${studioUrl}  ${c.dim}← open this, then click "Presentation"${c.off}\n` +
    `  ${c.dim}(stop both with Ctrl+C)${c.off}\n`,
);

function start(name, dir, port, env) {
  const child = spawn("npm", ["run", "dev", "--", "--port", String(port)], {
    cwd: path.join(ROOT, dir),
    env: { ...process.env, ...env },
    stdio: ["ignore", "pipe", "pipe"],
    detached: true, // own process group, so we can tear the whole tree down cleanly
  });
  const tag = `${c[name]}[${name}]${c.off} `;
  const relay = (src, dst) =>
    src.on("data", (buf) => {
      for (const line of buf.toString().split("\n")) {
        if (line.trim()) dst.write(tag + line + "\n");
      }
    });
  relay(child.stdout, process.stdout);
  relay(child.stderr, process.stderr);
  return child;
}

const children = [
  start("web", "web", webPort, { NEXT_PUBLIC_SANITY_STUDIO_URL: studioUrl }),
  start("studio", "studio", studioPort, { SANITY_STUDIO_PREVIEW_URL: webUrl }),
];

let down = false;
function shutdown(code) {
  if (down) return;
  down = true;
  for (const child of children) {
    try {
      process.kill(-child.pid, "SIGTERM"); // kill the whole process group
    } catch {
      /* already gone */
    }
  }
  process.exit(code ?? 0);
}
process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
for (const child of children) child.on("exit", () => shutdown(0));
