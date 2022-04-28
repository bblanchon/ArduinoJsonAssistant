import { describe, it, expect } from "vitest";
import { buildExpression } from "@/assistant/expression.mjs";

describe("buildExpression", () => {
  it("should return for an null or undefined", () => {
    expect(buildExpression(null)).toBe("0");
    expect(buildExpression(undefined)).toBe("0");
  });

  it("should return for a primitive", () => {
    expect(buildExpression(null)).toBe("0");
    expect(buildExpression(undefined)).toBe("0");
  });

  it("should return JSON_OBJECT_SIZE() for an empty object", () => {
    expect(buildExpression({})).toBe("JSON_OBJECT_SIZE(0)");
    expect(buildExpression({ hello: "world" })).toBe("JSON_OBJECT_SIZE(1)");
  });

  it("should return JSON_ARRAY_SIZE() for an empty array", () => {
    expect(buildExpression([])).toBe("JSON_ARRAY_SIZE(0)");
    expect(buildExpression([1])).toBe("JSON_ARRAY_SIZE(1)");
  });

  it("should sum size recursively", () => {
    expect(
      buildExpression({
        a: [1, 2],
        b: [1, 2],
      })
    ).toBe("2*JSON_ARRAY_SIZE(2) + JSON_OBJECT_SIZE(2)");
  });
});
