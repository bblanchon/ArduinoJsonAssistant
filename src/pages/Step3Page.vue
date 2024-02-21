<template>
  <div class="card">
    <h2 class="h4 card-header bg-primary text-white">Step 3: Program</h2>

    <div class="card-body">
      <CodeBlock :source="program.header" />

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

      <CodeBlock :source="program.body" />

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
import { useSettingsStore } from "@/stores/settings";
import { useProgramStore } from "@/stores/program";
import { inject, computed, watchEffect } from "vue";

const settings = useSettingsStore();
const program = useProgramStore();
const baseUrl = inject("baseUrl");

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
    {
      if: program.overridesSlotIdSize,
      label: "<code>ARDUINOJSON_SLOT_ID_SIZE</code>",
      url: `${baseUrl}/v7/config/slot_id_size/`,
    },
    {
      if: program.overridesStringLengthSize,
      label: "<code>ARDUINOJSON_STRING_LENGTH_SIZE</code>",
      url: `${baseUrl}/v7/config/string_length_size/`,
    },
    {
      if: program.overridesUseDouble,
      label: "<code>ARDUINOJSON_USE_DOUBLE</code>",
      url: `${baseUrl}/v7/config/use_double/`,
    },
    {
      if: program.overridesUseLongLong,
      label: "<code>ARDUINOJSON_USE_LONG_LONG</code>",
      url: `${baseUrl}/v7/config/use_long_long/`,
    },
  ].filter((link) => link.if),
);
</script>
