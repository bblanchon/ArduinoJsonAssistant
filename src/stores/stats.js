import { defineStore } from "pinia";
import { computed } from "vue";

import {
  countSlots,
  measureSize,
  getMaxStringLength,
  hasJsonInJsonSyndrome,
  measureNesting,
  needsDouble,
  needsLongLong,
} from "@/assistant/analyzer";

import { useSettingsStore } from "./settings";
import { useBoardStore } from "./board";

export const useStatsStore = defineStore("stats", () => {
  const cfg = useSettingsStore();
  const board = useBoardStore();

  const size = computed(() =>
    measureSize(cfg.input, {
      filter:
        cfg.mode == "deserialize" && cfg.filterEnabled ? cfg.filter : undefined,
      arch: board.arch,
      ignoreKeys: cfg.ignoreKeys,
      ignoreValues: cfg.ignoreValues,
      deduplicateKeys: cfg.deduplicateKeys,
      deduplicateValues: cfg.deduplicateValues,
      useLongLong: cfg.useLongLong,
      useDouble: cfg.useDouble,
      overAllocateStrings: cfg.mode == "deserialize",
      slotIdSize: cfg.slotIdSize,
      stringLengthSize: cfg.stringLengthSize,
    }),
  );

  const bufferSize = computed(() => {
    if (cfg.input === undefined) return 0;
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

  const peakRamUsage = computed(
    () => size.value.peakMemoryUsage + bufferSize.value,
  );

  return {
    nestingLevel: computed(() => measureNesting(cfg.input)),
    finalDocSize: computed(() => size.value.memoryUsage),
    peakDocSize: computed(() => size.value.peakMemoryUsage),
    doubleNeeded: computed(() => needsDouble(cfg.filteredInput)),
    longLongNeeded: computed(() => needsLongLong(cfg.filteredInput)),
    jsonInJson: computed(() => hasJsonInJsonSyndrome(cfg.filteredInput)),
    slotCount: computed(() => countSlots(cfg.filteredInput)),
    maxStringLength: computed(() => getMaxStringLength(cfg.filteredInput, cfg)),
    bufferSize,
    peakRamUsage,
    ramStatus: computed(() => {
      const ratio = peakRamUsage.value / board.ram;
      return ratio > 0.75 ? "danger" : ratio > 0.5 ? "warning" : "success";
    }),
  };
});
