<template>
  <div>
    <div class="stepwizard">
      <div
        v-for="(step, index) in steps"
        class="stepwizard-step"
        :key="step.number"
      >
        <RouterLink
          :to="{ name: step.route }"
          class="btn stepwizard-btn"
          :class="{ disabled: step.disabled }"
          @click="currentStepIndex = index"
        >
          {{ step.number }}
        </RouterLink>
        <p>
          <small>{{ step.label }}</small>
        </p>
      </div>
    </div>

    <RouterView />
  </div>
</template>

<script>
import "@/assets/stepwizard.scss";

import { RouterView, RouterLink } from "vue-router";
import { mapState } from "pinia";
import { useStore } from "@/store";

export default {
  components: { RouterView, RouterLink },
  computed: {
    ...mapState(useStore, ["hasErrors"]),
    steps() {
      return [
        {
          number: 1,
          route: "step1",
          label: "Configuration",
        },
        {
          number: 2,
          route: "step2",
          label: "JSON",
        },
        {
          number: 3,
          route: "step3",
          label: "Size",
          disabled: this.hasErrors,
        },
        {
          number: 4,
          label: "Program",
          route: "step4",
          disabled: this.hasErrors,
        },
      ];
    },
  },
};
</script>
