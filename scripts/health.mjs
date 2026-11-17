import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import {
  apiDir,
  checkHttp,
  commandExists,
  databaseHint,
  databaseStatus,
  loadEnv,
  rootDir,
  spawnCommand,
} from "./lib.mjs";

const scope = "health";
const results = [];

function report(ok, label, detail = "") {
  results.push({ ok, label });
  const state = ok ? "OK  " : "FAIL";
  console.log(`${state} ${label}${detail ? ` — ${detail}` : ""}`);
}

function versionOf(command, args = ["--version"]) {
  const result = spawnCommand(command, args, { encoding: "utf8" });
  if (result.status !== 0) return null;
  return (result.stdout || "").split(/\r?\n/)[0].trim();
}

console.log("health: environment");
report(Number(process.versions.node.split(".")[0]) >= 20, "Node.js 20+", process.version);
report(Boolean(versionOf("php")), "PHP", versionOf("php") ?? "not found");
report(Boolean(versionOf("composer")), "Composer", versionOf("composer") ?? "not found");
report(commandExists("npm"), "npm", versionOf("npm") ?? "not found");

const env = loadEnv();

if (!existsSync(path.join(rootDir, ".env"))) {
  report(false, "Root .env", "missing; run \"npm run setup\"");
} else {
  report(true, "Root .env", "present");
}

if (!existsSync(path.join(apiDir, ".env"))) {
  report(false, "api/.env", "missing; run \"npm run setup\"");
} else {
  report(true, "api/.env", "present");
}

report(Boolean(env.APP_KEY?.trim()), "Laravel APP_KEY", env.APP_KEY?.trim() ? "configured" : "missing; run \"php artisan key:generate\" in api/");

const database = await databaseStatus(env);
report(database.ready, `Database (${database.connection})`, database.ready ? database.detail : databaseHint(database));

console.log("health: services");
const apiBase = (env.API_INTERNAL_URL || "http://127.0.0.1:8000/api/v1").replace(/\/$/, "");
const apiHealth = await checkHttp(`${apiBase}/health`);
report(apiHealth.ok, "API health endpoint", apiHealth.ok ? `${apiBase}/health (${apiHealth.status})` : apiHealth.error ?? `unreachable at ${apiBase}/health`);

const webUrl = (env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
const web = await checkHttp(webUrl);
report(web.ok, "Frontend", web.ok ? `${webUrl} (${web.status})` : web.error ?? `unreachable at ${webUrl}`);

const failures = results.filter((result) => !result.ok);
console.log("");
if (failures.length > 0) {
  console.error(`health: ${failures.length} check${failures.length === 1 ? "" : "s"} failed.`);
  process.exit(1);
}

console.log("health: everything looks healthy.");
