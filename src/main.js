import { createApp } from "vue";
import App from "./App.vue";
import { popover } from "./directives";
import router from "./router";
import { createPinia } from "pinia";
import { persistStore } from "./persistence";

const el = document.getElementById("assistant-app");
const app = createApp(App);
app.use(router);
app.use(createPinia());
persistStore();
app.provide("baseUrl", el.dataset.url || "");
app.provide("version", el.dataset.version);
app.directive("popover", popover);
app.mount(el);
