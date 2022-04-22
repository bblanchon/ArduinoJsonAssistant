export function ProgramWriter() {
  const lines = [];
  let indent = 1;

  this.addLine = function () {
    const args = Array.prototype.slice.call(arguments);
    const line = args.join("");
    lines.push(Array(indent).join("  ") + line);
  };

  this.addEmptyLine = function () {
    if (lines.length > 0 && lines[lines.length - 1] != "") lines.push("");
  };

  this.indent = function () {
    indent++;
  };

  this.unindent = function () {
    indent--;
  };

  this.toString = function () {
    return lines.join("\n");
  };
}

export function sanitizeName(name) {
  return name.replace(/[^a-z0-9]+/gi, "_");
}

export function makeVariableName(expression) {
  return expression
    .replace(/["\]]/g, "")
    .replace(/[^a-z0-9]+/gi, "_")
    .replace(/^doc_(?=\d)/, "root_")
    .replace(/^doc_/, "")
    .replace(/^item_/, "");
}

export function makeItemName(expression) {
  return makeVariableName(expression + "_item")
    .replace(/hildren_item$/, "hild")
    .replace(/ies_item$/, "y")
    .replace(/s_item$/, "");
}

export function stringifyValue(type, value) {
  const numberTypes = ["int", "long", "long long", "float", "double"];
  if (!value && numberTypes.includes(type)) return "0";
  if (!value && type.endsWith("*")) return "nullptr";
  return JSON.stringify(value);
}
