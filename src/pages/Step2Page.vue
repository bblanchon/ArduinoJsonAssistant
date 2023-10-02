<template>
  <div class="card">
    <h2 class="h4 card-header bg-primary text-white">Step 2: JSON</h2>
    <div class="card-body resize-lg-vertical d-flex flex-column">
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

      <div class="d-flex align-items-center my-3">
        <div class="flex-none mr-3">
          Memory consumption: <b>{{ ramUsage }} bytes</b>
        </div>
        <div class="progress flex-fill">
          <div
            class="progress-bar"
            :class="`bg-${ramColor}`"
            role="progressbar"
            :style="{ width: ramPercent + '%' }"
            :aria-valuenow="ramPercent"
            aria-valuemin="0"
            aria-valuemax="100"
          ></div>
        </div>
      </div>

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
import { useConfigStore } from "@/stores/config";
import { useCpuStore } from "@/stores/cpu";
import { useAlertsStore } from "@/stores/alerts";
import { useStatsStore } from "@/stores/stats";

export default {
  inject: ["baseUrl"],
  computed: {
    ...mapState(useConfigStore, [
      "filter",
      "filteredInput",
      "filterJson",
      "hasErrors",
      "input",
      "inputJson",
      "isDeserializing",
      "mode",
    ]),
    ...mapState(useStatsStore, ["peakRamUsage", "ramUsage"]),
    ...mapState(useCpuStore, ["ramError", "ramWarning"]),
    ...mapState(useAlertsStore, ["alerts"]),
    ...mapWritableState(useConfigStore, ["filterEnabled"]),
    filteredInputJson() {
      return JSON.stringify(this.filteredInput, null, 2);
    },
    ramPercent() {
      return (this.peakRamUsage / this.ramError) * 100;
    },
    ramColor() {
      if (this.peakRamUsage > this.ramError) return "danger";
      if (this.peakRamUsage > this.ramWarning) return "warning";
      return "success";
    },
  },
  methods: mapActions(useConfigStore, [
    "setInputJson",
    "setFilterJson",
    "setSettings",
  ]),
};
</script>
