// Basic ESLint config for TypeScript React Native (ESM compatible)
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import reactPlugin from "eslint-plugin-react";

export default [
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      react: reactPlugin,
    },
    rules: {
      semi: ["error", "always"],
      quotes: ["error", "double"],
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
      "react/jsx-uses-react": "off",
      "react/react-in-jsx-scope": "off",
      // 2025 Industry Standard Syntax Rules
      "no-unreachable": "error",
      "no-unsafe-finally": "error",
      "no-unsafe-negation": "error",
      "valid-typeof": "error",
      "@typescript-eslint/no-misused-new": "error",
      "@typescript-eslint/no-non-null-assertion": "warn",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  // Type-aware rules override
  {
    files: ["**/*.ts", "**/*.tsx"],
    ignores: ["supabase/functions/**/*"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
        ecmaFeatures: { jsx: true },
        project: "./tsconfig.json",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      "@typescript-eslint/prefer-nullish-coalescing": "error",
      "@typescript-eslint/prefer-optional-chain": "error",
    },
  },
];
