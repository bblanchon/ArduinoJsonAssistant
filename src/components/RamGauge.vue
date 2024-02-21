<template>
  <div class="d-flex flex-column align-items-center">
    <h3 class="h5">RAM usage</h3>
    <BaseGauge
      :value="stats.peakRamUsage"
      :max="board.ram"
      :warning="0.5"
      :danger="0.75"
      :value-text="formatBytes(stats.finalDocSize)"
      title="RAM usage"
      :label="formatBytes(stats.peakRamUsage) + ' peak'"
      bytes
    />
  </div>
</template>

<script setup>
import bytes from "bytes";

import { useStatsStore } from "@/stores/stats";
import { useBoardStore } from "@/stores/board";

const stats = useStatsStore();
const board = useBoardStore();

function formatBytes(values) {
  return bytes.format(values, { decimalPlaces: 1, unitSeparator: " " });
}
</script>
