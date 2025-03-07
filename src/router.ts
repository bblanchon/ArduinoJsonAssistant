import { createRouter, createWebHashHistory } from "vue-router";
import AssistantStep1 from "./pages/Step1Page.vue";
import AssistantStep2 from "./pages/Step2Page.vue";
import AssistantStep3 from "./pages/Step3Page.vue";
import { useSettingsStore } from "@/stores/settings";

const router = createRouter({
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
      meta: {
        requiresNoError: true,
      },
    },
    {
      path: "/:pathMatch(.*)*",
      redirect: { name: "step1", params: {} },
    },
  ],
  linkActiveClass: "active",
  linkExactActiveClass: "active-exact",
});

router.beforeEach((to) => {
  const store = useSettingsStore();
  if (to.meta.requiresNoError && store.hasErrors) {
    return { name: "step2" };
  }
});

export default router;
