import { describe, it, expect } from "vitest";

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
      `JsonArray doc_0 = doc.add<JsonArray>();
doc_0.add(1);
doc_0.add(2);

JsonArray doc_1 = doc.add<JsonArray>();
doc_1.add(3);
doc_1.add(4);`,
    );
  });

  it('{ A: { B: { C: "D" }, E: { F: "G" } } }', () => {
    expect(getCompositionCode({ A: { B: { C: "D" }, E: { F: "G" } } })).toEqual(
      `JsonObject A = doc["A"].to<JsonObject>();
A["B"]["C"] = "D";
A["E"]["F"] = "G";`,
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
      `JsonArray doc_0 = doc.add<JsonArray>();

JsonArray doc_0_0 = doc_0.add<JsonArray>();
doc_0_0.add(42);
doc_0_0.add(43);

JsonArray doc_0_1 = doc_0.add<JsonArray>();
doc_0_1.add(44);
doc_0_1.add(45);`,
    );
  });

  it('{"hello world":[42, 43]}', () => {
    expect(getCompositionCode({ "hello world": [42, 43] })).toEqual(
      `JsonArray hello_world = doc["hello world"].to<JsonArray>();
hello_world.add(42);
hello_world.add(43);`,
    );
  });

  it("{ list: [{ dt: true }] }", () => {
    expect(getCompositionCode({ list: [{ dt: true, main: true }] })).toEqual(
      `JsonObject list_0 = doc["list"].add<JsonObject>();
list_0["dt"] = true;
list_0["main"] = true;`,
    );
  });

  it("{ list: [{ dt: true, main: true }] }", () => {
    expect(getCompositionCode({ list: [{ dt: true, main: true }] })).toEqual(
      `JsonObject list_0 = doc["list"].add<JsonObject>();
list_0["dt"] = true;
list_0["main"] = true;`,
    );
  });

  it("{ data: { children: [{ data: { title: true, ups: true } }] } }", () => {
    expect(
      getCompositionCode({
        data: { children: [{ data: { title: true, ups: true } }] },
      }),
    ).toEqual(
      `JsonObject data_children_0_data = doc["data"]["children"][0]["data"].to<JsonObject>();
data_children_0_data["title"] = true;
data_children_0_data["ups"] = true;`,
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
      `JsonObject doc_0 = doc.add<JsonObject>();
doc_0["a"] = 1;
doc_0["b"] = 2;

JsonObject doc_1 = doc.add<JsonObject>();
doc_1["a"] = 3;
doc_1["b"] = 4;`,
    );
  });
});

describe("generateSerializingProgram()", function () {
  it('{"answer":42}', () => {
    expect(generateSerializingProgram({ output: { answer: 42 } })).toEqual(
      `JsonDocument doc;

doc["answer"] = 42;

doc.shrinkToFit();  // optional

serializeJson(doc, output);`,
    );
  });

  it("null", () => {
    expect(generateSerializingProgram({ output: null })).toEqual(
      `JsonDocument doc;

serializeJson(doc, output);`,
    );
  });

  it("outputType = charPtr", () => {
    expect(generateSerializingProgram({ outputType: "charPtr" })).toEqual(
      `// char* output;
// size_t outputCapacity;

JsonDocument doc;

serializeJson(doc, output, outputCapacity);`,
    );
  });

  it("outputType = charArray", () => {
    expect(
      generateSerializingProgram({
        outputType: "charArray",
      }),
    ).toEqual(
      `JsonDocument doc;

char output[MAX_OUTPUT_SIZE];
serializeJson(doc, output);`,
    );
  });

  it("outputType = arduinoString", () => {
    expect(
      generateSerializingProgram({
        outputType: "arduinoString",
      }),
    ).toEqual(
      `JsonDocument doc;

String output;
serializeJson(doc, output);`,
    );
  });

  it("outputType = stdString", () => {
    expect(
      generateSerializingProgram({
        outputType: "stdString",
      }),
    ).toEqual(
      `JsonDocument doc;

std::string output;
serializeJson(doc, output);`,
    );
  });

  it("outputType = arduinoStream", () => {
    expect(
      generateSerializingProgram({
        outputType: "arduinoStream",
      }),
    ).toEqual(
      `// Stream& output;

JsonDocument doc;

serializeJson(doc, output);`,
    );
  });

  it("outputType = stdStream", () => {
    expect(
      generateSerializingProgram({
        outputType: "stdStream",
      }),
    ).toEqual(
      `// std::ostream& output;

JsonDocument doc;

serializeJson(doc, output);`,
    );
  });
});
