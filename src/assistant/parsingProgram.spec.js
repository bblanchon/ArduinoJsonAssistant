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
    expect(getDeserializationCode({ inputType: "charPtr" })).toEqual(
      "// char* input;\n" +
        "// size_t inputLength; (optional)\n\n" +
        "JsonDocument doc;\n\n" +
        "DeserializationError error = deserializeJson(doc, input, inputLength);",
    );
  });

  it("inputType == charArray", () => {
    expect(getDeserializationCode({ inputType: "charArray" })).toEqual(
      "// char input[MAX_INPUT_LENGTH];\n\n" +
        "JsonDocument doc;\n\n" +
        "DeserializationError error = deserializeJson(doc, input, MAX_INPUT_LENGTH);",
    );
  });

  it("inputType == constCharPtr", () => {
    expect(getDeserializationCode({ inputType: "constCharPtr" })).toEqual(
      "// const char* input;\n" +
        "// size_t inputLength; (optional)\n\n" +
        "JsonDocument doc;\n\n" +
        "DeserializationError error = deserializeJson(doc, input, inputLength);",
    );
  });

  it("inputType == arduinoString", () => {
    expect(getDeserializationCode({ inputType: "arduinoString" })).toEqual(
      "// String input;\n\n" +
        "JsonDocument doc;\n\n" +
        "DeserializationError error = deserializeJson(doc, input);",
    );
  });

  it("inputType == arduinoStream", () => {
    expect(getDeserializationCode({ inputType: "arduinoStream" })).toEqual(
      "// Stream& input;\n\n" +
        "JsonDocument doc;\n\n" +
        "DeserializationError error = deserializeJson(doc, input);",
    );
  });

  it("inputType == stdString", () => {
    expect(getDeserializationCode({ inputType: "stdString" })).toEqual(
      "// std::string input;\n\n" +
        "JsonDocument doc;\n\n" +
        "DeserializationError error = deserializeJson(doc, input);",
    );
  });

  it("inputType == stdStream", () => {
    expect(getDeserializationCode({ inputType: "stdStream" })).toEqual(
      "// std::istream& input;\n\n" +
        "JsonDocument doc;\n\n" +
        "DeserializationError error = deserializeJson(doc, input);",
    );
  });
});

describe("writeErrorCheckingCode()", () => {
  function getErrorCheckingCode(config) {
    const prg = new ProgramWriter();
    writeErrorCheckingCode(prg, config);
    return prg.toString();
  }

  it("should print to Serial when possible", () => {
    expect(getErrorCheckingCode({ serial: true, cpu: {} })).toEqual(
      "if (error) {\n" +
        '  Serial.print("deserializeJson() failed: ");\n' +
        "  Serial.println(error.c_str());\n" +
        "  return;\n" +
        "}",
    );
  });

  it("should use PROGMEM when possible", () => {
    expect(getErrorCheckingCode({ serial: true, progmem: true })).toEqual(
      "if (error) {\n" +
        '  Serial.print(F("deserializeJson() failed: "));\n' +
        "  Serial.println(error.f_str());\n" +
        "  return;\n" +
        "}",
    );
  });

  it("should print to cerr if Serial is not available", () => {
    expect(getErrorCheckingCode({ serial: false })).toEqual(
      "if (error) {\n" +
        '  std::cerr << "deserializeJson() failed: " << error.c_str() << std::endl;\n' +
        "  return;\n" +
        "}",
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
    ).toEqual(
      "JsonDocument doc;\n\n" +
        "DeserializationError error = deserializeJson(doc, input, DeserializationOption::NestingLimit(11));\n\n" +
        "if (error) {\n" +
        '  std::cerr << "deserializeJson() failed: " << error.c_str() << std::endl;\n' +
        "  return;\n" +
        "}\n",
    );
  });

  it("nesting limit with filter", () => {
    expect(
      generateParsingProgram({
        input: { ignored: [[[[[[[[[[]]]]]]]]]] },
        filter: { a: true },
        nestingLimit: 11,
      }),
    ).toEqual(
      "JsonDocument filter;\n" +
        'filter["a"] = true;\n\n' +
        "JsonDocument doc;\n\n" +
        "DeserializationError error = deserializeJson(doc, input, DeserializationOption::Filter(filter), DeserializationOption::NestingLimit(11));\n\n" +
        "if (error) {\n" +
        '  std::cerr << "deserializeJson() failed: " << error.c_str() << std::endl;\n' +
        "  return;\n" +
        "}\n",
    );
  });

  it("filter", () => {
    expect(generateParsingProgram({ input: {}, filter: { a: true } })).toEqual(
      "JsonDocument filter;\n" +
        'filter["a"] = true;\n\n' +
        "JsonDocument doc;\n\n" +
        "DeserializationError error = deserializeJson(doc, input, DeserializationOption::Filter(filter));\n\n" +
        "if (error) {\n" +
        '  std::cerr << "deserializeJson() failed: " << error.c_str() << std::endl;\n' +
        "  return;\n" +
        "}\n",
    );
  });
});

describe("writeDecompositionCode", function () {
  function getDecompositionCode(input) {
    const prg = new ProgramWriter();
    writeDecompositionCode(prg, input);
    return prg.toString();
  }

  it("[]", () => {
    expect(getDecompositionCode([])).toEqual("");
  });

  it("{}", () => {
    expect(getDecompositionCode({})).toEqual("");
  });

  it("42", () => {
    expect(getDecompositionCode(42)).toEqual("int root = doc.as<int>(); // 42");
  });

  it("[42]", () => {
    expect(getDecompositionCode([42])).toEqual("int root_0 = doc[0]; // 42\n");
  });

  it("bool", () => {
    expect(getDecompositionCode(true)).toEqual(
      "bool root = doc.as<bool>(); // true",
    );
    expect(getDecompositionCode(false)).toEqual(
      "bool root = doc.as<bool>(); // false",
    );
  });

  it("[1,2,3]", () => {
    expect(getDecompositionCode([1, 2, 3])).toEqual(
      "int root_0 = doc[0]; // 1\n" +
        "int root_1 = doc[1]; // 2\n" +
        "int root_2 = doc[2]; // 3\n",
    );
  });

  it('{"hello":true}', () => {
    expect(getDecompositionCode({ hello: true })).toEqual(
      'bool hello = doc["hello"]; // true\n',
    );
  });

  it('{"hello":null}', () => {
    expect(getDecompositionCode({ hello: null })).toEqual(
      '// doc["hello"] is null\n',
    );
  });

  it('{"hello":"world"}', () => {
    expect(getDecompositionCode({ hello: "world" })).toEqual(
      'const char* hello = doc["hello"]; // "world"\n',
    );
  });

  it('[{"a":1,"b":2,"c":3}]', () => {
    expect(getDecompositionCode([{ a: 1, b: 2, c: 3 }])).toEqual(
      "JsonObject root_0 = doc[0];\n" +
        'int root_0_a = root_0["a"]; // 1\n' +
        'int root_0_b = root_0["b"]; // 2\n' +
        'int root_0_c = root_0["c"]; // 3\n',
    );
  });

  it("[[[[[[[[[[[42]]]]]]]]]]]", () => {
    expect(getDecompositionCode([[[[[[[[[[[42]]]]]]]]]]])).toEqual(
      "int root_0_0_0_0_0_0_0_0_0_0_0 = doc[0][0][0][0][0][0][0][0][0][0][0]; // 42\n",
    );
  });

  it("[10000,10000000,10000000000]", () => {
    expect(getDecompositionCode([10000, 10000000, 10000000000])).toEqual(
      "int root_0 = doc[0]; // 10000\n" +
        "long root_1 = doc[1]; // 10000000\n" +
        "long long root_2 = doc[2]; // 10000000000\n",
    );
  });

  it('{"123":1}', () => {
    expect(getDecompositionCode({ 123: 1 })).toEqual(
      'int root_123 = doc["123"]; // 1\n',
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
    ).toEqual(
      "for (JsonObject item : doc.as<JsonArray>()) {\n\n" +
        '  long dt = item["dt"]; // 1511978400, 1511989200\n\n' +
        '  float main_temp = item["main"]["temp"]; // 3.95, 3.2\n\n' +
        '  const char* weather_0_description = item["weather"][0]["description"]; // "light rain", "clear sky"\n\n' +
        "}\n",
    );
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
    ).toEqual(
      'for (JsonObject list_item : doc["list"].as<JsonArray>()) {\n\n' +
        '  long list_item_dt = list_item["dt"]; // 1511978400, 1511989200, 1512000000\n\n' +
        '  float list_item_main_temp = list_item["main"]["temp"]; // 3.95, 3.2, 3.25\n\n' +
        '  const char* list_item_weather_0_description = list_item["weather"][0]["description"]; // "light rain", ...\n\n' +
        "}\n",
    );
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
    ).toEqual(
      'for (JsonPair property : doc["properties"].as<JsonObject>()) {\n' +
        '  const char* property_key = property.key().c_str(); // "batt", "tempc", "hum"\n\n' +
        '  const char* property_value_unit = property.value()["unit"]; // "%", "°C", "%"\n' +
        '  const char* property_value_name = property.value()["name"]; // "battery", "temperature", "humidity"\n\n' +
        "}\n",
    );
  });

  it("loop with mixed integer and long-longs", () => {
    expect(
      getDecompositionCode([{ x: 10000 }, { x: 10000000 }, { x: 10000000000 }]),
    ).toEqual(
      "for (JsonObject item : doc.as<JsonArray>()) {\n\n" +
        '  long long x = item["x"]; // 10000, 10000000, 10000000000\n\n' +
        "}\n",
    );
  });

  it("loop with mixed integer and floats", () => {
    expect(getDecompositionCode([{ x: 10000 }, { x: 1.4 }])).toEqual(
      "for (JsonObject item : doc.as<JsonArray>()) {\n\n" +
        '  float x = item["x"]; // 10000, 1.4\n\n' +
        "}\n",
    );
  });

  it("loop with mixed null and integer", () => {
    expect(getDecompositionCode([{ x: null }, { x: 42 }])).toEqual(
      "for (JsonObject item : doc.as<JsonArray>()) {\n\n" +
        '  int x = item["x"]; // 0, 42\n\n' +
        "}\n",
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
    ).toEqual(
      "for (JsonObject item : doc.as<JsonArray>()) {\n\n" +
        '  const char* very_long_name = item["very_long_name"]; // "long value", "another long value", "yes another ...\n\n' +
        "}\n",
    );
  });

  it("loop on root with null siblings", () => {
    expect(getDecompositionCode([{ x: { id: 10 } }, { x: null }])).toEqual(
      "for (JsonObject item : doc.as<JsonArray>()) {\n\n" +
        '  int x_id = item["x"]["id"]; // 10, 0\n\n' +
        "}\n",
    );
  });

  it("nested array with potential name conflict #1623", () => {
    expect(
      getDecompositionCode([
        { data: [{ time: 1 }, { time: 2 }] },
        { data: [{ time: 3 }, { time: 4 }] },
      ]),
    ).toEqual(
      "for (JsonObject item : doc.as<JsonArray>()) {\n\n" +
        '  for (JsonObject data_item : item["data"].as<JsonArray>()) {\n\n' +
        '    int data_item_time = data_item["time"]; // 1, 2\n\n' +
        "  }\n\n" +
        "}\n",
    );
  });

  it("null sibling array", () => {
    expect(
      getDecompositionCode([
        { data: [1, 3] },
        { data: [2, 4] },
        { data: null },
      ]),
    ).toEqual(
      `for (JsonObject item : doc.as<JsonArray>()) {

  int data_0 = item["data"][0]; // 1, 2, 0
  int data_1 = item["data"][1]; // 3, 4, 0

}
`,
    );
  });
});
