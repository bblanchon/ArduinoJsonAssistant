<template>
  <div v-cloak>
    <div class="stepwizard">
      <div
        v-for="(step, index) in steps"
        class="stepwizard-step"
        :key="step.number"
      >
        <button
          type="button"
          class="stepwizard-btn"
          :class="{ active: currentStepIndex >= index }"
          @click="currentStepIndex = index"
          :disabled="step.disabled"
        >
          {{ step.number }}
        </button>
        <p>
          <small>{{ step.label }}</small>
        </p>
      </div>
    </div>

    <div class="card">
      <h2 class="h4 card-header bg-primary text-white">
        Step {{ currentStep.number }}: {{ currentStep.label }}
      </h2>

      <div v-if="currentStepIndex == 0" class="card-body">
        <form class="mb-4">
          <div class="form-group row">
            <label for="cpu-selector" class="col-sm-2 col-form-label"
              >Processor</label
            >
            <div class="col-sm-10">
              <select
                id="cpu-selector"
                class="form-control"
                :value="cpu"
                @input="selectCpu($event.target.value)"
              >
                <option
                  v-for="(value, key) in cpuInfos"
                  :value="key"
                  :key="key"
                >
                  {{ value.label }}
                </option>
              </select>
            </div>
          </div>
          <div class="form-group row">
            <label for="mode-selector" class="col-sm-2 col-form-label"
              >Mode</label
            >
            <div class="col-sm-10">
              <select
                id="mode-selector"
                class="form-control"
                :value="mode"
                @input="selectMode($event.target.value)"
              >
                <option value="deserialize">Deserialize</option>
                <option value="deserialize-filter">
                  Deserialize and filter
                </option>
                <option value="serialize">Serialize</option>
              </select>
            </div>
          </div>
          <div class="form-group row">
            <label for="io-type" class="col-sm-2 col-form-label">
              {{ isSerializing ? "Output" : "Input" }} type
            </label>
            <div class="col-sm-10">
              <select id="io-type" class="form-control" v-model="ioTypeId">
                <option
                  v-for="(type, key) in ioTypes"
                  :key="key"
                  :value="key"
                  :disabled="type.disabled"
                >
                  {{ type.label }}
                </option>
              </select>
              <small
                v-if="currentIoType &amp;&amp; currentIoType.info"
                class="form-text text-muted"
                v-html="currentIoType.info"
              ></small>
            </div>
          </div>
        </form>
        <p class="short-warning" v-if="adBlocked">
          <strong>Your adblocker is blocking web analytics.</strong>
          Please consider whitelisting <code>arduinojson.org</code>
        </p>
        <p class="short-tip" v-else>
          This is the Assistant for ArduinoJson {{ version }}. Make sure the
          same version is installed on your computer.
        </p>
      </div>

      <div
        v-if="currentStepIndex == 1"
        class="card-body resize-lg-vertical d-flex flex-column"
      >
        <p>
          Examples:
          <a
            href="#"
            @click.prevent="
              downloadSettings(
                `${url}/v6/assistant/examples/openweathermap.json`
              )
            "
            >OpenWeatherMap</a
          >,
          <a
            href="#"
            @click.prevent="
              downloadSettings(`${url}/v6/assistant/examples/reddit.json`)
            "
            >Reddit</a
          >
        </p>
        <div class="row flex-fill">
          <div class="col-lg d-flex flex-column">
            <template v-if="isSerializing">
              <h3 class="h5">Output</h3>
              <small class="text-muted"
                >Enter here the JSON document you want your program to
                generate.</small
              >
            </template>
            <template v-else>
              <h3 class="h5">Input</h3>
              <small class="text-muted"
                >Enter here the JSON document you want your program to
                parse.</small
              >
            </template>
            <textarea
              class="form-control flex-fill resize-none"
              :class="{ 'is-invalid': inputError }"
              rows="10"
              v-model="inputJson"
            ></textarea>
            <div v-if="inputError" class="invalid-feedback">
              {{ inputError }}
            </div>
            <small v-else class="d-flex justify-content-between">
              <span class="form-text text-muted"
                >Input length: {{ inputJson.length }}</span
              >
              <a
                href="#"
                class="btn btn-sm btn-primary mt-1"
                @click.prevent="prettifyInput"
                >Prettify</a
              >
            </small>
          </div>
          <div v-if="filterEnabled" class="col-lg d-flex flex-column">
            <h3 class="h5">Filter</h3>
            <small class="text-muted"
              >Enter here the filter you want to apply to your input
              document.</small
            >
            <textarea
              class="form-control flex-fill resize-none"
              :class="{ 'is-invalid': filterError }"
              rows="10"
              v-model="filterJson"
            ></textarea>
            <div v-if="filterError" class="invalid-feedback">
              {{ filterError }}
            </div>
            <small v-else class="text-right">
              <a
                href="#"
                class="btn btn-sm btn-primary mt-1"
                @click.prevent="prettifyFilter"
                >Prettify</a
              >
            </small>
          </div>
          <div v-if="filterEnabled" class="col-lg d-flex flex-column">
            <h3 class="h5">Filtered input</h3>
            <small class="text-muted"
              >See here the result of applying the filter to your input
              document.</small
            >
            <textarea
              class="form-control flex-fill resize-none"
              rows="10"
              readonly
              v-model="filteredInputJson"
            ></textarea>
          </div>
        </div>
        <p
          v-if="isDeserializing &amp;&amp; nestingLevel > cpuInfo.nestingLimit"
          class="short-warning mt-4"
        >
          This document is deeply nested; don't forget to pass
          <a :href="`${url}/v6/api/json/deserializejson/#nesting-limit`"
            ><code
              >DeserializationOption::NestingLimit({{ nestingLevel }})</code
            ></a
          >.
        </p>
        <p
          v-if="needsLongLong &amp;&amp; cpuInfo.useLongLong &amp;&amp; !cpuInfo.useLongLong.default"
          class="short-warning mt-4"
        >
          This document contains <code>long&nbsp;long</code>; you should define
          <a :href="`${url}/v6/api/config/use_long_long/`"
            ><code>ARDUINOJSON_USE_LONG_LONG</code></a
          >
          to <code>1</code>
        </p>
        <p
          v-if="needsDouble &amp;&amp; cpuInfo.useDouble &amp;&amp; !cpuInfo.useDouble.default"
          class="short-warning mt-4"
        >
          This document contains <code>double</code>; you should define
          <a :href="`${url}/v6/api/config/use_double/`"
            ><code>ARDUINOJSON_USE_DOUBLE</code></a
          >
          to <code>1</code>
        </p>
        <p
          v-if="needsDouble &amp;&amp; !cpuInfo.useDouble"
          class="short-warning mt-4"
        >
          This document contains double-precision floating points values but the
          selected platform ({{ cpuInfo.label }}) doesn't support them (<code
            >double</code
          >
          is the same as <code>float</code>).
        </p>
        <p v-if="hasJsonInJsonSyndrome" class="short-warning mt-4">
          This document suffers from the <q>JSON in JSON</q> syndrome, so you
          may need to call
          <a
            v-if="isDeserializing"
            :href="`${url}/v6/api/json/deserializejson/`"
            ><code>deserializeJson()</code></a
          >
          <a v-else :href="`${url}/v6/api/json/serializejson/`"
            ><code>serializeJson()</code></a
          >
          multiple time.
          <strong
            >The ArduinoJson Assistant doesn't support this scenario for the
            moment.</strong
          >
        </p>
      </div>

      <div v-if="currentStepIndex == 2" class="card-body">
        <table class="table m-0">
          <tr>
            <th scope="row">Data structures</th>
            <td>{{ capacity.slots }}</td>
            <td class="text-muted">
              Bytes needed to stores the JSON objects and arrays in memory
              <a
                href="#"
                v-popover
                title="Expression"
                :data-content="expression"
                onclick="return false"
                ><InfoIcon
              /></a>
            </td>
          </tr>
          <tr>
            <th scope="row">Strings</th>
            <td>{{ capacity.strings }}</td>
            <td class="text-muted">
              Bytes needed to stores the strings in memory
              <a
                href="#"
                v-popover
                title="Deduplication"
                :data-content="
                  'Accoding to the configuration, ' + stringsDetails
                "
                onclick="return false"
                ><InfoIcon
              /></a>
            </td>
          </tr>
          <tr v-if="mode === 'deserialize-filter'">
            <th scope="row">Filter</th>
            <td>{{ capacity.filter }}</td>
            <td class="text-muted">
              The parser temporarily stores some ignored keys; this is the size
              of the largest one.
            </td>
          </tr>
          <tr>
            <th scope="row">Total (minimum)</th>
            <td>{{ capacity.minimum }}</td>
            <td class="text-muted">
              Minimum capacity for the
              <a :href="`${url}/v6/api/jsondocument/`"
                ><code>JsonDocument</code></a
              >.
            </td>
          </tr>
          <tr class="table-primary">
            <th scope="row">Total (recommended)</th>
            <td>{{ capacity.recommended }}</td>
            <td class="text-muted">
              Including some slack in case the strings change, and rounded to a
              power of two
            </td>
          </tr>
        </table>
        <p
          class="short-danger my-3"
          v-if="capacity.recommended > cpuInfo.ramError"
        >
          This is too big to fit in the RAM. See
          <a :href="`${url}/v6/how-to/deserialize-a-very-large-document/`"
            >How to deserialize a very large document?</a
          >
        </p>
        <p
          class="short-warning my-3"
          v-else-if="capacity.recommended > cpuInfo.ramWarning"
        >
          This may not fit in the RAM. Make sure there is enough free space.
        </p>
        <p
          class="short-tip my-3"
          v-if="capacity.recommended > cpuInfo.ramWarning &amp;&amp; cpu === 'esp32'"
        >
          See also:
          <a :href="`${url}/v6/how-to/use-external-ram-on-esp32/`"
            >How to use external RAM on an ESP32?</a
          >
        </p>
        <details class="mt-3">
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
              <code>XXXX</code>) in the box above.
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

      <div v-if="currentStepIndex == 3" class="card-body">
        <div
          class="alert alert-warning"
          v-if="cpuInfo.useLongLong &amp;&amp; cpuInfo.useLongLong.default != useLongLong"
        >
          ⚠️ This program assumes you defined
          <a :href="`${url}/v6/api/config/use_long_long/`"
            ><code>ARDUINOJSON_USE_LONG_LONG</code></a
          >
          to <code>{{ +useLongLong }}</code>
        </div>
        <div
          class="alert alert-warning"
          v-if="cpuInfo.useDouble &amp;&amp; cpuInfo.useDouble.default != useDouble"
        >
          ⚠️ This program assumes you defined
          <a :href="`${url}/v6/api/config/use_double/`"
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
        <ul class="list-inline">
          <li class="list-inline-item font-weight-bold">See also</li>
          <li v-if="isDeserializing" class="list-inline-item">
            <a :href="`${url}/v6/doc/deserialization/`"
              >Deserialization Tutorial</a
            >
          </li>
          <li v-if="isSerializing" class="list-inline-item">
            <a :href="`${url}/v6/doc/serialization/`">Serialization Tutorial</a>
          </li>
          <li class="list-inline-item">
            <a :href="`${url}/v6/api/dynamicjsondocument/`"
              ><code>DynamicJsonDocument</code></a
            >
          </li>
          <li v-if="isDeserializing" class="list-inline-item">
            <a :href="`${url}/v6/api/json/deserializejson/`"
              ><code>deserializeJson()</code></a
            >
          </li>
          <li v-if="isSerializing" class="list-inline-item">
            <a :href="`${url}/v6/api/json/serializejson/`"
              ><code>serializeJson()</code></a
            >
          </li>
        </ul>
      </div>

      <div class="card-footer">
        <div class="d-flex justify-content-between">
          <button
            v-if="prevStep"
            class="btn btn-secondary"
            @click="gotoPrevStep"
          >
            Previous
          </button>
          &nbsp;
          <button
            v-if="nextStep"
            class="btn btn-primary"
            :disabled="!nextStep || nextStep.disabled"
            @click="gotoNextStep"
          >
            Next: {{ nextStep.label }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import hljs from "highlight.js/lib/core";
import cpp from "highlight.js/lib/languages/cpp";
import "@/assets/highlight.scss";
hljs.registerLanguage("cpp", cpp);

import cpuInfos from "./assistant/cpus";
import { buildExpression } from "./assistant/SizeExpression";
import {
  needsDouble,
  needsLongLong,
  measureNesting,
  measureSize,
  hasJsonInJsonSyndrome,
} from "./assistant/analyzer";
import { applyFilter } from "./assistant/filter";
import { generateParsingProgram } from "./assistant/parsingProgram";
import { generateSerializingProgram } from "./assistant/serializingProgram";
import InfoIcon from "./components/InfoIcon.vue";

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

const defaultConfig = {
  mode: "deserialize",
  root: {
    sensor: "gps",
    time: 1351824120,
    data: [48.75608, 2.302038],
  },
};

export default {
  components: { InfoIcon },
  props: {
    url: {
      type: String,
      default: "",
    },
    version: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      currentStepIndex: 0,
      ioTypeId: "arduinoStream",
      mode: "deserialize",
      input: undefined,
      inputError: "",
      inputJson: "{}",
      assumeConstKeys: undefined,
      assumeConstValues: undefined,
      deduplicateKeys: undefined,
      deduplicateValues: undefined,
      adBlocked: false,
      cpu: "avr",
      filterJson: "true",
      filter: true,
      filterError: null,
      useDouble: false,
      useLongLong: false,
      program: "",
      programHtml: "",
      programCopied: false,
    };
  },
  mounted() {
    if (window.google_tag_data === undefined) {
      this.adBlocked = true;
    }
    this.setSettings(defaultConfig);
    try {
      this.loadSettings();
    } catch {
      this.setSettings(defaultConfig);
    }
  },
  computed: {
    cpuInfos() {
      return cpuInfos;
    },
    cpuInfo() {
      return this.cpuInfos[this.cpu];
    },
    expression() {
      return buildExpression(this.filteredInput);
    },
    isSerializing() {
      return this.mode === "serialize";
    },
    isDeserializing() {
      return this.mode.indexOf("deserialize") === 0;
    },
    needsDouble() {
      return needsDouble(this.filteredInput);
    },
    needsLongLong() {
      return needsLongLong(this.filteredInput);
    },
    configuration() {
      return {
        mode: this.mode,
        root: this.input,
        filter: this.filterEnabled ? this.filter : undefined,
        cpu: this.cpuInfo,
        ignoreKeys: this.ignoreKeys,
        ignoreValues: this.ignoreValues,
        deduplicateKeys: this.deduplicateKeys,
        deduplicateValues: this.deduplicateValues,
        useLongLong: this.useLongLong,
        useDouble: this.useDouble,
        inputType: this.ioTypeId,
      };
    },
    capacity() {
      return measureSize(this.input, this.configuration);
    },
    nestingLevel() {
      return measureNesting(this.input);
    },
    filterEnabled() {
      return this.mode === "deserialize-filter";
    },
    filteredInput() {
      if (!this.filterEnabled) return this.input;
      if (this.filterError) return undefined;
      return applyFilter(this.input, this.filter);
    },
    filteredInputJson() {
      return JSON.stringify(this.filteredInput, null, 2);
    },
    hasJsonInJsonSyndrome() {
      return hasJsonInJsonSyndrome(this.filteredInput);
    },
    stringsDetails() {
      if (this.ignoreKeys && this.ignoreValues)
        return "no string is stored in the JsonDocument";
      if (this.ignoreKeys && this.deduplicateValues)
        return "values are stored but keys are ignored (values are deduplicated)";
      if (this.ignoreKeys && !this.deduplicateValues)
        return "values are stored but keys are ignored (values are not deduplicated)";
      if (this.ignoreValues && this.deduplicateKeys)
        return "keys are stored but values are not (keys are deduplicated)";
      if (this.ignoreValues && !this.deduplicateKeys)
        return "keys are stored but values are not (keys are not deduplicated)";
      if (this.deduplicateKeys && this.deduplicateValues)
        return "strings are deduplicated";
      if (this.deduplicateKeys && !this.deduplicateValues)
        return "keys are deduplicated but values are not";
      if (!this.deduplicateKeys && this.deduplicateValues)
        return "values are deduplicated but keys are not";
      return "strings are not deduplicated";
    },
    ignoreKeys() {
      if (this.isSerializing) return this.assumeConstKeys;
      else return !!this.ioTypes[this.ioTypeId].ignoreStrings;
    },
    ignoreValues() {
      if (this.isSerializing) return this.assumeConstValues;
      else return !!this.ioTypes[this.ioTypeId].ignoreStrings;
    },
    currentIoType() {
      return this.ioTypes[this.ioTypeId];
    },
    ioTypes() {
      const zeroCopyInfo =
        "Uses the zero-copy mode: the <code>JsonDocument</code> stores pointer instead of copies of strings";
      const readOnlyString =
        "This is most likely a bad choice, prefer <code>char*</code> or stream";
      return {
        charPtr: {
          label: "char*",
          ignoreStrings: true,
          info: this.isDeserializing && zeroCopyInfo,
        },
        charArray: {
          label: "char[N]",
          ignoreStrings: true,
          info: this.isDeserializing && zeroCopyInfo,
        },
        constCharPtr: {
          label: "const char*",
          disabled: this.isSerializing,
          info: this.isDeserializing && readOnlyString,
        },
        arduinoString: {
          label: "String",
          disabled: this.cpu[0] == "x",
          info: this.isDeserializing && readOnlyString,
        },
        stdString: {
          label: "std::string",
          disabled: this.cpu == "avr",
          info: this.isDeserializing && readOnlyString,
        },
        arduinoStream: {
          label: "Stream",
          disabled: this.cpu[0] == "x",
          info: 'This is the most memory efficient option, but not the fastest; <a href="/v6/how-to/improve-speed/">see this if your program is slow</a>.',
        },
        stdStream: {
          label: this.isSerializing ? "std::ostream" : "std::istream",
          disabled: this.cpu == "avr",
        },
      };
    },
    steps() {
      const hasErrors = this.filteredInput === undefined;
      return [
        {
          number: 1,
          label: "Configuration",
        },
        {
          number: 2,
          label: "JSON",
        },
        {
          number: 3,
          label: "Size",
          disabled: hasErrors,
        },
        {
          number: 4,
          label: "Program",
          disabled: hasErrors,
        },
      ];
    },
    currentStep() {
      return this.steps[this.currentStepIndex];
    },
    prevStep() {
      return this.steps[this.currentStepIndex - 1];
    },
    nextStep() {
      return this.steps[this.currentStepIndex + 1];
    },
    //
    // Tweaks
    //
    defaultUseDouble() {
      return !!this.cpuInfo.useDouble?.default;
    },
    defaultUseLongLong() {
      return !!this.cpuInfo.useLongLong?.default;
    },
    defaultDeduplicateKeys() {
      return this.isDeserializing ? true : undefined;
    },
    defaultDeduplicateValues() {
      return this.isDeserializing ? false : undefined;
    },
    defaultAssumeConstKeys() {
      return this.isSerializing ? true : undefined;
    },
    defaultAssumeConstValues() {
      return this.isSerializing ? false : undefined;
    },
    tweakCount() {
      return (
        (this.assumeConstKeys != this.defaultAssumeConstKeys) +
        (this.assumeConstValues != this.defaultAssumeConstValues) +
        (this.deduplicateKeys != this.defaultDeduplicateKeys) +
        (this.deduplicateValues != this.defaultDeduplicateValues) +
        (this.useDouble != this.defaultUseDouble) +
        (this.useLongLong != this.defaultUseLongLong)
      );
    },
  },
  watch: {
    inputJson(val) {
      try {
        this.input = JSON.parse(val);
        this.inputError = "";
      } catch (ex) {
        this.input = undefined;
        this.inputError = ex.message;
      }
    },
    filterJson(val) {
      try {
        this.filter = JSON.parse(val);
        this.filterError = "";
      } catch (ex) {
        this.filter = undefined;
        this.filterError = ex.message;
      }
    },
    currentStepIndex(newStep, oldStep) {
      this.saveSettings();
      if (oldStep == 0) this.report("config", "Set configuration");
      if (oldStep == 1) this.report("json", "Set JSON", this.inputJson.length);
      if (newStep == 3) {
        this.report("program", "Generate program", this.capacity.recommended);
        this.generateProgram();
      }
    },
  },
  methods: {
    gotoNextStep() {
      this.currentStepIndex++;
    },
    gotoPrevStep() {
      this.currentStepIndex--;
    },
    prettifyInput() {
      this.inputJson = JSON.stringify(this.input, null, 2);
    },
    prettifyFilter() {
      this.filterJson = JSON.stringify(this.filter, null, 2);
    },
    report(action, label, value) {
      ga("set", {
        dimension1: this.mode,
        dimension2: this.cpu,
        dimension3: this.ioTypeId,
        metric1: this.inputJson.length,
        metric2: this.capacity && this.capacity.recommended,
      });
      ga("send", "event", {
        eventCategory: "assistant",
        eventAction: action,
        eventLabel: label,
        eventValue: value,
      });
    },
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
    selectCpu(cpu) {
      this.cpu = cpu;
      // we cannot use watch for the followings because they are triggered after setSetting() completes
      this.useDouble = this.defaultUseDouble;
      this.useLongLong = this.defaultUseLongLong;
    },
    selectMode(mode) {
      this.mode = mode;
      // we cannot use watch for the followings because they are triggered after setSetting() completes
      this.assumeConstKeys = this.defaultAssumeConstKeys;
      this.assumeConstValues = this.defaultAssumeConstValues;
      this.deduplicateKeys = this.defaultDeduplicateKeys;
      this.deduplicateValues = this.defaultDeduplicateValues;
    },
    //
    // Settings
    //
    setSettings(cfg) {
      if (cfg.rootJson) {
        this.inputJson = cfg.rootJson;
      } else if (cfg.root) {
        this.inputJson = JSON.stringify(cfg.root, null, 2);
      }
      if (cfg.filterJson) {
        this.filterJson = cfg.filterJson;
      } else if (cfg.filter) {
        this.filterJson = JSON.stringify(cfg.filter, null, 2);
      }
      if (cfg.mode) this.selectMode(cfg.mode);
      if (cfg.cpu && this.cpuInfos[cfg.cpu]) this.selectCpu(cfg.cpu);
      if (cfg.io && this.ioTypes[cfg.io]) this.ioTypeId = cfg.io;
      if (cfg.useDouble != undefined) this.useDouble = cfg.useDouble;
      if (cfg.useLongLong != undefined) this.useLongLong = cfg.useLongLong;
      if (cfg.assumeConstKeys != undefined && this.isSerializing)
        this.assumeConstKeys = cfg.assumeConstKeys;
      if (cfg.assumeConstValues != undefined && this.isSerializing)
        this.assumeConstValues = cfg.assumeConstValues;
      if (cfg.deduplicateKeys != undefined)
        this.deduplicateKeys = cfg.deduplicateKeys;
      if (cfg.deduplicateValues != undefined)
        this.deduplicateValues = cfg.deduplicateValues;
    },
    getSettings() {
      return {
        mode: this.mode,
        rootJson: this.inputJson,
        filterJson: this.filterEnabled ? this.filterJson : undefined,
        cpu: this.cpu,
        io: this.ioTypeId,
        useDouble: this.useDouble,
        useLongLong: this.useLongLong,
        deduplicateKeys: this.deduplicateKeys,
        deduplicateValues: this.deduplicateValues,
        assumeConstKeys: this.assumeConstKeys,
        assumeConstValues: this.assumeConstValues,
      };
    },
    saveSettings() {
      localStorage.setItem(
        "assitantConfig",
        JSON.stringify(this.getSettings())
      );
    },
    loadSettings() {
      this.setSettings(JSON.parse(localStorage.getItem("assitantConfig")));
    },
    downloadSettings(url) {
      const that = this;
      const request = new XMLHttpRequest();
      request.onload = function () {
        that.setSettings(JSON.parse(this.responseText));
      };
      request.open("get", url);
      request.send();
    },
    //
    // Tweaks
    //
    resetTweaks() {
      this.useLongLong = this.defaultUseLongLong;
      this.useDouble = this.defaultUseDouble;
      this.assumeConstKeys = this.defaultAssumeConstKeys;
      this.assumeConstValues = this.defaultAssumeConstValues;
      this.deduplicateKeys = this.defaultDeduplicateKeys;
      this.deduplicateValues = this.defaultDeduplicateValues;
    },
  },
};
</script>
