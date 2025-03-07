import { defineStore } from "pinia";
import { computed } from "vue";

import { useSettingsStore } from "./settings";
import { useBoardStore } from "./board";
import { useStatsStore } from "./stats";

export const useAlertsStore = defineStore("alerts", () => {
  const board = useBoardStore();
  const stats = useStatsStore();
  const settings = useSettingsStore();

  function* enumerateAlerts() {
    if (
      settings.isDeserializing &&
      stats.nestingLevel > board.memoryModel.nestingLimit
    )
      yield {
        id: "too-deep",
        type: "warning",
        message: `This document is deeply nested; don't forget to pass <a href="https://arduinojson.org/v7/api/json/deserializejson/#nesting-limit"><code>DeserializationOption::NestingLimit(${stats.nestingLevel})</code></a>`,
      };

    if (stats.longLongNeeded && !settings.useLongLong)
      yield {
        id: "long-long",
        type: "warning",
        message: `This document contains 64-bit integers; you should set <a href="https://arduinojson.org/v7/config/use_long_long/"><code>ARDUINOJSON_USE_LONG_LONG</code></a> to <code>1</code>`,
      };

    if (stats.doubleNeeded && board.doubleSupported && !settings.useDouble)
      yield {
        id: "double",
        type: "warning",
        message: `This document contains double precisions floating-point values; you should set <a href="https://arduinojson.org/v7/config/use_double/"><code>ARDUINOJSON_USE_DOUBLE</code></a> to <code>1</code>`,
      };

    if (stats.doubleNeeded && !board.doubleSupported)
      yield {
        id: "double-not-supported",
        type: "warning",
        message: `This document contains double-precision floating points values but ${board.name} doesn't support them (<code>double</code> is the same as <code>float</code>)`,
      };

    if (stats.jsonInJson)
      yield {
        id: "json-in-json",
        type: "warning",
        message: `This document suffers from the <q>JSON in JSON</q> syndrome, so you may need to call <a href="https://arduinojson.org/v7/api/json/deserializejson/"><code>deserializeJson()</code></a> multiple times. <strong>The ArduinoJson Assistant doesn't support settings scenario.</strong>`,
      };

    if (
      stats.ramStatus === "danger" &&
      !board.psram &&
      settings.isDeserializing
    )
      yield {
        id: "size-error",
        type: "danger",
        message: `This is too big to fit in the RAM. See <a href="https://arduinojson.org/v7/how-to/deserialize-a-very-large-document/">How to deserialize a very large document?</a>`,
      };

    if (stats.ramStatus === "danger" && board.psram)
      yield {
        id: "esp32-psram",
        type: "tip",
        message: `This is too big to fit in the RAM. See <a href="https://arduinojson.org/v7/how-to/use-external-ram-on-esp32/">How to use external RAM on an ESP32?</a>`,
      };
  }

  return {
    alerts: computed(() => Array.from(enumerateAlerts())),
  };
});
