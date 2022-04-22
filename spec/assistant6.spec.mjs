const sample_object = {
  sensor: "gps",
  time: 1351824120,
  data: [48.75608, 2.302038],
};

import {
  ProgramWriter,
  stringifyValue,
  makeVariableName,
  makeItemName,
} from "../src/assistant/programWriter.mjs";
import {
  generateParsingProgram,
  writeDeserializationCode,
  writeDecompositionCode,
  writeErrorCheckingCode,
} from "../src/assistant/parsingProgram.mjs";
import {
  generateSerializingProgram,
  writeCompositionCode,
} from "../src/assistant/serializingProgram.mjs";
import {
  measureSize,
  needsLongLong,
  needsDouble,
  roundCapacity,
  canLoop,
  getCommonCppTypeFor,
  hasJsonInJsonSyndrome,
} from "../src/assistant/analyzer.mjs";
import cpuInfos from "../src/assistant/cpus.mjs";
import { applyFilter } from "../src/assistant/filter.mjs";

describe("Assistant v6", function () {
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

  describe("measureSize", function () {
    it("should return 0+0 for null", () => {
      const result = measureSize(null, { cpu: cpuInfos.avr });
      expect(result).toEqual({
        slots: 0,
        strings: 0,
        minimum: 0,
        recommended: 0,
      });
    });

    it('should return 0+6 for "hello"', () => {
      const result = measureSize("hello", { cpu: cpuInfos.avr });
      expect(result).toEqual({
        slots: 0,
        strings: 6,
        minimum: 6,
        recommended: 16,
      });
    });

    it("should return 40+21 on AVR", () => {
      const result = measureSize(sample_object, { cpu: cpuInfos.avr });
      expect(result).toEqual({
        slots: 40,
        strings: 21,
        minimum: 61,
        recommended: 96,
      });
    });

    it("should return 80+21 on ESP", () => {
      const result = measureSize(sample_object, { cpu: cpuInfos.esp8266 });
      expect(result).toEqual({
        slots: 80,
        strings: 21,
        minimum: 101,
        recommended: 128,
      });
    });

    it("should not deduplicate keys if deduplicateKeys is false", () => {
      const input = [{ example: 1 }, { example: 2 }];
      const result = measureSize(input, {
        deduplicateKeys: false,
        cpu: { slotSize: 8 },
      });
      expect(result).toEqual({
        slots: 32,
        strings: 16,
        minimum: 48,
        recommended: 64,
      });
    });

    it("should not deduplicate keys if deduplicateKeys is true", () => {
      const input = [{ example: 1 }, { example: 2 }];
      const result = measureSize(input, {
        deduplicateKeys: true,
        cpu: { slotSize: 8 },
      });
      expect(result).toEqual({
        slots: 32,
        strings: 8,
        minimum: 40,
        recommended: 64,
      });
    });

    it("should not deduplicate values if deduplicateValues is false", () => {
      const input = ["example", "example"];
      const result = measureSize(input, {
        deduplicateValues: false,
        cpu: { slotSize: 8 },
      });
      expect(result).toEqual({
        slots: 16,
        strings: 16,
        minimum: 32,
        recommended: 48,
      });
    });

    it("should not deduplicate keys if deduplicateValues is true", () => {
      const input = ["example", "example"];
      const result = measureSize(input, {
        deduplicateValues: true,
        cpu: { slotSize: 8 },
      });
      expect(result).toEqual({
        slots: 16,
        strings: 8,
        minimum: 24,
        recommended: 48,
      });
    });

    it("filter simple object", () => {
      expect(
        measureSize(
          { hello: 1, world: 2 },
          { cpu: { slotSize: 8 }, filter: { hello: true } }
        )
      ).toEqual({
        filter: 6,
        slots: 8,
        strings: 6,
        minimum: 20,
        recommended: 32,
      });
    });

    it("filter simple array", () => {
      expect(
        measureSize(
          [
            { hello: 1, world: 0 },
            { hello: 2, worldWorld: 0 },
            { hello: 3, x: "what a wonderful day!" },
          ],
          {
            cpu: { slotSize: 8 },
            deduplicateKeys: true,
            filter: [{ hello: true }],
          }
        )
      ).toEqual({
        filter: 11,
        slots: 48,
        strings: 6,
        minimum: 65,
        recommended: 96,
      });
    });

    it("should ignore keys when ignoreKeys is true", () => {
      expect(
        measureSize(
          { hello: "world!!!" },
          {
            cpu: { slotSize: 8 },
            ignoreKeys: true,
          }
        )
      ).toEqual({
        slots: 8,
        strings: 9,
        minimum: 17,
        recommended: 32,
      });
    });

    it("should ignore values when ignoreValues is true", () => {
      expect(
        measureSize(
          { hello: "world!!!" },
          {
            cpu: { slotSize: 8 },
            ignoreValues: true,
          }
        )
      ).toEqual({
        slots: 8,
        strings: 6,
        minimum: 14,
        recommended: 24,
      });
    });
  });

  describe("hasJsonInJsonSyndrome()", () => {
    it("should return false for undefined", () => {
      expect(hasJsonInJsonSyndrome(undefined)).toBe(false);
    });

    it("should return false for a random string", () => {
      expect(hasJsonInJsonSyndrome("hello")).toBe(false);
    });

    it("should return true for a JSON string", () => {
      expect(hasJsonInJsonSyndrome('{"value":1}')).toBe(true);
    });

    it("should return true for a number string", () => {
      expect(hasJsonInJsonSyndrome("12345")).toBe(false);
    });

    it("should return true for a JSON string in an object", () => {
      expect(hasJsonInJsonSyndrome({ result: '{"value":1}' })).toBe(true);
    });

    it("should return true for a JSON string in an array", () => {
      expect(hasJsonInJsonSyndrome(['{"value":1}'])).toBe(true);
    });
  });

  it("roundCapacity", () => {
    expect(roundCapacity(0)).toBe(0);
    expect(roundCapacity(1)).toBe(8);
    expect(roundCapacity(10)).toBe(16);
    expect(roundCapacity(100)).toBe(128);
    expect(roundCapacity(127)).toBe(128);
    expect(roundCapacity(128)).toBe(128);
    expect(roundCapacity(129)).toBe(192);
    expect(roundCapacity(199999)).toBe(262144);
  });

  describe("canLoop()", () => {
    it("null", () => {
      expect(canLoop(null)).toBe(false);
    });

    it("empty object", () => {
      expect(canLoop({})).toBe(false);
    });

    it("empty array", () => {
      expect(canLoop([])).toBe(false);
    });

    it("array with one element", () => {
      expect(canLoop([42])).toBe(false);
    });

    it("object with one member", () => {
      expect(canLoop({ answer: 42 })).toBe(false);
    });

    it("array with two integers", () => {
      expect(canLoop([1, 2])).toBe(false);
    });

    it("array with two empty objects", () => {
      expect(canLoop([{}, {}])).toBe(true);
    });

    it("array with an object and an array", () => {
      expect(canLoop([{}, []])).toBe(false);
    });

    it("array with two objects with same keys and same values types", () => {
      expect(canLoop([{ a: 1 }, { a: 1 }])).toBe(true);
    });

    it("array with two objects with different keys", () => {
      expect(canLoop([{ a: 1 }, { b: 1 }])).toBe(false);
    });

    it("array with two objects with same keys but different value types", () => {
      expect(canLoop([{ a: 1 }, { a: "1" }])).toBe(false);
    });

    it("array with two objects with same keys and loopable values", () => {
      expect(canLoop([{ a: [1, 2] }, { a: [3, 4] }])).toBe(true);
    });

    it("array with two objects with same keys and non-loopable values", () => {
      expect(canLoop([{ a: [1, 2] }, { a: [3, "4"] }])).toBe(false);
    });

    it("array with mixed types", () => {
      expect(canLoop([1, "2"])).toBe(false);
    });

    it("OpenWeatherMap example", () => {
      expect(
        canLoop([
          {
            dt: 1511978400,
            main: { temp: 3.95 },
            weather: [{ description: "light rain" }],
          },
          {
            dt: 1511989200,
            main: { temp: 3.2 },
            weather: [{ description: "light rain" }],
          },
        ])
      ).toBe(true);
    });

    it("1technophile example", () => {
      expect(
        canLoop({
          batt: { unit: "%", name: "battery" },
          tempc: { unit: "°C", name: "temperature" },
          hum: { unit: "%", name: "humidity" },
        })
      ).toBe(true);
    });
  });

  describe("getCommonCppTypeFor()", () => {
    it("string", () => {
      expect(getCommonCppTypeFor(["string", 0, true])).toBe("const char*");
    });

    it("boolean", () => {
      expect(getCommonCppTypeFor([true, 0])).toBe("bool");
      expect(getCommonCppTypeFor([false, 0])).toBe("bool");
    });

    it("int", () => {
      expect(getCommonCppTypeFor([0, 1, 2])).toBe("int");
    });

    it("float", () => {
      expect(getCommonCppTypeFor([0, 0.1, 2])).toBe("float");
    });

    it("positive long", () => {
      expect(getCommonCppTypeFor([0, 1000, 100000])).toBe("long");
      expect(getCommonCppTypeFor([0, -1000, -100000])).toBe("long");
    });

    it("positive long long", () => {
      expect(getCommonCppTypeFor([0, 1e4, 2000000000])).toBe("long long");
      expect(getCommonCppTypeFor([0, -100000, -2000000000])).toBe("long long");
    });

    it("exceed long long capacity", () => {
      expect(getCommonCppTypeFor([0, 9e18])).toBe("float");
      expect(getCommonCppTypeFor([0, -9e18])).toBe("float");
    });

    it("exceed float capacity", () => {
      expect(getCommonCppTypeFor([0, 2e38])).toBe("double");
      expect(getCommonCppTypeFor([0, -2e38])).toBe("double");
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
      test([], "doc.to&lt;JsonArray&gt;();");
    });

    it("{}", () => {
      test({}, "doc.to&lt;JsonObject&gt;();");
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

  describe("applyFilter()", () => {
    const testFilter = (input, filter, expectedOutput) => {
      const output = applyFilter(input, filter);
      expect(output).toEqual(expectedOutput);
    };

    it("returns null if the filter is null", () => {
      testFilter({ hello: "world" }, null, null);
    });

    it("returns null if the filter is false", () => {
      testFilter({ hello: "world" }, false, null);
    });

    it("returns the input if filter is true", () => {
      testFilter({ hello: "world" }, true, { hello: "world" });
    });

    it("returns empty object if filter is empty object", () => {
      testFilter({ hello: "world" }, {}, {});
    });

    it("returns filtered members", () => {
      testFilter(
        { a: 1, b: 2, c: 3, d: 4 },
        { a: true, c: true },
        { a: 1, c: 3 }
      );
    });

    it("returns filtered members in nested object", () => {
      testFilter(
        { a: { c1: 1, c2: 2 }, b: { c1: 3, c2: 4 } },
        { a: { c1: true }, b: { c2: true } },
        { a: { c1: 1 }, b: { c2: 4 } }
      );
    });

    it("wildcard key", () => {
      testFilter(
        { a: { c1: 1, c2: 2 }, b: { c1: 3, c2: 4 } },
        { "*": { c1: true }, b: { c2: true } },
        { a: { c1: 1 }, b: { c2: 4 } }
      );
    });

    it("input is object, filter is  array", () => {
      testFilter({ a: 1 }, [], null);
    });

    it("input is array, filter is empty array", () => {
      testFilter([1, 2, 3], [], []);
    });

    it("only the first element of filter array counts", () => {
      testFilter([1, 2, 3], [true, false], [1, 2, 3]);
      testFilter([1, 2, 3], [false, true], []);
    });

    it("filter member of object in array", () => {
      testFilter(
        [
          { example: 1, ignore: 2 },
          { example: 3, ignore: 4 },
        ],
        [{ example: true }],
        [{ example: 1 }, { example: 3 }]
      );
    });
  });

  describe("needsLongLong()", () => {
    it("long", () => {
      expect(needsLongLong(10000000)).toBe(false);
    });

    it("long long", () => {
      expect(needsLongLong(10000000000)).toBe(true);
      expect(needsLongLong(-10000000000)).toBe(true);
    });

    it("float", () => {
      expect(needsLongLong(1.4)).toBe(false);
    });

    it("exceed long long capacity", () => {
      expect(needsLongLong(9e18)).toBe(false);
      expect(needsLongLong(-9e18)).toBe(false);
    });

    it("loop with mixed integer and long-longs", () => {
      expect(
        needsLongLong([{ x: 10000 }, { x: 10000000 }, { x: 10000000000 }])
      ).toBe(true);
    });

    it("loop with mixed long long and floats", () => {
      expect(needsLongLong([{ x: 10000000000 }, { x: 1.4 }])).toBe(false);
    });

    it("null siblings", () => {
      expect(needsLongLong([{ x: { id: 10 } }, { x: null }])).toBe(false);
      expect(needsLongLong([{ x: { id: 10000000000 } }, { x: null }])).toBe(
        true
      );
    });
  });

  describe("needsDouble()", () => {
    it("float", () => {
      expect(needsDouble(3.14)).toBe(false);
    });

    it("float with many digits", () => {
      expect(needsDouble(999999.11)).toBe(true);
    });

    it("integer exceeding float capacity", () => {
      expect(needsDouble(2e38)).toBe(true);
    });

    it("array with int and float", () => {
      expect(needsDouble([1, 3.14])).toBe(false);
    });

    it("array with float and double", () => {
      expect(needsDouble([3.14, 2e38])).toBe(true);
    });

    it("loop with mixed long long and double", () => {
      expect(needsDouble([{ x: 10000000000 }, { x: 2e38 }])).toBe(true);
    });

    it("object with double", () => {
      expect(needsDouble({ x: 2e38 })).toBe(true);
    });
  });
});
