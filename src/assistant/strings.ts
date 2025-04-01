import {
  isJsonArray,
  isJsonObject,
  isJsonString,
  type JsonValue,
} from "./json";

interface StringConfig {
  ignoreKeys?: boolean;
  ignoreValues?: boolean;
}

export function getMaxStringLength(
  obj: JsonValue,
  cfg: StringConfig = {},
): number {
  if (isJsonArray(obj)) {
    return Math.max(...obj.map((x) => getMaxStringLength(x, cfg)));
  }

  if (isJsonObject(obj)) {
    return Math.max(
      ...(cfg.ignoreKeys ? [] : Object.keys(obj).map((key) => key.length)),
      ...Object.values(obj).map((x) => getMaxStringLength(x, cfg)),
    );
  }

  if (isJsonString(obj)) {
    if (cfg.ignoreValues) return 0;
    return obj.length;
  }

  return 0;
}
