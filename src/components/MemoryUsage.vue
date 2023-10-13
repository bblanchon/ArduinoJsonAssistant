<template>
  <div class="d-md-flex align-items-center">
    <div class="flex-none mr-3">
      <table>
        <tr>
          <td>JsonDocument:&nbsp;</td>
          <td class="text-right font-weight-bold">
            {{ formatBytes(ramUsage) }}
          </td>
          <td>&nbsp;({{ formatBytes(peakRamUsage) }} peak)</td>
        </tr>
        <tr v-if="bufferSize">
          <td>{{ bufferLabel }}:&nbsp;</td>
          <td class="text-right font-weight-bold">
            {{ formatBytes(bufferSize) }}
          </td>
          <td>&nbsp;(minified)</td>
        </tr>
      </table>
    </div>
    <div class="flex-fill">
      <div class="progress" style="min-height: 2em">
        <div
          v-if="bufferSize"
          class="progress-bar bg-dark"
          role="progressbar"
          :style="{ width: bufferPercent + '%' }"
          :aria-valuenow="bufferPercent"
          aria-valuemin="0"
          aria-valuemax="100"
        >
          {{ bufferPercent > 20 ? bufferLabel : "" }}
          {{ bufferPercent > 10 ? formatBytes(bufferSize) : "" }}
        </div>
        <div
          class="progress-bar"
          :class="`bg-${ramColor}`"
          role="progressbar"
          :style="{ width: ramPercent + '%' }"
          :aria-valuenow="ramPercent"
          aria-valuemin="0"
          aria-valuemax="100"
        >
          {{ ramPercent > 20 ? "JsonDocument" : "" }}
          {{ ramPercent > 10 ? formatBytes(ramUsage) : "" }}
        </div>
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
      <div
        v-if="totalRamPercent > 100"
        class="progress mt-1"
        style="min-height: 2em"
      >
        <div
          class="progress-bar bg-dark"
          role="progressbar"
          :style="{ width: (100 / totalRamPercent) * 100 + '%' }"
          aria-valuemin="0"
          aria-valuemax="100"
        >
          Total RAM: {{ formatBytes(ramError) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import bytes from "bytes";
import { mapState } from "pinia";
import { useCpuStore } from "@/stores/cpu";
import { useStatsStore } from "@/stores/stats";
import { useSettingsStore } from "@/stores/settings";

export default {
  inject: ["baseUrl"],
  computed: {
    ...mapState(useStatsStore, ["peakRamUsage", "ramUsage"]),
    ...mapState(useCpuStore, ["ramError", "ramWarning"]),
    ...mapState(useSettingsStore, ["ioTypeId", "input", "mode"]),
    ...mapState(useCpuStore, { cpuName: "name" }),
    ramPercent() {
      return (this.peakRamUsage / this.ramError) * 100;
    },
    peakRamPercent() {
      if (this.ramUsage >= this.ramError) return 0;
      return ((this.peakRamUsage - this.ramUsage) / this.ramError) * 100;
    },
    totalRamPercent() {
      return this.ramPercent + this.peakRamPercent;
    },
    ramColor() {
      if (this.totalRamPercent > 75) return "danger";
      if (this.totalRamPercent > 25) return "warning";
      return "success";
    },
    bufferSize() {
      if (this.ioTypeId.endsWith("Stream")) return 0;
      return JSON.stringify(this.input).length;
    },
    bufferPercent() {
      return (this.bufferSize / this.ramError) * 100;
    },
    bufferLabel() {
      if (this.ioTypeId.endsWith("String"))
        return this.mode == "serialize" ? "Output string" : "Input string";
      else return this.mode == "serialize" ? "Output buffer" : "Input buffer";
    },
  },
  methods: {
    formatBytes(values) {
      return bytes.format(values, { decimalPlaces: 1 });
    },
  },
};
</script>
