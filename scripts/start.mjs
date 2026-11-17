import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import {
  apiDir,
  databaseHint,
  databaseStatus,
  fail,
  isPortOpen,
  loadEnv,
  requireCommand,
  rootDir,
} from "./lib.mjs";

const scope = "start";

const children = new Set();
let shuttingDown = false;

function start(command, args, cwd, label) {
  const child = spawn(command, args, { cwd, stdio: "inherit" });
  children.add(child);

  child.on("exit", (code, signal) => {
    children.delete(child);
    console.log(`${label} exited with ${code ?? signal ?? "unknown"}`);

    if (!shuttingDown) {
      shutDown();
      process.exitCode = code ?? 1;
    }
  });
}

function shutDown() {
  if (shuttingDown) return;
  shuttingDown = true;

  for (const child of children) {
    if (child.exitCode === null && !child.killed) {
      child.kill();
    }
  }
}

process.on("SIGINT", () => {
  shutDown();
  process.exit(130);
});
process.on("SIGTERM", () => {
  shutDown();
  process.exit(143);
});
process.on("exit", () => {
  for (const child of children) {
    if (child.exitCode === null && !child.killed) {
      child.kill();
    }
  }
});

if (!existsSync(path.join(rootDir, ".next", "BUILD_ID"))) {
  fail(scope, "no production build found. Run \"npm run build\" first.");
}

if (!existsSync(path.join(apiDir, ".env"))) {
  fail(scope, "api/.env is missing. Run \"npm run setup\" first.");
}

requireCommand(scope, "php", "Install PHP 8.2+ and add it to PATH.");

const database = await databaseStatus(loadEnv());
if (!database.ready) {
  fail(scope, databaseHint(database));
}

for (const [port, label] of [
  [3000, "Next.js"],
  [8000, "Laravel API"],
]) {
  if (await isPortOpen(port)) {
    fail(scope, `port ${port} (${label}) is already in use. Stop the other process before starting.`);
  }
}

start("php", ["artisan", "serve", "--host=127.0.0.1", "--port=8000"], apiDir, "Laravel API");
start(
  "node",
  [path.join(rootDir, "node_modules", "next", "dist", "bin", "next"), "start", "-p", "3000"],
  rootDir,
  "Next.js",
);
