import { createRouter, createWebHashHistory } from "vue-router";
import AssistantStep1 from "./pages/Step1Page.vue";
import AssistantStep2 from "./pages/Step2Page.vue";
import AssistantStep3 from "./pages/Step3Page.vue";
import AssistantStep4 from "./pages/Step4Page.vue";

export default createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/step1",
      name: "step1",
      component: AssistantStep1,
    },
    {
      path: "/step2",
      name: "step2",
      component: AssistantStep2,
    },
    {
      path: "/step3",
      name: "step3",
      component: AssistantStep3,
    },
    {
      path: "/step4",
      name: "step4",
      component: AssistantStep4,
    },
    {
      path: "/:pathMatch(.*)*",
      redirect: { name: "step1" },
    },
  ],
  linkActiveClass: "active",
  linkExactActiveClass: "active-exact",
});
