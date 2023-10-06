<template>
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
    <div v-if="doubleSupported" class="form-group">
      <label for="useDouble" class="col-form-label">
        Store floating point values as
      </label>
      <select id="useDouble" class="form-control" v-model="useDouble">
        <option v-if="doubleIsDefault" :value="true">double (default)</option>
        <option v-else :value="true">
          double (#define ARDUINOJSON_USE_DOUBLE 1)
        </option>
        <option v-if="doubleIsDefault" :value="false">
          float (#define ARDUINOJSON_USE_DOUBLE 0)
        </option>
        <option v-else :value="false">float (default)</option>
      </select>
      <small v-if="doubleInconsequential" class="form-text text-muted">
        This setting doesn't affect the document size of this platform, so you
        won't see any change in the table above.
      </small>
      <small v-else class="form-text text-muted">
        Choose <code>float</code> to reduce the document size; choose
        <code>double</code> if you need the increased precision and range.
      </small>
    </div>
    <div v-if="longLongSupported" class="form-group">
      <label for="useLongLong" class="col-form-label">
        Store integral values values as
      </label>
      <select id="useLongLong" class="form-control" v-model="useLongLong">
        <option v-if="longLongIsDefault" :value="true">
          long long (default)
        </option>
        <option v-else :value="true">
          long long (#define ARDUINOJSON_USE_LONG_LONG 1)
        </option>
        <option v-if="longLongIsDefault" :value="false">
          long (#define ARDUINOJSON_USE_LONG_LONG 0)
        </option>
        <option v-else :value="false">long (default)</option>
      </select>
      <small v-if="longLongInconsequential" class="form-text text-muted">
        This setting doesn't affect the document size of this platform, so you
        won't see any change in the table above.
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
        <code>JsonDocument</code> stores strings differently depending on their
        types. It stores <code>const char*</code> by pointer (which takes no
        extra space) and all other types by copy.<br />
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
        ArduinoJson detects duplicate strings to store only one copy, but you
        can tell the Assistant to include all strings.<br />
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
</template>

<script>
import { mapActions, mapState, mapWritableState } from "pinia";
import { useSettingsStore } from "@/stores/settings";
import { useCpuStore } from "@/stores/cpu";

const fields = [
  "assumeConstKeys",
  "assumeConstValues",
  "deduplicateKeys",
  "deduplicateValues",
  "useDouble",
  "useLongLong",
];

export default {
  computed: {
    ...mapState(useSettingsStore, [
      "ignoreKeys",
      "ignoreValues",
      "isSerializing",
    ]),
    ...mapState(useCpuStore, [
      "doubleSupported",
      "doubleIsDefault",
      "doubleInconsequential",
      "longLongSupported",
      "longLongIsDefault",
      "longLongInconsequential",
    ]),
    ...mapWritableState(useSettingsStore, fields),
    defaults() {
      return {
        assumeConstKeys: this.isSerializing ? true : undefined,
        assumeConstValues: this.isSerializing ? false : undefined,
        deduplicateKeys: true,
        deduplicateValues: false,
        useDouble: this.doubleIsDefault,
        useLongLong: this.longLongIsDefault,
      };
    },
    tweakCount() {
      return fields.filter((key) => this.defaults[key] !== this[key]).length;
    },
  },
  methods: {
    ...mapActions(useSettingsStore, ["setSettings"]),
    resetTweaks() {
      this.setSettings(this.defaults);
    },
  },
};
</script>
