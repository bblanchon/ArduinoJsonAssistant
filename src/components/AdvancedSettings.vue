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
    <div v-if="board.doubleSupported" class="form-group">
      <label for="useDouble" class="col-form-label">
        Store floating point values as
      </label>
      <ResetTweakButton
        v-model="settings.useDouble"
        :default-value="defaults.useDouble"
      />
      <select id="useDouble" class="form-control" v-model="settings.useDouble">
        <option v-if="defaults.useDouble" :value="true">
          double (default)
        </option>
        <option v-else :value="true">
          double (#define ARDUINOJSON_USE_DOUBLE 1)
        </option>
        <option v-if="defaults.useDouble" :value="false">
          float (#define ARDUINOJSON_USE_DOUBLE 0)
        </option>
        <option v-else :value="false">float (default)</option>
      </select>
      <small v-if="board.doubleInconsequential" class="form-text text-muted">
        This setting doesn't affect the document size of this platform, so you
        won't see any change in the table above.
      </small>
      <small v-else class="form-text text-muted">
        Choose <code>float</code> to reduce the document size; choose
        <code>double</code> if you need the increased precision and range.
      </small>
    </div>
    <div v-if="board.longLongSupported" class="form-group">
      <label for="useLongLong" class="col-form-label">
        Store integral values values as
      </label>
      <ResetTweakButton
        v-model="settings.useLongLong"
        :default-value="defaults.useLongLong"
      />
      <select
        id="useLongLong"
        class="form-control"
        v-model="settings.useLongLong"
      >
        <option v-if="defaults.useLongLong" :value="true">
          long long (default)
        </option>
        <option v-else :value="true">
          long long (#define ARDUINOJSON_USE_LONG_LONG 1)
        </option>
        <option v-if="defaults.useLongLong" :value="false">
          long (#define ARDUINOJSON_USE_LONG_LONG 0)
        </option>
        <option v-else :value="false">long (default)</option>
      </select>
      <small v-if="board.longLongInconsequential" class="form-text text-muted">
        This setting doesn't affect the document size of this platform, so you
        won't see any change in the table above.
      </small>
      <small v-else class="form-text text-muted">
        Choose <code>long</code> to reduce the document size; choose
        <code>long long</code> if you need the increased range.<br />
        In both cases, out-of-range values will be promoted to
        <code>{{ settings.useDouble ? "double" : "float" }}</code
        >.
      </small>
    </div>
    <div class="form-group form-check" v-if="settings.isSerializing">
      <input
        id="assume-const-values"
        class="form-check-input"
        type="checkbox"
        v-model="settings.assumeConstValues"
      />
      <label for="assume-const-values" class="form-check-label">
        Assume values are <code>const char*</code>
      </label>
      <ResetTweakButton
        v-model="settings.assumeConstValues"
        :default-value="defaults.assumeConstValues"
      />
      <small class="form-text text-muted">
        <code>JsonDocument</code> stores strings differently depending on their
        types. It stores <code>const char*</code> by pointer (which takes no
        extra space) and all other types by copy.<br />
        Check this box if you're only adding
        <code>const char*</code> values.
      </small>
    </div>
    <div class="form-group form-check" v-if="settings.isSerializing">
      <input
        id="assume-const-keys"
        class="form-check-input"
        type="checkbox"
        v-model="settings.assumeConstKeys"
      />
      <label for="assume-const-keys" class="form-check-label"
        >Assume keys are <code>const char*</code></label
      >
      <ResetTweakButton
        v-model="settings.assumeConstKeys"
        :default-value="defaults.assumeConstKeys"
      />
      <small class="form-text text-muted">
        Same as above but for keys.<br />
        Uncheck this box if your program generates keys at runtime.
      </small>
    </div>
    <div class="form-group form-check" v-if="!settings.ignoreValues">
      <input
        id="deduplicate-values"
        class="form-check-input"
        type="checkbox"
        v-model="settings.deduplicateValues"
      />
      <label for="deduplicate-values" class="form-check-label">
        Deduplicate values when measuring the capacity
      </label>
      <ResetTweakButton
        v-model="settings.deduplicateValues"
        :default-value="defaults.deduplicateValues"
      />
      <small class="form-text text-muted">
        ArduinoJson detects duplicate strings to store only one copy, but you
        can tell the Assistant to include all strings.<br />
        You should uncheck this box if you used placeholders values (like
        <code>XXXX</code>) in step&nbsp;2.
      </small>
    </div>
    <div class="form-group form-check mb-0" v-if="!settings.ignoreKeys">
      <input
        id="deduplicate-keys"
        class="form-check-input"
        type="checkbox"
        v-model="settings.deduplicateKeys"
      />
      <label for="deduplicate-keys" class="form-check-label">
        Deduplicate keys when measuring the capacity
      </label>
      <ResetTweakButton
        v-model="settings.deduplicateKeys"
        :default-value="defaults.deduplicateKeys"
      />
      <small class="form-text text-muted">
        Same as above, but for keys instead of values.<br />
        You should check this box unless you know what you're doing.
      </small>
    </div>
  </details>
</template>

<script setup>
import { useSettingsStore } from "@/stores/settings";
import { useBoardStore } from "@/stores/board";
import { computed } from "vue";

const fields = [
  "assumeConstKeys",
  "assumeConstValues",
  "deduplicateKeys",
  "deduplicateValues",
  "useDouble",
  "useLongLong",
];

const settings = useSettingsStore();
const board = useBoardStore();

const defaults = computed(() => ({
  assumeConstKeys: true,
  assumeConstValues: false,
  deduplicateKeys: true,
  deduplicateValues: false,
  useDouble: board.doubleIsDefault,
  useLongLong: board.longLongIsDefault,
}));

const tweakCount = computed(
  () => fields.filter((key) => defaults.value[key] !== settings[key]).length,
);

function resetTweaks() {
  fields.forEach((key) => (settings[key] = defaults.value[key]));
}
</script>
