<template>
  <div class="card">
    <h2 class="h4 card-header bg-primary text-white">Step 1: Configuration</h2>

    <div class="card-body">
      <div class="row">
        <form class="col-lg-6 mb-4" @submit.prevent>
          <div class="row">
            <label for="cpu-selector" class="col-sm-3 col-form-label"
              >Board</label
            >
            <div class="col-sm-9">
              <BoardSelector
                :model-value="settings.cpu"
                @update:model-value="selectCpu"
                id="cpu-selector"
                class="mb-2"
              />
              <p
                class="alert alert-info mt-2 mb-2"
                v-if="board.arch == '8-bit'"
              >
                For 8-bit microcontrollers, prefer
                <a href="https://arduinojson.org/v6/assistant/">ArduinoJson 6</a
                >.<br />
                It is smaller and can work without dynamic memory allocation.
              </p>
            </div>
          </div>
          <div class="row mb-2">
            <span class="col-sm-3 col-form-label">Mode</span>
            <div class="col-sm-3 col-6">
              <label
                class="bg-primary-subtle border rounded d-flex align-items-center flex-column py-2 gap-1"
              >
                <input
                  class="form-check-input m-0"
                  type="radio"
                  v-model="selectedMode"
                  value="deserialize"
                />
                <span> Deserialize </span>
                <small class="text-body-secondary"
                  >JSON &rightarrow; C++
                </small>
              </label>
            </div>
            <div class="col-6 col-sm-3">
              <label
                class="bg-primary-subtle border rounded d-flex align-items-center flex-column py-2 gap-1"
              >
                <input
                  class="form-check-input m-0"
                  type="radio"
                  v-model="selectedMode"
                  name="mode"
                  value="serialize"
                />
                <span>Serialize</span>
                <small class="text-body-secondary">C++ &rightarrow; JSON</small>
              </label>
            </div>
          </div>
          <div class="row">
            <label for="io-type" class="col-sm-3 col-form-label">
              {{ settings.isSerializing ? "Output" : "Input" }}
            </label>
            <div class="col-sm-9">
              <select
                id="io-type"
                class="form-control"
                v-model="settings.ioType"
              >
                <option
                  v-for="(name, id) in settings.ioTypeNames"
                  :key="id"
                  :value="id"
                >
                  {{ name }}
                </option>
              </select>
            </div>
          </div>
        </form>
        <div class="col-lg-6 d-none d-lg-block">
          <div class="alert alert-info">
            <p>Welcome to the <b>ArduinoJson Assistant</b>! Here, you can:</p>
            <ol>
              <li>
                Ensure your board has enough RAM to store the JSON document
              </li>
              <li>Design filters to reduce the memory consumption</li>
              <li>Generate the code to parse or generate the JSON document</li>
              <li>
                See the impact of library configuration on memory consumption
              </li>
            </ol>
            <p>
              This version is designed for
              <strong>ArduinoJson {{ version }}</strong
              >.<br />
              Make sure the same version is installed on your computer.
            </p>
          </div>
        </div>
      </div>
    </div>

    <div class="card-footer">
      <div class="d-flex justify-content-between">
        &nbsp;
        <RouterLink class="btn btn-primary" :to="{ name: 'step2' }"
          >Next: JSON</RouterLink
        >
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject, computed } from "vue";
import { onBeforeRouteLeave } from "vue-router";

import { useBoardStore } from "@/stores/board";
import { useSettingsStore } from "@/stores/settings";

import BoardSelector from "@/components/BoardSelector.vue";

const settings = useSettingsStore();
const board = useBoardStore();
const version = inject("version");

onBeforeRouteLeave((to) => {
  if (to.name == "step2") {
    window.plausible("ArduinoJson Assistant: Configuration", {
      props: {
        mode: settings.mode,
        board: board.name,
        type: settings.ioTypeNames[settings.ioType],
      },
    });
  }
});

const selectedMode = computed({
  get() {
    return settings.mode;
  },
  set(value) {
    settings.mode = value;
    settings.assumeConstKeys = true;
    settings.assumeConstValues = false;
    settings.deduplicateKeys = true;
    settings.deduplicateValues = true;
  },
});

function selectCpu(cpu: string) {
  settings.cpu = cpu;
  settings.useDouble = board.doubleIsDefault;
  settings.useLongLong = board.longLongIsDefault;
  settings.slotIdSize = board.slotIdSize;
  settings.stringLengthSize = board.stringLengthSize;
}
</script>
