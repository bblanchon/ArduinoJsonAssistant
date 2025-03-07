import { describe, it, expect } from "vitest";

import { applyFilter } from "./filter";

describe("applyFilter()", () => {
  it("returns null if the filter is null", () => {
    ((input, filter, expectedOutput) => {
      expect(applyFilter(input, filter)).toEqual(expectedOutput);
    })({ hello: "world" }, null, null);
  });

  it("returns null if the filter is false", () => {
    ((input, filter, expectedOutput) => {
      expect(applyFilter(input, filter)).toEqual(expectedOutput);
    })({ hello: "world" }, false, null);
  });

  it("returns the input if filter is true", () => {
    ((input, filter, expectedOutput) => {
      expect(applyFilter(input, filter)).toEqual(expectedOutput);
    })({ hello: "world" }, true, { hello: "world" });
  });

  it("returns empty object if filter is empty object", () => {
    ((input, filter, expectedOutput) => {
      expect(applyFilter(input, filter)).toEqual(expectedOutput);
    })({ hello: "world" }, {}, {});
  });

  it("returns filtered members", () => {
    ((input, filter, expectedOutput) => {
      expect(applyFilter(input, filter)).toEqual(expectedOutput);
    })(
      { a: 1, b: 2, c: 3, d: 4, z: 0 },
      { a: true, c: true, z: true },
      { a: 1, c: 3, z: 0 },
    );
  });

  it("returns filtered members in nested object", () => {
    ((input, filter, expectedOutput) => {
      expect(applyFilter(input, filter)).toEqual(expectedOutput);
    })(
      { a: { c1: 1, c2: 2 }, b: { c1: 3, c2: 4 } },
      { a: { c1: true }, b: { c2: true } },
      { a: { c1: 1 }, b: { c2: 4 } },
    );
  });

  it("wildcard key", () => {
    ((input, filter, expectedOutput) => {
      expect(applyFilter(input, filter)).toEqual(expectedOutput);
    })(
      { a: { c1: 1, c2: 2 }, b: { c1: 3, c2: 4 } },
      { "*": { c1: true }, b: { c2: true } },
      { a: { c1: 1 }, b: { c2: 4 } },
    );
  });

  it("input is object, filter is  array", () => {
    ((input, filter, expectedOutput) => {
      expect(applyFilter(input, filter)).toEqual(expectedOutput);
    })({ a: 1 }, [], null);
  });

  it("input is array, filter is empty array", () => {
    ((input, filter, expectedOutput) => {
      expect(applyFilter(input, filter)).toEqual(expectedOutput);
    })([1, 2, 3], [], []);
  });

  it("only the first element of filter array counts", () => {
    ((input, filter, expectedOutput) => {
      expect(applyFilter(input, filter)).toEqual(expectedOutput);
    })([1, 2, 3], [true, false], [1, 2, 3]);
    ((input, filter, expectedOutput) => {
      expect(applyFilter(input, filter)).toEqual(expectedOutput);
    })([1, 2, 3], [false, true], []);
  });

  it("filter member of object in array", () => {
    ((input, filter, expectedOutput) => {
      expect(applyFilter(input, filter)).toEqual(expectedOutput);
    })(
      [
        { example: 1, ignore: 2 },
        { example: 3, ignore: 4 },
      ],
      [{ example: true }],
      [{ example: 1 }, { example: 3 }],
    );
  });
});
