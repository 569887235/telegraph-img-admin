import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

const allowedHosts = (process.env.VITE_ALLOWED_HOSTS || "code.zyzhou.dpdns.org")
  .split(",")
  .map(host => host.trim())
  .filter(Boolean);

export default defineConfig({
  base: process.env.VITE_BASE || "/proxy/5173/",
  plugins: [vue()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    allowedHosts
  }
});
