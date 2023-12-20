import { useStore } from "./store";

export function persistStore() {
  const store = useStore();

  try {
    store.setSettings(JSON.parse(localStorage.getItem("assitantConfig")));
  } catch (e) {
    console.warn(e);
    store.$reset();
  }

  store.$subscribe((mutation, state) => {
    localStorage.setItem(
      "assitantConfig",
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
