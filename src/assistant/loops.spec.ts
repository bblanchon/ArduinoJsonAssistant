import { describe, expect, it } from "vitest";

import { canLoop } from "./loops";

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
