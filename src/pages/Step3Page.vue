<template>
  <div class="card">
    <h2 class="h4 card-header bg-primary text-white">Step 3: Program</h2>

    <div class="card-body">
      <div class="alert alert-warning" v-if="longLongIsDefault != useLongLong">
        ⚠️ This program assumes you defined
        <a :href="`${baseUrl}/v7/api/config/use_long_long/`"
          ><code>ARDUINOJSON_USE_LONG_LONG</code></a
        >
        to <code>{{ +useLongLong }}</code>
      </div>
      <div class="alert alert-warning" v-if="doubleIsDefault != useDouble">
        ⚠️ This program assumes you defined
        <a :href="`${baseUrl}/v7/api/config/use_double/`"
          ><code>ARDUINOJSON_USE_DOUBLE</code></a
        >
        to <code>{{ +useDouble }}</code>
      </div>

      <div class="form-inline" v-if="isDeserializing">
        <label for="io-library" class="sr-only">Name</label>
        <select
          id="io-library"
          v-model="ioLibrary"
          class="form-control mb-2 mr-sm-2"
        >
          <option value="serial">Serial</option>
          <option value="iostream">iostream</option>
        </select>

        <div
          class="custom-control custom-switch mb-2 mr-sm-2"
          v-if="ioLibrary == 'serial'"
        >
          <input
            class="custom-control-input"
            type="checkbox"
            id="progmem"
            v-model="progmem"
          />
          <label class="custom-control-label" for="progmem"
            >Flash strings</label
          >
        </div>
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
          <pre><code class="hljs" v-html="program"></code></pre>
        </div>
      </figure>
      <ul class="list-inline card-text">
        <li class="list-inline-item font-weight-bold">See also</li>
        <li v-for="link in links" :key="link.label" class="list-inline-item">
          <a :href="link.url" v-html="link.label"></a>
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
import { mapState, mapActions, mapWritableState } from "pinia";
import "@/assets/highlight.scss";

import { useSettingsStore } from "@/stores/settings";
import { useCpuStore } from "@/stores/cpu";
import { useProgramStore } from "@/stores/program";
import { sleep } from "@/utils";

export default {
  inject: ["baseUrl"],
  data() {
    return {
      programCopied: false,
    };
  },
  computed: {
    ...mapState(useProgramStore, ["program"]),
    ...mapWritableState(useProgramStore, ["ioLibrary", "progmem"]),
    ...mapState(useSettingsStore, [
      "isDeserializing",
      "isSerializing",
      "useLongLong",
      "useDouble",
    ]),
    ...mapState(useCpuStore, ["longLongIsDefault", "doubleIsDefault"]),
    links() {
      return [
        {
          if: this.isDeserializing,
          label: "Deserialization Tutorial",
          url: `${this.baseUrl}/v7/tutorial/deserialization/`,
        },
        {
          if: this.isSerializing,
          label: "Serialization Tutorial",
          url: `${this.baseUrl}/v7/tutorial/serialization/`,
        },
        {
          label: "<code>JsonDocument</code>",
          url: `${this.baseUrl}/v7/api/jsondocument/`,
        },
        {
          if: this.isDeserializing,
          label: "<code>deserializeJson()</code>",
          url: `${this.baseUrl}/v7/api/json/deserializejson/`,
        },
        {
          if: this.isSerializing,
          label: "<code>serializeJson()</code>",
          url: `${this.baseUrl}/v7/api/json/serializejson/`,
        },
      ].filter((link) => link.if);
    },
  },
  created() {
    this.generate();
  },
  methods: {
    async copyProgram() {
      await navigator.clipboard.writeText(this.program);
      this.programCopied = true;
      await sleep(500);
      this.programCopied = false;
    },
    ...mapActions(useProgramStore, ["generate"]),
  },
  watch: {
    ioLibrary() {
      this.generate();
    },
    progmem() {
      this.generate();
    },
  },
};
</script>
