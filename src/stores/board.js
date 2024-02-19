import { defineStore } from "pinia";
import { computed } from "vue";

import boards from "@/assets/boards.json";
import memoryModels from "@/assets/memoryModels.json";

import { useSettingsStore } from "./settings";

export const useBoardStore = defineStore("board", () => {
  const cfg = useSettingsStore();
  const board = computed(() => boards[cfg.cpu]);
  const arch = computed(() => `${board.value.bits}-bit`);
  const memoryModel = computed(() => memoryModels[arch.value]);
  return {
    name: computed(() => board.value.name),
    ram: computed(() => board.value.ram),
    arch,
    memoryModel,
    doubleSupported: computed(() => !!memoryModel.value.doubleSupported),
    doubleIsDefault: computed(() => !!memoryModel.value.doubleIsDefault),
    doubleInconsequential: computed(
      () => memoryModel.value.slotSize[0] == memoryModel.value.slotSize[1],
    ),
    longLongSupported: true,
    longLongIsDefault: computed(() => !!memoryModel.value.longLongIsDefault),
    longLongInconsequential: computed(
      () => memoryModel.value.slotSize[0] == memoryModel.value.slotSize[1],
    ),
    psram: computed(() => cfg.cpu === "esp32"),
    maxSlots: computed(() => (1 << (memoryModel.value.slotIdSize * 8)) - 1),
  };
});
