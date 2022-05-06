import { fileURLToPath, URL } from "url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";

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
    rollupOptions: {
      output: {
        // https://github.com/vitejs/vite/issues/4863
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === "style.css") return "assistant.css";
          return assetInfo.name;
        },
      },
    },
  },
});
