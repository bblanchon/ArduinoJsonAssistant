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

<script>
import { mapActions } from "pinia";
import { useSettingsStore } from "@/stores/settings";

export default {
  inject: ["scriptUrl"],
  data() {
    return {
      isDownloading: false,
    };
  },
  methods: {
    ...mapActions(useSettingsStore, ["setSettings"]),
    async downloadSettings(url) {
      if (this.scriptUrl) url = new URL(url, this.scriptUrl);
      this.isDownloading = true;
      try {
        const res = await fetch(url);
        this.setSettings(await res.json());
      } finally {
        this.isDownloading = false;
      }
    },
  },
};
</script>
