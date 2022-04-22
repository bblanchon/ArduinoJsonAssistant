import { createApp } from "vue";
import App from "./App.vue";

const el = document.getElementById("assistant-app");
createApp(App, el.dataset).mount(el);
