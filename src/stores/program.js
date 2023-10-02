import { defineStore } from "pinia";
import { ref } from "vue";
import hljs from "highlight.js/lib/core";
import cpp from "highlight.js/lib/languages/cpp";

import { sleep } from "@/utils";
import { generateParsingProgram } from "@/assistant/parsingProgram";
import { generateSerializingProgram } from "@/assistant/serializingProgram";

import { useConfigStore } from "./config";

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
  const program = ref("");

  async function generate() {
    switch (cfg.mode) {
      case "deserialize":
        program.value = generateParsingProgram(cfg.configuration);
        break;

      case "serialize":
        program.value = generateSerializingProgram(cfg.configuration);
        break;

      default:
        throw new Error(`Invalid mode ${cfg.mode}`);
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
