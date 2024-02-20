<template>
  <details>
    <summary>
      Assistant Behavior
      <button
        v-if="tweakCount"
        type="button"
        class="btn btn-outline-warning btn-sm py-0"
        style="margin-top: -5px"
        @click="resetTweaks"
      >
        Reset {{ tweakCount }} {{ tweakCount > 1 ? "changes" : "change" }}
      </button>
    </summary>
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
        Deduplicate values when measuring the size
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
        Deduplicate keys when measuring the size
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
import { computed } from "vue";

const settings = useSettingsStore();

const defaults = computed(() => ({
  assumeConstKeys: true,
  assumeConstValues: false,
  deduplicateKeys: true,
  deduplicateValues: true,
}));

const tweakCount = computed(
  () =>
    Object.entries(defaults.value).filter(
      ([key, value]) => value !== settings[key],
    ).length,
);

function resetTweaks() {
  Object.entries(defaults.value).forEach(
    ([key, value]) => (settings[key] = value),
  );
}
</script>
