<template>
  <div>
    <nav class="assistant-nav">
      <StepNumber
        v-for="(step, idx) in steps"
        :key="idx"
        :route="{ name: step.route }"
        :disabled="step.disabled"
        :label="step.label"
        :number="idx + 1"
      />
    </nav>

    <RouterView />
  </div>
</template>

<script setup lang="ts">
import { useSettingsStore } from "@/stores/settings";

import StepNumber from "@/components/StepNumber.vue";
import { computed } from "vue";

const settings = useSettingsStore();

const steps = computed(() => [
  {
    route: "step1",
    label: "Configuration",
  },
  {
    label: "JSON",
    route: "step2",
  },
  {
    label: "Program",
    route: "step3",
    disabled: settings.hasErrors,
  },
]);
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
