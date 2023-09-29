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
          <h3 class="h5">{{ isSerializing ? "Output" : "Input" }}</h3>
          <JsonEditor
            :modelValue="inputJson"
            @update:modelValue="setInputJson"
            :placeholder="`Enter here the JSON document you want your program to ${
              isSerializing ? 'generate' : 'parse'
            }.`"
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
          Memory consumption: <b>{{ capacity.minimum }} bytes</b>
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
import { hasJsonInJsonSyndrome, measureNesting } from "@/assistant/analyzer";
import { needsDouble, needsLongLong } from "@/assistant/analyzer";
import { useConfigStore } from "@/stores/config";
import { measureSize } from "@/assistant/analyzer";

export default {
  inject: ["baseUrl"],
  computed: {
    ...mapState(useConfigStore, [
      "configuration",
      "cpu",
      "cpuInfo",
      "filter",
      "filteredInput",
      "filterJson",
      "hasErrors",
      "hasJsonInJsonSyndrome",
      "input",
      "inputJson",
      "isDeserializing",
      "isSerializing",
    ]),
    ...mapWritableState(useConfigStore, ["filterEnabled"]),
    filteredInputJson() {
      return JSON.stringify(this.filteredInput, null, 2);
    },
    capacity() {
      return measureSize(this.input, this.configuration);
    },
    ramPercent() {
      return (this.capacity.recommended / this.cpuInfo.ramError) * 100;
    },
    ramColor() {
      if (this.capacity.recommended > this.cpuInfo.ramError) return "danger";
      if (this.capacity.recommended > this.cpuInfo.ramWarning) return "warning";
      return "success";
    },
    alerts() {
      const longLongNeeded = needsLongLong(this.filteredInput);
      const longLongIsDefault = !!this.cpuInfo.useLongLong?.default;
      const doubleNeeded = needsDouble(this.filteredInput);
      const doubleSupported = !!this.cpuInfo.useDouble;
      const doubleIsDefault = !!this.cpuInfo.useDouble?.default;
      const nestingLevel = measureNesting(this.input);
      return [
        {
          if: this.isDeserializing && nestingLevel > this.cpuInfo.nestingLimit,
          id: "too-deep",
          type: "warning",
          message: `This document is deeply nested; don't forget to pass <a href="${this.baseUrl}/v7/api/json/deserializejson/#nesting-limit"><code>DeserializationOption::NestingLimit(${nestingLevel})</code></a>`,
        },
        {
          if: longLongNeeded && !longLongIsDefault,
          id: "long-long",
          type: "warning",
          message: `This document contains <code>long&nbsp;long</code>; you should define <a href="${this.baseUrl}/v7/api/config/use_long_long/"><code>ARDUINOJSON_USE_LONG_LONG</code></a> to <code>1</code>`,
        },
        {
          if: doubleNeeded && doubleSupported && !doubleIsDefault,
          id: "double",
          type: "warning",
          message: `This document contains <code>double</code>; you should define <a href="${this.baseUrl}/v7/api/config/use_double/"><code>ARDUINOJSON_USE_DOUBLE</code></a> to <code>1</code>`,
        },
        {
          if: doubleNeeded && !doubleSupported,
          id: "double-not-supported",
          type: "warning",
          message: `This document contains double-precision floating points values but ${this.cpuInfo.label} doesn't support them (<code>double</code> is the same as <code>float</code>)`,
        },
        {
          if: hasJsonInJsonSyndrome(this.filteredInput),
          id: "json-in-json",
          type: "warning",
          message: `This document suffers from the <q>JSON in JSON</q> syndrome, so you may need to call <a href="${this.baseUrl}/v7/api/json/deserializejson/"><code>deserializeJson()</code></a> multiple times. <strong>The ArduinoJson Assistant doesn't support this scenario.</strong>`,
        },
        {
          if: this.ramColor == "danger",
          id: "size-error",
          type: "danger",
          message: `This is too big to fit in the RAM. See <a href="${this.baseUrl}/v7/how-to/deserialize-a-very-large-document/">How to deserialize a very large document?</a>`,
        },
        {
          if: this.ramColor == "warning",
          id: "size-warning",
          type: "warning",
          message: `This may not fit in the RAM. Make sure there is enough free space.`,
        },
        {
          if: this.ramColor == "danger" && this.cpu === "esp32",
          id: "esp32-psram",
          type: "tip",
          message: `This is too big to fit in the RAM. See <a href="${this.baseUrl}/v7/how-to/use-external-ram-on-esp32/">How to use external RAM on an ESP32?</a>`,
        },
      ].filter((alert) => alert.if);
    },
  },
  methods: mapActions(useConfigStore, [
    "setInputJson",
    "setFilterJson",
    "setSettings",
  ]),
};
</script>
