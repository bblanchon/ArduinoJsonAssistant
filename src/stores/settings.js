import { defineStore } from "pinia";
import { applyFilter } from "@/assistant/filter";

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

const sizeToCount = {
  1: 255,
  2: 65535,
  4: 4294967295,
};

export const useSettingsStore = defineStore("settings", {
  state() {
    return {
      assumeConstKeys: true,
      assumeConstValues: false,
      cpu: "uno",
      deduplicateKeys: true,
      deduplicateValues: true,
      filter: true,
      filterJson: "true",
      input: defaultInput,
      inputJson: JSON.stringify(defaultInput, null, 2),
      ioType: "arduinoStream",
      mode: "deserialize",
      filterEnabled: false,
      useDouble: false,
      useLongLong: false,
      slotIdSize: 1,
      stringLengthSize: 1,
    };
  },
  actions: {
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
      if (this.isDeserializing && this.filterEnabled)
        return applyFilter(this.input, this.filter);
      return this.input;
    },
    ignoreKeys() {
      if (this.isSerializing) return this.assumeConstKeys;
      else return false;
    },
    ignoreValues() {
      if (this.isSerializing) return this.assumeConstValues;
      else return false;
    },
    ioTypeNames() {
      return {
        charPtr: this.isSerializing ? "char*" : "const char*",
        charArray: "char[N]",
        arduinoString: "String",
        stdString: "std::string",
        arduinoStream: "Stream",
        stdStream: this.isSerializing ? "std::ostream" : "std::istream",
      };
    },
    hasErrors() {
      return this.filteredInput === undefined;
    },
    maxSlotCount() {
      return sizeToCount[this.slotIdSize];
    },
    maxStringLength() {
      return sizeToCount[this.stringLengthSize];
    },
  },
});
