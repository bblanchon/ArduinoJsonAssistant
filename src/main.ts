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
  .provide("version", "7.3")
  .mount(el);

persistStore();
