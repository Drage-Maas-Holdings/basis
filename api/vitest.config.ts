import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globalSetup: "./tests/global-setup.ts",
    include: ["tests/**/*.test.ts"],
    testTimeout: 15000,
    hookTimeout: 20000,
    fileParallelism: false,
    reporters: ["verbose"],
  },
});
