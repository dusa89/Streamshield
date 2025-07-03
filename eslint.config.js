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
      "react": reactPlugin,
    },
    rules: {
      "semi": ["error", "always"],
      "quotes": ["error", "double"],
      "@typescript-eslint/no-unused-vars": "warn",
      "react/jsx-uses-react": "off",
      "react/react-in-jsx-scope": "off"
    },
    settings: {
      react: {
        version: "detect"
      }
    },
  },
]; 