import { existsSync } from "node:fs";
import path from "node:path";
import { apiDir, fail, requireCommand, run } from "./lib.mjs";

const scope = "test:api";

if (!existsSync(path.join(apiDir, "vendor", "autoload.php"))) {
  fail(scope, "Laravel dependencies are missing. Run \"composer install\" inside api/ first.");
}

requireCommand(scope, "php", "Install PHP 8.2+ and add it to PATH.");

run(scope, "php", ["artisan", "test", "--compact"], { cwd: apiDir });
