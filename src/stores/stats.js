import { defineStore } from "pinia";
import { computed } from "vue";

import { measureSize } from "@/assistant/analyzer";
import { hasJsonInJsonSyndrome, measureNesting } from "@/assistant/analyzer";
import { needsDouble, needsLongLong } from "@/assistant/analyzer";

import { useConfigStore } from "./config";

export const useStatsStore = defineStore("stats", () => {
  const cfg = useConfigStore();

  const size = computed(() => measureSize(cfg.input, cfg.configuration));

  return {
    nestingLevel: computed(() => measureNesting(cfg.input)),
    ramUsage: computed(() => size.value.minimum),
    peakRamUsage: computed(() => size.value.recommended),
    doubleNeeded: computed(() => needsDouble(cfg.filteredInput)),
    longLongNeeded: computed(() => needsLongLong(cfg.filteredInput)),
    jsonInJson: computed(() => hasJsonInJsonSyndrome(cfg.filteredInput)),
  };
});
