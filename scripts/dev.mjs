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

const scope = "dev";

const children = new Set();
let shuttingDown = false;

function assertFile(filePath) {
  if (!existsSync(filePath)) {
    fail(scope, `missing required file: ${filePath}`);
  }
}

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

  return child;
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

assertFile(path.join(rootDir, "package.json"));
assertFile(path.join(apiDir, ".env"));
assertFile(path.join(apiDir, "artisan"));
assertFile(path.join(rootDir, "node_modules", "next", "dist", "bin", "next"));

requireCommand(scope, "php", "Install PHP 8.2+ and add it to PATH.");
requireCommand(scope, "composer", "Install Composer from https://getcomposer.org/.");
requireCommand(scope, "node");

const database = await databaseStatus(loadEnv());
if (!database.ready) {
  fail(scope, databaseHint(database));
}

for (const [port, label] of [
  [3000, "Next.js"],
  [8000, "Laravel API"],
]) {
  if (await isPortOpen(port)) {
    fail(scope, `port ${port} (${label}) is already in use. Stop the other process before running dev.`);
  }
}

start("php", ["artisan", "serve", "--host=127.0.0.1", "--port=8000"], apiDir, "Laravel API");
start(
  "node",
  [path.join(rootDir, "node_modules", "next", "dist", "bin", "next"), "dev", "--port", "3000"],
  rootDir,
  "Next.js",
);
