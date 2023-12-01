import { useSettingsStore } from "@/stores/settings";

const key = "ArduinoJson Assistant 7";

export function persistStore() {
  const settings = useSettingsStore();

  try {
    const cfg = JSON.parse(localStorage.getItem(key));
    settings.setInputJson(cfg.rootJson);
    settings.setFilterJson(cfg.filterJson);
    settings.cpu = cfg.cpu;
    settings.mode = cfg.mode;
    settings.ioType = cfg.ioType;
    settings.useDouble = cfg.useDouble;
    settings.useLongLong = cfg.useLongLong;
    settings.assumeConstKeys = cfg.assumeConstKeys;
    settings.assumeConstValues = cfg.assumeConstValues;
    settings.deduplicateKeys = cfg.deduplicateKeys;
    settings.deduplicateValues = cfg.deduplicateValues;
    settings.filterEnabled = cfg.filterEnabled;
  } catch (e) {
    console.warn(e);
    settings.$reset();
  }

  settings.$subscribe((mutation, state) => {
    try {
      localStorage.setItem(
        key,
        JSON.stringify({
          mode: state.mode,
          rootJson: state.inputJson,
          filterJson: state.filterJson,
          cpu: state.cpu,
          ioType: state.ioType,
          filterEnabled: state.filterEnabled,
          useDouble: state.useDouble,
          useLongLong: state.useLongLong,
          deduplicateKeys: state.deduplicateKeys,
          deduplicateValues: state.deduplicateValues,
          assumeConstKeys: state.assumeConstKeys,
          assumeConstValues: state.assumeConstValues,
        }),
      );
    } catch (e) {
      console.warn(e);
    }
  });
}
