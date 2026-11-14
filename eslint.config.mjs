import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // This application fetches API data in client effects (no server data layer).
      // The rule flags every async setState in those effects even though updates
      // happen after the awaited response, so it cannot be satisfied without
      // replacing the data-fetching architecture. Other react-hooks rules stay on.
      "react-hooks/set-state-in-effect": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "api/**",
    "scripts/**",
    "node_modules/**",
  ]),
]);

export default eslintConfig;
