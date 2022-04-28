import { describe, it, expect } from "vitest";
import { ProgramWriter } from "@/assistant/programWriter.mjs";
import {
  generateParsingProgram,
  writeDeserializationCode,
  writeDecompositionCode,
  writeErrorCheckingCode,
} from "@/assistant/parsingProgram.mjs";
import cpuInfos from "@/assistant/cpus.mjs";

describe("writeDeserializationCode()", () => {
  function testDeserializationCode(config, expectedOutput) {
    const prg = new ProgramWriter();
    writeDeserializationCode(prg, config);
    expect(prg.toString()).toEqual(expectedOutput);
  }

  it("inputType == charPtr", () => {
    testDeserializationCode(
      { inputType: "charPtr", cpu: cpuInfos.avr },
      "// char* input;\n" +
        "// size_t inputLength; (optional)\n\n" +
        "StaticJsonDocument<0> doc;\n\n" +
        "DeserializationError error = deserializeJson(doc, input, inputLength);"
    );
  });

  it("inputType == charArray", () => {
    testDeserializationCode(
      { inputType: "charArray", cpu: cpuInfos.avr },
      "// char input[MAX_INPUT_LENGTH];\n\n" +
        "StaticJsonDocument<0> doc;\n\n" +
        "DeserializationError error = deserializeJson(doc, input, MAX_INPUT_LENGTH);"
    );
  });

  it("inputType == constCharPtr", () => {
    testDeserializationCode(
      { inputType: "constCharPtr", cpu: cpuInfos.avr },
      "// const char* input;\n" +
        "// size_t inputLength; (optional)\n\n" +
        "StaticJsonDocument<0> doc;\n\n" +
        "DeserializationError error = deserializeJson(doc, input, inputLength);"
    );
  });

  it("inputType == arduinoString", () => {
    testDeserializationCode(
      { inputType: "arduinoString", cpu: cpuInfos.avr },
      "// String input;\n\n" +
        "StaticJsonDocument<0> doc;\n\n" +
        "DeserializationError error = deserializeJson(doc, input);"
    );
  });

  it("inputType == arduinoStream", () => {
    testDeserializationCode(
      { inputType: "arduinoStream", cpu: cpuInfos.avr },
      "// Stream& input;\n\n" +
        "StaticJsonDocument<0> doc;\n\n" +
        "DeserializationError error = deserializeJson(doc, input);"
    );
  });

  it("inputType == stdString", () => {
    testDeserializationCode(
      { inputType: "stdString", cpu: cpuInfos.avr },
      "// std::string input;\n\n" +
        "StaticJsonDocument<0> doc;\n\n" +
        "DeserializationError error = deserializeJson(doc, input);"
    );
  });

  it("inputType == stdStream", () => {
    testDeserializationCode(
      { inputType: "stdStream", cpu: cpuInfos.avr },
      "// std::istream& input;\n\n" +
        "StaticJsonDocument<0> doc;\n\n" +
        "DeserializationError error = deserializeJson(doc, input);"
    );
  });
});

describe("writeErrorCheckingCode()", () => {
  it("should print to Serial when possible", () => {
    const prg = new ProgramWriter();
    writeErrorCheckingCode(prg, { cpu: { serial: true } });
    expect(prg.toString()).toEqual(
      "if (error) {\n" +
        '  Serial.print("deserializeJson() failed: ");\n' +
        "  Serial.println(error.c_str());\n" +
        "  return;\n" +
        "}"
    );
  });

  it("should use PROGMEM when possible", () => {
    const prg = new ProgramWriter();
    writeErrorCheckingCode(prg, { cpu: { serial: true, progmem: true } });
    expect(prg.toString()).toEqual(
      "if (error) {\n" +
        '  Serial.print(F("deserializeJson() failed: "));\n' +
        "  Serial.println(error.f_str());\n" +
        "  return;\n" +
        "}"
    );
  });

  it("should print to cerr if Serial is not available", () => {
    const prg = new ProgramWriter();
    writeErrorCheckingCode(prg, { cpu: { serial: false } });
    expect(prg.toString()).toEqual(
      "if (error) {\n" +
        '  std::cerr << "deserializeJson() failed: " << error.c_str() << std::endl;\n' +
        "  return;\n" +
        "}"
    );
  });
});

describe("generateParsingProgram", function () {
  function testParginProgram(config, expectedOutput) {
    expect(generateParsingProgram(config)).toEqual(expectedOutput);
  }

  it("nesting limit witout filter", () => {
    testParginProgram(
      {
        root: [[[[[[[[[[[]]]]]]]]]]],
        cpu: { nestingLimit: 10, slotSize: 8 },
      },
      "StaticJsonDocument<96> doc;\n\n" +
        "DeserializationError error = deserializeJson(doc, input, DeserializationOption::NestingLimit(11));\n\n" +
        "if (error) {\n" +
        '  std::cerr << "deserializeJson() failed: " << error.c_str() << std::endl;\n' +
        "  return;\n" +
        "}\n"
    );
  });

  it("nesting limit with filter", () => {
    testParginProgram(
      {
        root: { ignored: [[[[[[[[[[]]]]]]]]]] },
        filter: { a: true },
        cpu: { slotSize: 8, nestingLimit: 10 },
      },
      "StaticJsonDocument<8> filter;\n" +
        'filter["a"] = true;\n\n' +
        "StaticJsonDocument<24> doc;\n\n" +
        "DeserializationError error = deserializeJson(doc, input, DeserializationOption::Filter(filter), DeserializationOption::NestingLimit(11));\n\n" +
        "if (error) {\n" +
        '  std::cerr << "deserializeJson() failed: " << error.c_str() << std::endl;\n' +
        "  return;\n" +
        "}\n"
    );
  });

  it("filter", () => {
    testParginProgram(
      { root: {}, filter: { a: true }, cpu: { slotSize: 8 } },
      "StaticJsonDocument<8> filter;\n" +
        'filter["a"] = true;\n\n' +
        "StaticJsonDocument<0> doc;\n\n" +
        "DeserializationError error = deserializeJson(doc, input, DeserializationOption::Filter(filter));\n\n" +
        "if (error) {\n" +
        '  std::cerr << "deserializeJson() failed: " << error.c_str() << std::endl;\n' +
        "  return;\n" +
        "}\n"
    );
  });

  it("DynamicJsonDocument", () => {
    testParginProgram(
      { root: "abcdef", cpu: { slotSize: 8, heapThreshold: 23 } },
      "DynamicJsonDocument doc(24);\n\n" +
        "DeserializationError error = deserializeJson(doc, input);\n\n" +
        "if (error) {\n" +
        '  std::cerr << "deserializeJson() failed: " << error.c_str() << std::endl;\n' +
        "  return;\n" +
        "}\n\n" +
        'const char* root = doc.as<const char*>(); // "abcdef"'
    );
  });
});

describe("writeDecompositionCode", function () {
  function testDescompositionCode(root, expectedOutput) {
    const prg = new ProgramWriter();
    writeDecompositionCode(prg, root);
    expect(prg.toString()).toEqual(expectedOutput);
  }

  it("[]", () => {
    testDescompositionCode([], "");
  });

  it("{}", () => {
    testDescompositionCode({}, "");
  });

  it("42", () => {
    testDescompositionCode(42, "int root = doc.as<int>(); // 42");
  });

  it("[42]", () => {
    testDescompositionCode([42], "int root_0 = doc[0]; // 42\n");
  });

  it("bool", () => {
    testDescompositionCode(true, "bool root = doc.as<bool>(); // true");
    testDescompositionCode(false, "bool root = doc.as<bool>(); // false");
  });

  it("[1,2,3]", () => {
    testDescompositionCode(
      [1, 2, 3],
      "int root_0 = doc[0]; // 1\n" +
        "int root_1 = doc[1]; // 2\n" +
        "int root_2 = doc[2]; // 3\n"
    );
  });

  it('{"hello":true}', () => {
    testDescompositionCode(
      { hello: true },
      'bool hello = doc["hello"]; // true\n'
    );
  });

  it('{"hello":null}', () => {
    testDescompositionCode({ hello: null }, '// doc["hello"] is null\n');
  });

  it('{"hello":"world"}', () => {
    testDescompositionCode(
      { hello: "world" },
      'const char* hello = doc["hello"]; // "world"\n'
    );
  });

  it('[{"a":1,"b":2,"c":3}]', () => {
    testDescompositionCode(
      [{ a: 1, b: 2, c: 3 }],
      "JsonObject root_0 = doc[0];\n" +
        'int root_0_a = root_0["a"]; // 1\n' +
        'int root_0_b = root_0["b"]; // 2\n' +
        'int root_0_c = root_0["c"]; // 3\n'
    );
  });

  it("[[[[[[[[[[[42]]]]]]]]]]]", () => {
    testDescompositionCode(
      [[[[[[[[[[[42]]]]]]]]]]],
      "int root_0_0_0_0_0_0_0_0_0_0_0 = doc[0][0][0][0][0][0][0][0][0][0][0]; // 42\n"
    );
  });

  it("[10000,10000000,10000000000]", () => {
    testDescompositionCode(
      [10000, 10000000, 10000000000],
      "int root_0 = doc[0]; // 10000\n" +
        "long root_1 = doc[1]; // 10000000\n" +
        "long long root_2 = doc[2]; // 10000000000\n"
    );
  });

  it('{"123":1}', () => {
    testDescompositionCode({ 123: 1 }, 'int root_123 = doc["123"]; // 1\n');
  });

  it("loop on root", () => {
    testDescompositionCode(
      [
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
      ],
      "for (JsonObject item : doc.as<JsonArray>()) {\n\n" +
        '  long dt = item["dt"]; // 1511978400, 1511989200\n\n' +
        '  float main_temp = item["main"]["temp"]; // 3.95, 3.2\n\n' +
        '  const char* weather_0_description = item["weather"][0]["description"]; // "light rain", "clear sky"\n\n' +
        "}\n"
    );
  });

  it("loop in member array", () => {
    testDescompositionCode(
      {
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
      },
      'for (JsonObject list_item : doc["list"].as<JsonArray>()) {\n\n' +
        '  long list_item_dt = list_item["dt"]; // 1511978400, 1511989200, 1512000000\n\n' +
        '  float list_item_main_temp = list_item["main"]["temp"]; // 3.95, 3.2, 3.25\n\n' +
        '  const char* list_item_weather_0_description = list_item["weather"][0]["description"]; // "light rain", ...\n\n' +
        "}\n"
    );
  });

  it("loop in member object", () => {
    testDescompositionCode(
      {
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
      },
      'for (JsonPair property : doc["properties"].as<JsonObject>()) {\n' +
        '  const char* property_key = property.key().c_str(); // "batt", "tempc", "hum"\n\n' +
        '  const char* property_value_unit = property.value()["unit"]; // "%", "°C", "%"\n' +
        '  const char* property_value_name = property.value()["name"]; // "battery", "temperature", "humidity"\n\n' +
        "}\n"
    );
  });

  it("loop with mixed integer and long-longs", () => {
    testDescompositionCode(
      [{ x: 10000 }, { x: 10000000 }, { x: 10000000000 }],
      "for (JsonObject item : doc.as<JsonArray>()) {\n\n" +
        '  long long x = item["x"]; // 10000, 10000000, 10000000000\n\n' +
        "}\n"
    );
  });

  it("loop with mixed integer and floats", () => {
    testDescompositionCode(
      [{ x: 10000 }, { x: 1.4 }],
      "for (JsonObject item : doc.as<JsonArray>()) {\n\n" +
        '  float x = item["x"]; // 10000, 1.4\n\n' +
        "}\n"
    );
  });

  it("loop with mixed null and integer", () => {
    testDescompositionCode(
      [{ x: null }, { x: 42 }],
      "for (JsonObject item : doc.as<JsonArray>()) {\n\n" +
        '  int x = item["x"]; // 0, 42\n\n' +
        "}\n"
    );
  });

  it("loop with many values shows ellipsis", () => {
    testDescompositionCode(
      [
        { very_long_name: "long value" },
        { very_long_name: "another long value" },
        { very_long_name: "yes another long value" },
        { very_long_name: "some string" },
      ],
      "for (JsonObject item : doc.as<JsonArray>()) {\n\n" +
        '  const char* very_long_name = item["very_long_name"]; // "long value", "another long value", "yes another ...\n\n' +
        "}\n"
    );
  });

  it("loop on root with null siblings", () => {
    testDescompositionCode(
      [{ x: { id: 10 } }, { x: null }],
      "for (JsonObject item : doc.as<JsonArray>()) {\n\n" +
        '  int x_id = item["x"]["id"]; // 10, 0\n\n' +
        "}\n"
    );
  });

  it("nested array with potential name conflict #1623", () => {
    testDescompositionCode(
      [
        { data: [{ time: 1 }, { time: 2 }] },
        { data: [{ time: 3 }, { time: 4 }] },
      ],
      "for (JsonObject item : doc.as<JsonArray>()) {\n\n" +
        '  for (JsonObject data_item : item["data"].as<JsonArray>()) {\n\n' +
        '    int data_item_time = data_item["time"]; // 1, 2\n\n' +
        "  }\n\n" +
        "}\n"
    );
  });
});
