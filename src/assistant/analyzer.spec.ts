import { describe, expect, it } from "vitest";

import {
  analyze,
  getEffectiveSlotSize,
  getOverallocatedStringSize,
  hasJsonInJsonSyndrome,
} from "./analyzer";
import type { JsonValue } from "./json";

function countSlots(input: JsonValue) {
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
    expect(analyze("hello", { arch: "8-bit" })).toMatchObject({
      memoryUsage: 24,
      peakMemoryUsage: 24,
    });
  });

  it("sample object on 8-bit processor", () => {
    expect(
      analyze(
        {
          sensor: "gps",
          time: 1351824120,
          data: [48.75608, 2.302038],
        },
        {
          arch: "8-bit",
        },
      ),
    ).toMatchObject({
      memoryUsage: 91,
      peakMemoryUsage: 139,
    });
  });

  it("sample object on 32-bit processor", () => {
    expect(
      analyze(
        {
          sensor: "gps",
          time: 1351824120,
          data: [48.75608, 2.302038],
        },
        {
          arch: "32-bit",
          useLongLong: true,
          useDouble: true,
        },
      ),
    ).toMatchObject({
      memoryUsage: 145,
      peakMemoryUsage: 1105,
    });
  });

  it("should not deduplicate keys if deduplicateKeys is false", () => {
    expect(
      analyze([{ example: 1 }, { example: 2 }], {
        deduplicateKeys: false,
        arch: "8-bit",
      }),
    ).toMatchObject({
      memoryUsage: 74,
      peakMemoryUsage: 134,
    });
  });

  it("should not deduplicate keys if deduplicateKeys is true", () => {
    expect(
      analyze([{ example: 1 }, { example: 2 }], {
        deduplicateKeys: true,
        arch: "8-bit",
      }),
    ).toMatchObject({
      memoryUsage: 62,
      peakMemoryUsage: 122,
    });
  });

  it("should not deduplicate values if deduplicateValues is false", () => {
    expect(
      analyze(["example", "example"], {
        deduplicateValues: false,
        arch: "8-bit",
      }),
    ).toMatchObject({
      memoryUsage: 50,
      peakMemoryUsage: 134,
    });
  });

  it("should not deduplicate keys if deduplicateValues is true", () => {
    expect(
      analyze(["example", "example"], {
        deduplicateValues: true,
        arch: "8-bit",
      }),
    ).toMatchObject({
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

  it("should not allocate an extra slot for 64-bit integers if useLongLong is false", () => {
    expect(
      analyze(4294967296, {
        arch: "32-bit",
        useLongLong: false,
      }),
    ).toMatchObject({
      slotCount: 0,
    });
    expect(
      analyze(-2147483649, {
        arch: "32-bit",
        useLongLong: false,
      }),
    ).toMatchObject({
      slotCount: 0,
    });
  });

  it("should allocate an extra slot for 64-bit integers if useLongLong is true", () => {
    expect(
      analyze(4294967296, {
        arch: "32-bit",
        useLongLong: true,
      }),
    ).toMatchObject({
      slotCount: 1,
    });
    expect(
      analyze(-2147483649, {
        arch: "32-bit",
        useLongLong: true,
      }),
    ).toMatchObject({
      slotCount: 1,
    });
  });

  it("should not allocate an extra slot for 64-bit floats if useDouble is false", () => {
    expect(
      analyze(1e40, {
        arch: "32-bit",
        useDouble: false,
      }),
    ).toMatchObject({
      slotCount: 0,
    });
    expect(
      analyze(1e-40, {
        arch: "32-bit",
        useDouble: false,
      }),
    ).toMatchObject({
      slotCount: 0,
    });
    expect(
      analyze(1.23456789, {
        arch: "32-bit",
        useDouble: false,
      }),
    ).toMatchObject({
      slotCount: 0,
    });
  });

  it("should allocate an extra slot for 64-bit integers if useDouble is true", () => {
    expect(
      analyze(1e40, {
        arch: "32-bit",
        useDouble: true,
      }),
    ).toMatchObject({
      slotCount: 1,
    });
    expect(
      analyze(1e-46, {
        arch: "32-bit",
        useDouble: true,
      }),
    ).toMatchObject({
      slotCount: 1,
    });
    expect(
      analyze(1.23456789, {
        arch: "32-bit",
        useDouble: true,
      }),
    ).toMatchObject({
      slotCount: 1,
    });
  });

  it("should not allocate space for of 3-characters string", () => {
    expect(
      analyze("abc", { arch: "8-bit", overAllocateStrings: true }),
    ).toMatchObject({
      memoryUsage: 14,
      peakMemoryUsage: 50,
    });
  });

  it("should use tiny string optimization of 3-characters key", () => {
    expect(
      analyze({ abc: 1 }, { arch: "8-bit", overAllocateStrings: true }),
    ).toMatchObject({
      memoryUsage: 26,
      peakMemoryUsage: 146,
    });
  });
});

describe("hasJsonInJsonSyndrome()", () => {
  it("should return false for null", () => {
    expect(hasJsonInJsonSyndrome(null)).toBe(false);
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
