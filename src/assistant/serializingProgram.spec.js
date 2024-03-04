import { describe, it, expect } from "vitest";

import { ProgramWriter } from "./programWriter";
import {
  generateSerializingProgram,
  writeCompositionCode,
} from "./serializingProgram";

describe("writeCompositionCode()", () => {
  function getCompositionCode(output) {
    const prg = new ProgramWriter();
    writeCompositionCode(prg, { value: output, name: "doc" });
    return prg.toString();
  }

  it("null", () => {
    expect(getCompositionCode(null)).toEqual("");
  });

  it("[]", () => {
    expect(getCompositionCode([])).toMatchFileSnapshot(
      "snapshots/compose/array-empty.html",
    );
  });

  it("{}", () => {
    expect(getCompositionCode({})).toMatchFileSnapshot(
      "snapshots/compose/object-empty.html",
    );
  });

  it("[42]", () => {
    expect(getCompositionCode([42])).toMatchFileSnapshot(
      "snapshots/compose/array-int.html",
    );
  });

  it("[null]", () => {
    expect(getCompositionCode([null])).toMatchFileSnapshot(
      "snapshots/compose/array-null.html",
    );
  });

  it('["hello"]', () => {
    expect(getCompositionCode(["hello"])).toMatchFileSnapshot(
      "snapshots/compose/array-one-string.html",
    );
  });

  it('["hello","world",null]', () => {
    expect(getCompositionCode(["hello", "world", null])).toMatchFileSnapshot(
      "snapshots/compose/array-string-string-null.html",
    );
  });

  it('{"answer":42}', () => {
    expect(getCompositionCode({ answer: 42 })).toMatchFileSnapshot(
      "snapshots/compose/object-int.html",
    );
  });

  it('{"answer":null}', () => {
    expect(getCompositionCode({ answer: null })).toMatchFileSnapshot(
      "snapshots/compose/object-null.html",
    );
  });

  it('[{"answer":42}]', () => {
    expect(getCompositionCode([{ answer: 42 }])).toMatchFileSnapshot(
      "snapshots/compose/array-object-int.html",
    );
  });

  it('{"answers":[42]}', () => {
    expect(getCompositionCode({ answers: [42] })).toMatchFileSnapshot(
      "snapshots/compose/object-array-int.html",
    );
  });

  it("[[1,2],[3,4]]", () => {
    expect(
      getCompositionCode([
        [1, 2],
        [3, 4],
      ]),
    ).toMatchFileSnapshot("snapshots/compose/array-2d.html");
  });

  it('{ A: { B: { C: "D" }, E: { F: "G" } } }', () => {
    expect(
      getCompositionCode({ A: { B: { C: "D" }, E: { F: "G" } } }),
    ).toMatchFileSnapshot("snapshots/compose/object-many-strings-deep.html");
  });

  it('{ A: { B: { C: "D" } } }', () => {
    expect(getCompositionCode({ A: { B: { C: "D" } } })).toMatchFileSnapshot(
      "snapshots/compose/object-one-string-deep.html",
    );
  });

  it('{"hello world":[42, 43]}', () => {
    expect(getCompositionCode({ "hello world": [42, 43] })).toMatchFileSnapshot(
      "snapshots/compose/object-array-ints.html",
    );
  });

  it("{ list: [{ dt: true, main: true }] }", () => {
    expect(
      getCompositionCode({ list: [{ dt: true, main: true }] }),
    ).toMatchFileSnapshot("snapshots/compose/object-array-object-bools.html");
  });

  it("{ data: { children: [{ data: { title: true, ups: true } }] } }", () => {
    expect(
      getCompositionCode({
        data: { children: [{ data: { title: true, ups: true } }] },
      }),
    ).toMatchFileSnapshot(
      "snapshots/compose/object-array-object-object-bools.html",
    );
  });

  it("[{ a: 1 }, { a: 2 }]", () => {
    expect(getCompositionCode([{ a: 1 }, { a: 2 }])).toMatchFileSnapshot(
      "snapshots/compose/array-objects-one-member-per-object.html",
    );
  });

  it("[{ a: 1, b: 2 }, { a: 3, b: 4 }]", () => {
    expect(
      getCompositionCode([
        { a: 1, b: 2 },
        { a: 3, b: 4 },
      ]),
    ).toMatchFileSnapshot(
      "snapshots/compose/array-objects-two-members-per-object.html",
    );
  });

  it("{ if: {} }", () => {
    expect(getCompositionCode({ if: {} })).toMatchFileSnapshot(
      "snapshots/compose/object-if-empty-object.html",
    );
  });
});

describe("generateSerializingProgram()", function () {
  it('{"answer":42}', () => {
    expect(
      generateSerializingProgram({ output: { answer: 42 } }),
    ).toMatchFileSnapshot("snapshots/serializing-program/object.html");
  });

  it("null", () => {
    expect(generateSerializingProgram({ output: null })).toMatchFileSnapshot(
      "snapshots/serializing-program/null.html",
    );
  });

  it("outputType = charPtr", () => {
    expect(
      generateSerializingProgram({ outputType: "charPtr" }),
    ).toMatchFileSnapshot("snapshots/serializing-program/char-ptr.html");
  });

  it("outputType = charArray", () => {
    expect(
      generateSerializingProgram({
        outputType: "charArray",
      }),
    ).toMatchFileSnapshot("snapshots/serializing-program/char-array.html");
  });

  it("outputType = arduinoString", () => {
    expect(
      generateSerializingProgram({
        outputType: "arduinoString",
      }),
    ).toMatchFileSnapshot("snapshots/serializing-program/arduino-string.html");
  });

  it("outputType = stdString", () => {
    expect(
      generateSerializingProgram({
        outputType: "stdString",
      }),
    ).toMatchFileSnapshot("snapshots/serializing-program/std-string.html");
  });

  it("outputType = arduinoStream", () => {
    expect(
      generateSerializingProgram({
        outputType: "arduinoStream",
      }),
    ).toMatchFileSnapshot("snapshots/serializing-program/arduino-stream.html");
  });

  it("outputType = stdStream", () => {
    expect(
      generateSerializingProgram({
        outputType: "stdStream",
      }),
    ).toMatchFileSnapshot("snapshots/serializing-program/std-ostream.html");
  });
});
