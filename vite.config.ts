import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "MetaFarm Next",
        short_name: "MetaFarm",
        description: "เว็บฟาร์มและระบบจัดการรังชันโรง",
        lang: "th",
        theme_color: "#f59e0b",
        background_color: "#fafaf9",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
        ],
      },
      workbox: {
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\//],
        runtimeCaching: [{ urlPattern: /\/api\//, handler: "NetworkOnly" }],
      },
    }),
  ],
  server: { proxy: { "/api": "http://127.0.0.1:8787" } },
  test: {
    environment: "node",
    include: [
      "server/**/*.test.ts",
      "src/**/*.test.ts",
      "src/**/*.test.tsx",
      "scripts/**/*.test.ts",
    ],
  },
});
