<template>
  <div class="card">
    <h2 class="h4 card-header bg-primary text-white">Step 2: JSON</h2>
    <div class="card-body d-flex flex-column">
      <div class="d-flex justify-content-between">
        <ExampleDownloader />
        <div
          class="custom-control custom-switch"
          v-if="settings.isDeserializing"
        >
          <input
            type="checkbox"
            class="custom-control-input"
            id="filter-switch"
            v-model="settings.filterEnabled"
          />
          <label class="custom-control-label" for="filter-switch"
            >Enable input filter</label
          >
        </div>
      </div>
      <div class="row flex-fill">
        <div class="col-lg d-flex flex-column">
          <h3 class="h5">
            {{ { serialize: "Output", deserialize: "Input" }[settings.mode] }}
          </h3>
          <JsonEditor
            :modelValue="settings.inputJson"
            @update:modelValue="settings.setInputJson"
            :placeholder="`Enter here the JSON document you want your program to ${settings.mode}.`"
          />
        </div>
        <div
          v-if="settings.isDeserializing && settings.filterEnabled"
          class="col-lg d-flex flex-column"
        >
          <h3 class="h5">Filter</h3>
          <JsonEditor
            :modelValue="settings.filterJson"
            @update:modelValue="settings.setFilterJson"
            placeholder="Enter here the filter you want to apply to your inputdocument."
          />
        </div>
        <div
          v-if="settings.isDeserializing && settings.filterEnabled"
          class="col-lg d-flex flex-column"
        >
          <h3 class="h5">Filtered input</h3>
          <JsonEditor
            :modelValue="filteredInputJson"
            readonly
            placeholder="See here the result of applying the filter to your input
            document."
          />
        </div>
      </div>

      <div class="border rounded bg-light my-3">
        <div class="row">
          <div class="col-sm-4 my-3">
            <RamGauge />
          </div>
          <div class="col-sm-4 my-3">
            <SlotsGauge />
          </div>
          <div class="col-sm-4 my-3">
            <StringsGauge />
          </div>
        </div>
      </div>

      <div
        v-for="alert in alerts"
        :key="alert.id"
        :class="`short-${alert.type} mb-3`"
        v-html="alert.message"
      ></div>

      <LibraryConfiguration />
      <AssistantTweaks />
    </div>

    <div class="card-footer">
      <div class="d-flex justify-content-between">
        <RouterLink class="btn btn-secondary" :to="{ name: 'step1' }">
          Previous
        </RouterLink>
        <RouterLink
          class="btn btn-primary"
          :class="{ disabled: settings.hasErrors }"
          :to="{ name: 'step3' }"
        >
          Next: Program
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useSettingsStore } from "@/stores/settings";
import { useAlertsStore } from "@/stores/alerts";
import { computed } from "vue";

const settings = useSettingsStore();
const { alerts } = useAlertsStore();

const filteredInputJson = computed(() =>
  JSON.stringify(settings.filteredInput, null, 2),
);
</script>
