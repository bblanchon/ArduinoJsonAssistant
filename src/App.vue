<template>
  <div>
    <nav class="assistant-nav">
      <StepNumber
        v-for="step in steps"
        :key="step.number"
        :route="{ name: step.route }"
        :disabled="step.disabled"
        :label="step.label"
        :number="step.number"
      />
    </nav>

    <RouterView />
  </div>
</template>

<script>
import { RouterView } from "vue-router";
import { mapState } from "pinia";
import { useStore } from "@/store";
import StepNumber from "@/components/StepNumber.vue";

export default {
  components: { RouterView, StepNumber },
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

<style lang="scss">
.assistant-nav {
  display: flex;
  justify-content: space-evenly;
  position: relative;

  &:before {
    top: 14px;
    bottom: 0;
    position: absolute;
    content: " ";
    width: 100%;
    height: 1px;
    background-color: #ccc;
    z-index: -1;
  }
}
</style>
