export class ProgramWriter {
  constructor() {
    this.lines = [];
    this.depth = 1;
  }

  addLine() {
    const args = Array.prototype.slice.call(arguments);
    const line = args.join("");
    this.lines.push(Array(this.depth).join("  ") + line);
  }

  addEmptyLine() {
    if (this.lines.length > 0 && this.lines[this.lines.length - 1] != "")
      this.lines.push("");
  }

  indent() {
    this.depth++;
  }

  unindent() {
    this.depth--;
  }

  toString() {
    return this.lines.join("\n");
  }
}

export function sanitizeName(name) {
  return name.replace(/[^a-z0-9]+/gi, "_");
}

export function makeVariableName(expression) {
  return expression
    .replace(/F\("([^"]+)"\)]/g, "$1")
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
