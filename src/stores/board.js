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
    longLongSupported: true,
    longLongIsDefault: computed(() => !!memoryModel.value.longLongIsDefault),
    psram: computed(() => cfg.cpu === "esp32"),
  };
});
