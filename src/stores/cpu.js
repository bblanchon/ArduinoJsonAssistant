import { defineStore } from "pinia";
import { computed } from "vue";

import boards from "@/assets/boards.json";
import memoryModels from "@/assets/memoryModels.json";

import { useSettingsStore } from "./settings";

export const useCpuStore = defineStore("cpu", () => {
  const cfg = useSettingsStore();
  const cpu = computed(() => boards[cfg.cpu]);
  const memoryModel = computed(() => memoryModels[cpu.value.memoryModel]);
  return {
    name: computed(() => cpu.value.name),
    nestingLimit: computed(() => cpu.value.nestingLimit),
    ram: computed(() => cpu.value.ram),
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
  };
});
