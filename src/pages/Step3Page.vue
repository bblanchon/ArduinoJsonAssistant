<template>
  <div class="card">
    <h2 class="h4 card-header bg-primary text-white">Step 3: Program</h2>

    <div class="card-body">
      <div
        class="alert alert-warning"
        v-if="board.longLongIsDefault != settings.useLongLong"
      >
        ⚠️ This program assumes you defined
        <a :href="`${baseUrl}/v7/api/config/use_long_long/`"
          ><code>ARDUINOJSON_USE_LONG_LONG</code></a
        >
        to <code>{{ +settings.useLongLong }}</code>
      </div>
      <div
        class="alert alert-warning"
        v-if="board.doubleIsDefault != settings.useDouble"
      >
        ⚠️ This program assumes you defined
        <a :href="`${baseUrl}/v7/api/config/use_double/`"
          ><code>ARDUINOJSON_USE_DOUBLE</code></a
        >
        to <code>{{ +settings.useDouble }}</code>
      </div>

      <div class="form-inline" v-if="settings.isDeserializing">
        <label for="io-library" class="sr-only">Name</label>
        <select
          id="io-library"
          v-model="program.ioLibrary"
          class="form-control mb-2 mr-sm-2"
        >
          <option value="serial">Serial</option>
          <option value="iostream">iostream</option>
        </select>

        <div class="custom-control custom-switch mb-2 mr-sm-2">
          <input
            class="custom-control-input"
            type="checkbox"
            id="progmem"
            v-model="program.progmem"
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
        <div class="highlight p-3 program">
          <pre><code class="hljs" v-html="program.programHtml"></code></pre>
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

<script setup>
import "@/assets/highlight.scss";

import { useSettingsStore } from "@/stores/settings";
import { useBoardStore } from "@/stores/board";
import { useProgramStore } from "@/stores/program";
import { sleep } from "@/utils";
import { inject, computed, ref, watchEffect } from "vue";

const settings = useSettingsStore();
const board = useBoardStore();
const program = useProgramStore();
const baseUrl = inject("baseUrl");

const programCopied = ref(false);

watchEffect(() => program.generate());

const links = computed(() =>
  [
    {
      if: settings.isDeserializing,
      label: "Deserialization Tutorial",
      url: `${baseUrl}/v7/tutorial/deserialization/`,
    },
    {
      if: settings.isSerializing,
      label: "Serialization Tutorial",
      url: `${baseUrl}/v7/tutorial/serialization/`,
    },
    {
      label: "<code>JsonDocument</code>",
      url: `${baseUrl}/v7/api/jsondocument/`,
    },
    {
      if: settings.isDeserializing,
      label: "<code>deserializeJson()</code>",
      url: `${baseUrl}/v7/api/json/deserializejson/`,
    },
    {
      if: settings.isSerializing,
      label: "<code>serializeJson()</code>",
      url: `${baseUrl}/v7/api/json/serializejson/`,
    },
  ].filter((link) => link.if),
);

async function copyProgram() {
  await navigator.clipboard.writeText(program.programText);
  programCopied.value = true;
  await sleep(500);
  programCopied.value = false;
}
</script>

<style scoped>
.program {
  max-height: 30em;
  overflow-y: auto;
}
</style>
