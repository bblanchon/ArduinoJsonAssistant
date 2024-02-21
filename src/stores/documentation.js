import { defineStore } from "pinia";
import { computed, inject } from "vue";

import { useSettingsStore } from "@/stores/settings";
import { useBoardStore } from "@/stores/board";

export const useDocumentationStore = defineStore("alerts", () => {
  const board = useBoardStore();
  const settings = useSettingsStore();
  const baseUrl = inject("baseUrl");

  function* enumerateLinks() {
    if (settings.isDeserializing)
      yield {
        label: "Deserialization Tutorial",
        url: `${baseUrl}/v7/tutorial/deserialization/`,
      };

    if (settings.isSerializing)
      yield {
        label: "Serialization Tutorial",
        url: `${baseUrl}/v7/tutorial/serialization/`,
      };

    yield {
      label: "<code>JsonDocument</code>",
      url: `${baseUrl}/v7/api/jsondocument/`,
    };

    if (settings.isDeserializing)
      yield {
        label: "<code>deserializeJson()</code>",
        url: `${baseUrl}/v7/api/json/deserializejson/`,
      };

    if (settings.isSerializing)
      yield {
        label: "<code>serializeJson()</code>",
        url: `${baseUrl}/v7/api/json/serializejson/`,
      };

    if (board.slotIdSize != settings.slotIdSize)
      yield {
        label: "<code>ARDUINOJSON_SLOT_ID_SIZE</code>",
        url: `${baseUrl}/v7/config/slot_id_size/`,
      };

    if (board.stringLengthSize != settings.stringLengthSize)
      yield {
        label: "<code>ARDUINOJSON_STRING_LENGTH_SIZE</code>",
        url: `${baseUrl}/v7/config/string_length_size/`,
      };

    if (board.doubleIsDefault != settings.useDouble)
      yield {
        label: "<code>ARDUINOJSON_USE_DOUBLE</code>",
        url: `${baseUrl}/v7/config/use_double/`,
      };

    if (board.longLongIsDefault != settings.useLongLong)
      yield {
        label: "<code>ARDUINOJSON_USE_LONG_LONG</code>",
        url: `${baseUrl}/v7/config/use_long_long/`,
      };
  }

  return {
    links: computed(() => Array.from(enumerateLinks())),
  };
});
