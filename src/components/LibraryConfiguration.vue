<template>
  <details>
    <summary>
      Library Configuration
      <button
        v-if="changeCount"
        type="button"
        class="btn btn-outline-warning btn-sm py-0"
        style="margin-top: -5px"
        @click="resetChanges"
      >
        Reset {{ changeCount }} {{ changeCount > 1 ? "changes" : "change" }}
      </button>
    </summary>
    <div v-if="board.doubleSupported" class="form-group">
      <label for="useDouble" class="col-form-label text-monospace">
        ARDUINOJSON_USE_DOUBLE
      </label>
      <ResetTweakButton
        v-model="settings.useDouble"
        :default-value="defaults.useDouble"
      />
      <select id="useDouble" class="form-control" v-model="settings.useDouble">
        <option :value="false">
          {{ defaults.useDouble ? "0" : "0 (default)" }}
        </option>
        <option :value="true">
          {{ defaults.useDouble ? "1 (default)" : "1" }}
        </option>
      </select>
      <small class="form-text text-muted">
        Selects the type used to store floating point values:
        <code>float</code> or <code>double</code>.
      </small>
    </div>
    <div v-if="board.longLongSupported" class="form-group">
      <label for="useLongLong" class="col-form-label text-monospace">
        ARDUINOJSON_USE_LONG_LONG
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
        <option :value="false">
          {{ defaults.useLongLong ? "0" : "0 (default)" }}
        </option>
        <option :value="true">
          {{ defaults.useLongLong ? "1 (default)" : "1" }}
        </option>
      </select>
      <small class="form-text text-muted">
        Selects the type used to store integers: <code>long</code> or
        <code>long long</code>.
      </small>
    </div>
    <div class="form-group">
      <label for="slotIdSize" class="col-form-label text-monospace">
        ARDUINOJSON_SLOT_ID_SIZE
      </label>
      <ResetTweakButton
        v-model="settings.slotIdSize"
        :default-value="defaults.slotIdSize"
      />
      <select
        id="slotIdSize"
        class="form-control"
        v-model="settings.slotIdSize"
      >
        <option value="1">
          1 (up to 255 slots{{ defaults.slotIdSize == 1 ? ", default" : "" }})
        </option>
        <option value="2">
          2 (up to 65,635 slots{{
            defaults.slotIdSize == 2 ? ", default" : ""
          }})
        </option>
        <option value="4">
          4 (up to 4 million slots{{
            defaults.slotIdSize == 4 ? ", default" : ""
          }})
        </option>
      </select>
      <small class="form-text text-muted">
        Defines the number of bytes used to store a slot identifier.
      </small>
    </div>
  </details>
</template>

<script setup>
import { useSettingsStore } from "@/stores/settings";
import { useBoardStore } from "@/stores/board";
import { computed } from "vue";

const settings = useSettingsStore();
const board = useBoardStore();

const defaults = computed(() => ({
  useDouble: board.doubleIsDefault,
  useLongLong: board.longLongIsDefault,
  slotIdSize: board.slotIdSize,
}));

const changeCount = computed(
  () =>
    Object.entries(defaults.value).filter(
      ([key, value]) => value !== settings[key],
    ).length,
);

function resetChanges() {
  Object.entries(defaults.value).forEach(
    ([key, value]) => (settings[key] = value),
  );
}
</script>
