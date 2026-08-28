import { defineConfig } from "vite";

export default defineConfig({
  build: {
    target: "es2022",
    outDir: "dist/app",
    emptyOutDir: true,
    sourcemap: true
  },
  server: { strictPort: true, port: 1420 },
  clearScreen: false
});
