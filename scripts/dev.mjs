import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const rootDir = process.cwd();
const apiDir = path.join(rootDir, "api");

const children = new Set();
let shuttingDown = false;

function fail(message) {
  console.error(`dev: ${message}`);
  process.exit(1);
}

function assertFile(filePath) {
  if (!existsSync(filePath)) {
    fail(`Missing required file: ${filePath}`);
  }
}

function assertCommand(command) {
  const result = spawnSync(command, ["--version"], { stdio: "ignore", shell: process.platform === "win32" });
  if (result.status !== 0) {
    fail(`Missing required command: ${command}`);
  }
}

function run(command, args, cwd, label) {
  const child = spawn(command, args, { cwd, stdio: "inherit" });
  children.add(child);

  child.on("exit", (code, signal) => {
    children.delete(child);
    console.log(`${label} exited with ${code ?? signal ?? "unknown"}`);

    if (!shuttingDown) {
      fail(`${label} exited unexpectedly`);
    }
  });

  return child;
}

function shutdown(signal) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  for (const child of children) {
    if (child.exitCode === null && !child.killed) {
      child.kill(signal);
    }
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

assertFile(path.join(rootDir, "package.json"));
assertFile(path.join(apiDir, ".env"));
assertFile(path.join(apiDir, "artisan"));
assertFile(path.join(rootDir, "node_modules", "next", "dist", "bin", "next"));

assertCommand("php");
assertCommand("composer");
assertCommand("node");

const api = run(
  "php",
  ["artisan", "serve", "--host=127.0.0.1", "--port=8000"],
  apiDir,
  "Laravel API",
);

const web = run(
  "node",
  [path.join(rootDir, "node_modules", "next", "dist", "bin", "next"), "dev", "--port", "3000"],
  rootDir,
  "Next.js",
);
