import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  build: {
    outDir: "build",
    rollupOptions: {
      input: {
        index: resolve(__dirname, "index.html"),
        mapCustomizer: resolve(__dirname, "map-customizer.html"),
      },
    },
  },
});
