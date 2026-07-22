import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Separate build config for the standalone GitHub Pages demo (demo.html +
// src/demo/main.tsx), kept apart from vite.config.ts so it doesn't affect
// the webview/dist output the VS Code extension packages and loads. Icons
// live in demo-public/ (not the conventional public/) for the same reason:
// Vite's default publicDir is shared by every config with the same root, so
// a plain public/ would also get copied into the extension's webview/dist.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      // Excalidraw's optional-feature chunks (mermaid, katex, cytoscape, ...)
      // push the largest bundle past Workbox's 2 MiB default; raise it
      // rather than fight code-splitting that upstream itself doesn't do.
      workbox: {
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
      },
      manifest: {
        name: "Excalidraw LaTeX — Demo",
        short_name: "Excalidraw LaTeX",
        description: "Excalidraw with LaTeX math formula support (MathJax)",
        start_url: process.env.DEMO_BASE_PATH ?? "/excalidraw-vscode-latex/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#ffffff",
        icons: [
          { src: "pwa-192.png", sizes: "192x192", type: "image/png" },
          {
            src: "pwa-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
  publicDir: "demo-public",
  // GitHub Pages serves project pages from /<repo-name>/, not the domain
  // root; override with DEMO_BASE_PATH for a fork under a different name.
  base: process.env.DEMO_BASE_PATH ?? "/excalidraw-vscode-latex/",
  build: {
    outDir: "dist-demo",
    rollupOptions: {
      input: "demo.html",
    },
  },
});
