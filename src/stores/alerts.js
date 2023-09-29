import { defineStore } from "pinia";
import { useConfigStore } from "./config";
import { computed, inject } from "vue";

import { hasJsonInJsonSyndrome, measureNesting } from "@/assistant/analyzer";
import { needsDouble, needsLongLong } from "@/assistant/analyzer";
import { measureSize } from "@/assistant/analyzer";

export const useAlertsStore = defineStore("alerts", () => {
  const cfg = useConfigStore();

  const baseUrl = inject("baseUrl");

  const ramStatus = computed(() => {
    const usage = measureSize(cfg.input, cfg.configuration).recommended;
    if (usage > cfg.cpuInfo.ramError) return "error";
    if (usage > cfg.cpuInfo.ramWarning) return "warning";
    return "success";
  });

  const alerts = computed(() => {
    const longLongNeeded = needsLongLong(cfg.filteredInput);
    const longLongIsDefault = !!cfg.cpuInfo.useLongLong?.default;
    const doubleNeeded = needsDouble(cfg.filteredInput);
    const doubleSupported = !!cfg.cpuInfo.useDouble;
    const doubleIsDefault = !!cfg.cpuInfo.useDouble?.default;
    const nestingLevel = measureNesting(cfg.input);

    return [
      {
        if: cfg.isDeserializing && nestingLevel > cfg.cpuInfo.nestingLimit,
        id: "too-deep",
        type: "warning",
        message: `This document is deeply nested; don't forget to pass <a href="${baseUrl}/v7/api/json/deserializejson/#nesting-limit"><code>DeserializationOption::NestingLimit(${nestingLevel})</code></a>`,
      },
      {
        if: longLongNeeded && !longLongIsDefault,
        id: "long-long",
        type: "warning",
        message: `This document contains <code>long&nbsp;long</code>; you should define <a href="${baseUrl}/v7/api/cfg/use_long_long/"><code>ARDUINOJSON_USE_LONG_LONG</code></a> to <code>1</code>`,
      },
      {
        if: doubleNeeded && doubleSupported && !doubleIsDefault,
        id: "double",
        type: "warning",
        message: `This document contains <code>double</code>; you should define <a href="${baseUrl}/v7/api/cfg/use_double/"><code>ARDUINOJSON_USE_DOUBLE</code></a> to <code>1</code>`,
      },
      {
        if: doubleNeeded && !doubleSupported,
        id: "double-not-supported",
        type: "warning",
        message: `This document contains double-precision floating points values but ${cfg.cpuInfo.label} doesn't support them (<code>double</code> is the same as <code>float</code>)`,
      },
      {
        if: hasJsonInJsonSyndrome(cfg.filteredInput),
        id: "json-in-json",
        type: "warning",
        message: `This document suffers from the <q>JSON in JSON</q> syndrome, so you may need to call <a href="${baseUrl}/v7/api/json/deserializejson/"><code>deserializeJson()</code></a> multiple times. <strong>The ArduinoJson Assistant doesn't support cfg scenario.</strong>`,
      },
      {
        if: ramStatus.value === "warning",
        id: "size-warning",
        type: "warning",
        message: `This may not fit in the RAM. Make sure there is enough free space.`,
      },
      {
        if: ramStatus.value === "error" && cfg.cpu !== "esp32",
        id: "size-error",
        type: "danger",
        message: `This is too big to fit in the RAM. See <a href="${baseUrl}/v7/how-to/deserialize-a-very-large-document/">How to deserialize a very large document?</a>`,
      },
      {
        if: ramStatus.value === "error" && cfg.cpu === "esp32",
        id: "esp32-psram",
        type: "tip",
        message: `This is too big to fit in the RAM. See <a href="${baseUrl}/v7/how-to/use-external-ram-on-esp32/">How to use external RAM on an ESP32?</a>`,
      },
    ].filter((alert) => alert.if);
  });

  return { alerts };
});
