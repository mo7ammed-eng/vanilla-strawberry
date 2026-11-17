import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import process from "node:process";

export const rootDir = process.cwd();
export const apiDir = path.join(rootDir, "api");
export const isWindows = process.platform === "win32";

export function fail(scope, message) {
  console.error(`${scope}: ${message}`);
  process.exit(1);
}

export function commandExists(command) {
  const result = spawnCommand(command, ["--version"], { stdio: "ignore" });
  return result.status === 0;
}

function quoteArg(value) {
  return /[\s"]/.test(value) ? `"${value.replace(/"/g, '\\"')}"` : value;
}

export function spawnCommand(command, args, options = {}) {
  if (isWindows) {
    const line = [command, ...args].map(quoteArg).join(" ");
    return spawnSync(line, [], { shell: true, ...options });
  }

  return spawnSync(command, args, { shell: false, ...options });
}

export function requireCommand(scope, command, hint) {
  if (!commandExists(command)) {
    fail(scope, `missing required command "${command}".${hint ? ` ${hint}` : ""}`);
  }
}

export function run(scope, command, args, options = {}) {
  const result = spawnCommand(command, args, {
    stdio: "inherit",
    ...options,
  });

  if (result.error) {
    fail(scope, result.error.message);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

export function parseEnv(contents) {
  const values = {};

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separator = line.indexOf("=");
    if (separator === -1) continue;

    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    values[key] = value;
  }

  return values;
}

export function readEnvFile(filePath) {
  if (!existsSync(filePath)) return {};
  return parseEnv(readFileSync(filePath, "utf8"));
}

export function loadEnv() {
  return {
    ...readEnvFile(path.join(rootDir, ".env")),
    ...readEnvFile(path.join(apiDir, ".env")),
  };
}

export function isPortOpen(port, host = "127.0.0.1", timeout = 800) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port });
    const settle = (open) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(open);
    };

    socket.setTimeout(timeout);
    socket.once("connect", () => settle(true));
    socket.once("timeout", () => settle(false));
    socket.once("error", () => settle(false));
  });
}

export function checkHttp(url, timeout = 3000) {
  return fetch(url, { signal: AbortSignal.timeout(timeout), redirect: "manual" })
    .then((response) => ({ ok: response.ok, status: response.status }))
    .catch((error) => ({ ok: false, status: null, error: error.message }));
}

export function sqliteFile(env) {
  const configured = env.DB_DATABASE;
  if (configured && configured !== ":memory:") return configured;
  return path.join(apiDir, "database", "database.sqlite");
}

export async function databaseStatus(env) {
  const connection = (env.DB_CONNECTION ?? "mysql").toLowerCase();

  if (connection === "sqlite") {
    const file = sqliteFile(env);
    return {
      connection,
      ready: existsSync(file),
      detail: file,
    };
  }

  if (["mysql", "mariadb", "pgsql"].includes(connection)) {
    const host = env.DB_HOST ?? "127.0.0.1";
    const port = Number(env.DB_PORT ?? (connection === "pgsql" ? 5432 : 3306));
    const database = env.DB_DATABASE ?? "unknown";
    const open = await isPortOpen(port, host);
    return {
      connection,
      ready: open,
      detail: `${host}:${port}/${database}`,
    };
  }

  return {
    connection,
    ready: false,
    detail: `unsupported DB_CONNECTION "${connection}"`,
  };
}

export function databaseHint(status) {
  if (status.connection === "sqlite") {
    return `The SQLite file ${status.detail} does not exist yet. Run "npm run setup" to create it and apply migrations.`;
  }

  return [
    `Could not reach ${status.connection} at ${status.detail}.`,
    "Start the database server, or run \"npm run db:status\" for a diagnostic.",
    "For a quick local alternative, set DB_CONNECTION=sqlite and DB_DATABASE to an absolute file path inside api/.env, then run \"npm run setup\".",
  ].join(" ");
}
