<template>
  <div class="d-flex flex-column align-items-center">
    <h3 class="h5">String length</h3>
    <BaseGauge
      :value="stats.maxStringLength"
      :max="settings.maxStringLength"
      :warning="0.8"
      :danger="0.95"
    />
  </div>
</template>

<script setup lang="ts">
import { useStatsStore } from "@/stores/stats";
import { useSettingsStore } from "@/stores/settings";

import BaseGauge from "@/components/BaseGauge.vue";

const stats = useStatsStore();
const settings = useSettingsStore();
</script>
