import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import {
  apiDir,
  commandExists,
  databaseHint,
  databaseStatus,
  fail,
  loadEnv,
  readEnvFile,
  requireCommand,
  rootDir,
  run,
  sqliteFile,
} from "./lib.mjs";

const scope = "setup";

const nodeMajor = Number(process.versions.node.split(".")[0]);
if (nodeMajor < 20) {
  fail(scope, `Node.js 20 or newer is required (found ${process.version}).`);
}

requireCommand(scope, "php", "Install PHP 8.2+ and add it to PATH.");
requireCommand(scope, "composer", "Install Composer from https://getcomposer.org/.");

const rootEnv = path.join(rootDir, ".env");
const rootEnvExample = path.join(rootDir, ".env.example");
const apiEnv = path.join(apiDir, ".env");
const apiEnvExample = path.join(apiDir, ".env.example");

if (!existsSync(rootEnv)) {
  if (!existsSync(rootEnvExample)) {
    fail(scope, `missing ${rootEnvExample}`);
  }
  copyFileSync(rootEnvExample, rootEnv);
  console.log("setup: created .env from .env.example");
}

if (!existsSync(apiEnv)) {
  if (!existsSync(apiEnvExample)) {
    fail(scope, `missing ${apiEnvExample}`);
  }
  copyFileSync(apiEnvExample, apiEnv);
  console.log("setup: created api/.env from api/.env.example");
}

if (!existsSync(path.join(rootDir, "node_modules", "next", "package.json"))) {
  console.log("setup: installing frontend dependencies (npm install)");
  run(scope, "npm", ["install"], { cwd: rootDir });
}

if (!existsSync(path.join(apiDir, "vendor", "autoload.php"))) {
  console.log("setup: installing Laravel dependencies (composer install)");
  run(scope, "composer", ["install", "--no-interaction", "--prefer-dist"], { cwd: apiDir });
}

let env = loadEnv();

if (!env.APP_KEY?.trim()) {
  console.log("setup: generating the Laravel application key");
  run(scope, "php", ["artisan", "key:generate", "--no-interaction"], { cwd: apiDir });
  env = { ...readEnvFile(apiEnv) };
}

if (!commandExists("npm")) {
  fail(scope, "missing required command \"npm\".");
}

const status = await databaseStatus(env);

if (!status.ready) {
  if (status.connection === "sqlite") {
    const file = sqliteFile(env);
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, "");
    console.log(`setup: created local SQLite database at ${file}`);
    console.log("setup: applying migrations and demo seed to the new local database");
    run(scope, "php", ["artisan", "migrate", "--seed", "--no-interaction"], { cwd: apiDir });
  } else {
    console.error(`setup: ${databaseHint(status)}`);
    console.error("setup: environment files and dependencies are ready; the database step is still pending.");
    process.exit(1);
  }
} else {
  console.log(`setup: database ready at ${status.detail}`);
  console.log("setup: applying any pending migrations (no destructive commands)");
  run(scope, "php", ["artisan", "migrate", "--no-interaction"], { cwd: apiDir });
}

console.log("");
console.log("setup: complete.");
console.log("setup: start both apps with \"npm run dev\" (site: http://localhost:3000, API: http://localhost:8000).");
