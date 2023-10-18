import { defineStore } from "pinia";
import { ref } from "vue";
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
  const program = ref("");
  const ioLibrary = ref("serial");
  const progmem = ref(false);

  async function generate() {
    let code;

    switch (cfg.mode) {
      case "deserialize":
        code = generateParsingProgram({
          input: cfg.input,
          inputType: cfg.ioTypeId,
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
          outputType: cfg.ioTypeId,
        });
        break;
    }

    program.value = escapeHtmlTags(code);
    await sleep(100);
    program.value = hljs.highlight(code, { language: "cpp" }).value;
  }

  return {
    program,
    generate,
    ioLibrary,
    progmem,
  };
});
