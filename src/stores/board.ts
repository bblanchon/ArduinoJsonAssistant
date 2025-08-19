import { defineStore } from "pinia";
import { computed } from "vue";

import boards from "@/assets/boards.json";
import memoryModels from "@/assets/memoryModels.json";

import { useSettingsStore } from "./settings";

export type BoardData = (typeof boards)["uno_r4_wifi"];
export type BoardDatabase = Record<string, BoardData>;

type Arch = "8-bit" | "16-bit" | "32-bit" | "64-bit";

export const useBoardStore = defineStore("board", () => {
  const cfg = useSettingsStore();
  const board = computed(() => (boards as BoardDatabase)[cfg.cpu]!);
  const arch = computed(() => `${board.value.bits}-bit` as Arch);
  const memoryModel = computed(() => memoryModels[arch.value]);
  return {
    name: computed(() => board.value.name),
    ram: computed(() => board.value.ram),
    arch,
    memoryModel,
    doubleSupported: computed(() => !!memoryModel.value.doubleSupported),
    doubleIsDefault: computed(() => !!memoryModel.value.doubleIsDefault),
    longLongIsDefault: computed(() => !!memoryModel.value.longLongIsDefault),
    psram: computed(() => cfg.cpu === "esp32"),
    slotIdSize: computed(() => memoryModel.value.slotIdSize),
    stringLengthSize: computed(() => memoryModel.value.stringLengthSize),
  };
});
