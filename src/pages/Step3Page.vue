<template>
  <div class="card">
    <h2 class="h4 card-header bg-primary text-white">Step 3: Program</h2>

    <div class="card-body">
      <CodeBlock :source="program.header" />

      <div class="align-items-center g-2 mb-3 d-flex gap-3">
        <template v-if="settings.isDeserializing">
          <label for="io-library" class="visually-hidden">I/O</label>
          <div class="col-sm-3">
            <select
              id="io-library"
              v-model="program.ioLibrary"
              class="form-control flex-0 max-w-0"
            >
              <option value="serial">Serial</option>
              <option value="iostream">iostream</option>
            </select>
          </div>
        </template>

        <div class="form-check flex-0">
          <input
            class="form-check-input"
            type="checkbox"
            id="progmem"
            v-model="program.progmem"
          />
          <label class="form-check-label" for="progmem"
            ><code>PROGMEM</code></label
          >
        </div>

        <div class="form-check flex-0">
          <input
            class="form-check-input"
            type="checkbox"
            id="auto"
            v-model="program.auto"
          />
          <label class="form-check-label" for="auto"><code>auto</code></label>
        </div>
      </div>

      <CodeBlock :source="program.body" />
    </div>

    <div class="card-footer">
      <RouterLink class="btn btn-secondary" :to="{ name: 'step2' }">
        Previous
      </RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watchEffect } from "vue";

import { useSettingsStore } from "@/stores/settings";
import { useProgramStore } from "@/stores/program";

import CodeBlock from "@/components/CodeBlock.vue";

const settings = useSettingsStore();
const program = useProgramStore();

watchEffect(() => program.generate());
</script>
