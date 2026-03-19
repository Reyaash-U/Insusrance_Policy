import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      "@":           path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@pages":      path.resolve(__dirname, "./src/pages"),
      "@store":      path.resolve(__dirname, "./src/store"),
      "@hooks":      path.resolve(__dirname, "./src/hooks"),
      "@utils":      path.resolve(__dirname, "./src/utils"),
      "@api":        path.resolve(__dirname, "./src/api"),
      "@context":    path.resolve(__dirname, "./src/context"),
    },
  },

  server: {
    port: 5173,
    proxy: {
      "/api": {
        target:      "http://localhost:5000",
        changeOrigin: true,
        secure:       false,
      },
      "/socket.io": {
        target:    "http://localhost:5000",
        ws:        true,
        changeOrigin: true,
      },
    },
  },

  build: {
    outDir:        "dist",
    sourcemap:     false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor:   ["react", "react-dom", "react-router-dom"],
          redux:    ["@reduxjs/toolkit", "react-redux"],
          motion:   ["framer-motion"],
          charts:   ["recharts"],
          socket:   ["socket.io-client"],
        },
      },
    },
  },
});
