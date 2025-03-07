import { describe, it, expect } from "vitest";

import { ProgramWriter } from "./programWriter";
import {
  generateSerializingProgram,
  writeCompositionCode,
} from "./serializingProgram";

describe("writeCompositionCode()", () => {
  function getCompositionCode(output: any) {
    const prg = new ProgramWriter();
    writeCompositionCode(prg, { value: output, name: "doc" });
    return prg.toString();
  }

  it("null", () => {
    expect(getCompositionCode(null)).toEqual("");
  });

  it("[]", async () => {
    await expect(getCompositionCode([])).toMatchFileSnapshot(
      "snapshots/compose/array-empty.html",
    );
  });

  it("{}", async () => {
    await expect(getCompositionCode({})).toMatchFileSnapshot(
      "snapshots/compose/object-empty.html",
    );
  });

  it("[42]", async () => {
    await expect(getCompositionCode([42])).toMatchFileSnapshot(
      "snapshots/compose/array-int.html",
    );
  });

  it("[null]", async () => {
    await expect(getCompositionCode([null])).toMatchFileSnapshot(
      "snapshots/compose/array-null.html",
    );
  });

  it('["hello"]', async () => {
    await expect(getCompositionCode(["hello"])).toMatchFileSnapshot(
      "snapshots/compose/array-one-string.html",
    );
  });

  it('["hello","world",null]', async () => {
    await expect(
      getCompositionCode(["hello", "world", null]),
    ).toMatchFileSnapshot("snapshots/compose/array-string-string-null.html");
  });

  it('{"answer":42}', async () => {
    await expect(getCompositionCode({ answer: 42 })).toMatchFileSnapshot(
      "snapshots/compose/object-int.html",
    );
  });

  it('{"answer":null}', async () => {
    await expect(getCompositionCode({ answer: null })).toMatchFileSnapshot(
      "snapshots/compose/object-null.html",
    );
  });

  it('[{"answer":42}]', async () => {
    await expect(getCompositionCode([{ answer: 42 }])).toMatchFileSnapshot(
      "snapshots/compose/array-object-int.html",
    );
  });

  it('{"answers":[42]}', async () => {
    await expect(getCompositionCode({ answers: [42] })).toMatchFileSnapshot(
      "snapshots/compose/object-array-int.html",
    );
  });

  it("[[1,2],[3,4]]", async () => {
    await expect(
      getCompositionCode([
        [1, 2],
        [3, 4],
      ]),
    ).toMatchFileSnapshot("snapshots/compose/array-2d.html");
  });

  it('{ A: { B: { C: "D" }, E: { F: "G" } } }', async () => {
    await expect(
      getCompositionCode({ A: { B: { C: "D" }, E: { F: "G" } } }),
    ).toMatchFileSnapshot("snapshots/compose/object-many-strings-deep.html");
  });

  it('{ A: { B: { C: "D" } } }', async () => {
    await expect(
      getCompositionCode({ A: { B: { C: "D" } } }),
    ).toMatchFileSnapshot("snapshots/compose/object-one-string-deep.html");
  });

  it('{"hello world":[42, 43]}', async () => {
    await expect(
      getCompositionCode({ "hello world": [42, 43] }),
    ).toMatchFileSnapshot("snapshots/compose/object-array-ints.html");
  });

  it("{ list: [{ dt: true, main: true }] }", async () => {
    await expect(
      getCompositionCode({ list: [{ dt: true, main: true }] }),
    ).toMatchFileSnapshot("snapshots/compose/object-array-object-bools.html");
  });

  it("{ data: { children: [{ data: { title: true, ups: true } }] } }", async () => {
    await expect(
      getCompositionCode({
        data: { children: [{ data: { title: true, ups: true } }] },
      }),
    ).toMatchFileSnapshot(
      "snapshots/compose/object-array-object-object-bools.html",
    );
  });

  it("[{ a: 1 }, { a: 2 }]", async () => {
    await expect(getCompositionCode([{ a: 1 }, { a: 2 }])).toMatchFileSnapshot(
      "snapshots/compose/array-objects-one-member-per-object.html",
    );
  });

  it("[{ a: 1, b: 2 }, { a: 3, b: 4 }]", async () => {
    await expect(
      getCompositionCode([
        { a: 1, b: 2 },
        { a: 3, b: 4 },
      ]),
    ).toMatchFileSnapshot(
      "snapshots/compose/array-objects-two-members-per-object.html",
    );
  });

  it("{ if: {} }", async () => {
    await expect(getCompositionCode({ if: {} })).toMatchFileSnapshot(
      "snapshots/compose/object-if-empty-object.html",
    );
  });
});

describe("generateSerializingProgram()", function () {
  it('{"answer":42}', async () => {
    await expect(
      generateSerializingProgram({ output: { answer: 42 } }),
    ).toMatchFileSnapshot("snapshots/serializing-program/object.html");
  });

  it("null", async () => {
    await expect(
      generateSerializingProgram({ output: null }),
    ).toMatchFileSnapshot("snapshots/serializing-program/null.html");
  });

  it("outputType = charPtr", async () => {
    await expect(
      generateSerializingProgram({ outputType: "charPtr" }),
    ).toMatchFileSnapshot("snapshots/serializing-program/char-ptr.html");
  });

  it("outputType = charArray", async () => {
    await expect(
      generateSerializingProgram({
        outputType: "charArray",
      }),
    ).toMatchFileSnapshot("snapshots/serializing-program/char-array.html");
  });

  it("outputType = arduinoString", async () => {
    await expect(
      generateSerializingProgram({
        outputType: "arduinoString",
      }),
    ).toMatchFileSnapshot("snapshots/serializing-program/arduino-string.html");
  });

  it("outputType = stdString", async () => {
    await expect(
      generateSerializingProgram({
        outputType: "stdString",
      }),
    ).toMatchFileSnapshot("snapshots/serializing-program/std-string.html");
  });

  it("outputType = arduinoStream", async () => {
    await expect(
      generateSerializingProgram({
        outputType: "arduinoStream",
      }),
    ).toMatchFileSnapshot("snapshots/serializing-program/arduino-stream.html");
  });

  it("outputType = stdStream", async () => {
    await expect(
      generateSerializingProgram({
        outputType: "stdStream",
      }),
    ).toMatchFileSnapshot("snapshots/serializing-program/std-ostream.html");
  });
});
