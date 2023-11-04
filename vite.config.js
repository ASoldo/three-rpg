// vite.config.js
import { defineConfig } from "vite";

const functionNamesToKeep = ["initSoldo"];
const keepFnamesRegex = new RegExp(
  functionNamesToKeep.map((name) => `^${name}$`).join("|"),
);

export default defineConfig({
  build: {
    minify: "terser",
    terserOptions: {
      keep_fnames: keepFnamesRegex,
    },
  },
});
