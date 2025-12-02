import js from "@eslint/js";
import globals from "globals";
import pluginReact from "eslint-plugin-react";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  ...nextVitals,
  pluginReact.configs.flat.recommended,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);
