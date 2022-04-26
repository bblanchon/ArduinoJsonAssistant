export const popover = {
  mounted(el) {
    $(el).popover();
  },
  beforeUnmount(el) {
    $(el).popover("hide");
  },
};

export default function (app) {
  app.directive("popover", popover);
}
