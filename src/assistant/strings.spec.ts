import { describe, expect, it } from "vitest";

import { getMaxStringLength } from "./strings";

describe("getMaxStringLength", () => {
  it("should return 0 for simple values", () => {
    expect(getMaxStringLength(null)).toBe(0);
    expect(getMaxStringLength(true)).toBe(0);
    expect(getMaxStringLength(42)).toBe(0);
    expect(getMaxStringLength(42.0)).toBe(0);
  });

  it("should return the length of the string", () => {
    expect(getMaxStringLength("a")).toBe(1);
    expect(getMaxStringLength("aa")).toBe(2);
    expect(getMaxStringLength("aaa")).toBe(3);
  });

  it("should return 0 if ignoreValues is true", () => {
    const cfg = { ignoreValues: true };
    expect(getMaxStringLength("a", cfg)).toBe(0);
    expect(getMaxStringLength(["a", "aa", "aaa"], cfg)).toBe(0);
  });

  it("should return the length of the longest array value", () => {
    expect(getMaxStringLength(["a", "aa", "aaa"])).toBe(3);
  });

  it("should return the length of the longest object key", () => {
    expect(getMaxStringLength({ a: 1, aa: 2, aaa: 3 })).toBe(3);
  });

  it("should return the 0 if ignoreKeys is true", () => {
    const cfg = { ignoreKeys: true };
    expect(getMaxStringLength({ a: 1, aa: 2, aaa: 3 }, cfg)).toBe(0);
  });
});
