import { defineStore } from "pinia";
import { computed } from "vue";

import { measureSize } from "@/assistant/analyzer";
import cpuInfos from "@/assets/cpus.json";
import { hasJsonInJsonSyndrome, measureNesting } from "@/assistant/analyzer";
import { needsDouble, needsLongLong } from "@/assistant/analyzer";

import { useSettingsStore } from "./settings";

export const useStatsStore = defineStore("stats", () => {
  const cfg = useSettingsStore();

  const slotSize = computed(() => {
    const cpu = cpuInfos[cfg.cpu];
    if (cfg.useLongLong && cfg.useDouble)
      return Math.max(cpu.useLongLong.slotSize, cpu.useDouble.slotSize);
    if (cfg.useDouble) return cpu.useDouble.slotSize;
    if (cfg.useLongLong) return cpu.useLongLong.slotSize;
    return cpu.slotSize;
  });

  const size = computed(() =>
    measureSize(cfg.input, {
      mode: cfg.mode,
      filter: cfg.filterEnabled ? cfg.filter : undefined,
      slotSize: slotSize.value,
      poolCapacity: cpuInfos[cfg.cpu].poolCapacity,
      ignoreKeys: cfg.ignoreKeys,
      ignoreValues: cfg.ignoreValues,
      deduplicateKeys: cfg.deduplicateKeys,
      deduplicateValues: cfg.deduplicateValues,
      useLongLong: cfg.useLongLong,
      useDouble: cfg.useDouble,
    }),
  );

  return {
    nestingLevel: computed(() => measureNesting(cfg.input)),
    ramUsage: computed(() => size.value.memoryUsage),
    peakRamUsage: computed(() => size.value.peakMemoryUsage),
    doubleNeeded: computed(() => needsDouble(cfg.filteredInput)),
    longLongNeeded: computed(() => needsLongLong(cfg.filteredInput)),
    jsonInJson: computed(() => hasJsonInJsonSyndrome(cfg.filteredInput)),
  };
});
