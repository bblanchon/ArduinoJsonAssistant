import { defineStore } from "pinia";
import { ref } from "vue";
import hljs from "highlight.js/lib/core";
import cpp from "highlight.js/lib/languages/cpp";

import { sleep } from "@/utils";
import { generateParsingProgram } from "@/assistant/parsingProgram";
import { generateSerializingProgram } from "@/assistant/serializingProgram";

import { useConfigStore } from "./config";
import { useCpuStore } from "./cpu";
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
  const cfg = useConfigStore();
  const cpu = useCpuStore();
  const stats = useStatsStore();
  const program = ref("");

  async function generate() {
    switch (cfg.mode) {
      case "deserialize":
        program.value = generateParsingProgram({
          root: cfg.input,
          filter: cfg.filterEnabled ? cfg.filter : undefined,
          nestingLimit:
            stats.nestingLevel > cpu.nestingLimit
              ? stats.nestingLevel
              : undefined,
          cpu: {
            serial: cpu.serial,
            progmem: cpu.progmem,
          },
          inputType: cfg.ioTypeId,
        });
        break;

      case "serialize":
        program.value = generateSerializingProgram({
          root: cfg.input,
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
  };
});
