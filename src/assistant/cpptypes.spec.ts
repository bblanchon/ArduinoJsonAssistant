import { describe, expect, it } from "vitest";

import { getCommonCppTypeFor, needsDouble, needsLongLong } from "./cpptypes";

describe("getCommonCppTypeFor()", () => {
  it("string", () => {
    expect(getCommonCppTypeFor(["string", 0, true])).toBe("const char*");
  });

  it("boolean", () => {
    expect(getCommonCppTypeFor([true, 0])).toBe("bool");
    expect(getCommonCppTypeFor([false, 0])).toBe("bool");
  });

  it("int", () => {
    expect(getCommonCppTypeFor([0, 1, 2])).toBe("int");
  });

  it("float", () => {
    expect(getCommonCppTypeFor([0, 0.1, 2])).toBe("float");
  });

  it("positive long", () => {
    expect(getCommonCppTypeFor([0, 1000, 100000])).toBe("long");
    expect(getCommonCppTypeFor([0, -1000, -100000])).toBe("long");
  });

  it("positive long long", () => {
    expect(getCommonCppTypeFor([0, 1e4, 2000000000])).toBe("long long");
    expect(getCommonCppTypeFor([0, -100000, -2000000000])).toBe("long long");
  });

  it("exceed long long capacity", () => {
    expect(getCommonCppTypeFor([0, 9e18])).toBe("float");
    expect(getCommonCppTypeFor([0, -9e18])).toBe("float");
  });

  it("exceed float capacity", () => {
    expect(getCommonCppTypeFor([0, 2e38])).toBe("double");
    expect(getCommonCppTypeFor([0, -2e38])).toBe("double");
  });
});

describe("needsLongLong()", () => {
  it("long", () => {
    expect(needsLongLong(10000000)).toBe(false);
  });

  it("long long", () => {
    expect(needsLongLong(10000000000)).toBe(true);
    expect(needsLongLong(-10000000000)).toBe(true);
  });

  it("float", () => {
    expect(needsLongLong(1.4)).toBe(false);
  });

  it("exceed long long capacity", () => {
    expect(needsLongLong(9e18)).toBe(false);
    expect(needsLongLong(-9e18)).toBe(false);
  });

  it("loop with mixed integer and long-longs", () => {
    expect(
      needsLongLong([{ x: 10000 }, { x: 10000000 }, { x: 10000000000 }]),
    ).toBe(true);
  });

  it("loop with mixed long long and floats", () => {
    expect(needsLongLong([{ x: 10000000000 }, { x: 1.4 }])).toBe(false);
  });

  it("null siblings", () => {
    expect(needsLongLong([{ x: { id: 10 } }, { x: null }])).toBe(false);
    expect(needsLongLong([{ x: { id: 10000000000 } }, { x: null }])).toBe(true);
  });
});

describe("needsDouble()", () => {
  it("float", () => {
    expect(needsDouble(3.14)).toBe(false);
  });

  it("float with many digits", () => {
    expect(needsDouble(999999.11)).toBe(true);
  });

  it("integer exceeding float capacity", () => {
    expect(needsDouble(2e38)).toBe(true);
  });

  it("array with int and float", () => {
    expect(needsDouble([1, 3.14])).toBe(false);
  });

  it("array with float and double", () => {
    expect(needsDouble([3.14, 2e38])).toBe(true);
  });

  it("loop with mixed long long and double", () => {
    expect(needsDouble([{ x: 10000000000 }, { x: 2e38 }])).toBe(true);
  });

  it("object with double", () => {
    expect(needsDouble({ x: 2e38 })).toBe(true);
  });
});
