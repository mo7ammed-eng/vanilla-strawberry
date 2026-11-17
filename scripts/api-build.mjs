import { existsSync } from "node:fs";
import path from "node:path";
import { apiDir, requireCommand, run } from "./lib.mjs";

const scope = "build:api";

requireCommand(scope, "php", "Install PHP 8.2+ and add it to PATH.");
requireCommand(scope, "composer", "Install Composer from https://getcomposer.org/.");

if (!existsSync(path.join(apiDir, "vendor", "autoload.php"))) {
  console.log("build:api: installing Laravel dependencies");
  run(scope, "composer", ["install", "--no-interaction", "--prefer-dist"], { cwd: apiDir });
}

console.log("build:api: validating composer.json");
run(scope, "composer", ["validate", "--no-check-publish", "--no-interaction"], { cwd: apiDir });

console.log("build:api: rebuilding the optimized autoloader");
run(scope, "composer", ["dump-autoload", "--optimize", "--no-interaction"], { cwd: apiDir });

console.log("build:api: done.");
