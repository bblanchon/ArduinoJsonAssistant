import { useSettingsStore } from "@/stores/settings";

const key = "ArduinoJson Assistant 7";

export function persistStore() {
  const store = useSettingsStore();

  try {
    store.setSettings(JSON.parse(localStorage.getItem(key)));
  } catch (e) {
    console.warn(e);
    store.$reset();
  }

  store.$subscribe((mutation, state) => {
    localStorage.setItem(
      key,
      JSON.stringify({
        mode: state.mode,
        rootJson: state.inputJson,
        filterJson: state.filterEnabled ? state.filterJson : undefined,
        cpu: state.cpu,
        io: state.ioTypeId,
        useDouble: state.useDouble,
        useLongLong: state.useLongLong,
        deduplicateKeys: state.deduplicateKeys,
        deduplicateValues: state.deduplicateValues,
        assumeConstKeys: state.assumeConstKeys,
        assumeConstValues: state.assumeConstValues,
      }),
    );
  });
}
