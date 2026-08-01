import pluginJs from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import prettierConfig from "eslint-config-prettier";

export default tseslint.config(
  {
    ignores: ["org.openhab.stream-deck-plugin.sdPlugin/bin/**"],
  },
  {
    languageOptions: { globals: globals.browser },
  },
  {
    files: ["eslint.config.js", "rollup.config.mjs", "vitest.config.ts"],
    languageOptions: { globals: globals.node },
  },
  prettierConfig,
  pluginJs.configs.recommended,
  {
    files: ["src/**/*.ts"],
    extends: [
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
);
