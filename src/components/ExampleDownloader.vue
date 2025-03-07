<template>
  <p v-if="isDownloading">Downloading example...</p>
  <p v-else>
    Examples:
    <a
      href="#"
      @click.prevent="downloadSettings('examples/openweathermap.json')"
    >
      OpenWeatherMap</a
    >,
    <a href="#" @click.prevent="downloadSettings('examples/reddit.json')"
      >Reddit</a
    >
  </p>
</template>

<script setup lang="ts">
import { ref } from "vue";

import { useScriptUrl } from "@/composables/script-url";
import { useSettingsStore } from "@/stores/settings";

const scriptUrl = useScriptUrl();
const isDownloading = ref(false);
const settings = useSettingsStore();

async function downloadSettings(url: string | URL) {
  if (scriptUrl) url = new URL(url, scriptUrl);
  isDownloading.value = true;
  try {
    const response = await fetch(url);
    const cfg = await response.json();
    cfg.filter ??= true;
    settings.input = cfg.root;
    settings.inputJson = JSON.stringify(cfg.root, null, 2);
    settings.filter = cfg.filter;
    settings.filterJson = JSON.stringify(cfg.filter, null, 2);
  } finally {
    isDownloading.value = false;
  }
}
</script>
