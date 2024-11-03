import { describe, it, expect } from "vitest";

import cpuInfos from "./cpus";
import { ProgramWriter } from "./programWriter";
import {
  generateSerializingProgram,
  writeCompositionCode,
} from "./serializingProgram";

function compositionCodeFor(root) {
  const prg = new ProgramWriter();
  writeCompositionCode(prg, root, "doc");
  const output = prg.toString();
  return output;
}

describe("writeCompositionCode()", () => {
  it("null", () => {
    expect(compositionCodeFor(null)).toEqual("");
  });

  it("[]", () => {
    expect(compositionCodeFor([])).toEqual("doc.to<JsonArray>();");
  });

  it("{}", () => {
    expect(compositionCodeFor({})).toEqual("doc.to<JsonObject>();");
  });

  it("[42]", () => {
    expect(compositionCodeFor([42])).toEqual("doc[0] = 42;");
  });

  it("[null]", () => {
    expect(compositionCodeFor([null])).toEqual("doc[0] = nullptr;");
  });

  it('["hello"]', () => {
    expect(compositionCodeFor(["hello"])).toEqual('doc[0] = "hello";');
  });

  it('["hello","world",null]', () => {
    expect(compositionCodeFor(["hello", "world", null])).toEqual(
      'doc.add("hello");\ndoc.add("world");\ndoc.add(nullptr);',
    );
  });

  it('{"answer":42}', () => {
    expect(compositionCodeFor({ answer: 42 })).toEqual('doc["answer"] = 42;');
  });

  it('{"answer":null}', () => {
    expect(compositionCodeFor({ answer: null })).toEqual(
      'doc["answer"] = nullptr;',
    );
  });

  it('[{"answer":42}]', () => {
    expect(compositionCodeFor([{ answer: 42 }])).toEqual(
      'doc[0]["answer"] = 42;',
    );
  });

  it('{"answers":[42]}', () => {
    expect(compositionCodeFor({ answers: [42] })).toEqual(
      'doc["answers"][0] = 42;',
    );
  });

  it('{"message":{"status":"ok"}}', () => {
    expect(compositionCodeFor({ message: { status: "ok" } })).toEqual(
      'doc["message"]["status"] = "ok";',
    );
  });

  it("[[1,2],[3,4]]", () => {
    expect(
      compositionCodeFor([
        [1, 2],
        [3, 4],
      ]),
    ).toEqual(
      "JsonArray doc_0 = doc.createNestedArray();\n" +
        "doc_0.add(1);\n" +
        "doc_0.add(2);\n\n" +
        "JsonArray doc_1 = doc.createNestedArray();\n" +
        "doc_1.add(3);\n" +
        "doc_1.add(4);",
    );
  });

  it('{ A: { B: { C: "D" }, E: { F: "G" } } }', () => {
    expect(compositionCodeFor({ A: { B: { C: "D" }, E: { F: "G" } } })).toEqual(
      'JsonObject A = doc.createNestedObject("A");\n' +
        'A["B"]["C"] = "D";\n' +
        'A["E"]["F"] = "G";',
    );
  });

  it('{ A: { B: { C: "D" } } }', () => {
    expect(compositionCodeFor({ A: { B: { C: "D" } } })).toEqual(
      'doc["A"]["B"]["C"] = "D";',
    );
  });

  it("[[[42, 43],[44, 45]]]", () => {
    expect(
      compositionCodeFor([
        [
          [42, 43],
          [44, 45],
        ],
      ]),
    ).toEqual(
      "JsonArray doc_0 = doc.createNestedArray();\n\n" +
        "JsonArray doc_0_0 = doc_0.createNestedArray();\n" +
        "doc_0_0.add(42);\n" +
        "doc_0_0.add(43);\n\n" +
        "JsonArray doc_0_1 = doc_0.createNestedArray();\n" +
        "doc_0_1.add(44);\n" +
        "doc_0_1.add(45);",
    );
  });

  it('{"hello world":[42, 43]}', () => {
    expect(compositionCodeFor({ "hello world": [42, 43] })).toEqual(
      'JsonArray hello_world = doc.createNestedArray("hello world");\n' +
        "hello_world.add(42);\n" +
        "hello_world.add(43);",
    );
  });

  it("{ list: [{ dt: true }] }", () => {
    expect(compositionCodeFor({ list: [{ dt: true, main: true }] })).toEqual(
      'JsonObject list_0 = doc["list"].createNestedObject();\n' +
        'list_0["dt"] = true;\n' +
        'list_0["main"] = true;',
    );
  });

  it("{ list: [{ dt: true, main: true }] }", () => {
    expect(compositionCodeFor({ list: [{ dt: true, main: true }] })).toEqual(
      'JsonObject list_0 = doc["list"].createNestedObject();\n' +
        'list_0["dt"] = true;\n' +
        'list_0["main"] = true;',
    );
  });

  it("{ data: { children: [{ data: { title: true, ups: true } }] } }", () => {
    expect(
      compositionCodeFor({
        data: { children: [{ data: { title: true, ups: true } }] },
      }),
    ).toEqual(
      'JsonObject data_children_0_data = doc["data"]["children"][0].createNestedObject("data");\n' +
        'data_children_0_data["title"] = true;\n' +
        'data_children_0_data["ups"] = true;',
    );
  });

  it("[{ a: 1 }, { a: 2 }]", () => {
    expect(compositionCodeFor([{ a: 1 }, { a: 2 }])).toEqual(
      'doc[0]["a"] = 1;\ndoc[1]["a"] = 2;',
    );
  });

  it("[{ a: 1, b: 2 }, { a: 3, b: 4 }]", () => {
    expect(
      compositionCodeFor([
        { a: 1, b: 2 },
        { a: 3, b: 4 },
      ]),
    ).toEqual(
      "JsonObject doc_0 = doc.createNestedObject();\n" +
        'doc_0["a"] = 1;\n' +
        'doc_0["b"] = 2;\n' +
        "\n" +
        "JsonObject doc_1 = doc.createNestedObject();\n" +
        'doc_1["a"] = 3;\n' +
        'doc_1["b"] = 4;',
    );
  });
});

describe("generateSerializingProgram", function () {
  it('{"answer":42}', () => {
    expect(
      generateSerializingProgram({ root: { answer: 42 }, cpu: cpuInfos.avr }),
    ).toEqual(
      "StaticJsonDocument<32> doc;\n\n" +
        'doc["answer"] = 42;\n\n' +
        "serializeJson(doc, output);",
    );
  });

  it("null", () => {
    expect(
      generateSerializingProgram({ root: null, cpu: cpuInfos.avr }),
    ).toEqual("StaticJsonDocument<0> doc;\n\nserializeJson(doc, output);");
  });

  it("outputType = charPtr", () => {
    expect(
      generateSerializingProgram({ outputType: "charPtr", cpu: cpuInfos.avr }),
    ).toEqual(
      "// char* output;\n" +
        "// size_t outputCapacity;\n\n" +
        "StaticJsonDocument<0> doc;\n\n" +
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
      "StaticJsonDocument<0> doc;\n\n" +
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
      "StaticJsonDocument<0> doc;\n\n" +
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
      "StaticJsonDocument<0> doc;\n\n" +
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
        "StaticJsonDocument<0> doc;\n\n" +
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
        "StaticJsonDocument<0> doc;\n\n" +
        "serializeJson(doc, output);",
    );
  });

  it("DynamicJsonDocument", () => {
    expect(
      generateSerializingProgram({
        root: "abcdef",
        cpu: { heapThreshold: 23 },
      }),
    ).toEqual(
      "DynamicJsonDocument doc(24);\n\n" +
        'doc.set("abcdef");\n\n' +
        "serializeJson(doc, output);",
    );
  });
});
