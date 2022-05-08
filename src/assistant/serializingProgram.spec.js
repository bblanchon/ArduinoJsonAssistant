import { describe, it, expect } from "vitest";
import cpuInfos from "@/assistant/cpus.js";
import { ProgramWriter } from "@/assistant/programWriter.js";
import {
  generateSerializingProgram,
  writeCompositionCode,
} from "@/assistant/serializingProgram.js";

describe("writeCompositionCode()", () => {
  function test(root, expectedOutput) {
    const prg = new ProgramWriter();
    writeCompositionCode(prg, root, "doc");
    expect(prg.toString()).toEqual(expectedOutput);
  }

  it("null", () => {
    test(null, "");
  });

  it("[]", () => {
    test([], "doc.to<JsonArray>();");
  });

  it("{}", () => {
    test({}, "doc.to<JsonObject>();");
  });

  it("[42]", () => {
    test([42], "doc[0] = 42;");
  });

  it("[null]", () => {
    test([null], "doc[0] = nullptr;");
  });

  it('["hello"]', () => {
    test(["hello"], 'doc[0] = "hello";');
  });

  it('["hello","world",null]', () => {
    test(
      ["hello", "world", null],
      'doc.add("hello");\ndoc.add("world");\ndoc.add(nullptr);'
    );
  });

  it('{"answer":42}', () => {
    test({ answer: 42 }, 'doc["answer"] = 42;');
  });

  it('{"answer":null}', () => {
    test({ answer: null }, 'doc["answer"] = nullptr;');
  });

  it('[{"answer":42}]', () => {
    test([{ answer: 42 }], 'doc[0]["answer"] = 42;');
  });

  it('{"answers":[42]}', () => {
    test({ answers: [42] }, 'doc["answers"][0] = 42;');
  });

  it('{"message":{"status":"ok"}}', () => {
    test({ message: { status: "ok" } }, 'doc["message"]["status"] = "ok";');
  });

  it("[[1,2],[3,4]]", () => {
    test(
      [
        [1, 2],
        [3, 4],
      ],
      "JsonArray doc_0 = doc.createNestedArray();\n" +
        "doc_0.add(1);\n" +
        "doc_0.add(2);\n\n" +
        "JsonArray doc_1 = doc.createNestedArray();\n" +
        "doc_1.add(3);\n" +
        "doc_1.add(4);"
    );
  });

  it('{ A: { B: { C: "D" }, E: { F: "G" } } }', () => {
    test(
      { A: { B: { C: "D" }, E: { F: "G" } } },
      'JsonObject A = doc.createNestedObject("A");\n' +
        'A["B"]["C"] = "D";\n' +
        'A["E"]["F"] = "G";'
    );
  });

  it('{ A: { B: { C: "D" } } }', () => {
    test({ A: { B: { C: "D" } } }, 'doc["A"]["B"]["C"] = "D";');
  });

  it("[[[42, 43],[44, 45]]]", () => {
    test(
      [
        [
          [42, 43],
          [44, 45],
        ],
      ],
      "JsonArray doc_0 = doc.createNestedArray();\n\n" +
        "JsonArray doc_0_0 = doc_0.createNestedArray();\n" +
        "doc_0_0.add(42);\n" +
        "doc_0_0.add(43);\n\n" +
        "JsonArray doc_0_1 = doc_0.createNestedArray();\n" +
        "doc_0_1.add(44);\n" +
        "doc_0_1.add(45);"
    );
  });

  it('{"hello world":[42, 43]}', () => {
    test(
      { "hello world": [42, 43] },
      'JsonArray hello_world = doc.createNestedArray("hello world");\n' +
        "hello_world.add(42);\n" +
        "hello_world.add(43);"
    );
  });

  it("{ list: [{ dt: true }] }", () => {
    test(
      { list: [{ dt: true, main: true }] },
      'JsonObject list_0 = doc["list"].createNestedObject();\n' +
        'list_0["dt"] = true;\n' +
        'list_0["main"] = true;'
    );
  });

  it("{ list: [{ dt: true, main: true }] }", () => {
    test(
      { list: [{ dt: true, main: true }] },
      'JsonObject list_0 = doc["list"].createNestedObject();\n' +
        'list_0["dt"] = true;\n' +
        'list_0["main"] = true;'
    );
  });

  it("{ data: { children: [{ data: { title: true, ups: true } }] } }", () => {
    test(
      { data: { children: [{ data: { title: true, ups: true } }] } },
      'JsonObject data_children_0_data = doc["data"]["children"][0].createNestedObject("data");\n' +
        'data_children_0_data["title"] = true;\n' +
        'data_children_0_data["ups"] = true;'
    );
  });

  it("[{ a: 1 }, { a: 2 }]", () => {
    test([{ a: 1 }, { a: 2 }], 'doc[0]["a"] = 1;\ndoc[1]["a"] = 2;');
  });
});

describe("generateSerializingProgram", function () {
  function testSerializingProgram(cfg, expectedOutput) {
    expect(generateSerializingProgram(cfg)).toEqual(expectedOutput);
  }

  it('{"answer":42}', () => {
    testSerializingProgram(
      { root: { answer: 42 }, cpu: cpuInfos.avr },
      "StaticJsonDocument<32> doc;\n\n" +
        'doc["answer"] = 42;\n\n' +
        "serializeJson(doc, output);"
    );
  });

  it("null", () => {
    testSerializingProgram(
      { root: null, cpu: cpuInfos.avr },
      "StaticJsonDocument<0> doc;\n\nserializeJson(doc, output);"
    );
  });

  it("outputType = charPtr", () => {
    testSerializingProgram(
      { outputType: "charPtr", cpu: cpuInfos.avr },
      "// char* output;\n" +
        "// size_t outputCapacity;\n\n" +
        "StaticJsonDocument<0> doc;\n\n" +
        "serializeJson(doc, output, outputCapacity);"
    );
  });

  it("outputType = charArray", () => {
    testSerializingProgram(
      { outputType: "charArray", cpu: cpuInfos.avr },
      "StaticJsonDocument<0> doc;\n\n" +
        "char output[MAX_OUTPUT_SIZE];\n" +
        "serializeJson(doc, output);"
    );
  });

  it("outputType = arduinoString", () => {
    testSerializingProgram(
      { outputType: "arduinoString", cpu: cpuInfos.avr },
      "StaticJsonDocument<0> doc;\n\n" +
        "String output;\n" +
        "serializeJson(doc, output);"
    );
  });

  it("outputType = stdString", () => {
    testSerializingProgram(
      { outputType: "stdString", cpu: cpuInfos.avr },
      "StaticJsonDocument<0> doc;\n\n" +
        "std::string output;\n" +
        "serializeJson(doc, output);"
    );
  });

  it("outputType = arduinoStream", () => {
    testSerializingProgram(
      { outputType: "arduinoStream", cpu: cpuInfos.avr },
      "// Stream& output;\n\n" +
        "StaticJsonDocument<0> doc;\n\n" +
        "serializeJson(doc, output);"
    );
  });

  it("outputType = stdStream", () => {
    testSerializingProgram(
      { outputType: "stdStream", cpu: cpuInfos.avr },
      "// std::ostream& output;\n\n" +
        "StaticJsonDocument<0> doc;\n\n" +
        "serializeJson(doc, output);"
    );
  });

  it("DynamicJsonDocument", () => {
    testSerializingProgram(
      { root: "abcdef", cpu: { heapThreshold: 23 } },
      "DynamicJsonDocument doc(24);\n\n" +
        'doc.set("abcdef");\n\n' +
        "serializeJson(doc, output);"
    );
  });
});
