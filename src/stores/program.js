import { defineStore } from "pinia";
import { ref, computed } from "vue";
import hljs from "highlight.js/lib/core";
import cpp from "highlight.js/lib/languages/cpp";

import { sleep } from "@/utils";
import { generateParsingProgram } from "@/assistant/parsingProgram";
import { generateSerializingProgram } from "@/assistant/serializingProgram";

import { useSettingsStore } from "./settings";
import { useBoardStore } from "./board";
import { useStatsStore } from "./stats";

hljs.registerLanguage("cpp", (hljs) => {
  const lang = cpp(hljs);
  lang.keywords.type.push(
    "JsonArray",
    "JsonObject",
    "JsonVariant",
    "JsonDocument",
    "DeserializationError",
    "DeserializationOption",
  );
  return lang;
});

function escapeHtmlTags(str) {
  return str.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export const useProgramStore = defineStore("program", () => {
  const cfg = useSettingsStore();
  const board = useBoardStore();
  const stats = useStatsStore();
  const programText = ref("");
  const programHtml = ref("");
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

    programText.value = code;
    programHtml.value = escapeHtmlTags(code);
    await sleep(100);
    programHtml.value = hljs.highlight(code, { language: "cpp" }).value;
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

  const headerText = computed(() => {
    const lines = [];
    if (overridesSlotIdSize.value)
      lines.push(`#define ARDUINOJSON_SLOT_ID_SIZE ${cfg.slotIdSize}`);
    if (overridesUseDouble.value)
      lines.push(`#define ARDUINOJSON_USE_DOUBLE ${+cfg.useDouble}`);
    if (overridesUseLongLong.value)
      lines.push(`#define ARDUINOJSON_USE_LONG_LONG ${+cfg.useLongLong}`);
    lines.push(`#include <ArduinoJson.h>`);
    return lines.join("\n");
  });

  const headerHtml = computed(
    () => hljs.highlight(headerText.value, { language: "cpp" }).value,
  );

  return {
    headerText,
    headerHtml,
    programHtml,
    programText,
    generate,
    ioLibrary,
    progmem,
    overridesUseDouble,
    overridesUseLongLong,
    overridesSlotIdSize,
  };
});
