import { describe, it, expect } from "vitest";

import { applyFilter } from "./filter";

describe("applyFilter()", () => {
  it("returns null if the filter is null", () => {
    expect(applyFilter({ hello: "world" }, null)).toEqual(null);
  });

  it("returns null if the filter is false", () => {
    expect(applyFilter({ hello: "world" }, false)).toEqual(null);
  });

  it("returns the input if filter is true", () => {
    expect(applyFilter({ hello: "world" }, true)).toEqual({ hello: "world" });
  });

  it("returns empty object if filter is empty object", () => {
    expect(applyFilter({ hello: "world" }, {})).toEqual({});
  });

  it("returns filtered members", () => {
    expect(
      applyFilter(
        { a: 1, b: 2, c: 3, d: 4, z: 0 },
        { a: true, c: true, z: true },
      ),
    ).toEqual({ a: 1, c: 3, z: 0 });
  });

  it("returns filtered members in nested object", () => {
    expect(
      applyFilter(
        { a: { c1: 1, c2: 2 }, b: { c1: 3, c2: 4 } },
        { a: { c1: true }, b: { c2: true } },
      ),
    ).toEqual({ a: { c1: 1 }, b: { c2: 4 } });
  });

  it("wildcard key", () => {
    expect(
      applyFilter(
        { a: { c1: 1, c2: 2 }, b: { c1: 3, c2: 4 } },
        { "*": { c1: true }, b: { c2: true } },
      ),
    ).toEqual({ a: { c1: 1 }, b: { c2: 4 } });
  });

  it("input is object, filter is array", () => {
    expect(applyFilter({ a: 1 }, [])).toEqual(null);
  });

  it("input is array, filter is empty array", () => {
    expect(applyFilter([1, 2, 3], [])).toEqual([]);
  });

  it("only the first element of filter array counts", () => {
    expect(applyFilter([1, 2, 3], [true, false])).toEqual([1, 2, 3]);
    expect(applyFilter([1, 2, 3], [false, true])).toEqual([]);
  });

  it("filter member of object in array", () => {
    expect(
      applyFilter(
        [
          { example: 1, ignore: 2 },
          { example: 3, ignore: 4 },
        ],
        [{ example: true }],
      ),
    ).toEqual([{ example: 1 }, { example: 3 }]);
  });
});
