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
    <table class="table">
      <thead>
        <tr>
          <th>Setting</th>
          <th>Value</th>
          <th class="d-none d-sm-table-cell">Default</th>
          <th class="d-none d-md-table-cell">Effect</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="board.doubleSupported">
          <td>
            <label for="useDouble" class="text-monospace">
              ARDUINOJSON_USE_DOUBLE
            </label>
          </td>
          <td>
            <select
              id="useDouble"
              class="form-control form-control-sm"
              v-model="settings.useDouble"
            >
              <option :value="false">0</option>
              <option :value="true">1</option>
            </select>
          </td>
          <td class="d-none d-sm-table-cell">
            {{ +defaults.useDouble }}
            <ResetTweakButton
              v-model="settings.useDouble"
              :default-value="defaults.useDouble"
            />
          </td>
          <td class="text-muted d-none d-md-table-cell">
            The <code>JsonDocument</code> will store floating point values as
            <code>{{ settings.useDouble ? "double" : "float" }}</code
            >.
          </td>
        </tr>
        <tr>
          <td>
            <label for="useLongLong" class="text-monospace">
              ARDUINOJSON_USE_LONG_LONG
            </label>
          </td>
          <td>
            <select
              id="useLongLong"
              class="form-control form-control-sm"
              v-model="settings.useLongLong"
            >
              <option :value="false">0</option>
              <option :value="true">1</option>
            </select>
          </td>
          <td class="d-none d-sm-table-cell">
            {{ +defaults.useLongLong }}
            <ResetTweakButton
              v-model="settings.useLongLong"
              :default-value="defaults.useLongLong"
            />
          </td>
          <td class="text-muted d-none d-md-table-cell">
            The <code>JsonDocument</code> will store integers as
            <code>{{ settings.useLongLong ? "long long" : "long" }}</code
            >.
          </td>
        </tr>
        <tr>
          <td>
            <label for="slotIdSize" class="text-monospace">
              ARDUINOJSON_SLOT_ID_SIZE
            </label>
          </td>
          <td>
            <select
              id="slotIdSize"
              class="form-control form-control-sm"
              v-model="settings.slotIdSize"
            >
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="4">4</option>
            </select>
          </td>
          <td class="d-none d-sm-table-cell">
            {{ +defaults.slotIdSize }}
            <ResetTweakButton
              v-model="settings.slotIdSize"
              :default-value="defaults.slotIdSize"
            />
          </td>
          <td class="text-muted d-none d-md-table-cell">
            The <code>JsonDocument</code> can contain up to
            {{ formatInteger(settings.maxSlotCount) }} slots.<br />
            (The document above uses
            {{ formatInteger(stats.slotCount) }} slots.)
          </td>
        </tr>
        <tr>
          <td>
            <label for="stringLengthSize" class="text-monospace">
              ARDUINOJSON_STRING_LENGTH_SIZE
            </label>
          </td>
          <td>
            <select
              id="stringLengthSize"
              class="form-control form-control-sm"
              v-model="settings.stringLengthSize"
            >
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="4">4</option>
            </select>
          </td>
          <td class="d-none d-sm-table-cell">
            {{ +defaults.stringLengthSize }}
            <ResetTweakButton
              v-model="settings.stringLengthSize"
              :default-value="defaults.stringLengthSize"
            />
          </td>
          <td class="text-muted d-none d-md-table-cell">
            String can contain up to
            {{ formatInteger(settings.maxStringLength) }} characters.<br />
            (The longest string in the document above has
            {{ formatInteger(stats.maxStringLength) }} characters.)
          </td>
        </tr>
      </tbody>
    </table>
  </details>
</template>

<script setup>
import { useSettingsStore } from "@/stores/settings";
import { useBoardStore } from "@/stores/board";
import { useStatsStore } from "@/stores/stats";
import { computed } from "vue";
import { formatInteger } from "@/utils";

const settings = useSettingsStore();
const board = useBoardStore();
const stats = useStatsStore();

const defaults = computed(() => ({
  useDouble: board.doubleIsDefault,
  useLongLong: board.longLongIsDefault,
  slotIdSize: board.slotIdSize,
  stringLengthSize: board.stringLengthSize,
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
