import { defineStore } from "pinia";
import { computed } from "vue";

import { measureSize } from "@/assistant/analyzer";
import { hasJsonInJsonSyndrome, measureNesting } from "@/assistant/analyzer";
import { needsDouble, needsLongLong } from "@/assistant/analyzer";

import { useSettingsStore } from "./settings";
import { useCpuStore } from "./cpu";

export const useStatsStore = defineStore("stats", () => {
  const cfg = useSettingsStore();
  const cpu = useCpuStore();

  const size = computed(() =>
    measureSize(cfg.input, {
      mode: cfg.mode,
      filter: cfg.filterEnabled ? cfg.filter : undefined,
      memoryModel: cpu.memoryModel,
      ignoreKeys: cfg.ignoreKeys,
      ignoreValues: cfg.ignoreValues,
      deduplicateKeys: cfg.deduplicateKeys,
      deduplicateValues: cfg.deduplicateValues,
      useLongLong: cfg.useLongLong,
      useDouble: cfg.useDouble,
      overAllocateStrings: cfg.mode == "deserialize",
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
