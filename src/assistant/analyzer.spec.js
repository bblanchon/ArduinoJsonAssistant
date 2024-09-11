import { describe, it, expect } from "vitest";

import {
  analyze,
  needsLongLong,
  needsDouble,
  canLoop,
  getCommonCppTypeFor,
  hasJsonInJsonSyndrome,
  getOverallocatedStringSize,
  getEffectiveSlotSize,
  getMaxStringLength,
} from "./analyzer";

const sample_object = {
  sensor: "gps",
  time: 1351824120,
  data: [48.75608, 2.302038],
};

function countSlots(input) {
  return analyze(input, { arch: "8-bit" }).slotCount;
}

describe("getEffectiveSlotSize()", () => {
  describe("on an 8-bit processor", () => {
    it("should return 6 with default configuration", () => {
      expect(getEffectiveSlotSize({ arch: "8-bit" })).toBe(6);
    });
    it("should return 6 if double is enabled", () => {
      expect(
        getEffectiveSlotSize({
          arch: "8-bit",
          useDouble: true,
        }),
      ).toBe(6);
    });
    it("should return 8 if long long is enabled", () => {
      expect(
        getEffectiveSlotSize({
          arch: "8-bit",
          useLongLong: true,
        }),
      ).toBe(8);
    });
    it("should return 7 if slot id size is 2", () => {
      expect(
        getEffectiveSlotSize({
          arch: "8-bit",
          slotIdSize: 2,
        }),
      ).toBe(7);
    });
    it("should return 13 if slot id size is 4", () => {
      expect(
        getEffectiveSlotSize({
          arch: "8-bit",
          slotIdSize: 4,
        }),
      ).toBe(13);
    });
  });

  describe("on a 32-bit processor", () => {
    it("should return 8 with default configuration", () => {
      expect(getEffectiveSlotSize({ arch: "32-bit" })).toBe(8);
    });
    it("should return 8 if double and long long are disabled", () => {
      expect(
        getEffectiveSlotSize({
          arch: "32-bit",
          useDouble: false,
          useLongLong: false,
        }),
      ).toBe(8);
    });
    it("should return 16 if slot id size is 4", () => {
      expect(
        getEffectiveSlotSize({
          arch: "32-bit",
          slotIdSize: 4,
        }),
      ).toBe(16);
    });
  });

  describe("on a 64-bit processor", () => {
    it("should return 16 with default configuration", () => {
      expect(getEffectiveSlotSize({ arch: "64-bit" })).toBe(16);
    });
    it("should return 16 if double and long long are disabled", () => {
      expect(
        getEffectiveSlotSize({
          arch: "64-bit",
          useDouble: false,
          useLongLong: false,
        }),
      ).toBe(16);
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

describe("analyze", function () {
  it("should return 0+0 for null", () => {
    const result = analyze(null, { arch: "8-bit" });
    expect(result).toMatchObject({
      memoryUsage: 14,
      peakMemoryUsage: 14,
    });
  });

  it('should return 0+6 for "hello"', () => {
    const result = analyze("hello", { arch: "8-bit" });
    expect(result).toMatchObject({
      memoryUsage: 24,
      peakMemoryUsage: 24,
    });
  });

  it("sample object on 8-bit processor", () => {
    const result = analyze(sample_object, {
      arch: "8-bit",
    });
    expect(result).toMatchObject({
      memoryUsage: 99,
      peakMemoryUsage: 147,
    });
  });

  it("sample object on 32-bit processor", () => {
    const result = analyze(sample_object, {
      arch: "32-bit",
      useLongLong: true,
      useDouble: true,
    });
    expect(result).toMatchObject({
      memoryUsage: 157,
      peakMemoryUsage: 1117,
    });
  });

  it("should not deduplicate keys if deduplicateKeys is false", () => {
    const input = [{ example: 1 }, { example: 2 }];
    const result = analyze(input, {
      deduplicateKeys: false,
      arch: "8-bit",
    });
    expect(result).toMatchObject({
      memoryUsage: 74,
      peakMemoryUsage: 134,
    });
  });

  it("should not deduplicate keys if deduplicateKeys is true", () => {
    const input = [{ example: 1 }, { example: 2 }];
    const result = analyze(input, {
      deduplicateKeys: true,
      arch: "8-bit",
    });
    expect(result).toMatchObject({
      memoryUsage: 62,
      peakMemoryUsage: 122,
    });
  });

  it("should not deduplicate values if deduplicateValues is false", () => {
    const input = ["example", "example"];
    const result = analyze(input, {
      deduplicateValues: false,
      arch: "8-bit",
    });
    expect(result).toMatchObject({
      memoryUsage: 50,
      peakMemoryUsage: 134,
    });
  });

  it("should not deduplicate keys if deduplicateValues is true", () => {
    const input = ["example", "example"];
    const result = analyze(input, {
      deduplicateValues: true,
      arch: "8-bit",
    });
    expect(result).toMatchObject({
      memoryUsage: 38,
      peakMemoryUsage: 122,
    });
  });

  it("filter simple object", () => {
    expect(
      analyze(
        { hello: 1, world: 2 },
        { arch: "8-bit", filter: { hello: true } },
      ),
    ).toMatchObject({
      memoryUsage: 72,
      peakMemoryUsage: 166,
    });
  });

  it("filter simple array", () => {
    expect(
      analyze(
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
    ).toMatchObject({
      memoryUsage: 120,
      peakMemoryUsage: 177,
    });
  });

  it("should ignore keys when ignoreKeys is true", () => {
    expect(
      analyze(
        { hello: "world!!!" },
        {
          arch: "8-bit",
          ignoreKeys: true,
        },
      ),
    ).toMatchObject({
      memoryUsage: 39,
      peakMemoryUsage: 123,
    });
  });

  it("should ignore values when ignoreValues is true", () => {
    expect(
      analyze(
        { hello: "world!!!" },
        {
          arch: "8-bit",
          ignoreValues: true,
        },
      ),
    ).toMatchObject({
      memoryUsage: 36,
      peakMemoryUsage: 120,
    });
  });

  it("should over allocate string if overAllocateString is true", () => {
    expect(
      analyze(
        { hello: "world" },
        {
          arch: "8-bit",
          overAllocateStrings: true,
        },
      ),
    ).toMatchObject({
      memoryUsage: 46,
      peakMemoryUsage: 156,
    });
  });

  it("should double pool list's capacity above 64 nodes", () => {
    expect(
      analyze(new Array(64), {
        arch: "8-bit",
        overAllocateStrings: true,
      }),
    ).toMatchObject({
      memoryUsage: 398,
      peakMemoryUsage: 398,
    });

    expect(
      analyze(new Array(65), {
        arch: "8-bit",
        overAllocateStrings: true,
      }),
    ).toMatchObject({
      memoryUsage: 424, // +26 => 5*4 for the pool list + 6 for the pool
      peakMemoryUsage: 526, // +128 => 8*4 for the pool list + 16*6 for the pool
    });
  });

  it("should quadruple pool list's capacity above 128 nodes", () => {
    expect(
      analyze(new Array(128), {
        arch: "8-bit",
        overAllocateStrings: true,
      }),
    ).toMatchObject({
      memoryUsage: 814,
      peakMemoryUsage: 814,
    });

    expect(
      analyze(new Array(129), {
        arch: "8-bit",
        overAllocateStrings: true,
      }),
    ).toMatchObject({
      memoryUsage: 824, // +10 => 4 for the pool list + 6 for the pool
      peakMemoryUsage: 942, // +128 => 8*4 for the pool list + 16*6 for the pool
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

  it("should return 2*N for an object of N members", () => {
    expect(countSlots({})).toBe(0);
    expect(countSlots({ a: 1 })).toBe(2);
    expect(countSlots({ a: 1, b: 2 })).toBe(4);
  });

  it("should return N for an array of N elements", () => {
    expect(countSlots([])).toBe(0);
    expect(countSlots([1])).toBe(1);
    expect(countSlots([1, 2])).toBe(2);
  });

  it("should recursively count slots", () => {
    expect(countSlots([{ a: 1 }, { a: 2 }])).toBe(6);
  });
});

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
