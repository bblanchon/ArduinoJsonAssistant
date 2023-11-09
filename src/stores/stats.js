import { defineStore } from "pinia";
import { computed } from "vue";

import { measureSize } from "@/assistant/analyzer";
import { hasJsonInJsonSyndrome, measureNesting } from "@/assistant/analyzer";
import { needsDouble, needsLongLong } from "@/assistant/analyzer";

import { useSettingsStore } from "./settings";
import { useBoardStore } from "./board";

export const useStatsStore = defineStore("stats", () => {
  const cfg = useSettingsStore();
  const board = useBoardStore();

  const size = computed(() =>
    measureSize(cfg.input, {
      mode: cfg.mode,
      filter: cfg.filterEnabled ? cfg.filter : undefined,
      arch: board.arch,
      ignoreKeys: cfg.ignoreKeys,
      ignoreValues: cfg.ignoreValues,
      deduplicateKeys: cfg.deduplicateKeys,
      deduplicateValues: cfg.deduplicateValues,
      useLongLong: cfg.useLongLong,
      useDouble: cfg.useDouble,
      overAllocateStrings: cfg.mode == "deserialize",
    }),
  );

  const bufferSize = computed(() => {
    let size = JSON.stringify(cfg.input).length + 1;
    switch (cfg.ioType) {
      case "arduinoStream":
      case "stdStream":
        return 0;
      case "arduinoString":
        size += board.memoryModel.arduinoStringOverhead;
        break;
      case "stdString":
        size += board.memoryModel.stdStringOverhead;
        break;
    }
    return size;
  });

  return {
    nestingLevel: computed(() => measureNesting(cfg.input)),
    ramUsage: computed(() => size.value.memoryUsage),
    peakRamUsage: computed(() => size.value.peakMemoryUsage),
    doubleNeeded: computed(() => needsDouble(cfg.filteredInput)),
    longLongNeeded: computed(() => needsLongLong(cfg.filteredInput)),
    jsonInJson: computed(() => hasJsonInJsonSyndrome(cfg.filteredInput)),
    bufferSize,
  };
});
