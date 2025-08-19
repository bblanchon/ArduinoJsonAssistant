import {
  isJsonArray,
  isJsonBoolean,
  isJsonNumber,
  isJsonObject,
  isJsonString,
  type JsonValue,
} from "./json";
import { canLoop } from "./loops";

export function getCppTypeFor(value: JsonValue) {
  return getCommonCppTypeFor([value]);
}

type CppType =
  | "bool"
  | "const char*"
  | "int"
  | "long"
  | "long long"
  | "float"
  | "double";

function hasShortMantissa(value: number): boolean {
  return value.toExponential().split("e")[0]!.length < 9;
}

export function getCommonCppTypeFor(values: JsonValue[]): CppType | undefined {
  if (isJsonBoolean(values[0])) {
    return "bool";
  }

  if (isJsonString(values[0])) {
    return "const char*";
  }

  if (isJsonNumber(values[0])) {
    const nums = values as number[];
    const containsFloat = nums.some((x) => x % 1);
    const max = Math.max(...nums);
    const min = Math.min(...nums);
    if (!containsFloat) {
      if (max < 32000 && min > -32000) return "int";
      if (max < 2000000000 && min > -2000000000) return "long";
      if (max < 9e18 && min > -9e18) return "long long";
    }
    if (
      max < 2e38 &&
      min > -2e38 &&
      nums.every(hasShortMantissa) &&
      (min == 0 || Math.abs(min) > 1e-45)
    )
      return "float";
    return "double";
  }

  if (values[0] === null) {
    return getCommonCppTypeFor(values.slice(1));
  }
}

function needsCppType(
  cpptype: CppType,
  value: JsonValue,
  siblings?: JsonValue[] | undefined,
): boolean {
  if (isJsonArray(value)) {
    if (canLoop(value)) return needsCppType(cpptype, value[0]!, value);
    return value.some((x) => needsCppType(cpptype, x));
  }

  if (isJsonObject(value)) {
    return Object.entries(value).some(([key, val]) =>
      needsCppType(
        cpptype,
        val,
        siblings?.filter((x) => isJsonObject(x)).map((x) => x[key] ?? null),
      ),
    );
  }

  return getCommonCppTypeFor(siblings || [value]) == cpptype;
}

export const needsDouble = (val: JsonValue) => needsCppType("double", val);
export const needsLongLong = (val: JsonValue) => needsCppType("long long", val);
