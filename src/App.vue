<template>
  <div>
    <nav class="assistant-nav">
      <StepNumber number="1" label="Configuration" />
      <StepNumber number="2" label="JSON" />
      <StepNumber number="3" label="Program" :disabled="settings.hasErrors" />
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
