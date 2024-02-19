import { describe, it, expect } from "vitest";

import {
  measureSize,
  needsLongLong,
  needsDouble,
  canLoop,
  getCommonCppTypeFor,
  hasJsonInJsonSyndrome,
  getOverallocatedStringSize,
  getEffectiveSlotSize,
  countSlots,
} from "./analyzer";

const sample_object = {
  sensor: "gps",
  time: 1351824120,
  data: [48.75608, 2.302038],
};

describe("getEffectiveSlotSize()", () => {
  describe("on an 8-bit processor", () => {
    it("should return 8 with default configuration", () => {
      expect(getEffectiveSlotSize({ arch: "8-bit" })).toBe(8);
    });
    it("should return 8 if double is enabled", () => {
      expect(
        getEffectiveSlotSize({
          arch: "8-bit",
          useDouble: true,
        }),
      ).toBe(8);
    });
    it("should return 12 if long long is enabled", () => {
      expect(
        getEffectiveSlotSize({
          arch: "8-bit",
          useLongLong: true,
        }),
      ).toBe(12);
    });
  });

  describe("on a 32-bit processor", () => {
    it("should return 16 with default configuration", () => {
      expect(getEffectiveSlotSize({ arch: "32-bit" })).toBe(16);
    });
    it("should return 12 if double and long long are disabled", () => {
      expect(
        getEffectiveSlotSize({
          arch: "32-bit",
          useDouble: false,
          useLongLong: false,
        }),
      ).toBe(12);
    });
  });

  describe("on a 64-bit processor", () => {
    it("should return 24 with default configuration", () => {
      expect(getEffectiveSlotSize({ arch: "64-bit" })).toBe(24);
    });
    it("should return 24 if double and long long are disabled", () => {
      expect(
        getEffectiveSlotSize({
          arch: "64-bit",
          useDouble: false,
          useLongLong: false,
        }),
      ).toBe(24);
    });
  });
});

describe("getOverallocatedStringSize()", () => {
  it("should return 31 for a length between 0 and 31", () => {
    expect(getOverallocatedStringSize(0)).toBe(31);
    expect(getOverallocatedStringSize(31)).toBe(31);
  });

  it("should return 63 for a length between 32 and 63", () => {
    expect(getOverallocatedStringSize(32)).toBe(63);
    expect(getOverallocatedStringSize(63)).toBe(63);
  });
});

describe("measureSize", function () {
  it("should return 0+0 for null", () => {
    const result = measureSize(null, { arch: "8-bit" });
    expect(result).toEqual({
      memoryUsage: 14,
      peakMemoryUsage: 14,
    });
  });

  it('should return 0+6 for "hello"', () => {
    const result = measureSize("hello", { arch: "8-bit" });
    expect(result).toEqual({
      memoryUsage: 24,
      peakMemoryUsage: 24,
    });
  });

  it("sample object on 8-bit processor", () => {
    const result = measureSize(sample_object, {
      arch: "8-bit",
    });
    expect(result).toEqual({
      memoryUsage: 91,
      peakMemoryUsage: 179,
    });
  });

  it("sample object on 32-bit processor", () => {
    const result = measureSize(sample_object, {
      arch: "32-bit",
      useLongLong: true,
      useDouble: true,
    });
    expect(result).toEqual({
      memoryUsage: 173,
      peakMemoryUsage: 1117,
    });
  });

  it("should not deduplicate keys if deduplicateKeys is false", () => {
    const input = [{ example: 1 }, { example: 2 }];
    const result = measureSize(input, {
      deduplicateKeys: false,
      arch: "8-bit",
    });
    expect(result).toEqual({
      memoryUsage: 70,
      peakMemoryUsage: 166,
    });
  });

  it("should not deduplicate keys if deduplicateKeys is true", () => {
    const input = [{ example: 1 }, { example: 2 }];
    const result = measureSize(input, {
      deduplicateKeys: true,
      arch: "8-bit",
    });
    expect(result).toEqual({
      memoryUsage: 58,
      peakMemoryUsage: 154,
    });
  });

  it("should not deduplicate values if deduplicateValues is false", () => {
    const input = ["example", "example"];
    const result = measureSize(input, {
      deduplicateValues: false,
      arch: "8-bit",
    });
    expect(result).toEqual({
      memoryUsage: 54,
      peakMemoryUsage: 166,
    });
  });

  it("should not deduplicate keys if deduplicateValues is true", () => {
    const input = ["example", "example"];
    const result = measureSize(input, {
      deduplicateValues: true,
      arch: "8-bit",
    });
    expect(result).toEqual({
      memoryUsage: 42,
      peakMemoryUsage: 154,
    });
  });

  it("filter simple object", () => {
    expect(
      measureSize(
        { hello: 1, world: 2 },
        { arch: "8-bit", filter: { hello: true } },
      ),
    ).toEqual({
      memoryUsage: 64,
      peakMemoryUsage: 194,
    });
  });

  it("filter simple array", () => {
    expect(
      measureSize(
        [
          { hello: 1, world: 0 },
          { hello: 2, worldWorld: 0 },
          { hello: 3, x: "what a wonderful day!" },
        ],
        {
          arch: "8-bit",
          deduplicateKeys: true,
          filter: [{ hello: true }],
        },
      ),
    ).toEqual({
      memoryUsage: 112,
      peakMemoryUsage: 207,
    });
  });

  it("should ignore keys when ignoreKeys is true", () => {
    expect(
      measureSize(
        { hello: "world!!!" },
        {
          arch: "8-bit",
          ignoreKeys: true,
        },
      ),
    ).toEqual({
      memoryUsage: 35,
      peakMemoryUsage: 155,
    });
  });

  it("should ignore values when ignoreValues is true", () => {
    expect(
      measureSize(
        { hello: "world!!!" },
        {
          arch: "8-bit",
          ignoreValues: true,
        },
      ),
    ).toEqual({
      memoryUsage: 32,
      peakMemoryUsage: 152,
    });
  });

  it("should over allocate string if overAllocateString is true", () => {
    expect(
      measureSize(
        { hello: "world" },
        {
          arch: "8-bit",
          overAllocateStrings: true,
        },
      ),
    ).toEqual({
      memoryUsage: 42,
      peakMemoryUsage: 188,
    });
  });

  it("should double pool list's capacity above 64 nodes", () => {
    expect(
      measureSize(new Array(64), {
        arch: "8-bit",
        overAllocateStrings: true,
      }),
    ).toEqual({
      memoryUsage: 526,
      peakMemoryUsage: 526,
    });

    expect(
      measureSize(new Array(65), {
        arch: "8-bit",
        overAllocateStrings: true,
      }),
    ).toEqual({
      memoryUsage: 554, // +28 => 5*4 for the pool list + 8 for the pool
      peakMemoryUsage: 686, // +160 => 8*4 for the pool list + 16*8 for the pool
    });
  });

  it("should quadruple pool list's capacity above 128 nodes", () => {
    expect(
      measureSize(new Array(128), {
        arch: "8-bit",
        overAllocateStrings: true,
      }),
    ).toEqual({
      memoryUsage: 1070,
      peakMemoryUsage: 1070,
    });

    expect(
      measureSize(new Array(129), {
        arch: "8-bit",
        overAllocateStrings: true,
      }),
    ).toEqual({
      memoryUsage: 1082, // +28 => 4 for the pool list + 8 for the pool
      peakMemoryUsage: 1230, // +160 => 8*4 for the pool list + 16*8 for the pool
    });
  });
});

describe("hasJsonInJsonSyndrome()", () => {
  it("should return false for undefined", () => {
    expect(hasJsonInJsonSyndrome(undefined)).toBe(false);
  });

  it("should return false for a random string", () => {
    expect(hasJsonInJsonSyndrome("hello")).toBe(false);
  });

  it("should return true for a JSON string", () => {
    expect(hasJsonInJsonSyndrome('{"value":1}')).toBe(true);
  });

  it("should return true for a number string", () => {
    expect(hasJsonInJsonSyndrome("12345")).toBe(false);
  });

  it("should return true for a JSON string in an object", () => {
    expect(hasJsonInJsonSyndrome({ result: '{"value":1}' })).toBe(true);
  });

  it("should return true for a JSON string in an array", () => {
    expect(hasJsonInJsonSyndrome(['{"value":1}'])).toBe(true);
  });
});

describe("canLoop()", () => {
  it("null", () => {
    expect(canLoop(null)).toBe(false);
  });

  it("empty object", () => {
    expect(canLoop({})).toBe(false);
  });

  it("empty array", () => {
    expect(canLoop([])).toBe(false);
  });

  it("array with one element", () => {
    expect(canLoop([42])).toBe(false);
  });

  it("object with one member", () => {
    expect(canLoop({ answer: 42 })).toBe(false);
  });

  it("array with two integers", () => {
    expect(canLoop([1, 2])).toBe(false);
  });

  it("array with two empty objects", () => {
    expect(canLoop([{}, {}])).toBe(true);
  });

  it("array with an object and an array", () => {
    expect(canLoop([{}, []])).toBe(false);
  });

  it("array with two objects with same keys and same values types", () => {
    expect(canLoop([{ a: 1 }, { a: 1 }])).toBe(true);
  });

  it("array with two objects with different keys", () => {
    expect(canLoop([{ a: 1 }, { b: 1 }])).toBe(false);
  });

  it("array with two objects with same keys but different value types", () => {
    expect(canLoop([{ a: 1 }, { a: "1" }])).toBe(false);
  });

  it("array with two objects with same keys and loopable values", () => {
    expect(canLoop([{ a: [1, 2] }, { a: [3, 4] }])).toBe(true);
  });

  it("array with two objects with same keys and non-loopable values", () => {
    expect(canLoop([{ a: [1, 2] }, { a: [3, "4"] }])).toBe(false);
  });

  it("array with mixed types", () => {
    expect(canLoop([1, "2"])).toBe(false);
  });

  it("OpenWeatherMap example", () => {
    expect(
      canLoop([
        {
          dt: 1511978400,
          main: { temp: 3.95 },
          weather: [{ description: "light rain" }],
        },
        {
          dt: 1511989200,
          main: { temp: 3.2 },
          weather: [{ description: "light rain" }],
        },
      ]),
    ).toBe(true);
  });

  it("1technophile example", () => {
    expect(
      canLoop({
        batt: { unit: "%", name: "battery" },
        tempc: { unit: "°C", name: "temperature" },
        hum: { unit: "%", name: "humidity" },
      }),
    ).toBe(true);
  });
});

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

describe("countSlots", () => {
  it("should return 0 for simple values", () => {
    expect(countSlots(null)).toBe(0);
    expect(countSlots(true)).toBe(0);
    expect(countSlots(42)).toBe(0);
    expect(countSlots(42.0)).toBe(0);
  });

  it("should return N for an object of N members", () => {
    expect(countSlots({})).toBe(0);
    expect(countSlots({ a: 1 })).toBe(1);
    expect(countSlots({ a: 1, b: 2 })).toBe(2);
  });

  it("should return N for an array of N elements", () => {
    expect(countSlots([])).toBe(0);
    expect(countSlots([1])).toBe(1);
    expect(countSlots([1, 2])).toBe(2);
  });

  it("should recursively count slots", () => {
    expect(countSlots([{ a: 1 }, { a: 2 }])).toBe(4);
  });
});
