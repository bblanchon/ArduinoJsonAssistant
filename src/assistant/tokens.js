export const tokens = {
  comment(value) {
    return `<span class="hl-comment">// ${value}</span>`;
  },
  type(value, href) {
    if (href) return `<a href="${href}" class="hl-type">${value}</a>`;
    else return `<span class="hl-type">${value}</span>`;
  },
  function(value, href) {
    if (href) return `<a href="${href}" class="hl-function">${value}</a>`;
    else return `<span class="hl-function">${value}</span>`;
  },
  builtin(value, href) {
    if (href) return `<a href="${href}" class="hl-built_in">${value}</a>`;
    else return `<span class="hl-built_in">${value}</span>`;
  },
  macro(value, href) {
    if (href) return `<a href="${href}" class="hl-built_in">${value}</a>`;
    else return `<span class="hl-built_in">${value}</span>`;
  },
  keyword: (value) => `<span class="hl-keyword">${value}</span>`,
  variable: (value) => `<span class="hl-variable">${value}</span>`,
};

export const keywords = {
  for: tokens.keyword("for"),
  if: tokens.keyword("if"),
  return: tokens.keyword("return"),
  nullptr: tokens.keyword("nullptr"),
  define: '<span class="hl-meta-keyword">#define</span>',
  include: '<span class="hl-meta-keyword">#include</span>',
};

export const literals = {
  bool: (value) =>
    `<span class="hl-literal">${value ? "true" : "false"}</span>`,
  string: (value) => `<span class="hl-string">"${value}"</span>`,
  number: (value) => `<span class="hl-number">${value}</span>`,
};

export const types = {
  String: tokens.type(
    "String",
    "https://www.arduino.cc/reference/en/language/variables/data-types/stringobject/",
  ),
  JsonObject: tokens.type(
    "JsonObject",
    "https://arduinojson.org/v7/api/jsonobject/",
  ),
  DeserializationError: tokens.type(
    "DeserializationError",
    "https://arduinojson.org/v7/api/misc/deserializationerror/",
  ),
  JsonArray: tokens.type(
    "JsonArray",
    "https://arduinojson.org/v7/api/jsonarray/",
  ),
  JsonDocument: tokens.type(
    "JsonDocument",
    "https://arduinojson.org/v7/api/jsondocument/",
  ),
  JsonPair: tokens.type(
    "JsonPair",
    "https://arduinojson.org/v7/api/jsonobject/begin_end/#return-value",
  ),
  std: {
    string: tokens.type(
      "std::string",
      "https://en.cppreference.com/w/cpp/string/basic_string",
    ),
  },
};

export const globals = {
  std: {
    cerr: tokens.builtin(
      "std::cerr",
      "https://en.cppreference.com/w/cpp/io/cerr",
    ),
    endl: tokens.builtin(
      "std::endl",
      "https://en.cppreference.com/w/cpp/io/manip/endl",
    ),
  },
};

export const functions = {
  deserializeJson: tokens.function(
    "deserializeJson",
    "https://arduinojson.org/v7/api/json/deserializejson/",
  ),
  Serial: {
    print:
      tokens.builtin(
        "Serial",
        "https://www.arduino.cc/reference/en/language/functions/communication/serial/",
      ) +
      "." +
      tokens.builtin(
        "print",
        "https://www.arduino.cc/reference/en/language/functions/communication/serial/print/",
      ),
    println:
      tokens.builtin(
        "Serial",
        "https://www.arduino.cc/reference/en/language/functions/communication/serial/",
      ) +
      "." +
      tokens.builtin(
        "println",
        "https://www.arduino.cc/reference/en/language/functions/communication/serial/println/",
      ),
  },
  DeserializationOption: {
    NestingLimit:
      tokens.type("DeserializationOption") +
      "::" +
      tokens.builtin(
        "NestingLimit",
        "https://arduinojson.org/v7/api/json/deserializejson/#nesting-limit",
      ),
    Filter:
      tokens.type("DeserializationOption") +
      "::" +
      tokens.builtin(
        "Filter",
        "https://arduinojson.org/v7/api/json/deserializejson/#filtering",
      ),
  },
  JsonArray: {
    add: tokens.builtin("add", "https://arduinojson.org/v7/api/jsonarray/add/"),
  },
  JsonDocument: {
    add: tokens.builtin(
      "add",
      "https://arduinojson.org/v7/api/jsondocument/add/",
    ),
    as: tokens.builtin("as", "https://arduinojson.org/v7/api/jsondocument/as/"),
    set: tokens.builtin(
      "set",
      "https://arduinojson.org/v7/api/jsondocument/set/",
    ),
    shrinkToFit: tokens.builtin(
      "shrinkToFit",
      "https://arduinojson.org/v7/api/jsondocument/shrinktofit/",
    ),
    to: tokens.builtin("to", "https://arduinojson.org/v7/api/jsondocument/to/"),
  },
  JsonVariant: {
    as: tokens.builtin("as", "https://arduinojson.org/v7/api/jsonvariant/as/"),
    set: tokens.builtin(
      "set",
      "https://arduinojson.org/v7/api/jsonvariant/set/",
    ),
    to: tokens.builtin("to", "https://arduinojson.org/v7/api/jsonvariant/to/"),
  },
  serializeJson: tokens.builtin(
    "serializeJson",
    "https://arduinojson.org/v7/api/json/serializejson/",
  ),
};

export const macros = {
  ARDUINOJSON_SLOT_ID_SIZE: tokens.macro(
    "ARDUINOJSON_SLOT_ID_SIZE",
    "https://arduinojson.org/v7/config/slot_id_size/",
  ),
  ARDUINOJSON_STRING_LENGTH_SIZE: tokens.macro(
    "ARDUINOJSON_STRING_LENGTH_SIZE",
    "https://arduinojson.org/v7/config/string_length_size/",
  ),
  ARDUINOJSON_USE_DOUBLE: tokens.macro(
    "ARDUINOJSON_USE_DOUBLE",
    "https://arduinojson.org/v7/config/use_double/",
  ),
  ARDUINOJSON_USE_LONG_LONG: tokens.macro(
    "ARDUINOJSON_USE_LONG_LONG",
    "https://arduinojson.org/v7/config/use_long_long/",
  ),
  F: tokens.macro(
    "F",
    "https://www.arduino.cc/reference/en/language/variables/utilities/progmem",
  ),
};
