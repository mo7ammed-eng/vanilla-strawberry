import { existsSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import {
  apiDir,
  databaseStatus,
  fail,
  loadEnv,
  run,
  sqliteFile,
} from "./lib.mjs";

const scope = "db";
const action = process.argv[2];

if (!["up", "down", "status"].includes(action)) {
  fail(scope, "usage: node scripts/db.mjs <up|down|status>");
}

if (!existsSync(path.join(apiDir, ".env"))) {
  fail(scope, "api/.env is missing. Run \"npm run setup\" first.");
}

const env = loadEnv();
const status = await databaseStatus(env);

if (action === "status") {
  console.log(`db: connection ${status.connection}`);
  console.log(`db: target     ${status.detail}`);
  console.log(`db: state      ${status.ready ? "reachable" : "unreachable"}`);

  if (status.connection === "sqlite" && status.ready) {
    const size = statSync(sqliteFile(env)).size;
    console.log(`db: file size  ${(size / 1024).toFixed(1)} KiB`);
  }

  if (status.ready) {
    run(scope, "php", ["artisan", "migrate:status", "--no-interaction"], { cwd: apiDir });
    process.exit(0);
  }

  console.error(
    status.connection === "sqlite"
      ? "db: the SQLite file is missing. Run \"npm run setup\" to create it."
      : `db: MySQL/PostgreSQL is not reachable at ${status.detail}. Start the server, then retry.`,
  );
  process.exit(1);
}

if (status.connection === "sqlite") {
  const file = sqliteFile(env);

  if (action === "down") {
    console.log("db: SQLite needs no server, and this script will not delete your local data file.");
    console.log("db: remove the file manually only when you intend to erase local data.");
    process.exit(0);
  }

  mkdirSync(path.dirname(file), { recursive: true });
  if (!existsSync(file)) {
    writeFileSync(file, "");
    console.log(`db: created ${file}`);
  }

  run(scope, "php", ["artisan", "migrate", "--no-interaction"], { cwd: apiDir });
  console.log("db: SQLite is ready.");
  process.exit(0);
}

if (action === "down") {
  console.log("db: this project does not manage the database server lifecycle.");
  console.log("db: stop MySQL/PostgreSQL with the service manager or container runtime you used to start it.");
  process.exit(0);
}

console.error(`db: cannot start ${status.connection} automatically.`);
console.error(`db: start the server at ${status.detail} using your service manager, MAMP/Laragon, or a container.`);
console.error("db: then run \"npm run db:status\" to verify the connection.");
console.error("db: for a file-based local database, set DB_CONNECTION=sqlite and DB_DATABASE in api/.env, then run \"npm run setup\".");
process.exit(1);
