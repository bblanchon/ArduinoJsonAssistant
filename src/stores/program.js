import { defineStore } from "pinia";
import { ref, computed } from "vue";

import { generateParsingProgram } from "@/assistant/parsingProgram";
import { generateSerializingProgram } from "@/assistant/serializingProgram";

import { useSettingsStore } from "./settings";
import { useBoardStore } from "./board";
import { useStatsStore } from "./stats";

export const useProgramStore = defineStore("program", () => {
  const cfg = useSettingsStore();
  const board = useBoardStore();
  const stats = useStatsStore();
  const body = ref("");
  const ioLibrary = ref("serial");
  const progmem = ref(false);

  async function generate() {
    let code;

    switch (cfg.mode) {
      case "deserialize":
        code = generateParsingProgram({
          input: cfg.input,
          inputType: cfg.ioType,
          filter: cfg.filterEnabled ? cfg.filter : undefined,
          nestingLimit:
            stats.nestingLevel > board.memoryModel.nestingLimit
              ? stats.nestingLevel
              : undefined,
          serial: ioLibrary.value == "serial",
          progmem: progmem.value,
        });
        break;

      case "serialize":
        code = generateSerializingProgram({
          output: cfg.input,
          outputType: cfg.ioType,
        });
        break;
    }

    body.value = code;
  }

  const overridesUseDouble = computed(
    () => board.doubleIsDefault != cfg.useDouble,
  );
  const overridesUseLongLong = computed(
    () => board.longLongIsDefault != cfg.useLongLong,
  );
  const overridesSlotIdSize = computed(
    () => board.slotIdSize != cfg.slotIdSize,
  );
  const overridesStringLengthSize = computed(
    () => board.stringLengthSize != cfg.stringLengthSize,
  );

  const header = computed(() => {
    const lines = [];
    if (overridesSlotIdSize.value)
      lines.push(`#define ARDUINOJSON_SLOT_ID_SIZE ${cfg.slotIdSize}`);
    if (overridesStringLengthSize.value)
      lines.push(
        `#define ARDUINOJSON_STRING_LENGTH_SIZE ${cfg.stringLengthSize}`,
      );
    if (overridesUseDouble.value)
      lines.push(`#define ARDUINOJSON_USE_DOUBLE ${+cfg.useDouble}`);
    if (overridesUseLongLong.value)
      lines.push(`#define ARDUINOJSON_USE_LONG_LONG ${+cfg.useLongLong}`);
    lines.push(`#include <ArduinoJson.h>`);
    return lines.join("\n");
  });

  return {
    header,
    body,
    generate,
    ioLibrary,
    progmem,
    overridesSlotIdSize,
    overridesStringLengthSize,
    overridesUseDouble,
    overridesUseLongLong,
  };
});
