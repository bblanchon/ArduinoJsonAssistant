import { createStore } from "vuex";
import { applyFilter } from "@/assistant/filter";
import cpuInfos from "@/assistant/cpus";

const store = createStore({
  state() {
    return {
      assumeConstKeys: undefined,
      assumeConstValues: undefined,
      cpu: "avr",
      deduplicateKeys: undefined,
      deduplicateValues: undefined,
      filter: true,
      filterError: null,
      filterJson: "true",
      input: null,
      inputError: "",
      inputJson: "{}",
      ioTypeId: "arduinoStream",
      mode: "deserialize",
      useDouble: false,
      useLongLong: false,
    };
  },
  mutations: {
    setSettings(state, cfg) {
      if (cfg.rootJson) {
        state.inputJson = cfg.rootJson;
        try {
          state.input = JSON.parse(state.inputJson);
          state.inputError = "";
        } catch (ex) {
          state.input = undefined;
          state.inputError = ex.message;
        }
      } else if (cfg.root) {
        state.input = cfg.root;
        state.inputJson = JSON.stringify(cfg.root, null, 2);
      }
      if (cfg.filterJson) {
        state.filterJson = cfg.filterJson;
      } else if (cfg.filter) {
        state.filterJson = JSON.stringify(cfg.filter, null, 2);
      }
      if (cfg.mode) {
        state.mode = cfg.mode;
        const serializing = cfg.mode === "serialize";
        const deserializing = state.mode.indexOf("deserialize") === 0;
        state.assumeConstKeys = serializing ? true : undefined;
        state.assumeConstValues = serializing ? false : undefined;
        state.deduplicateKeys = deserializing ? true : undefined;
        state.deduplicateValues = deserializing ? false : undefined;
      }
      if (cfg.cpu && cpuInfos[cfg.cpu]) {
        state.cpu = cfg.cpu;
        state.useDouble = cpuInfos[cfg.cpu].useDouble?.default;
        state.useLongLong = cpuInfos[cfg.cpu].useLongLong?.default;
      }
      if (cfg.useDouble != undefined) state.useDouble = cfg.useDouble;
      if (cfg.useLongLong != undefined) state.useLongLong = cfg.useLongLong;
      if (cfg.assumeConstKeys != undefined)
        state.assumeConstKeys = cfg.assumeConstKeys;
      if (cfg.assumeConstValues != undefined)
        state.assumeConstValues = cfg.assumeConstValues;
      if (cfg.deduplicateKeys != undefined)
        state.deduplicateKeys = cfg.deduplicateKeys;
      if (cfg.deduplicateValues != undefined)
        state.deduplicateValues = cfg.deduplicateValues;
    },
    selectCpu(state, cpu) {
      state.cpu = cpu;
      state.useDouble = cpuInfos[cpu].useDouble?.default;
      state.useLongLong = cpuInfos[cpu].useLongLong?.default;
    },
    selectMode(state, mode) {
      state.mode = mode;
      const serializing = mode === "serialize";
      const deserializing = state.mode.indexOf("deserialize") === 0;
      state.assumeConstKeys = serializing ? true : undefined;
      state.assumeConstValues = serializing ? false : undefined;
      state.deduplicateKeys = deserializing ? true : undefined;
      state.deduplicateValues = deserializing ? false : undefined;
    },
    selectIoType(state, ioTypeId) {
      state.ioTypeId = ioTypeId;
    },
    setFilterJson(state, val) {
      state.filterJson = val;
      try {
        state.filter = JSON.parse(val);
        state.filterError = "";
      } catch (ex) {
        state.filter = undefined;
        state.filterError = ex.message;
      }
    },
    setInputJson(state, val) {
      state.inputJson = val;
      try {
        state.input = JSON.parse(val);
        state.inputError = "";
      } catch (ex) {
        state.input = undefined;
        state.inputError = ex.message;
      }
    },
    setUseDouble(state, val) {
      state.useDouble = val;
    },
    setUseLongLong(state, val) {
      state.useLongLong = val;
    },
    setAssumeConstKeys(state, val) {
      state.assumeConstKeys = val;
    },
    setAssumeConstValues(state, val) {
      state.assumeConstValues = val;
    },
    setDeduplicateKeys(state, val) {
      state.deduplicateKeys = val;
    },
    setDeduplicateValues(state, val) {
      state.deduplicateValues = val;
    },
  },
  getters: {
    defaults(state, getters) {
      return {
        assumeConstKeys: getters.isSerializing ? true : undefined,
        assumeConstValues: getters.isSerializing ? false : undefined,
        deduplicateKeys: true,
        deduplicateValues: false,
        useDouble: !!getters.cpuInfo.useDouble?.default,
        useLongLong: !!getters.cpuInfo.useLongLong?.default,
      };
    },
    cpuInfo(state) {
      return cpuInfos[state.cpu];
    },
    isSerializing(state) {
      return state.mode === "serialize";
    },
    isDeserializing(state) {
      return state.mode.indexOf("deserialize") === 0;
    },
    configuration(state, getters) {
      return {
        mode: state.mode,
        root: state.input,
        filter: state.filterEnabled ? state.filter : undefined,
        cpu: getters.cpuInfo,
        ignoreKeys: getters.ignoreKeys,
        ignoreValues: getters.ignoreValues,
        deduplicateKeys: state.deduplicateKeys,
        deduplicateValues: state.deduplicateValues,
        useLongLong: state.useLongLong,
        useDouble: state.useDouble,
        inputType: state.ioTypeId,
      };
    },
    filterEnabled(state) {
      return state.mode === "deserialize-filter";
    },
    filteredInput(state, getters) {
      if (!getters.filterEnabled) return state.input;
      if (state.filterError) return undefined;
      return applyFilter(state.input, state.filter);
    },
    ignoreKeys(state, getters) {
      if (getters.isSerializing) return state.assumeConstKeys;
      else return !!getters.ioType.ignoreStrings;
    },
    ignoreValues(state, getters) {
      if (getters.isSerializing) return state.assumeConstValues;
      else return !!getters.ioType.ignoreStrings;
    },
    ioType(state, getters) {
      return getters.ioTypes[state.ioTypeId];
    },
    ioTypes(state, getters) {
      return {
        charPtr: {
          label: "char*",
          ignoreStrings: true,
        },
        charArray: {
          label: "char[N]",
          ignoreStrings: true,
        },
        constCharPtr: {
          label: "const char*",
          disabled: getters.isSerializing,
        },
        arduinoString: {
          label: "String",
          disabled: state.cpu[0] == "x",
        },
        stdString: {
          label: "std::string",
          disabled: state.cpu == "avr",
        },
        arduinoStream: {
          label: "Stream",
          disabled: state.cpu[0] == "x",
        },
        stdStream: {
          label: getters.isSerializing ? "std::ostream" : "std::istream",
          disabled: state.cpu == "avr",
        },
      };
    },
    hasErrors(_state, getters) {
      return getters.filteredInput === undefined;
    },
  },
  actions: {
    report({ state }, { action, label, value }) {
      console.log("ga send event", action, label, value);
      ga("set", {
        dimension1: state.mode,
        dimension2: state.cpu,
        dimension3: state.ioTypeId,
      });
      ga("send", "event", {
        eventCategory: "assistant",
        eventAction: action,
        eventLabel: label,
        eventValue: value,
      });
    },
  },
});

const defaultConfig = {
  mode: "deserialize",
  root: {
    sensor: "gps",
    time: 1351824120,
    data: [48.75608, 2.302038],
  },
};

try {
  store.commit(
    "setSettings",
    JSON.parse(localStorage.getItem("assitantConfig"))
  );
} catch (e) {
  console.warn(e);
  store.commit("setSettings", defaultConfig);
}

store.subscribe((mutation, state) => {
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
    })
  );
});

export default store;
