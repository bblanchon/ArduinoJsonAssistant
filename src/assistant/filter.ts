import {
  isJsonArray,
  isJsonObject,
  type JsonObject,
  type JsonValue,
} from "./json";

export class JsonFilter {
  value: JsonValue;

  constructor(value: JsonValue) {
    this.value = value;
  }

  allows(value: JsonValue): boolean {
    if (this.value === true) return true;
    if (isJsonArray(this.value) && isJsonArray(value)) return true;
    if (isJsonObject(this.value) && isJsonObject(value)) return true;
    return false;
  }

  private getMember(key: string): JsonValue {
    if (this.value === true) return true;
    if (isJsonObject(this.value)) {
      if (key in this.value) return this.value[key]!;
      else return this.value["*"] ?? false;
    }
    return false;
  }

  getMemberFilter(key: string) {
    return new JsonFilter(this.getMember(key));
  }

  private getElement(): JsonValue {
    if (this.value === true) return true;
    if (isJsonArray(this.value)) return this.value[0] ?? false;
    return false;
  }

  getElementFilter(): JsonFilter {
    return new JsonFilter(this.getElement());
  }

  apply(input: JsonValue): JsonValue | undefined {
    if (this.value === true) return input;

    if (isJsonArray(this.value) && isJsonArray(input)) {
      const elementFilter = this.getElementFilter();
      if (!elementFilter.value) return [];
      return input.map((el) => elementFilter.apply(el) ?? null);
    }

    if (isJsonObject(this.value) && isJsonObject(input)) {
      const output: JsonObject = {};
      Object.entries(input).forEach(([key, val]) => {
        const memberFilter = this.getMemberFilter(key);
        const memberValue = memberFilter.apply(val);
        if (memberValue !== undefined) output[key] = memberValue;
      });
      return output;
    }

    return undefined;
  }
}

export function applyFilter(input: JsonValue, filter: JsonValue): JsonValue {
  return new JsonFilter(filter).apply(input) ?? null;
}
