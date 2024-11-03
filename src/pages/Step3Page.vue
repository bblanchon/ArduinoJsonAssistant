<template>
  <div class="card">
    <h2 class="h4 card-header bg-primary text-white">Step 3: Size</h2>

    <div class="card-body">
      <table class="table m-0">
        <tbody>
          <tr>
            <th scope="row">Data structures</th>
            <td>{{ capacity.slots }}</td>
            <td class="text-body-secondary">
              Bytes needed to stores the JSON objects and arrays in memory
              <a
                href="#"
                v-popover="{
                  title: 'Expression',
                  content: expression,
                }"
                @click.prevent
              >
                <InfoIcon />
              </a>
            </td>
          </tr>
          <tr>
            <th scope="row">Strings</th>
            <td>{{ capacity.strings }}</td>
            <td class="text-body-secondary">
              Bytes needed to stores the strings in memory
              <a
                href="#"
                v-popover="{
                  title: 'Deduplication',
                  content: 'Accoding to the configuration, ' + stringsDetails,
                }"
                @click.prevent
                ><InfoIcon
              /></a>
            </td>
          </tr>
          <tr v-if="mode === 'deserialize-filter'">
            <th scope="row">Filter</th>
            <td>{{ capacity.filter }}</td>
            <td class="text-body-secondary">
              The parser temporarily stores some ignored keys; this is the size
              of the largest one.
            </td>
          </tr>
          <tr>
            <th scope="row">Total (minimum)</th>
            <td>{{ capacity.minimum }}</td>
            <td class="text-body-secondary">
              Minimum capacity for the
              <a :href="`${baseUrl}/v6/api/jsondocument/`"
                ><code>JsonDocument</code></a
              >.
            </td>
          </tr>
          <tr class="table-primary">
            <th scope="row">Total (recommended)</th>
            <td>{{ capacity.recommended }}</td>
            <td class="text-body-secondary">
              Including some slack in case the strings change, and rounded to a
              power of two
            </td>
          </tr>
        </tbody>
      </table>
      <p
        class="short-danger my-3"
        v-if="capacity.recommended > cpuInfo.ramError"
      >
        This is too big to fit in the RAM. See
        <a :href="`${baseUrl}/v6/how-to/deserialize-a-very-large-document/`"
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
        v-if="capacity.recommended > cpuInfo.ramWarning && cpu === 'esp32'"
      >
        See also:
        <a :href="`${baseUrl}/v6/how-to/use-external-ram-on-esp32/`"
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
        <div v-if="cpuInfo.useDouble" class="mb-3">
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
          <div
            v-if="cpuInfo.useDouble.slotSize == cpuInfo.slotSize"
            class="form-text"
          >
            This setting doesn't affect the document size of this platform, so
            you won't see any change in the table above.
          </div>
          <div v-else class="form-text">
            Choose <code>float</code> to reduce the document size; choose
            <code>double</code> if you need the increased precision and range.
          </div>
        </div>
        <div v-if="cpuInfo.useLongLong" class="mb-3">
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
          <div
            v-if="cpuInfo.useLongLong.slotSize == cpuInfo.slotSize"
            class="form-text"
          >
            This setting doesn't affect the document size of this platform, so
            you won't see any change in the table above.
          </div>
          <div v-else class="form-text">
            Choose <code>long</code> to reduce the document size; choose
            <code>long long</code> if you need the increased range.<br />
            In both cases, out-of-range values will be promoted to
            <code>{{ useDouble ? "double" : "float" }}</code
            >.
          </div>
        </div>
        <div class="mb-3 form-check" v-if="isSerializing">
          <input
            id="assume-const-values"
            class="form-check-input"
            type="checkbox"
            v-model="assumeConstValues"
          />
          <label for="assume-const-values" class="form-check-label"
            >Assume values are <code>const char*</code></label
          >
          <div class="form-text">
            <code>JsonDocument</code> stores strings differently depending on
            their types. It stores <code>const char*</code> by pointer (which
            takes no extra space) and all other types by copy.<br />
            Check this box if you're only adding
            <code>const char*</code> values.
          </div>
        </div>
        <div class="mb-3 form-check" v-if="isSerializing">
          <input
            id="assume-const-keys"
            class="form-check-input"
            type="checkbox"
            v-model="assumeConstKeys"
          />
          <label for="assume-const-keys" class="form-check-label"
            >Assume keys are <code>const char*</code></label
          >
          <div class="form-text">
            Same as above but for keys.<br />
            Uncheck this box if your program generates keys at runtime.
          </div>
        </div>
        <div class="mb-3 form-check" v-if="!ignoreValues">
          <input
            id="deduplicate-values"
            class="form-check-input"
            type="checkbox"
            v-model="deduplicateValues"
          />
          <label for="deduplicate-values" class="form-check-label">
            Deduplicate values when measuring the capacity
          </label>
          <div class="form-text">
            ArduinoJson detects duplicate strings to store only one copy, but
            you can tell the Assistant to include all strings.<br />
            You should uncheck this box if you used placeholders values (like
            <code>XXXX</code>) in step 2.
          </div>
        </div>
        <div class="form-check" v-if="!ignoreKeys">
          <input
            id="deduplicate-keys"
            class="form-check-input"
            type="checkbox"
            v-model="deduplicateKeys"
          />
          <label for="deduplicate-keys" class="form-check-label">
            Deduplicate keys when measuring the capacity
          </label>
          <div class="form-text">
            Same as above, but for keys instead of values.<br />
            You should check this box unless you know what you're doing.
          </div>
        </div>
      </details>
    </div>

    <div class="card-footer">
      <div class="d-flex justify-content-between">
        <RouterLink :to="{ name: 'step2' }" class="btn btn-secondary">
          Previous
        </RouterLink>
        <RouterLink
          :to="{ name: 'step4' }"
          class="btn btn-primary"
          :class="{ disabled: hasErrors }"
        >
          Next: Program
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script>
import InfoIcon from "@/components/InfoIcon.vue";
import { RouterLink } from "vue-router";
import { mapActions, mapState, mapWritableState } from "pinia";
import { measureSize } from "@/assistant/analyzer";
import { buildExpression } from "@/assistant/expression";
import { useStore } from "@/store";

export default {
  components: { InfoIcon, RouterLink },
  inject: ["baseUrl"],
  computed: {
    ...mapState(useStore, [
      "configuration",
      "cpu",
      "cpuInfo",
      "defaults",
      "expression",
      "filteredInput",
      "hasErrors",
      "ignoreKeys",
      "ignoreValues",
      "isSerializing",
      "input",
      "mode",
    ]),
    ...mapWritableState(useStore, [
      "useDouble",
      "useLongLong",
      "assumeConstKeys",
      "assumeConstValues",
      "deduplicateKeys",
      "deduplicateValues",
    ]),
    capacity() {
      return measureSize(this.input, this.configuration);
    },
    expression() {
      return buildExpression(this.filteredInput);
    },
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
    tweakCount() {
      return Object.entries(this.defaults).filter(
        ([key, defaultValue]) =>
          defaultValue !== undefined && this[key] !== defaultValue,
      ).length;
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
  },
  methods: {
    ...mapActions(useStore, ["setSettings"]),
    resetTweaks() {
      this.setSettings(this.defaults);
    },
  },
};
</script>
