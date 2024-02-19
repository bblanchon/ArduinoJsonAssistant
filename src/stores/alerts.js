import { defineStore } from "pinia";
import { useSettingsStore } from "./settings";
import { useBoardStore } from "./board";
import { computed, inject } from "vue";

import { useStatsStore } from "./stats";

export const useAlertsStore = defineStore("alerts", () => {
  const cfg = useSettingsStore();
  const board = useBoardStore();
  const stats = useStatsStore();
  const baseUrl = inject("baseUrl");

  const alerts = computed(() => {
    return [
      {
        if: board.maxSlots && stats.slotCount > board.maxSlots,
        id: "too-many-slots",
        type: "danger",
        message:
          "<b>This document contains too many values.</b><br>Because of an optimization, <code>JsonDocument</code> can only contain a limited number of values. You could overpass this limit by changing <code>ARDUINOJSON_SLOT_ID_SIZE</code>, but it would increase the memory usage, and I won't be able to compute it anymore.<br>At this point, you should consider using a different library.",
      },
      {
        if:
          cfg.isDeserializing &&
          stats.nestingLevel > board.memoryModel.nestingLimit,
        id: "too-deep",
        type: "warning",
        message: `This document is deeply nested; don't forget to pass <a href="${baseUrl}/v7/api/json/deserializejson/#nesting-limit"><code>DeserializationOption::NestingLimit(${stats.nestingLevel})</code></a>`,
      },
      {
        if: stats.longLongNeeded && !board.longLongIsDefault,
        id: "long-long",
        type: "warning",
        message: `This document contains <code>long&nbsp;long</code>; you should define <a href="${baseUrl}/v7/api/config/use_long_long/"><code>ARDUINOJSON_USE_LONG_LONG</code></a> to <code>1</code>`,
      },
      {
        if:
          stats.doubleNeeded && board.doubleSupported && !board.doubleIsDefault,
        id: "double",
        type: "warning",
        message: `This document contains <code>double</code>; you should define <a href="${baseUrl}/v7/api/config/use_double/"><code>ARDUINOJSON_USE_DOUBLE</code></a> to <code>1</code>`,
      },
      {
        if: stats.doubleNeeded && !board.doubleSupported,
        id: "double-not-supported",
        type: "warning",
        message: `This document contains double-precision floating points values but ${board.name} doesn't support them (<code>double</code> is the same as <code>float</code>)`,
      },
      {
        if: stats.jsonInJson,
        id: "json-in-json",
        type: "warning",
        message: `This document suffers from the <q>JSON in JSON</q> syndrome, so you may need to call <a href="${baseUrl}/v7/api/json/deserializejson/"><code>deserializeJson()</code></a> multiple times. <strong>The ArduinoJson Assistant doesn't support cfg scenario.</strong>`,
      },
      {
        if: stats.ramStatus === "warning",
        id: "size-warning",
        type: "warning",
        message: `This may not fit in the RAM. Make sure there is enough free space.`,
      },
      {
        if: stats.ramStatus === "error" && !board.psram,
        id: "size-error",
        type: "danger",
        message: `This is too big to fit in the RAM. See <a href="${baseUrl}/v7/how-to/deserialize-a-very-large-document/">How to deserialize a very large document?</a>`,
      },
      {
        if: stats.ramStatus === "error" && board.psram,
        id: "esp32-psram",
        type: "tip",
        message: `This is too big to fit in the RAM. See <a href="${baseUrl}/v7/how-to/use-external-ram-on-esp32/">How to use external RAM on an ESP32?</a>`,
      },
    ].filter((alert) => alert.if);
  });

  return { alerts };
});
