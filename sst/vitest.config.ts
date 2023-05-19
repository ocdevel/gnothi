/// <reference types="vitest" />

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    testTimeout: 30000,
    // include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'] // default
    include: ['services/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    threads: false
  },
  logLevel: "info",
  esbuild: {
    sourcemap: "both",
  },
  resolve: {
    alias: {
      "@gnothi/core": "./services/core",
    },
  },
});
