export const popover = {
  mounted(el, { value }) {
    new bootstrap.Popover(el, value);
  },
  beforeUnmount(el) {
    bootstrap.Popover.getInstance(el).hide();
  },
};

export default function (app) {
  app.directive("popover", popover);
}
