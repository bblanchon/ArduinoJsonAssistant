import { defineStore } from "pinia";
import { applyFilter } from "@/assistant/filter";
import boards from "@/assets/boards.json";

const defaultInput = {
  sensor: "gps",
  time: 1351824120,
  data: [48.75608, 2.302038],
};

function tryParse(input) {
  try {
    return JSON.parse(input);
  } catch {
    return undefined;
  }
}

export const useSettingsStore = defineStore("settings", {
  state() {
    return {
      assumeConstKeys: true,
      assumeConstValues: false,
      cpu: "uno",
      deduplicateKeys: true,
      deduplicateValues: false,
      filter: true,
      filterJson: "true",
      input: defaultInput,
      inputJson: JSON.stringify(defaultInput, null, 2),
      ioTypeId: "arduinoStream",
      mode: "deserialize",
      filterEnabled: false,
      useDouble: false,
      useLongLong: false,
    };
  },
  actions: {
    setSettings(cfg) {
      if (!cfg) return;
      if (cfg.rootJson) {
        this.inputJson = cfg.rootJson;
        try {
          this.input = JSON.parse(this.inputJson);
        } catch {
          this.input = undefined;
        }
      } else if (cfg.root) {
        this.input = cfg.root;
        this.inputJson = JSON.stringify(cfg.root, null, 2);
      }
      if (cfg.filterJson) {
        this.filterJson = cfg.filterJson;
        this.filter = tryParse(cfg.filterJson);
      } else if (cfg.filter) {
        this.filter = cfg.filter;
        this.filterJson = JSON.stringify(cfg.filter, null, 2);
      }
      if (cfg.mode) {
        this.mode = cfg.mode;
        this.assumeConstKeys = true;
        this.assumeConstValues = false;
        this.deduplicateKeys = true;
        this.deduplicateValues = false;
      }
      if (cfg.cpu && boards[cfg.cpu]) {
        this.cpu = cfg.cpu;
        this.useDouble = boards[cfg.cpu].useDouble?.default;
        this.useLongLong = boards[cfg.cpu].useLongLong?.default;
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
      this.useDouble = boards[cpu].useDouble?.default;
      this.useLongLong = boards[cpu].useLongLong?.default;
    },
    selectMode(mode) {
      this.mode = mode;
      this.assumeConstKeys = true;
      this.assumeConstValues = false;
      this.deduplicateKeys = true;
      this.deduplicateValues = false;
    },
    selectIoType(ioTypeId) {
      this.ioTypeId = ioTypeId;
    },
    setFilterJson(val) {
      this.filterJson = val;
      this.filter = tryParse(val);
    },
    setInputJson(val) {
      this.inputJson = val;
      this.input = tryParse(val);
    },
  },
  getters: {
    isSerializing() {
      return this.mode === "serialize";
    },
    isDeserializing() {
      return this.mode === "deserialize";
    },
    filteredInput() {
      if (!this.filterEnabled) return this.input;
      return applyFilter(this.input, this.filter);
    },
    ignoreKeys() {
      if (this.isSerializing) return this.assumeConstKeys;
      else return false;
    },
    ignoreValues() {
      if (this.isSerializing) return this.assumeConstValues;
      else return false;
    },
    ioType() {
      return this.ioTypes[this.ioTypeId];
    },
    ioTypes() {
      return {
        charPtr: {
          label: "char*",
        },
        charArray: {
          label: "char[N]",
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
