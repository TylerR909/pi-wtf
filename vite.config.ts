import { lingui, linguiTransformerBabelPreset } from "@lingui/vite-plugin";
import babel from "@rolldown/plugin-babel";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    lingui(),
    // Presets apply in reverse order: Lingui macros expand before React Compiler.
    babel({
      presets: [reactCompilerPreset(), linguiTransformerBabelPreset()],
    }),
  ],
  // Fully static, edge-cacheable build
  build: {
    target: "es2022",
    cssCodeSplit: true,
    sourcemap: true,
    assetsInlineLimit: 4096,
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
});
