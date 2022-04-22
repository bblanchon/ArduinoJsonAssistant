import { createApp } from "vue";
import App from "./App.vue";
import { popover } from "./directives";

const el = document.getElementById("assistant-app");
const app = createApp(App, el.dataset);
app.directive("popover", popover);
app.mount(el);
