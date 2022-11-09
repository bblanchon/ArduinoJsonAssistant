import { describe, it, expect } from "vitest";

import { applyFilter } from "./filter";

describe("applyFilter()", () => {
  const testFilter = (input, filter, expectedOutput) => {
    const output = applyFilter(input, filter);
    expect(output).toEqual(expectedOutput);
  };

  it("returns null if the filter is null", () => {
    testFilter({ hello: "world" }, null, null);
  });

  it("returns null if the filter is false", () => {
    testFilter({ hello: "world" }, false, null);
  });

  it("returns the input if filter is true", () => {
    testFilter({ hello: "world" }, true, { hello: "world" });
  });

  it("returns empty object if filter is empty object", () => {
    testFilter({ hello: "world" }, {}, {});
  });

  it("returns filtered members", () => {
    testFilter(
      { a: 1, b: 2, c: 3, d: 4 },
      { a: true, c: true },
      { a: 1, c: 3 }
    );
  });

  it("returns filtered members in nested object", () => {
    testFilter(
      { a: { c1: 1, c2: 2 }, b: { c1: 3, c2: 4 } },
      { a: { c1: true }, b: { c2: true } },
      { a: { c1: 1 }, b: { c2: 4 } }
    );
  });

  it("wildcard key", () => {
    testFilter(
      { a: { c1: 1, c2: 2 }, b: { c1: 3, c2: 4 } },
      { "*": { c1: true }, b: { c2: true } },
      { a: { c1: 1 }, b: { c2: 4 } }
    );
  });

  it("input is object, filter is  array", () => {
    testFilter({ a: 1 }, [], null);
  });

  it("input is array, filter is empty array", () => {
    testFilter([1, 2, 3], [], []);
  });

  it("only the first element of filter array counts", () => {
    testFilter([1, 2, 3], [true, false], [1, 2, 3]);
    testFilter([1, 2, 3], [false, true], []);
  });

  it("filter member of object in array", () => {
    testFilter(
      [
        { example: 1, ignore: 2 },
        { example: 3, ignore: 4 },
      ],
      [{ example: true }],
      [{ example: 1 }, { example: 3 }]
    );
  });
});
