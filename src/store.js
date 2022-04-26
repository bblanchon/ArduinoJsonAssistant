import { defineStore } from "pinia";
import { applyFilter } from "@/assistant/filter";
import cpuInfos from "@/assistant/cpus";

const defaultInput = {
  sensor: "gps",
  time: 1351824120,
  data: [48.75608, 2.302038],
};

export const useStore = defineStore("assistant", {
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
      input: defaultInput,
      inputError: "",
      inputJson: JSON.stringify(defaultInput, null, 2),
      ioTypeId: "arduinoStream",
      mode: "deserialize",
      useDouble: false,
      useLongLong: false,
    };
  },
  actions: {
    setSettings(cfg) {
      if (cfg.rootJson) {
        this.inputJson = cfg.rootJson;
        try {
          this.input = JSON.parse(this.inputJson);
          this.inputError = "";
        } catch (ex) {
          this.input = undefined;
          this.inputError = ex.message;
        }
      } else if (cfg.root) {
        this.input = cfg.root;
        this.inputJson = JSON.stringify(cfg.root, null, 2);
      }
      if (cfg.filterJson) {
        this.filterJson = cfg.filterJson;
      } else if (cfg.filter) {
        this.filterJson = JSON.stringify(cfg.filter, null, 2);
      }
      if (cfg.mode) {
        this.mode = cfg.mode;
        const serializing = cfg.mode === "serialize";
        const deserializing = this.mode.indexOf("deserialize") === 0;
        this.assumeConstKeys = serializing ? true : undefined;
        this.assumeConstValues = serializing ? false : undefined;
        this.deduplicateKeys = deserializing ? true : undefined;
        this.deduplicateValues = deserializing ? false : undefined;
      }
      if (cfg.cpu && cpuInfos[cfg.cpu]) {
        this.cpu = cfg.cpu;
        this.useDouble = cpuInfos[cfg.cpu].useDouble?.default;
        this.useLongLong = cpuInfos[cfg.cpu].useLongLong?.default;
      }
      if (cfg.useDouble != undefined) this.useDouble = cfg.useDouble;
      if (cfg.useLongLong != undefined) this.useLongLong = cfg.useLongLong;
      if (cfg.assumeConstKeys != undefined)
        this.assumeConstKeys = cfg.assumeConstKeys;
      if (cfg.assumeConstValues != undefined)
        this.assumeConstValues = cfg.assumeConstValues;
      if (cfg.deduplicateKeys != undefined)
        this.deduplicateKeys = cfg.deduplicateKeys;
      if (cfg.deduplicateValues != undefined)
        this.deduplicateValues = cfg.deduplicateValues;
    },
    selectCpu(cpu) {
      this.cpu = cpu;
      this.useDouble = cpuInfos[cpu].useDouble?.default;
      this.useLongLong = cpuInfos[cpu].useLongLong?.default;
    },
    selectMode(mode) {
      this.mode = mode;
      const serializing = mode === "serialize";
      const deserializing = this.mode.indexOf("deserialize") === 0;
      this.assumeConstKeys = serializing ? true : undefined;
      this.assumeConstValues = serializing ? false : undefined;
      this.deduplicateKeys = deserializing ? true : undefined;
      this.deduplicateValues = deserializing ? false : undefined;
    },
    selectIoType(ioTypeId) {
      this.ioTypeId = ioTypeId;
    },
    setFilterJson(val) {
      this.filterJson = val;
      try {
        this.filter = JSON.parse(val);
        this.filterError = "";
      } catch (ex) {
        this.filter = undefined;
        this.filterError = ex.message;
      }
    },
    setInputJson(val) {
      this.inputJson = val;
      try {
        this.input = JSON.parse(val);
        this.inputError = "";
      } catch (ex) {
        this.input = undefined;
        this.inputError = ex.message;
      }
    },
    report({ action, label, value }) {
      ga("set", {
        dimension1: this.mode,
        dimension2: this.cpu,
        dimension3: this.ioTypeId,
      });
      ga("send", "event", {
        eventCategory: "assistant",
        eventAction: action,
        eventLabel: label,
        eventValue: value,
      });
    },
  },
  getters: {
    defaults() {
      return {
        assumeConstKeys: this.isSerializing ? true : undefined,
        assumeConstValues: this.isSerializing ? false : undefined,
        deduplicateKeys: true,
        deduplicateValues: false,
        useDouble: !!this.cpuInfo.useDouble?.default,
        useLongLong: !!this.cpuInfo.useLongLong?.default,
      };
    },
    cpuInfo() {
      return cpuInfos[this.cpu];
    },
    isSerializing() {
      return this.mode === "serialize";
    },
    isDeserializing() {
      return this.mode.indexOf("deserialize") === 0;
    },
    configuration() {
      return {
        mode: this.mode,
        root: this.input,
        filter: this.filterEnabled ? this.filter : undefined,
        cpu: this.cpuInfo,
        ignoreKeys: this.ignoreKeys,
        ignoreValues: this.ignoreValues,
        deduplicateKeys: this.deduplicateKeys,
        deduplicateValues: this.deduplicateValues,
        useLongLong: this.useLongLong,
        useDouble: this.useDouble,
        inputType: this.ioTypeId,
      };
    },
    filterEnabled() {
      return this.mode === "deserialize-filter";
    },
    filteredInput() {
      if (!this.filterEnabled) return this.input;
      if (this.filterError) return undefined;
      return applyFilter(this.input.filter);
    },
    ignoreKeys() {
      if (this.isSerializing) return this.assumeConstKeys;
      else return !!this.ioType.ignoreStrings;
    },
    ignoreValues() {
      if (this.isSerializing) return this.assumeConstValues;
      else return !!this.ioType.ignoreStrings;
    },
    ioType() {
      return this.ioTypes[this.ioTypeId];
    },
    ioTypes() {
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
          disabled: this.isSerializing,
        },
        arduinoString: {
          label: "String",
          disabled: this.cpu[0] == "x",
        },
        stdString: {
          label: "std::string",
          disabled: this.cpu == "avr",
        },
        arduinoStream: {
          label: "Stream",
          disabled: this.cpu[0] == "x",
        },
        stdStream: {
          label: this.isSerializing ? "std::ostream" : "std::istream",
          disabled: this.cpu == "avr",
        },
      };
    },
    hasErrors() {
      return this.filteredInput === undefined;
    },
  },
});
