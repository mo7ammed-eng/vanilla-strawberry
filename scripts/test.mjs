import { existsSync } from "node:fs";
import path from "node:path";
import { apiDir, fail, requireCommand, rootDir, run } from "./lib.mjs";

const scope = "test";

if (!existsSync(path.join(rootDir, "node_modules", "next", "package.json"))) {
  fail(scope, "frontend dependencies are missing. Run \"npm install\" first.");
}

if (!existsSync(path.join(apiDir, "vendor", "autoload.php"))) {
  fail(scope, "Laravel dependencies are missing. Run \"composer install\" inside api/ first.");
}

requireCommand(scope, "php", "Install PHP 8.2+ and add it to PATH.");

console.log("test: linting the frontend");
run(scope, "npm", ["run", "lint"], { cwd: rootDir });

console.log("test: typechecking the frontend");
run(scope, "npm", ["run", "typecheck"], { cwd: rootDir });

console.log("test: running the Laravel test suite");
run(scope, "npm", ["run", "test:api"], { cwd: rootDir });

console.log("test: all quality gates passed.");
