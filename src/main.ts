import { createApp } from "vue";
import App from "./App.vue";
import tooltip from "./plugins/tooltip";
import router from "./router";
import { createPinia } from "pinia";
import { persistStore } from "./persistence";

const el = document.getElementById("assistant-app")!;

createApp(App)
  .use(router)
  .use(createPinia())
  .use(tooltip)
  .provide("baseUrl", el!.dataset.url || "")
  .provide("version", "7.3")
  .provide(
    "scriptUrl",
    (document.currentScript as HTMLScriptElement | undefined)?.src,
  )
  .mount(el);

persistStore();
