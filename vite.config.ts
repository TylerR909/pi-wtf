import { lingui, linguiTransformerBabelPreset } from "@lingui/vite-plugin";
import babel from "@rolldown/plugin-babel";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
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
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: [
        "pi.txt",
        "og.jpg",
        "robots.txt",
        "sitemap.xml",
        "llms.txt",
        "learn.html",
        "LICENSE",
        "THIRD_PARTY_NOTICES.md",
        "icon-192.png",
        "icon-512.png",
        "icon-512-maskable.png",
        "apple-touch-icon.png",
      ],
      manifest: {
        name: "piwtf",
        short_name: "piwtf",
        description: "Learn the digits of π — pi trainer, pi quiz, and a π matrix rain.",
        theme_color: "#0e0e10",
        background_color: "#0e0e10",
        display: "standalone",
        orientation: "any",
        start_url: "/",
        scope: "/",
        lang: "en",
        categories: ["entertainment", "education"],
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "/icon-512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,jpg,txt,xml,ico,webmanifest}"],
        // /pi.txt is ~1MB
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        navigateFallback: "/index.html",
      },
      // So `npm start` can offer install on localhost (Chrome still needs a SW)
      devOptions: { enabled: true, type: "module" },
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
