import {
  getValueType,
  canLoop,
  getCommonCppTypeFor,
  getCppTypeFor,
  measureNesting,
} from "./analyzer";
import {
  ProgramWriter,
  makeItemName,
  makeVariableName,
  stringifyValue,
} from "./programWriter";
import { writeCompositionCode } from "./serializingProgram";
import { applyFilter } from "./filter";

function extractValue(prg, cfg) {
  const value = cfg.value;
  const parent = cfg.parent;
  const variableName = cfg.name;

  switch (getValueType(value)) {
    case "array":
      prg.addEmptyLine();
      if (canLoop(value)) {
        const item = makeItemName(parent);
        prg.addLine(`for (JsonObject ${item} : ${parent}.as<JsonArray>()) {`);
        prg.indent();
        extractValue(prg, {
          value: value[0],
          parent: item,
          siblings: value,
        });
        prg.unindent();
        prg.addLine("}");
      } else {
        let arrayName = parent;
        if (value.length > 2 && parent.indexOf("[") >= 0) {
          arrayName = makeVariableName(variableName);
          prg.addLine(`JsonArray ${arrayName} = ${parent};`);
        }
        for (let i = 0; i < value.length; i++) {
          const elementExpression = `${arrayName}[${i}]`;
          extractValue(prg, {
            value: value[i],
            parent: elementExpression,
            name: makeVariableName(elementExpression),
            siblings: cfg.siblings?.map((x) => (x ? x[i] : null)),
          });
        }
      }
      prg.addEmptyLine();
      break;

    case "object":
      prg.addEmptyLine();
      if (canLoop(value)) {
        const item = makeItemName(parent);
        prg.addLine(`for (JsonPair ${item} : ${parent}.as<JsonObject>()) {`);
        prg.indent();
        extractValue(prg, {
          value: Object.keys(value)[0],
          name: item + "_key",
          parent: item + ".key().c_str()",
          siblings: Object.keys(value),
        });
        extractValue(prg, {
          value: Object.values(value)[0],
          parent: item + ".value()",
          siblings: Object.values(value),
        });
        prg.unindent();
        prg.addLine("}");
      } else {
        let objName = parent;
        if (variableName && Object.keys(value).length > 2) {
          objName = makeVariableName(variableName);
          prg.addLine(`JsonObject ${objName} = ${parent};`);
        }
        for (const key in value) {
          const memberExpression = `${objName}["${key}"]`;
          extractValue(prg, {
            value: value[key],
            parent: memberExpression,
            name: makeVariableName(memberExpression),
            siblings: cfg.siblings?.map((x) => (x ? x[key] : null)),
          });
        }
      }
      prg.addEmptyLine();
      break;

    default: {
      const siblings = cfg.siblings || [value];
      const type = getCommonCppTypeFor(siblings);
      if (type) {
        const statement = `${type} ${variableName} = ${parent};`;
        let comment = siblings
          .map((value) => stringifyValue(type, value))
          .join(", ");
        if (statement.length + comment.length > 100) {
          const spaceIndex = comment.lastIndexOf(" ", 100 - statement.length);
          if (spaceIndex > 0) {
            comment = comment.slice(0, spaceIndex + 1) + "...";
          } else {
            comment = null;
          }
        }
        if (comment) prg.addLine(`${statement} // ${comment}`);
        else prg.addLine(statement);
      } else {
        prg.addLine(`// ${parent} is null`);
      }
      break;
    }
  }
}

export function writeDecompositionCode(prg, root) {
  switch (typeof root) {
    case "object":
      return extractValue(prg, {
        value: root,
        parent: "doc",
      });
    default: {
      const t = getCppTypeFor(root);
      prg.addLine(t, " root = doc.as<", t, ">(); // ", JSON.stringify(root));
      break;
    }
  }
}

export function writeDeserializationCode(prg, cfg) {
  switch (cfg.inputType) {
    case "charPtr":
      prg.addLine("// char* input;");
      prg.addLine("// size_t inputLength; (optional)");
      break;

    case "constCharPtr":
      prg.addLine("// const char* input;");
      prg.addLine("// size_t inputLength; (optional)");
      break;

    case "charArray":
      prg.addLine("// char input[MAX_INPUT_LENGTH];");
      break;

    case "arduinoString":
      prg.addLine("// String input;");
      break;

    case "arduinoStream":
      prg.addLine("// Stream& input;");
      break;

    case "stdStream":
      prg.addLine("// std::istream& input;");
      break;

    case "stdString":
      prg.addLine("// std::string input;");
      break;
  }
  prg.addEmptyLine();

  const filter = cfg.filter;
  if (filter) {
    prg.addLine("JsonDocument filter;");
    writeCompositionCode(prg, filter, "filter");
    prg.addEmptyLine();
  }

  prg.addLine("JsonDocument doc;");

  const args = ["doc", "input"];

  switch (cfg.inputType) {
    case "charPtr":
    case "constCharPtr":
      args.push("inputLength");
      break;
    case "charArray":
      args.push("MAX_INPUT_LENGTH");
      break;
  }

  if (filter) args.push("DeserializationOption::Filter(filter)");

  const nesting = measureNesting(cfg.root);
  if (nesting > cfg.cpu.nestingLimit)
    args.push(`DeserializationOption::NestingLimit(${nesting})`);

  prg.addEmptyLine();
  prg.addLine(
    `DeserializationError error = deserializeJson(${args.join(", ")});`,
  );
}

export function writeErrorCheckingCode(prg, cfg) {
  prg.addLine(`if (error) {`);
  prg.indent();
  if (cfg.cpu.serial && cfg.cpu.progmem) {
    prg.addLine('Serial.print(F("deserializeJson() failed: "));');
    prg.addLine("Serial.println(error.f_str());");
  } else if (cfg.cpu.serial) {
    prg.addLine('Serial.print("deserializeJson() failed: ");');
    prg.addLine("Serial.println(error.c_str());");
  } else {
    prg.addLine(
      'std::cerr << "deserializeJson() failed: " << error.c_str() << std::endl;',
    );
  }
  prg.addLine("return;");
  prg.unindent();
  prg.addLine("}");
}

export function generateParsingProgram(cfg) {
  const prg = new ProgramWriter();

  writeDeserializationCode(prg, cfg);
  prg.addEmptyLine();
  writeErrorCheckingCode(prg, cfg);
  prg.addEmptyLine();

  const root = cfg.filter ? applyFilter(cfg.root, cfg.filter) : cfg.root;
  writeDecompositionCode(prg, root);

  return prg.toString();
}
