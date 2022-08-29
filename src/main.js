import { createApp } from "vue";
import App from "./App.vue";
import popover from "./plugins/popover";
import router from "./router";
import { createPinia } from "pinia";
import { persistStore } from "./persistence";

const el = document.getElementById("assistant-app");
const sponsors = document.getElementById("assistant-sponsors");

const app = createApp(App);
app.use(router);
app.use(createPinia());
persistStore();
app.provide("baseUrl", el.dataset.url || "");
app.provide("version", el.dataset.version);
app.provide("scriptUrl", document.currentScript?.src);
if (sponsors) {
  sponsors.remove();
  app.provide("sponsors", JSON.parse(sponsors.textContent));
} else {
  app.provide("sponsors", []);
}
app.use(popover);
app.mount(el);
