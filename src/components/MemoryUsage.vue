<template>
  <div class="d-md-flex align-items-center">
    <div class="flex-none mr-3">
      <table>
        <tr>
          <td>JsonDocument:&nbsp;</td>
          <td class="text-right font-weight-bold">
            {{ formatBytes(finalDocSize) }}
          </td>
          <td>&nbsp;({{ formatBytes(peakDocSize) }} peak)</td>
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
          :style="{ width: finalDocPercent + '%' }"
          :aria-valuenow="finalDocPercent"
          aria-valuemin="0"
          aria-valuemax="100"
        >
          {{ finalDocPercent > 20 ? "JsonDocument" : "" }}
          {{ finalDocPercent > 10 ? formatBytes(finalDocSize) : "" }}
        </div>
        <div
          class="progress-bar progress-bar-striped"
          :class="`bg-${ramColor}`"
          role="progressbar"
          :style="{ width: peakDocDiffPercent + '%' }"
          :aria-valuenow="peakDocDiffPercent"
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
          Total RAM: {{ formatBytes(ram) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import bytes from "bytes";
import { mapState } from "pinia";
import { useBoardStore } from "@/stores/board";
import { useStatsStore } from "@/stores/stats";
import { useSettingsStore } from "@/stores/settings";

export default {
  inject: ["baseUrl"],
  computed: {
    ...mapState(useStatsStore, [
      "bufferSize",
      "finalDocSize",
      "peakDocSize",
      "peakRamUsage",
    ]),
    ...mapState(useBoardStore, ["ram"]),
    ...mapState(useSettingsStore, ["ioType", "mode"]),
    finalDocPercent() {
      return (this.finalDocSize / this.ram) * 100;
    },
    peakDocDiffPercent() {
      if (this.finalDocSize >= this.ram) return 0;
      return ((this.peakDocSize - this.finalDocSize) / this.ram) * 100;
    },
    totalRamPercent() {
      return (this.peakRamUsage / this.ram) * 100;
    },
    ramColor() {
      if (this.totalRamPercent > 60) return "danger";
      if (this.totalRamPercent > 40) return "warning";
      return "success";
    },
    bufferPercent() {
      return (this.bufferSize / this.ram) * 100;
    },
    bufferLabel() {
      if (this.ioType.endsWith("String"))
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
