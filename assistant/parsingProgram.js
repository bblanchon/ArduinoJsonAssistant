import {
  makeVariableName,
  sanitizeName,
  getCppTypeFor,
  ProgramWriter
} from "./programWriter"

function ParsingProgram() {
  var _root, _sizeExpression, _extraBytes

  function extractValue(prg, value, valueText, prefix) {
    if (value instanceof Array) {
      prg.addEmptyLine()
      if (value.length > 2 && valueText.indexOf("[") >= 0) {
        var arrayName = makeVariableName(prefix)
        prg.addLine("JsonArray& " + arrayName + " = " + valueText + ";")
        for (var i = 0; i < value.length; i++) {
          extractValue(
            prg,
            value[i],
            arrayName + "[" + i + "]",
            makeVariableName(prefix, i)
          )
        }
      } else {
        for (var i = 0; i < value.length; i++) {
          extractValue(
            prg,
            value[i],
            valueText + "[" + i + "]",
            makeVariableName(prefix, i)
          )
        }
      }
      prg.addEmptyLine()
    } else if (value instanceof Object) {
      prg.addEmptyLine()
      if (prefix && Object.keys(value).length > 2) {
        var objName = makeVariableName(prefix)
        prg.addLine("JsonObject& " + objName + " = " + valueText + ";")
        for (var key in value) {
          extractValue(
            prg,
            value[key],
            objName + '["' + key + '"]',
            makeVariableName(prefix, sanitizeName(key))
          )
        }
      } else {
        for (var key in value) {
          extractValue(
            prg,
            value[key],
            valueText + '["' + key + '"]',
            makeVariableName(prefix, sanitizeName(key))
          )
        }
      }
      prg.addEmptyLine()
    } else {
      var type = getCppTypeFor(value)
      if (type)
        prg.addLine(
          type +
            " " +
            prefix +
            " = " +
            valueText +
            "; // " +
            JSON.stringify(value)
        )
    }
  }

  function measureNesting(obj) {
    if (obj instanceof Object === false) return 0
    var innerNesting = 0
    for (var key in obj) {
      innerNesting = Math.max(innerNesting, measureNesting(obj[key]))
    }
    return 1 + innerNesting
  }

  this.setInput = function (root) {
    _root = root
  }

  this.setSize = function (expression, extra) {
    _sizeExpression = expression
    _extraBytes = extra
  }

  this.toString = function () {
    var prg = new ProgramWriter()
    var nesting = measureNesting(_root)

    var sizeExpression = _sizeExpression
    if (_extraBytes) {
      sizeExpression += " + " + Math.ceil(_extraBytes / 9) * 10
    }
    prg.addLine("const size_t capacity = " + sizeExpression + ";")
    prg.addLine("DynamicJsonBuffer jsonBuffer(capacity);")
    prg.addEmptyLine()
    prg.addLine(
      'const char* json = "' + JSON.stringify(_root).replace(/"/g, '\\"') + '";'
    )
    prg.addEmptyLine()
    var argsToParse = "json"
    if (nesting > 10) argsToParse = argsToParse + ", " + nesting
    if (_root instanceof Array) {
      if (nesting > 10)
        prg.addLine(
          "JsonArray& root = jsonBuffer.parseArray(json, " + nesting + ");"
        )
      else prg.addLine("JsonArray& root = jsonBuffer.parseArray(json);")
      extractValue(prg, _root, "root")
    } else if (_root instanceof Object) {
      if (nesting > 10)
        prg.addLine(
          "JsonObject& root = jsonBuffer.parseObject(json, " + nesting + ");"
        )
      else prg.addLine("JsonObject& root = jsonBuffer.parseObject(json);")
      extractValue(prg, _root, "root")
    } else {
      if (nesting > 10)
        prg.addLine(
          "JsonVariant root = jsonBuffer.parse(json, " + nesting + ");"
        )
      else prg.addLine("JsonVariant root = jsonBuffer.parse(json);")
    }

    return prg.toString()
  }
}

export function generateParsingProgram(cfg) {
  var parser = new ParsingProgram()
  parser.setInput(cfg.root)
  parser.setSize(cfg.expression, cfg.extraBytes)
  return parser.toString()
}
