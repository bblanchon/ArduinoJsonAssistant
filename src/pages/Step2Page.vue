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

      <p
        v-for="alert in alerts"
        :key="alert.id"
        :class="`short-${alert.type} mb-3`"
        v-html="alert.message"
      ></p>

      <details>
        <summary>
          Tweaks
          <button
            v-if="tweakCount"
            type="button"
            class="btn btn-outline-warning btn-sm py-0"
            style="margin-top: -5px"
            @click="resetTweaks"
          >
            Reset {{ tweakCount }} {{ tweakCount > 1 ? "changes" : "change" }}
          </button>
          <span v-else>(advanced users only)</span>
        </summary>
        <div v-if="cpuInfo.useDouble" class="form-group">
          <label for="useDouble" class="col-form-label">
            Store floating point values as
          </label>
          <select id="useDouble" class="form-control" v-model="useDouble">
            <option v-if="cpuInfo.useDouble.default" :value="true">
              double (default)
            </option>
            <option v-else :value="true">
              double (#define ARDUINOJSON_USE_DOUBLE 1)
            </option>
            <option v-if="cpuInfo.useDouble.default" :value="false">
              float (#define ARDUINOJSON_USE_DOUBLE 0)
            </option>
            <option v-else :value="false">float (default)</option>
          </select>
          <small
            v-if="cpuInfo.useDouble.slotSize == cpuInfo.slotSize"
            class="form-text text-muted"
          >
            This setting doesn't affect the document size of this platform, so
            you won't see any change in the table above.
          </small>
          <small v-else class="form-text text-muted">
            Choose <code>float</code> to reduce the document size; choose
            <code>double</code> if you need the increased precision and range.
          </small>
        </div>
        <div v-if="cpuInfo.useLongLong" class="form-group">
          <label for="useLongLong" class="col-form-label">
            Store integral values values as
          </label>
          <select id="useLongLong" class="form-control" v-model="useLongLong">
            <option v-if="cpuInfo.useLongLong.default" :value="true">
              long long (default)
            </option>
            <option v-else :value="true">
              long long (#define ARDUINOJSON_USE_LONG_LONG 1)
            </option>
            <option v-if="cpuInfo.useLongLong.default" :value="false">
              long (#define ARDUINOJSON_USE_LONG_LONG 0)
            </option>
            <option v-else :value="false">long (default)</option>
          </select>
          <small
            v-if="cpuInfo.useLongLong.slotSize == cpuInfo.slotSize"
            class="form-text text-muted"
          >
            This setting doesn't affect the document size of this platform, so
            you won't see any change in the table above.
          </small>
          <small v-else class="form-text text-muted">
            Choose <code>long</code> to reduce the document size; choose
            <code>long long</code> if you need the increased range.<br />
            In both cases, out-of-range values will be promoted to
            <code>{{ useDouble ? "double" : "float" }}</code
            >.
          </small>
        </div>
        <div class="form-group form-check" v-if="isSerializing">
          <input
            id="assume-const-values"
            class="form-check-input"
            type="checkbox"
            v-model="assumeConstValues"
          />
          <label for="assume-const-values" class="form-check-label"
            >Assume values are <code>const char*</code></label
          >
          <small class="form-text text-muted">
            <code>JsonDocument</code> stores strings differently depending on
            their types. It stores <code>const char*</code> by pointer (which
            takes no extra space) and all other types by copy.<br />
            Check this box if you're only adding
            <code>const char*</code> values.
          </small>
        </div>
        <div class="form-group form-check" v-if="isSerializing">
          <input
            id="assume-const-keys"
            class="form-check-input"
            type="checkbox"
            v-model="assumeConstKeys"
          />
          <label for="assume-const-keys" class="form-check-label"
            >Assume keys are <code>const char*</code></label
          >
          <small class="form-text text-muted">
            Same as above but for keys.<br />
            Uncheck this box if your program generates keys at runtime.
          </small>
        </div>
        <div class="form-group form-check" v-if="!ignoreValues">
          <input
            id="deduplicate-values"
            class="form-check-input"
            type="checkbox"
            v-model="deduplicateValues"
          />
          <label for="deduplicate-values" class="form-check-label">
            Deduplicate values when measuring the capacity
          </label>
          <small class="form-text text-muted">
            ArduinoJson detects duplicate strings to store only one copy, but
            you can tell the Assistant to include all strings.<br />
            You should uncheck this box if you used placeholders values (like
            <code>XXXX</code>) in step 2.
          </small>
        </div>
        <div class="form-group form-check mb-0" v-if="!ignoreKeys">
          <input
            id="deduplicate-keys"
            class="form-check-input"
            type="checkbox"
            v-model="deduplicateKeys"
          />
          <label for="deduplicate-keys" class="form-check-label">
            Deduplicate keys when measuring the capacity
          </label>
          <small class="form-text text-muted">
            Same as above, but for keys instead of values.<br />
            You should check this box unless you know what you're doing.
          </small>
        </div>
      </details>
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
import { useStore } from "@/store";
import { measureSize } from "@/assistant/analyzer";

export default {
  inject: ["baseUrl"],
  computed: {
    ...mapState(useStore, [
      "configuration",
      "cpu",
      "cpuInfo",
      "filter",
      "filteredInput",
      "filterJson",
      "hasErrors",
      "hasJsonInJsonSyndrome",
      "ignoreKeys",
      "ignoreValues",
      "input",
      "inputJson",
      "isDeserializing",
      "isSerializing",
    ]),
    ...mapWritableState(useStore, [
      "assumeConstKeys",
      "assumeConstValues",
      "deduplicateKeys",
      "deduplicateValues",
      "filterEnabled",
      "useDouble",
      "useLongLong",
    ]),
    defaults() {
      return {
        assumeConstKeys: this.isSerializing ? true : undefined,
        assumeConstValues: this.isSerializing ? false : undefined,
        deduplicateKeys: true,
        deduplicateValues: false,
        useDouble: !!this.cpuInfo.useDouble?.default,
        useLongLong: !!this.cpuInfo.useLongLong?.default,
      };
    },
    filteredInputJson() {
      return JSON.stringify(this.filteredInput, null, 2);
    },
    hasJsonInJsonSyndrome() {
      return hasJsonInJsonSyndrome(this.filteredInput);
    },
    needsDouble() {
      return needsDouble(this.filteredInput);
    },
    needsLongLong() {
      return needsLongLong(this.filteredInput);
    },
    nestingLevel() {
      return measureNesting(this.input);
    },
    tweakCount() {
      return Object.entries(this.defaults).filter(
        ([key, defaultValue]) =>
          defaultValue !== undefined && this[key] !== defaultValue,
      ).length;
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
      const alerts = [];
      if (this.isDeserializing && this.nestingLevel > this.cpuInfo.nestingLimit)
        alerts.push({
          id: "too-deep",
          type: "warning",
          message: `This document is deeply nested; don't forget to pass <a href="${this.baseUrl}/v7/api/json/deserializejson/#nesting-limit"><code>DeserializationOption::NestingLimit(${this.nestingLevel})</code></a>`,
        });
      if (
        this.needsLongLong &&
        this.cpuInfo.useLongLong &&
        !this.cpuInfo.useLongLong.default
      )
        alerts.push({
          id: "long-long",
          type: "warning",
          message: `This document contains <code>long&nbsp;long</code>; you should define <a href="${this.baseUrl}/v7/api/config/use_long_long/"><code>ARDUINOJSON_USE_LONG_LONG</code></a> to <code>1</code>`,
        });
      if (
        this.needsDouble &&
        this.cpuInfo.useDouble &&
        !this.cpuInfo.useDouble.default
      )
        alerts.push({
          id: "double",
          type: "warning",
          message: `This document contains <code>double</code>; you should define <a href="${this.baseUrl}/v7/api/config/use_double/"><code>ARDUINOJSON_USE_DOUBLE</code></a> to <code>1</code>`,
        });
      if (this.needsDouble && !this.cpuInfo.useDouble)
        alerts.push({
          id: "double-not-supported",
          type: "warning",
          message: `This document contains double-precision floating points values but ${this.cpuInfo.label} doesn't support them (<code>double</code> is the same as <code>float</code>)`,
        });
      if (this.hasJsonInJsonSyndrome)
        alerts.push({
          id: "json-in-json",
          type: "warning",
          message: `This document suffers from the <q>JSON in JSON</q> syndrome, so you may need to call <a href="${this.baseUrl}/v7/api/json/deserializejson/"><code>deserializeJson()</code></a> multiple times. <strong>The ArduinoJson Assistant doesn't support this scenario.</strong>`,
        });
      if (this.ramColor == "danger")
        alerts.push({
          id: "size-error",
          type: "danger",
          message: `This is too big to fit in the RAM. See <a href="${this.baseUrl}/v7/how-to/deserialize-a-very-large-document/">How to deserialize a very large document?</a>`,
        });
      if (this.ramColor == "warning")
        alerts.push({
          id: "size-warning",
          type: "warning",
          message: `This may not fit in the RAM. Make sure there is enough free space.`,
        });
      if (this.ramColor == "danger" && this.cpu === "esp32")
        alerts.push({
          id: "esp32-psram",
          type: "tip",
          message: `This is too big to fit in the RAM. See <a href="${this.baseUrl}/v7/how-to/use-external-ram-on-esp32/">How to use external RAM on an ESP32?</a>`,
        });
      return alerts;
    },
  },
  methods: {
    ...mapActions(useStore, ["setInputJson", "setFilterJson", "setSettings"]),
    resetTweaks() {
      this.setSettings(this.defaults);
    },
  },
};
</script>
