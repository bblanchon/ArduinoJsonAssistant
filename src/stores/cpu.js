import { defineStore } from "pinia";
import { computed } from "vue";

import cpuInfos from "@/assistant/cpus";

import { useConfigStore } from "./config";

export const useCpuStore = defineStore("cpu", () => {
  const cfg = useConfigStore();
  const cpu = computed(() => cpuInfos[cfg.cpu]);
  return {
    name: computed(() => cpu.value.label),
    nestingLimit: computed(() => cpu.value.nestingLimit),
    ramError: computed(() => cpu.value.ramError),
    ramWarning: computed(() => cpu.value.ramWarning),
    doubleSupported: computed(() => !!cpu.value.useDouble),
    doubleIsDefault: computed(() => !!cpu.value.useDouble?.default),
    doubleInconsequential: computed(
      () => cpu.value.slotSize == cpu.value.useDouble.slotSize,
    ),
    longLongSupported: computed(() => !!cpu.value.useLongLong),
    longLongIsDefault: computed(() => !!cpu.value.useLongLong?.default),
    longLongInconsequential: computed(
      () => cpu.value.slotSize == cpu.value.useLongLong.slotSize,
    ),
    psram: computed(() => cfg.cpu === "esp32"),
  };
});
