import { defineConfig } from "vitest/dist/config.js";
import react from "@vitejs/plugin-react";
import path from "path";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ["react", "react-dom", "react-router-dom"],
 
    alias: {
      react: path.resolve("./node_modules/react"),
      "react-dom": path.resolve("./node_modules/react-dom"),
    },
  },

  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./setup.ts"],
    include: ["unit/**/*.test.ts", "unit/**/*.test.tsx"],
    coverage: {
      provider: "istanbul",
      reporter: ["text", "lcov"],
      thresholds: {
        lines: 70,
        branches: 60,
        functions: 70,
      },
    },
  },
});
