import { defineStore } from "pinia";
import { ref } from "vue";
import hljs from "highlight.js/lib/core";
import cpp from "highlight.js/lib/languages/cpp";

import { sleep } from "@/utils";
import { generateParsingProgram } from "@/assistant/parsingProgram";
import { generateSerializingProgram } from "@/assistant/serializingProgram";

import { useConfigStore } from "./config";
import { useCpuStore } from "./cpu";

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
  const program = ref("");

  async function generate() {
    const fct = {
      deserialize: generateParsingProgram,
      serialize: generateSerializingProgram,
    }[cfg.mode];

    program.value = fct({
      root: cfg.input,
      filter: cfg.filterEnabled ? cfg.filter : undefined,
      cpu: {
        nestingLimit: cpu.nestingLimit,
        serial: cpu.serial,
        progmem: cpu.progmem,
      },
      inputType: cfg.ioTypeId,
    });

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
