<template>
  <div class="card">
    <h2 class="h4 card-header bg-primary text-white">Step 3: Program</h2>

    <div class="card-body">
      <CodeBlock :source="program.header" />

      <div class="form-inline" v-if="settings.isDeserializing">
        <label for="io-library" class="sr-only">Name</label>
        <select
          id="io-library"
          v-model="program.ioLibrary"
          class="form-control mb-2 mr-sm-2"
        >
          <option value="serial">Serial</option>
          <option value="iostream">iostream</option>
        </select>

        <div class="custom-control custom-switch mb-2 mr-sm-2">
          <input
            class="custom-control-input"
            type="checkbox"
            id="progmem"
            v-model="program.progmem"
          />
          <label class="custom-control-label" for="progmem"
            >Flash strings</label
          >
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

<script setup>
import { useSettingsStore } from "@/stores/settings";
import { useProgramStore } from "@/stores/program";
import { watchEffect } from "vue";

const settings = useSettingsStore();
const program = useProgramStore();

watchEffect(() => program.generate());
</script>
