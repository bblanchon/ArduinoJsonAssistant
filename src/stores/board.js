import { defineStore } from "pinia";
import { computed } from "vue";

import boards from "@/assets/boards.json";
import memoryModels from "@/assets/memoryModels.json";

import { useSettingsStore } from "./settings";

export const useBoardStore = defineStore("board", () => {
  const cfg = useSettingsStore();
  const board = computed(() => boards[cfg.cpu]);
  const memoryModel = computed(() => `${board.value.bits}-bit`);
  return {
    name: computed(() => board.value.name),
    nestingLimit: computed(() => memoryModels[memoryModel.value].nestingLimit),
    ram: computed(() => board.value.ram),
    memoryModel,
    stdStringOverhead: computed(
      () => memoryModels[memoryModel.value].stdStringOverhead,
    ),
    arduinoStringOverhead: computed(
      () => memoryModels[memoryModel.value].arduinoStringOverhead,
    ),
    doubleSupported: computed(
      () => !!memoryModels[memoryModel.value].doubleSupported,
    ),
    doubleIsDefault: computed(
      () => !!memoryModels[memoryModel.value].doubleIsDefault,
    ),
    doubleInconsequential: computed(
      () =>
        memoryModels[memoryModel.value].slotSize[0] ==
        memoryModels[memoryModel.value].slotSize[1],
    ),
    longLongSupported: true,
    longLongIsDefault: computed(
      () => !!memoryModels[memoryModel.value].longLongIsDefault,
    ),
    longLongInconsequential: computed(
      () =>
        memoryModels[memoryModel.value].slotSize[0] ==
        memoryModels[memoryModel.value].slotSize[1],
    ),
    psram: computed(() => cfg.cpu === "esp32"),
  };
});
