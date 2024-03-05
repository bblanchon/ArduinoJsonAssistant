import { resolve } from "path"
import { defineConfig } from "vite"

import vue from "@vitejs/plugin-vue"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: resolve(__dirname, "src/main.js"),
      name: "ArduinoJsonAssistant",
      fileName: (format) => "assistant.js",
      formats: ["iife"]
    }
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV)
  }
})
