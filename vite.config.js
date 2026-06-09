import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  base: "/",
  plugins: [vue()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    allowedHosts: true,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3100",
        changeOrigin: true
      },
      "/health": {
        target: "http://127.0.0.1:3100",
        changeOrigin: true
      }
    }
  }
});
