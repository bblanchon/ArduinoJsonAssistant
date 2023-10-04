import { describe, it, expect } from "vitest";

import cpuInfos from "./cpus";
import { ProgramWriter } from "./programWriter";
import {
  generateSerializingProgram,
  writeCompositionCode,
} from "./serializingProgram";

describe("writeCompositionCode()", () => {
  function getCompositionCode(output) {
    const prg = new ProgramWriter();
    writeCompositionCode(prg, output, "doc");
    return prg.toString();
  }

  it("null", () => {
    expect(getCompositionCode(null)).toEqual("");
  });

  it("[]", () => {
    expect(getCompositionCode([])).toEqual("doc.to<JsonArray>();");
  });

  it("{}", () => {
    expect(getCompositionCode({})).toEqual("doc.to<JsonObject>();");
  });

  it("[42]", () => {
    expect(getCompositionCode([42])).toEqual("doc[0] = 42;");
  });

  it("[null]", () => {
    expect(getCompositionCode([null])).toEqual("doc[0] = nullptr;");
  });

  it('["hello"]', () => {
    expect(getCompositionCode(["hello"])).toEqual('doc[0] = "hello";');
  });

  it('["hello","world",null]', () => {
    expect(getCompositionCode(["hello", "world", null])).toEqual(
      'doc.add("hello");\ndoc.add("world");\ndoc.add(nullptr);',
    );
  });

  it('{"answer":42}', () => {
    expect(getCompositionCode({ answer: 42 })).toEqual('doc["answer"] = 42;');
  });

  it('{"answer":null}', () => {
    expect(getCompositionCode({ answer: null })).toEqual(
      'doc["answer"] = nullptr;',
    );
  });

  it('[{"answer":42}]', () => {
    expect(getCompositionCode([{ answer: 42 }])).toEqual(
      'doc[0]["answer"] = 42;',
    );
  });

  it('{"answers":[42]}', () => {
    expect(getCompositionCode({ answers: [42] })).toEqual(
      'doc["answers"][0] = 42;',
    );
  });

  it('{"message":{"status":"ok"}}', () => {
    expect(getCompositionCode({ message: { status: "ok" } })).toEqual(
      'doc["message"]["status"] = "ok";',
    );
  });

  it("[[1,2],[3,4]]", () => {
    expect(
      getCompositionCode([
        [1, 2],
        [3, 4],
      ]),
    ).toEqual(
      "JsonArray doc_0 = doc.add<JsonArray>();\n" +
        "doc_0.add(1);\n" +
        "doc_0.add(2);\n\n" +
        "JsonArray doc_1 = doc.add<JsonArray>();\n" +
        "doc_1.add(3);\n" +
        "doc_1.add(4);",
    );
  });

  it('{ A: { B: { C: "D" }, E: { F: "G" } } }', () => {
    expect(getCompositionCode({ A: { B: { C: "D" }, E: { F: "G" } } })).toEqual(
      'JsonObject A = doc["A"].to<JsonObject>();\n' +
        'A["B"]["C"] = "D";\n' +
        'A["E"]["F"] = "G";',
    );
  });

  it('{ A: { B: { C: "D" } } }', () => {
    expect(getCompositionCode({ A: { B: { C: "D" } } })).toEqual(
      'doc["A"]["B"]["C"] = "D";',
    );
  });

  it("[[[42, 43],[44, 45]]]", () => {
    expect(
      getCompositionCode([
        [
          [42, 43],
          [44, 45],
        ],
      ]),
    ).toEqual(
      "JsonArray doc_0 = doc.add<JsonArray>();\n\n" +
        "JsonArray doc_0_0 = doc_0.add<JsonArray>();\n" +
        "doc_0_0.add(42);\n" +
        "doc_0_0.add(43);\n\n" +
        "JsonArray doc_0_1 = doc_0.add<JsonArray>();\n" +
        "doc_0_1.add(44);\n" +
        "doc_0_1.add(45);",
    );
  });

  it('{"hello world":[42, 43]}', () => {
    expect(getCompositionCode({ "hello world": [42, 43] })).toEqual(
      'JsonArray hello_world = doc["hello world"].to<JsonArray>();\n' +
        "hello_world.add(42);\n" +
        "hello_world.add(43);",
    );
  });

  it("{ list: [{ dt: true }] }", () => {
    expect(getCompositionCode({ list: [{ dt: true, main: true }] })).toEqual(
      'JsonObject list_0 = doc["list"].add<JsonObject>();\n' +
        'list_0["dt"] = true;\n' +
        'list_0["main"] = true;',
    );
  });

  it("{ list: [{ dt: true, main: true }] }", () => {
    expect(getCompositionCode({ list: [{ dt: true, main: true }] })).toEqual(
      'JsonObject list_0 = doc["list"].add<JsonObject>();\n' +
        'list_0["dt"] = true;\n' +
        'list_0["main"] = true;',
    );
  });

  it("{ data: { children: [{ data: { title: true, ups: true } }] } }", () => {
    expect(
      getCompositionCode({
        data: { children: [{ data: { title: true, ups: true } }] },
      }),
    ).toEqual(
      'JsonObject data_children_0_data = doc["data"]["children"][0]["data"].to<JsonObject>();\n' +
        'data_children_0_data["title"] = true;\n' +
        'data_children_0_data["ups"] = true;',
    );
  });

  it("[{ a: 1 }, { a: 2 }]", () => {
    expect(getCompositionCode([{ a: 1 }, { a: 2 }])).toEqual(
      'doc[0]["a"] = 1;\ndoc[1]["a"] = 2;',
    );
  });

  it("[{ a: 1, b: 2 }, { a: 3, b: 4 }]", () => {
    expect(
      getCompositionCode([
        { a: 1, b: 2 },
        { a: 3, b: 4 },
      ]),
    ).toEqual(
      "JsonObject doc_0 = doc.add<JsonObject>();\n" +
        'doc_0["a"] = 1;\n' +
        'doc_0["b"] = 2;\n' +
        "\n" +
        "JsonObject doc_1 = doc.add<JsonObject>();\n" +
        'doc_1["a"] = 3;\n' +
        'doc_1["b"] = 4;',
    );
  });
});

describe("generateSerializingProgram()", function () {
  it('{"answer":42}', () => {
    expect(
      generateSerializingProgram({ output: { answer: 42 }, cpu: cpuInfos.avr }),
    ).toEqual(
      "JsonDocument doc;\n\n" +
        'doc["answer"] = 42;\n\n' +
        "serializeJson(doc, output);",
    );
  });

  it("null", () => {
    expect(
      generateSerializingProgram({ output: null, cpu: cpuInfos.avr }),
    ).toEqual("JsonDocument doc;\n\nserializeJson(doc, output);");
  });

  it("outputType = charPtr", () => {
    expect(
      generateSerializingProgram({ outputType: "charPtr", cpu: cpuInfos.avr }),
    ).toEqual(
      "// char* output;\n" +
        "// size_t outputCapacity;\n\n" +
        "JsonDocument doc;\n\n" +
        "serializeJson(doc, output, outputCapacity);",
    );
  });

  it("outputType = charArray", () => {
    expect(
      generateSerializingProgram({
        outputType: "charArray",
        cpu: cpuInfos.avr,
      }),
    ).toEqual(
      "JsonDocument doc;\n\n" +
        "char output[MAX_OUTPUT_SIZE];\n" +
        "serializeJson(doc, output);",
    );
  });

  it("outputType = arduinoString", () => {
    expect(
      generateSerializingProgram({
        outputType: "arduinoString",
        cpu: cpuInfos.avr,
      }),
    ).toEqual(
      "JsonDocument doc;\n\n" +
        "String output;\n" +
        "serializeJson(doc, output);",
    );
  });

  it("outputType = stdString", () => {
    expect(
      generateSerializingProgram({
        outputType: "stdString",
        cpu: cpuInfos.avr,
      }),
    ).toEqual(
      "JsonDocument doc;\n\n" +
        "std::string output;\n" +
        "serializeJson(doc, output);",
    );
  });

  it("outputType = arduinoStream", () => {
    expect(
      generateSerializingProgram({
        outputType: "arduinoStream",
        cpu: cpuInfos.avr,
      }),
    ).toEqual(
      "// Stream& output;\n\n" +
        "JsonDocument doc;\n\n" +
        "serializeJson(doc, output);",
    );
  });

  it("outputType = stdStream", () => {
    expect(
      generateSerializingProgram({
        outputType: "stdStream",
        cpu: cpuInfos.avr,
      }),
    ).toEqual(
      "// std::ostream& output;\n\n" +
        "JsonDocument doc;\n\n" +
        "serializeJson(doc, output);",
    );
  });
});
