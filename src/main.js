import { createApp } from "vue";
import App from "./App.vue";
import popover from "./plugins/popover";
import tooltip from "./plugins/tooltip";
import router from "./router";
import { createPinia } from "pinia";
import { persistStore } from "./persistence";

const sponsorsEl = document.getElementById("assistant-sponsors");
const sponsors = sponsorsEl ? JSON.parse(sponsorsEl.textContent) : [];

const el = document.getElementById("assistant-app");

createApp(App)
  .use(router)
  .use(createPinia())
  .use(popover)
  .use(tooltip)
  .provide("baseUrl", el.dataset.url || "")
  .provide("version", el.dataset.version)
  .provide("scriptUrl", document.currentScript?.src)
  .provide("sponsors", sponsors)
  .mount(el);

persistStore();
