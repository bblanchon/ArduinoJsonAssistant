<template>
  <div class="card">
    <h2 class="h4 card-header bg-primary text-white">Step 3: Program</h2>

    <div class="card-body">
      <div
        class="alert alert-warning"
        v-if="cpuInfo.useLongLong && cpuInfo.useLongLong.default != useLongLong"
      >
        ⚠️ This program assumes you defined
        <a :href="`${baseUrl}/v7/api/config/use_long_long/`"
          ><code>ARDUINOJSON_USE_LONG_LONG</code></a
        >
        to <code>{{ +useLongLong }}</code>
      </div>
      <div
        class="alert alert-warning"
        v-if="cpuInfo.useDouble && cpuInfo.useDouble.default != useDouble"
      >
        ⚠️ This program assumes you defined
        <a :href="`${baseUrl}/v7/api/config/use_double/`"
          ><code>ARDUINOJSON_USE_DOUBLE</code></a
        >
        to <code>{{ +useDouble }}</code>
      </div>
      <figure class="position-relative">
        <button
          class="btn position-absolute"
          :class="{
            'btn-outline-primary': !programCopied,
            'btn-success': programCopied,
          }"
          :disabled="programCopied"
          style="top: 1em; right: 1em; width: 6em"
          @click="copyProgram"
        >
          {{ programCopied ? "✓ Copied" : "Copy" }}
        </button>
        <div class="highlight p-3">
          <pre><code class="hljs" v-html="programHtml"></code></pre>
        </div>
      </figure>
      <ul class="list-inline card-text">
        <li class="list-inline-item font-weight-bold">See also</li>
        <li v-if="isDeserializing" class="list-inline-item">
          <a :href="`${baseUrl}/v7/tutorial/deserialization/`"
            >Deserialization Tutorial</a
          >
        </li>
        <li v-if="isSerializing" class="list-inline-item">
          <a :href="`${baseUrl}/v7/tutorial/serialization/`"
            >Serialization Tutorial</a
          >
        </li>
        <li class="list-inline-item">
          <a :href="`${baseUrl}/v7/api/jsondocument/`"
            ><code>JsonDocument</code></a
          >
        </li>
        <li v-if="isDeserializing" class="list-inline-item">
          <a :href="`${baseUrl}/v7/api/json/deserializejson/`"
            ><code>deserializeJson()</code></a
          >
        </li>
        <li v-if="isSerializing" class="list-inline-item">
          <a :href="`${baseUrl}/v7/api/json/serializejson/`"
            ><code>serializeJson()</code></a
          >
        </li>
      </ul>
    </div>

    <div class="card-footer">
      <RouterLink class="btn btn-secondary" :to="{ name: 'step2' }">
        Previous
      </RouterLink>
    </div>
  </div>
</template>

<script>
import hljs from "highlight.js/lib/core";
import cpp from "highlight.js/lib/languages/cpp";
import "@/assets/highlight.scss";

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

import { generateParsingProgram } from "@/assistant/parsingProgram";
import { generateSerializingProgram } from "@/assistant/serializingProgram";
import { mapState } from "pinia";
import { useStore } from "@/store";

const sleep = (m) => new Promise((r) => setTimeout(r, m));

function generateProgram(cfg) {
  switch (cfg.mode) {
    case "deserialize":
    case "deserialize-filter":
      return generateParsingProgram(cfg);

    case "serialize":
      return generateSerializingProgram(cfg);
  }
  throw new Error(`Invalid mode ${cfg.mode}`);
}

export default {
  inject: ["baseUrl"],
  data() {
    return {
      programCopied: false,
      program: "",
      programHtml: "",
    };
  },
  computed: {
    ...mapState(useStore, [
      "cpuInfo",
      "isDeserializing",
      "isSerializing",
      "configuration",
      "useLongLong",
      "useDouble",
    ]),
  },
  created() {
    this.generateProgram();
  },
  methods: {
    async copyProgram() {
      await navigator.clipboard.writeText(this.program);
      this.programCopied = true;
      await sleep(500);
      this.programCopied = false;
    },
    async generateProgram() {
      this.programHtml = this.program = generateProgram(this.configuration);
      await sleep(100);
      this.programHtml = hljs.highlight(this.program, {
        language: "cpp",
      }).value;
    },
  },
};
</script>
