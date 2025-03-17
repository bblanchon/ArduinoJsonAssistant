export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type JsonArray = JsonValue[];

export type JsonObject = { [key: string]: JsonValue };

export function isJsonArray(value: JsonValue): value is JsonValue[] {
  return Array.isArray(value);
}

export function isJsonObject(
  value: JsonValue,
): value is { [key: string]: JsonValue } {
  return typeof value === "object" && !Array.isArray(value) && value !== null;
}

export function isJsonString(value: JsonValue): value is string {
  return typeof value === "string";
}

export function isJsonNumber(value: JsonValue): value is number {
  return typeof value === "number";
}

export function isJsonBoolean(value: JsonValue): value is boolean {
  return typeof value === "boolean";
}
