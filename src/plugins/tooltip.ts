import { type App } from "vue";

export default function (app: App) {
  app.directive("tooltip", {
    mounted(el, { value }) {
      new bootstrap.Tooltip(el, {
        title: value,
      });
    },
    beforeUnmount(el) {
      bootstrap.Tooltip.getInstance(el).hide();
    },
  });
}
