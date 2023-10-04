<template>
  <div class="d-md-flex align-items-center">
    <div class="flex-none mr-3">
      RAM usage: <b>{{ ramUsage }} bytes</b> ({{ peakRamUsage }} peak)
    </div>
    <div class="progress flex-fill">
      <div
        class="progress-bar"
        :class="`bg-${ramColor}`"
        role="progressbar"
        :style="{ width: ramPercent + '%' }"
        :aria-valuenow="ramPercent"
        aria-valuemin="0"
        aria-valuemax="100"
      ></div>
      <div
        class="progress-bar progress-bar-striped"
        :class="`bg-${ramColor}`"
        role="progressbar"
        :style="{ width: peakRamPercent + '%' }"
        :aria-valuenow="peakRamPercent"
        aria-valuemin="0"
        aria-valuemax="100"
      ></div>
    </div>
  </div>
</template>

<script>
import { mapState } from "pinia";
import { useCpuStore } from "@/stores/cpu";
import { useStatsStore } from "@/stores/stats";

export default {
  inject: ["baseUrl"],
  computed: {
    ...mapState(useStatsStore, ["peakRamUsage", "ramUsage"]),
    ...mapState(useCpuStore, ["ramError", "ramWarning"]),
    ramPercent() {
      return (this.peakRamUsage / this.ramError) * 100;
    },
    peakRamPercent() {
      if (this.ramUsage >= this.ramError) return 0;
      return ((this.peakRamUsage - this.ramUsage) / this.ramError) * 100;
    },
    ramColor() {
      if (this.peakRamUsage > this.ramError) return "danger";
      if (this.peakRamUsage > this.ramWarning) return "warning";
      return "success";
    },
  },
};
</script>
