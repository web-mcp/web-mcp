import { fileURLToPath, URL, resolve as r } from "node:url";
import { dirname, resolve, relative } from "node:path";
import { readFileSync } from "node:fs";
import { defineConfig, mergeConfig, type UserConfig } from "vite";
import manifest, { browser } from "./src/manifest";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

/// <reference types="vitest" />

export const __DEV__ = process.env.NODE_ENV == "development";
const __FIREFOX__ = process.env.BROWSER == "firefox";

export const outdir = `dist/${browser}`;

export const shareConfig: UserConfig = {
  define: {
    __INTLIFY_JIT_COMPILATION__: true,
    __INTLIFY_DROP_MESSAGE_COMPILER__: true,

    __DEV__: process.env.NODE_ENV === "development",
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
    "process.env.BROWSER": JSON.stringify(process.env.BROWSER),
  },
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "assets-rewrite",
      enforce: "post",
      apply: "build",
      transformIndexHtml(html, { path }) {
        return html.replace(
          /"\/assets\//g,
          `"${relative(dirname(path), "/assets")}/`
        );
      },
    },
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  esbuild: {
    pure: __DEV__ ? [] : ["console.log"],
    // charset: "ascii",
  },
  optimizeDeps: {},
  build: {
    minify: __FIREFOX__ ? false : "esbuild",
  },
};

const port = 5172;

// https://vitejs.dev/config/
export default defineConfig(({ command }) =>
  mergeConfig(shareConfig, {
    base: command === "serve" ? `http://localhost:${port}/` : "/",
    server: {
      port: port,
      strictPort: true,
      hmr: {
        host: "localhost",
      },
      origin: `http://localhost:${port}`,
    },
    build: {
      watch: __DEV__ ? {} : undefined,
      target: ["chrome111"],
      emptyOutDir: false,
      manifest: false,
      outDir: outdir,
      rollupOptions: {
        input: {
          popup: "popup.html",
          // sidebar: "sidebar.html",
          offscreen: "offscreen.html",
          options: "options.html",
          index: "./src/assets/main.css",
        },
        output: {
          chunkFileNames: "js/chunk-[hash].js",
          assetFileNames: "assets/[name][extname]",
          extend: true,
        },
      },
    },
  })
);
