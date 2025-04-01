import { isJsonArray, isJsonObject, type JsonValue } from "./json";

function areSimilar(a: JsonValue, b: JsonValue): boolean {
  if (a === null || b === null) return true;

  if (isJsonObject(a) && isJsonObject(b)) {
    for (const k in a) {
      if (!(k in b)) return false;
    }
    for (const k in b) {
      if (!(k in a)) return false;
      if (!areSimilar(a[k], b[k])) return false;
    }
  }

  if (isJsonArray(a) && isJsonArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!areSimilar(a[i], b[i])) return false;
    }
  }

  return typeof a === typeof b;
}

export function canLoop(input: JsonValue): boolean {
  if (isJsonArray(input)) {
    if (input.length < 2) return false;
    return input.every(
      (value) => isJsonObject(value) && areSimilar(input[0], value),
    );
  }

  if (isJsonObject(input)) {
    return canLoop(Object.values(input));
  }

  return false;
}
