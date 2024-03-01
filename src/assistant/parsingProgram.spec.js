import { describe, it, expect } from "vitest";

import { ProgramWriter } from "./programWriter";
import {
  generateParsingProgram,
  writeDeserializationCode,
  writeDecompositionCode,
  writeErrorCheckingCode,
} from "./parsingProgram";

describe("writeDeserializationCode()", () => {
  function getDeserializationCode(config) {
    const prg = new ProgramWriter();
    writeDeserializationCode(prg, config);
    return prg.toString();
  }

  it("inputType == charPtr", () => {
    expect(
      getDeserializationCode({ inputType: "charPtr" }),
    ).toMatchFileSnapshot("snapshots/deserializejson/char-ptr.cpp");
  });

  it("inputType == charArray", () => {
    expect(
      getDeserializationCode({ inputType: "charArray" }),
    ).toMatchFileSnapshot("snapshots/deserializejson/char-array.cpp");
  });

  it("inputType == arduinoString", () => {
    expect(
      getDeserializationCode({ inputType: "arduinoString" }),
    ).toMatchFileSnapshot("snapshots/deserializejson/arduino-string.cpp");
  });

  it("inputType == arduinoStream", () => {
    expect(
      getDeserializationCode({ inputType: "arduinoStream" }),
    ).toMatchFileSnapshot("snapshots/deserializejson/arduino-stream.cpp");
  });

  it("inputType == stdString", () => {
    expect(
      getDeserializationCode({ inputType: "stdString" }),
    ).toMatchFileSnapshot("snapshots/deserializejson/std-string.cpp");
  });

  it("inputType == stdStream", () => {
    expect(
      getDeserializationCode({ inputType: "stdStream" }),
    ).toMatchFileSnapshot("snapshots/deserializejson/std-istream.cpp");
  });
});

describe("writeErrorCheckingCode()", () => {
  function getErrorCheckingCode(config) {
    const prg = new ProgramWriter();
    writeErrorCheckingCode(prg, config);
    return prg.toString();
  }

  it("should print to Serial when possible", () => {
    expect(getErrorCheckingCode({ serial: true })).toMatchFileSnapshot(
      "snapshots/check-error/serial.cpp",
    );
  });

  it("should use PROGMEM when possible", () => {
    expect(
      getErrorCheckingCode({ serial: true, progmem: true }),
    ).toMatchFileSnapshot("snapshots/check-error/serial-progmem.cpp");
  });

  it("should print to cerr if Serial is not available", () => {
    expect(getErrorCheckingCode({ serial: false })).toMatchFileSnapshot(
      "snapshots/check-error/iostream.cpp",
    );
  });
});

describe("generateParsingProgram", function () {
  it("nesting limit witout filter", () => {
    expect(
      generateParsingProgram({
        input: [[[[[[[[[[[]]]]]]]]]]],
        nestingLimit: 11,
      }),
    ).toMatchFileSnapshot("snapshots/parsing-program/nestinglimit.cpp");
  });

  it("nesting limit with filter", () => {
    expect(
      generateParsingProgram({
        input: { ignored: [[[[[[[[[[]]]]]]]]]] },
        filter: { a: true },
        nestingLimit: 11,
      }),
    ).toMatchFileSnapshot("snapshots/parsing-program/filter-nestinglimit.cpp");
  });

  it("filter", () => {
    expect(
      generateParsingProgram({ input: {}, filter: { a: true } }),
    ).toMatchFileSnapshot("snapshots/parsing-program/filter.cpp");
  });

  it("serial and progmem", () => {
    expect(
      generateParsingProgram({
        input: { hello: "world" },
        serial: true,
        progmem: true,
      }),
    ).toMatchFileSnapshot("snapshots/parsing-program/serial-progmem.cpp");
  });
});

describe("writeDecompositionCode", function () {
  function getDecompositionCode(input, cfg) {
    const prg = new ProgramWriter();
    writeDecompositionCode(prg, input, cfg);
    return prg.toString();
  }

  it("[]", () => {
    expect(getDecompositionCode([])).toEqual("");
  });

  it("{}", () => {
    expect(getDecompositionCode({})).toEqual("");
  });

  it("42", () => {
    expect(getDecompositionCode(42)).toMatchFileSnapshot(
      "snapshots/decompose/int.cpp",
    );
  });

  it("[42]", () => {
    expect(getDecompositionCode([42])).toMatchFileSnapshot(
      "snapshots/decompose/array-one-int.cpp",
    );
  });

  it("bool", () => {
    expect(getDecompositionCode(true)).toMatchFileSnapshot(
      "snapshots/decompose/bool-true.cpp",
    );
    expect(getDecompositionCode(false)).toMatchFileSnapshot(
      "snapshots/decompose/bool-false.cpp",
    );
  });

  it("[1,2,3]", () => {
    expect(getDecompositionCode([1, 2, 3])).toMatchFileSnapshot(
      "snapshots/decompose/array-three-int.cpp",
    );
  });

  it('{"hello":true}', () => {
    expect(getDecompositionCode({ hello: true })).toMatchFileSnapshot(
      "snapshots/decompose/object-bool.cpp",
    );
  });

  it('{"hello":true} with progmem', () => {
    expect(
      getDecompositionCode({ hello: true }, { progmem: true }),
    ).toMatchFileSnapshot("snapshots/decompose/object-bool-progmem.cpp");
  });

  it('{"hello":null}', () => {
    expect(getDecompositionCode({ hello: null })).toMatchFileSnapshot(
      "snapshots/decompose/object-null.cpp",
    );
  });

  it('{"hello":"world"}', () => {
    expect(getDecompositionCode({ hello: "world" })).toMatchFileSnapshot(
      "snapshots/decompose/object-string.cpp",
    );
  });

  it('{"hello":"world"} with progmem', () => {
    expect(
      getDecompositionCode({ hello: "world" }, { progmem: true }),
    ).toMatchFileSnapshot("snapshots/decompose/object-string-progmem.cpp");
  });

  it('[{"a":1,"b":2,"c":3}]', () => {
    expect(getDecompositionCode([{ a: 1, b: 2, c: 3 }])).toMatchFileSnapshot(
      "snapshots/decompose/object-three-int.cpp",
    );
  });

  it("[[[[[[[[[[[42]]]]]]]]]]]", () => {
    expect(getDecompositionCode([[[[[[[[[[[42]]]]]]]]]]])).toMatchFileSnapshot(
      "snapshots/decompose/array-deep-int.cpp",
    );
  });

  it("[10000,10000000,10000000000]", () => {
    expect(
      getDecompositionCode([10000, 10000000, 10000000000]),
    ).toMatchFileSnapshot("snapshots/decompose/array-large-integers.cpp");
  });

  it('{"123":1}', () => {
    expect(getDecompositionCode({ 123: 1 })).toMatchFileSnapshot(
      "snapshots/decompose/object-int-key.cpp",
    );
  });

  it("loop on root", () => {
    expect(
      getDecompositionCode([
        {
          dt: 1511978400,
          main: { temp: 3.95 },
          weather: [{ description: "light rain" }],
        },
        {
          dt: 1511989200,
          main: { temp: 3.2 },
          weather: [{ description: "clear sky" }],
        },
      ]),
    ).toMatchFileSnapshot("snapshots/decompose/loop-in-root-array.cpp");
  });

  it("loop in member array", () => {
    expect(
      getDecompositionCode({
        list: [
          {
            dt: 1511978400,
            main: { temp: 3.95 },
            weather: [{ description: "light rain" }],
          },
          {
            dt: 1511989200,
            main: { temp: 3.2 },
            weather: [{ description: "clear sky" }],
          },
          {
            dt: 1512000000,
            main: { temp: 3.25 },
            weather: [{ description: "light rain" }],
          },
        ],
      }),
    ).toMatchFileSnapshot("snapshots/decompose/loop-in-member-array.cpp");
  });

  it("loop in member object", () => {
    expect(
      getDecompositionCode({
        properties: {
          batt: {
            unit: "%",
            name: "battery",
          },
          tempc: {
            unit: "°C",
            name: "temperature",
          },
          hum: {
            unit: "%",
            name: "humidity",
          },
        },
      }),
    ).toMatchFileSnapshot("snapshots/decompose/loop-in-member-object.cpp");
  });

  it("loop with mixed integer and long-longs", () => {
    expect(
      getDecompositionCode([{ x: 10000 }, { x: 10000000 }, { x: 10000000000 }]),
    ).toMatchFileSnapshot(
      "snapshots/decompose/loop-mixed-int-and-long-long.cpp",
    );
  });

  it("loop with mixed integer and floats", () => {
    expect(
      getDecompositionCode([{ x: 10000 }, { x: 1.4 }]),
    ).toMatchFileSnapshot("snapshots/decompose/loop-mixed-int-and-float.cpp");
  });

  it("loop with mixed null and integer", () => {
    expect(getDecompositionCode([{ x: null }, { x: 42 }])).toMatchFileSnapshot(
      "snapshots/decompose/loop-mixed-int-and-null.cpp",
    );
  });

  it("loop with many values shows ellipsis", () => {
    expect(
      getDecompositionCode([
        { very_long_name: "long value" },
        { very_long_name: "another long value" },
        { very_long_name: "yes another long value" },
        { very_long_name: "some string" },
      ]),
    ).toMatchFileSnapshot("snapshots/decompose/loop-ellipsis.cpp");
  });

  it("loop on root with null siblings", () => {
    expect(
      getDecompositionCode([{ x: { id: 10 } }, { x: null }]),
    ).toMatchFileSnapshot("snapshots/decompose/loop-null-sibling-object.cpp");
  });

  it("nested array with potential name conflict #1623", () => {
    expect(
      getDecompositionCode([
        { data: [{ time: 1 }, { time: 2 }] },
        { data: [{ time: 3 }, { time: 4 }] },
      ]),
    ).toMatchFileSnapshot("snapshots/decompose/loop-nested.cpp");
  });

  it("null sibling array", () => {
    expect(
      getDecompositionCode([
        { data: [1, 3] },
        { data: [2, 4] },
        { data: null },
      ]),
    ).toMatchFileSnapshot("snapshots/decompose/loop-null-sibling-array.cpp");
  });
});
