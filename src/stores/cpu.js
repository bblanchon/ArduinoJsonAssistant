import { defineStore } from "pinia";
import { computed } from "vue";

import boards from "@/assets/boards.json";
import memoryModels from "@/assets/memoryModels.json";

import { useSettingsStore } from "./settings";

export const useCpuStore = defineStore("cpu", () => {
  const cfg = useSettingsStore();
  const cpu = computed(() => boards[cfg.cpu]);
  const memoryModel = computed(() => `${cpu.value.bits}-bit`);
  return {
    name: computed(() => cpu.value.name),
    nestingLimit: computed(() => cpu.value.nestingLimit),
    ram: computed(() => cpu.value.ram),
    memoryModel,
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
