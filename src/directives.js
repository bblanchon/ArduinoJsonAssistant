export const popover = {
  mounted(el) {
    $(el).popover();
  },
  beforeUnmount(el) {
    $(el).popover("hide");
  },
};
