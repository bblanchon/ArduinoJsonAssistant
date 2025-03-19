import type { JsonValue } from "./json";

export class ProgramWriter {
  private lines: string[] = [];
  private indentation: string = "";

  addLine(line: string = "") {
    if (line) {
      this.lines.push(this.indentation + line);
    } else if (
      this.lines.length > 0 &&
      this.lines[this.lines.length - 1] != ""
    ) {
      // Add an empty line if the last line is not empty
      this.lines.push("");
    }
  }

  indent() {
    this.indentation += "  ";
  }

  unindent() {
    this.indentation = this.indentation.slice(0, -2);
  }

  toString() {
    return this.lines.join("\n");
  }
}

const reservedWords = [
  "alignas",
  "alignof",
  "and",
  "and_eq",
  "asm",
  "atomic_cancel",
  "atomic_commit",
  "atomic_noexcept",
  "auto",
  "bitand",
  "bitor",
  "bool",
  "break",
  "case",
  "catch",
  "char",
  "char8_t",
  "char16_t",
  "char32_t",
  "class",
  "compl",
  "concept",
  "const",
  "consteval",
  "constexpr",
  "constinit",
  "const_cast",
  "continue",
  "co_await",
  "co_return",
  "co_yield",
  "decltype",
  "default",
  "delete",
  "do",
  "double",
  "dynamic_cast",
  "else",
  "enum",
  "explicit",
  "export",
  "extern",
  "false",
  "float",
  "for",
  "friend",
  "goto",
  "if",
  "inline",
  "int",
  "long",
  "mutable",
  "namespace",
  "new",
  "noexcept",
  "not",
  "not_eq",
  "nullptr",
  "operator",
  "or",
  "or_eq",
  "private",
  "protected",
  "public",
  "reflexpr",
  "register",
  "reinterpret_cast",
  "requires",
  "return",
  "short",
  "signed",
  "sizeof",
  "static",
  "static_assert",
  "static_cast",
  "struct",
  "switch",
  "synchronized",
  "template",
  "this",
  "thread_local",
  "throw",
  "true",
  "try",
  "typedef",
  "typeid",
  "typename",
  "union",
  "unsigned",
  "using",
  "virtual",
  "void",
  "volatile",
  "wchar_t",
  "while",
  "xor",
  "xor_eq",
];

export function stripHtml(html: string) {
  return html
    .replace(/<[^>]*>?/gi, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export function makeVariableName(expression: string) {
  let variable = stripHtml(expression)
    .replace(/F\("([^"]+)"\)]/g, "$1")
    .replace(/["\]]/g, "")
    .replace(/[^a-z0-9]+/gi, "_")
    .replace(/^doc_(?=\d)/, "root_")
    .replace(/^doc_/, "")
    .replace(/^item_/, "");
  if (reservedWords.includes(variable)) variable += "_";
  return variable;
}

export function makeItemName(expression: string) {
  return makeVariableName(expression + "_item")
    .replace(/hildren_item$/, "hild")
    .replace(/ies_item$/, "y")
    .replace(/s_item$/, "");
}

export function stringifyValue(type: string, value: JsonValue) {
  const numberTypes = ["int", "long", "long long", "float", "double"];
  if (!value && numberTypes.includes(type)) return "0";
  if (!value && type.endsWith("*")) return "nullptr";
  return JSON.stringify(value);
}
