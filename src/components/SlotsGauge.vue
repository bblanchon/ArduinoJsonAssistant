<template>
  <div class="d-flex flex-column align-items-center">
    <h3 class="h5">Slot count</h3>
    <BaseGauge
      :value="stats.slotCount"
      :max="settings.maxSlotCount"
      :warning="0.8"
      :danger="0.95"
    />
  </div>
</template>

<script setup>
import { useStatsStore } from "@/stores/stats";
import { useSettingsStore } from "@/stores/settings";

const stats = useStatsStore();
const settings = useSettingsStore();
</script>
