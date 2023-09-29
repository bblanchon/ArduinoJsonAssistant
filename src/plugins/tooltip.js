export default function (app) {
  app.directive("tooltip", {
    mounted(el, { value }) {
      $(el).tooltip({
        title: value,
      });
    },
    beforeUnmount(el) {
      $(el).tooltip("dispose");
    },
  });
}
