import { defineStore } from "pinia";
import { computed } from "vue";

import cpuInfos from "@/assets/cpus.json";
import memoryModels from "@/assets/memoryModels.json";

import { useSettingsStore } from "./settings";

export const useCpuStore = defineStore("cpu", () => {
  const cfg = useSettingsStore();
  const cpu = computed(() => cpuInfos[cfg.cpu]);
  const memoryModel = computed(() => memoryModels[cpu.value.memoryModel]);
  return {
    name: computed(() => cpu.value.label),
    nestingLimit: computed(() => cpu.value.nestingLimit),
    ramError: computed(() => cpu.value.ramError),
    ramWarning: computed(() => cpu.value.ramWarning),
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
    serial: computed(() => cpu.value.serial),
    progmem: computed(() => cpu.value.progmem),
  };
});
