export const popover = {
  mounted(el, { value }) {
    $(el).popover(value);
  },
  beforeUnmount(el) {
    $(el).popover("hide");
  },
};

export default function (app) {
  app.directive("popover", popover);
}
