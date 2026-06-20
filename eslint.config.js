import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  reactPlugin.configs.flat.recommended,
  { settings: { react: { version: "19.0" } } },
  {
    rules: {
      "react/react-in-jsx-scope": "off",
    },
  },
  {
    ignores: ["node_modules/", "import/"],
  },
);
