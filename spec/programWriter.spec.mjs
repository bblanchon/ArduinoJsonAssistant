import {
  stringifyValue,
  makeVariableName,
  makeItemName,
} from "../src/assistant/programWriter.mjs";

describe("makeVariableName()", function () {
  it("should return valid identifiers unchanged", () => {
    expect(makeVariableName("toto")).toBe("toto");
    expect(makeVariableName("toto1")).toBe("toto1");
  });

  it("should support object keys", () => {
    expect(makeVariableName('obj["key"]')).toBe("obj_key");
    expect(makeVariableName('obj["key"]["key"]')).toBe("obj_key_key");
  });

  it("should support array index", () => {
    expect(makeVariableName("obj[0]")).toBe("obj_0");
    expect(makeVariableName("obj[0][1]")).toBe("obj_0_1");
  });

  it("should rename doc to root", () => {
    // we could remove this in the future
    expect(makeVariableName("doc[0]")).toBe("root_0");
  });
});

describe("makeItemName()", function () {
  it("should append _item by default", () => {
    expect(makeItemName("toto")).toBe("toto_item");
  });

  it("should replace children with child", () => {
    expect(makeItemName("children")).toBe("child");
    expect(makeItemName("Children")).toBe("Child");
    expect(makeItemName("totoChildren")).toBe("totoChild");
    expect(makeItemName("toto_children")).toBe("toto_child");
  });

  it("should remove s", () => {
    expect(makeItemName("bubbles")).toBe("bubble");
    expect(makeItemName("Kitchens")).toBe("Kitchen");
  });

  it('should replace "ies" with "y"', () => {
    expect(makeItemName("properties")).toBe("property");
  });
});

describe("stringifyValue()", () => {
  it("(int)null == 0", () => {
    expect(stringifyValue("int", null)).toBe("0");
  });

  it("(long)null == 0", () => {
    expect(stringifyValue("long", null)).toBe("0");
  });

  it("(long long)null == 0", () => {
    expect(stringifyValue("long long", null)).toBe("0");
  });

  it("(float)null == 0", () => {
    expect(stringifyValue("float", null)).toBe("0");
  });

  it("(double)null == 0", () => {
    expect(stringifyValue("double", null)).toBe("0");
  });

  it("(const char*)null == nullptr", () => {
    expect(stringifyValue("const char*", null)).toBe("nullptr");
  });
});
