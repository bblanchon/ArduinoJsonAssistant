import { fileURLToPath, URL } from "node:url";
import path from "node:path";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/main.js"),
      formats: ["iife"],
      name: "ArduinoJsonAssistant",
      fileName: (format) => "assistant.js",
    },
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
  },
});
