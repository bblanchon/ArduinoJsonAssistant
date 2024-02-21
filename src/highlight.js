import hljs from "highlight.js/lib/core";
import cpp from "highlight.js/lib/languages/cpp";

hljs.registerLanguage("cpp", (hljs) => {
  const lang = cpp(hljs);
  lang.keywords.type.push(
    "JsonArray",
    "JsonObject",
    "JsonVariant",
    "JsonDocument",
    "DeserializationError",
    "DeserializationOption",
  );
  return lang;
});

export default function (source) {
  return hljs.highlight(source, { language: "cpp" }).value;
}
