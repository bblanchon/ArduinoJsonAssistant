import { describe, it, expect } from "vitest";

import {
  measureSize,
  needsLongLong,
  needsDouble,
  roundCapacity,
  canLoop,
  getCommonCppTypeFor,
  hasJsonInJsonSyndrome,
  countSlots,
} from "./analyzer";
import cpuInfos from "./cpus";

const sample_object = {
  sensor: "gps",
  time: 1351824120,
  data: [48.75608, 2.302038],
};

describe("measureSize", function () {
  it("should return 0+0 for null", () => {
    const result = measureSize(null, { cpu: cpuInfos.avr });
    expect(result).toEqual({
      slots: 0,
      strings: 0,
      minimum: 0,
      recommended: 0,
    });
  });

  it('should return 0+6 for "hello"', () => {
    const result = measureSize("hello", { cpu: cpuInfos.avr });
    expect(result).toEqual({
      slots: 0,
      strings: 6,
      minimum: 6,
      recommended: 16,
    });
  });

  it("should return 40+21 on AVR", () => {
    const result = measureSize(sample_object, { cpu: cpuInfos.avr });
    expect(result).toEqual({
      slots: 40,
      strings: 21,
      minimum: 61,
      recommended: 96,
    });
  });

  it("should return 80+21 on ESP", () => {
    const result = measureSize(sample_object, { cpu: cpuInfos.esp8266 });
    expect(result).toEqual({
      slots: 80,
      strings: 21,
      minimum: 101,
      recommended: 128,
    });
  });

  it("should not deduplicate keys if deduplicateKeys is false", () => {
    const input = [{ example: 1 }, { example: 2 }];
    const result = measureSize(input, {
      deduplicateKeys: false,
      cpu: { slotSize: 8 },
    });
    expect(result).toEqual({
      slots: 32,
      strings: 16,
      minimum: 48,
      recommended: 64,
    });
  });

  it("should not deduplicate keys if deduplicateKeys is true", () => {
    const input = [{ example: 1 }, { example: 2 }];
    const result = measureSize(input, {
      deduplicateKeys: true,
      cpu: { slotSize: 8 },
    });
    expect(result).toEqual({
      slots: 32,
      strings: 8,
      minimum: 40,
      recommended: 64,
    });
  });

  it("should not deduplicate values if deduplicateValues is false", () => {
    const input = ["example", "example"];
    const result = measureSize(input, {
      deduplicateValues: false,
      cpu: { slotSize: 8 },
    });
    expect(result).toEqual({
      slots: 16,
      strings: 16,
      minimum: 32,
      recommended: 48,
    });
  });

  it("should not deduplicate keys if deduplicateValues is true", () => {
    const input = ["example", "example"];
    const result = measureSize(input, {
      deduplicateValues: true,
      cpu: { slotSize: 8 },
    });
    expect(result).toEqual({
      slots: 16,
      strings: 8,
      minimum: 24,
      recommended: 48,
    });
  });

  it("filter simple object", () => {
    expect(
      measureSize(
        { hello: 1, world: 2 },
        { cpu: { slotSize: 8 }, filter: { hello: true } },
      ),
    ).toEqual({
      filter: 6,
      slots: 8,
      strings: 6,
      minimum: 20,
      recommended: 32,
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
          cpu: { slotSize: 8 },
          deduplicateKeys: true,
          filter: [{ hello: true }],
        },
      ),
    ).toEqual({
      filter: 11,
      slots: 48,
      strings: 6,
      minimum: 65,
      recommended: 96,
    });
  });

  it("should ignore keys when ignoreKeys is true", () => {
    expect(
      measureSize(
        { hello: "world!!!" },
        {
          cpu: { slotSize: 8 },
          ignoreKeys: true,
        },
      ),
    ).toEqual({
      slots: 8,
      strings: 9,
      minimum: 17,
      recommended: 32,
    });
  });

  it("should ignore values when ignoreValues is true", () => {
    expect(
      measureSize(
        { hello: "world!!!" },
        {
          cpu: { slotSize: 8 },
          ignoreValues: true,
        },
      ),
    ).toEqual({
      slots: 8,
      strings: 6,
      minimum: 14,
      recommended: 24,
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

it("roundCapacity", () => {
  expect(roundCapacity(0)).toBe(0);
  expect(roundCapacity(1)).toBe(8);
  expect(roundCapacity(10)).toBe(16);
  expect(roundCapacity(100)).toBe(128);
  expect(roundCapacity(127)).toBe(128);
  expect(roundCapacity(128)).toBe(128);
  expect(roundCapacity(129)).toBe(192);
  expect(roundCapacity(199999)).toBe(262144);
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
