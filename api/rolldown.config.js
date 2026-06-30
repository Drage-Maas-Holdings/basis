import { defineConfig } from "rolldown";

export default defineConfig({
  input: "src/index.ts",
  output: {
    dir: "dist",
    format: "esm",
    entryFileNames: "index.js",
  },
  platform: "node",
  external: ["better-sqlite3"],
  sourcemap: true,
  cleanDir: true,
});
