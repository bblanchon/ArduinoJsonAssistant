import {
  isJsonArray,
  isJsonObject,
  type JsonObject,
  type JsonValue,
} from "./json";

type FilterMode = "array" | "object" | "accept" | "reject";

export class JsonFilter {
  value: JsonValue;
  mode: FilterMode;
  allowsArray: boolean;
  allowsObject: boolean;
  allowsValue: boolean;
  allowsSomething: boolean;

  constructor(value: JsonValue) {
    this.value = value;
    this.mode =
      value instanceof Array
        ? "array"
        : value instanceof Object
          ? "object"
          : value === true
            ? "accept"
            : "reject";
    this.allowsArray = this.mode == "array" || this.mode == "accept";
    this.allowsObject = this.mode == "object" || this.mode == "accept";
    this.allowsValue = this.mode == "accept";
    this.allowsSomething = this.mode !== "reject";
  }

  getMemberFilter(key: string) {
    switch (this.mode) {
      case "accept":
        return new JsonFilter(true);

      case "object":
        if (!isJsonObject(this.value)) throw new Error("Object expected");
        return new JsonFilter(
          key in this.value ? this.value[key] : this.value["*"],
        );

      default:
        return new JsonFilter(false);
    }
  }

  getElementFilter() {
    switch (this.mode) {
      case "accept":
        return new JsonFilter(true);
      case "array":
        if (!isJsonArray(this.value)) throw new Error("Array expected");
        return new JsonFilter(this.value[0]);
      default:
        return new JsonFilter(false);
    }
  }

  filterDocument(input: JsonValue): JsonValue | undefined {
    switch (this.mode) {
      case "reject":
        return undefined;
      case "accept":
        return input;

      case "array": {
        if (!Array.isArray(input)) return undefined;
        const elementFilter = this.getElementFilter();
        if (elementFilter.mode === "reject") return [];
        return input.map((el) => elementFilter.filterDocument(el) ?? null);
      }

      case "object": {
        const output: JsonObject = {};
        if (!isJsonObject(input)) return undefined;
        for (const k in input) {
          if (k in input) {
            const memberFilter = this.getMemberFilter(k);
            const memberValue = memberFilter.filterDocument(input[k]);
            if (memberValue !== undefined) output[k] = memberValue;
          }
        }
        return output;
      }
    }
  }
}

export function makeJsonFilter(filter: JsonValue) {
  return new JsonFilter(filter);
}

export function applyFilter(input: JsonValue, filter: JsonValue): JsonValue {
  return new JsonFilter(filter).filterDocument(input) ?? null;
}
