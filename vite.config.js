import { fileURLToPath, URL } from "node:url";
import path from "node:path";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueComponents from "unplugin-vue-components/vite";
import svgLoader from "vite-svg-loader";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), vueComponents(), svgLoader()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    sourcemap: true,
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
