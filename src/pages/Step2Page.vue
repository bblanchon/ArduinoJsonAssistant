<template>
  <div class="card">
    <h2 class="h4 card-header bg-primary text-white">Step 2: JSON</h2>
    <div class="card-body d-flex flex-column">
      <div class="d-flex justify-content-between">
        <ExampleDownloader />
        <div class="custom-control custom-switch" v-if="isDeserializing">
          <input
            type="checkbox"
            class="custom-control-input"
            id="filter-switch"
            v-model="filterEnabled"
          />
          <label class="custom-control-label" for="filter-switch"
            >Enable input filter</label
          >
        </div>
      </div>
      <div class="row flex-fill">
        <div class="col-lg d-flex flex-column">
          <h3 class="h5">
            {{ { serialize: "Output", deserialize: "Input" }[mode] }}
          </h3>
          <JsonEditor
            :modelValue="inputJson"
            @update:modelValue="setInputJson"
            :placeholder="`Enter here the JSON document you want your program to ${mode}.`"
          />
        </div>
        <div
          v-if="isDeserializing && filterEnabled"
          class="col-lg d-flex flex-column"
        >
          <h3 class="h5">Filter</h3>
          <JsonEditor
            :modelValue="filterJson"
            @update:modelValue="setFilterJson"
            placeholder="Enter here the filter you want to apply to your inputdocument."
          />
        </div>
        <div
          v-if="isDeserializing && filterEnabled"
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

      <MemoryUsage class="my-3" />

      <div
        v-for="alert in alerts"
        :key="alert.id"
        :class="`short-${alert.type} mb-3`"
        v-html="alert.message"
      ></div>

      <AdvancedSettings />
    </div>

    <div class="card-footer">
      <div class="d-flex justify-content-between">
        <RouterLink class="btn btn-secondary" :to="{ name: 'step1' }">
          Previous
        </RouterLink>
        <RouterLink
          class="btn btn-primary"
          :class="{ disabled: hasErrors }"
          :to="{ name: 'step3' }"
        >
          Next: Program
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script>
import { mapActions, mapState, mapWritableState } from "pinia";
import { useSettingsStore } from "@/stores/settings";
import { useAlertsStore } from "@/stores/alerts";

export default {
  computed: {
    ...mapState(useSettingsStore, [
      "filter",
      "filteredInput",
      "filterJson",
      "hasErrors",
      "input",
      "inputJson",
      "isDeserializing",
      "mode",
    ]),
    ...mapState(useAlertsStore, ["alerts"]),
    ...mapWritableState(useSettingsStore, ["filterEnabled"]),
    filteredInputJson() {
      return JSON.stringify(this.filteredInput, null, 2);
    },
  },
  methods: mapActions(useSettingsStore, ["setInputJson", "setFilterJson"]),
};
</script>
