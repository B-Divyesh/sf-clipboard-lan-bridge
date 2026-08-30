import { defineConfig } from "vite";

export default defineConfig({
  root: "site",
  publicDir: "public",
  build: {
    target: "es2022",
    outDir: "../dist/site",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: "site/index.html",
        notFound: "site/404.html",
        demo: "site/demo/index.html",
        privacy: "site/privacy/index.html",
        terms: "site/terms/index.html"
      }
    }
  },
  server: { strictPort: true, port: 4173 }
});
