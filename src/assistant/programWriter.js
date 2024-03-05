export function ProgramWriter() {
  var lines = []
  var indent = 1

  this.addLine = function (line) {
    if (line instanceof Array) {
      for (var i = 0; i < line.length; i++) {
        lines.push(Array(indent).join(" ") + line[i])
      }
    } else lines.push(Array(indent).join(" ") + line)
  }

  this.addEmptyLine = function () {
    if (lines.length > 0 && lines[lines.length - 1] != "") lines.push("")
  }

  this.indent = function () {
    indent++
  }

  this.unindent = function () {
    indent--
  }

  this.toString = function () {
    return lines.join("\n")
  }
}

export function sanitizeName(name) {
  return name.replace(/[^a-z0-9]+/gi, "_")
}

export function makeVariableName(prefix, suffix) {
  if (
    typeof suffix == "number" ||
    (suffix && suffix[0] >= "0" && suffix[0] <= "9")
  ) {
    if (prefix) return prefix + "_" + suffix
    else return "root_" + suffix
  }
  if (prefix === undefined || suffix === undefined)
    return prefix || suffix || "root"
  return prefix + "_" + suffix
}

export function getCppTypeFor(value) {
  switch (typeof value) {
    case "string":
      return "const char*"

    case "number":
      if (value % 1 !== 0) return "float"
      else if (value < 32000 && value > -32000) return "int"
      else if (value < 2000000000 && value > -2000000000) return "long"
      return "long long"

    case "boolean":
      return "bool"
  }
}
