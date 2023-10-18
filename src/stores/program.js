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

export const useProgramStore = defineStore("program", () => {
  const cfg = useSettingsStore();
  const board = useBoardStore();
  const stats = useStatsStore();
  const program = ref("");
  const ioLibrary = ref("serial");
  const progmem = ref(false);

  async function generate() {
    switch (cfg.mode) {
      case "deserialize":
        program.value = generateParsingProgram({
          input: cfg.input,
          inputType: cfg.ioTypeId,
          filter: cfg.filterEnabled ? cfg.filter : undefined,
          nestingLimit:
            stats.nestingLevel > board.nestingLimit
              ? stats.nestingLevel
              : undefined,
          serial: ioLibrary.value == "serial",
          progmem: progmem.value,
        });
        break;

      case "serialize":
        program.value = generateSerializingProgram({
          output: cfg.input,
          outputType: cfg.ioTypeId,
        });
        break;
    }

    await sleep(100);

    program.value = hljs.highlight(program.value, {
      language: "cpp",
    }).value;
  }

  return {
    program,
    generate,
    ioLibrary,
    progmem,
  };
});
