import { describe, it, expect } from "vitest"

import { measureSize } from "../assistant/calculator.js"
import dataModels from "../assistant/architectures.js"
import { generateParsingProgram } from "../assistant/parsingProgram.js"
import { generateExpression } from "../assistant/SizeExpression.js"
import { generateSerializingProgram } from "../assistant/serializingProgram.js"

var sample_object = {
  sensor: "gps",
  time: 1351824120,
  data: [48.75608, 2.302038]
}

describe("Assistant v5", function () {
  describe("Size", function () {
    it("should return 0+5 for null", function () {
      var result = measureSize(null, dataModels[0])
      expect(result).toEqual([0, 5])
    })

    it('should return 0+6 for "hello"', function () {
      var result = measureSize("hello", dataModels[0])
      expect(result).toEqual([0, 6])
    })

    it("should return 54+50 on AVR", function () {
      var result = measureSize(sample_object, dataModels[0])
      expect(result).toEqual([54, 50])
    })

    it("should return 88+50 on ESP", function () {
      var result = measureSize(sample_object, dataModels[1])
      expect(result).toEqual([88, 50])
    })
  })

  describe("ParsingProgram", function () {
    function testDeserialization(input, expectedOutput) {
      it(input, function () {
        var root = JSON.parse(input)
        var output = generateParsingProgram({
          root: root,
          expression: generateExpression(root),
          extraBytes: measureSize(root)[1]
        })
        expect(output).toEqual(expectedOutput)
      })
    }

    testDeserialization(
      "[]",
      "const size_t capacity = JSON_ARRAY_SIZE(0);\n" +
        "DynamicJsonBuffer jsonBuffer(capacity);\n\n" +
        'const char* json = "[]";\n\n' +
        "JsonArray& root = jsonBuffer.parseArray(json);\n"
    )

    testDeserialization(
      "{}",
      "const size_t capacity = JSON_OBJECT_SIZE(0);\n" +
        "DynamicJsonBuffer jsonBuffer(capacity);\n\n" +
        'const char* json = "{}";\n\n' +
        "JsonObject& root = jsonBuffer.parseObject(json);\n"
    )

    testDeserialization(
      "42",
      "const size_t capacity = 0 + 10;\n" +
        "DynamicJsonBuffer jsonBuffer(capacity);\n\n" +
        'const char* json = "42";\n\n' +
        "JsonVariant root = jsonBuffer.parse(json);"
    )

    testDeserialization(
      "[42]",
      "const size_t capacity = JSON_ARRAY_SIZE(1) + 10;\n" +
        "DynamicJsonBuffer jsonBuffer(capacity);\n\n" +
        'const char* json = "[42]";\n\n' +
        "JsonArray& root = jsonBuffer.parseArray(json);\n\n" +
        "int root_0 = root[0]; // 42\n"
    )

    testDeserialization(
      "[1,2,3]",
      "const size_t capacity = JSON_ARRAY_SIZE(3) + 10;\n" +
        "DynamicJsonBuffer jsonBuffer(capacity);\n\n" +
        'const char* json = "[1,2,3]";\n\n' +
        "JsonArray& root = jsonBuffer.parseArray(json);\n\n" +
        "int root_0 = root[0]; // 1\n" +
        "int root_1 = root[1]; // 2\n" +
        "int root_2 = root[2]; // 3\n"
    )

    testDeserialization(
      '{"hello":"world"}',
      "const size_t capacity = JSON_OBJECT_SIZE(1) + 20;\n" +
        "DynamicJsonBuffer jsonBuffer(capacity);\n\n" +
        'const char* json = "{\\"hello\\":\\"world\\"}";\n\n' +
        "JsonObject& root = jsonBuffer.parseObject(json);\n\n" +
        'const char* hello = root["hello"]; // "world"\n'
    )

    testDeserialization(
      "[[[[[[[[[[[]]]]]]]]]]]",
      "const size_t capacity = JSON_ARRAY_SIZE(0) + 10*JSON_ARRAY_SIZE(1);\n" +
        "DynamicJsonBuffer jsonBuffer(capacity);\n\n" +
        'const char* json = "[[[[[[[[[[[]]]]]]]]]]]";\n\n' +
        "JsonArray& root = jsonBuffer.parseArray(json, 11);\n"
    )
  })

  describe("SerializingProgram", function () {
    function testSerialization(input, expectedOutput) {
      it(input, function () {
        var root = JSON.parse(input)
        var output = generateSerializingProgram({
          root: root,
          expression: generateExpression(root)
        })
        expect(output).toEqual(expectedOutput)
      })
    }

    testSerialization(
      "[]",
      "const size_t capacity = JSON_ARRAY_SIZE(0);\n" +
        "DynamicJsonBuffer jsonBuffer(capacity);\n\n" +
        "JsonArray& root = jsonBuffer.createArray();\n\n" +
        "root.printTo(Serial);"
    )

    testSerialization(
      "{}",
      "const size_t capacity = JSON_OBJECT_SIZE(0);\n" +
        "DynamicJsonBuffer jsonBuffer(capacity);\n\n" +
        "JsonObject& root = jsonBuffer.createObject();\n\n" +
        "root.printTo(Serial);"
    )

    testSerialization(
      "[42]",
      "const size_t capacity = JSON_ARRAY_SIZE(1);\n" +
        "DynamicJsonBuffer jsonBuffer(capacity);\n\n" +
        "JsonArray& root = jsonBuffer.createArray();\n" +
        "root.add(42);\n\n" +
        "root.printTo(Serial);"
    )

    testSerialization(
      '["hello"]',
      "const size_t capacity = JSON_ARRAY_SIZE(1);\n" +
        "DynamicJsonBuffer jsonBuffer(capacity);\n\n" +
        "JsonArray& root = jsonBuffer.createArray();\n" +
        'root.add("hello");\n\n' +
        "root.printTo(Serial);"
    )

    testSerialization(
      '{"answer":42}',
      "const size_t capacity = JSON_OBJECT_SIZE(1);\n" +
        "DynamicJsonBuffer jsonBuffer(capacity);\n\n" +
        "JsonObject& root = jsonBuffer.createObject();\n" +
        'root["answer"] = 42;\n\n' +
        "root.printTo(Serial);"
    )

    testSerialization(
      '[{"answer":42}]',
      "const size_t capacity = JSON_ARRAY_SIZE(1) + JSON_OBJECT_SIZE(1);\n" +
        "DynamicJsonBuffer jsonBuffer(capacity);\n\n" +
        "JsonArray& root = jsonBuffer.createArray();\n" +
        "JsonObject& root_0 = root.createNestedObject();\n" +
        'root_0["answer"] = 42;\n\n' +
        "root.printTo(Serial);"
    )

    testSerialization(
      '{"answers":[42]}',
      "const size_t capacity = JSON_ARRAY_SIZE(1) + JSON_OBJECT_SIZE(1);\n" +
        "DynamicJsonBuffer jsonBuffer(capacity);\n\n" +
        "JsonObject& root = jsonBuffer.createObject();\n" +
        'JsonArray& answers = root.createNestedArray("answers");\n' +
        "answers.add(42);\n\n" +
        "root.printTo(Serial);"
    )

    testSerialization(
      '{"message":{"status":"ok"}}',
      "const size_t capacity = 2*JSON_OBJECT_SIZE(1);\n" +
        "DynamicJsonBuffer jsonBuffer(capacity);\n\n" +
        "JsonObject& root = jsonBuffer.createObject();\n" +
        'JsonObject& message = root.createNestedObject("message");\n' +
        'message["status"] = "ok";\n\n' +
        "root.printTo(Serial);"
    )

    testSerialization(
      "[[1,2],[3,4]]",
      "const size_t capacity = 3*JSON_ARRAY_SIZE(2);\n" +
        "DynamicJsonBuffer jsonBuffer(capacity);\n\n" +
        "JsonArray& root = jsonBuffer.createArray();\n\n" +
        "JsonArray& root_0 = root.createNestedArray();\n" +
        "root_0.add(1);\n" +
        "root_0.add(2);\n\n" +
        "JsonArray& root_1 = root.createNestedArray();\n" +
        "root_1.add(3);\n" +
        "root_1.add(4);\n\n" +
        "root.printTo(Serial);"
    )

    testSerialization(
      '{"A":{"B":{"C":"D"}}}',
      "const size_t capacity = 3*JSON_OBJECT_SIZE(1);\n" +
        "DynamicJsonBuffer jsonBuffer(capacity);\n\n" +
        "JsonObject& root = jsonBuffer.createObject();\n\n" +
        'JsonObject& A = root.createNestedObject("A");\n' +
        'JsonObject& A_B = A.createNestedObject("B");\n' +
        'A_B["C"] = "D";\n\n' +
        "root.printTo(Serial);"
    )

    testSerialization(
      "[[[42]]]",
      "const size_t capacity = 3*JSON_ARRAY_SIZE(1);\n" +
        "DynamicJsonBuffer jsonBuffer(capacity);\n\n" +
        "JsonArray& root = jsonBuffer.createArray();\n\n" +
        "JsonArray& root_0 = root.createNestedArray();\n" +
        "JsonArray& root_0_0 = root_0.createNestedArray();\n" +
        "root_0_0.add(42);\n\n" +
        "root.printTo(Serial);"
    )

    testSerialization(
      '{"hello world":[42]}',
      "const size_t capacity = JSON_ARRAY_SIZE(1) + JSON_OBJECT_SIZE(1);\n" +
        "DynamicJsonBuffer jsonBuffer(capacity);\n\n" +
        "JsonObject& root = jsonBuffer.createObject();\n" +
        'JsonArray& hello_world = root.createNestedArray("hello world");\n' +
        "hello_world.add(42);\n\n" +
        "root.printTo(Serial);"
    )
  })
})
