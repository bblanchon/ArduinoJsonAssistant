<template>
  <div>
    <nav class="assistant-nav">
      <StepNumber step="1">Configuration</StepNumber>
      <StepNumber step="2">JSON</StepNumber>
      <StepNumber step="3" :disabled="settings.hasErrors">Program</StepNumber>
    </nav>

    <RouterView />
  </div>
</template>

<script setup lang="ts">
import { useSettingsStore } from "@/stores/settings";

import StepNumber from "@/components/StepNumber.vue";

const settings = useSettingsStore();
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
