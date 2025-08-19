import { createApp } from "vue";
import App from "./App.vue";
import tooltip from "./plugins/tooltip";
import router from "./router";
import { createPinia } from "pinia";
import { persistStore } from "./persistence";

const el = document.getElementById("assistant-app")!;

// CAUTION: document.currentScript might return null if not called from the entry point
const script = document.currentScript as HTMLScriptElement | undefined;

createApp(App)
  .use(router)
  .use(createPinia())
  .use(tooltip)
  .provide("version", "7.4")
  .provide("scriptUrl", script?.src)
  .mount(el);

persistStore();
