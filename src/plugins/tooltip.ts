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

  function createTooltips(el: HTMLElement) {
    el.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((trigger) => {
      new bootstrap.Tooltip(trigger as HTMLElement);
    });
  }

  function disposeTooltips(el: HTMLElement) {
    el.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((trigger) => {
      bootstrap.Tooltip.getInstance(trigger as HTMLElement)?.dispose();
    });
  }

  app.directive("html-tooltips", {
    mounted(el) {
      createTooltips(el);
    },
    beforeUpdate(el) {
      disposeTooltips(el);
    },
    updated(el) {
      createTooltips(el);
    },
    beforeUnmount(el) {
      disposeTooltips(el);
    },
  });
}
