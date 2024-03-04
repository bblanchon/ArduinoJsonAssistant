import {
  getValueType,
  canLoop,
  getCommonCppTypeFor,
  getCppTypeFor,
} from "./analyzer";
import {
  ProgramWriter,
  makeItemName,
  makeVariableName,
  stringifyValue,
  stripHtml,
} from "./programWriter";
import {
  keywords,
  types,
  literals,
  tokens,
  functions,
  macros,
  globals,
} from "./tokens";
import { writeCompositionCode } from "./serializingProgram";
import { applyFilter } from "./filter";

function extractValue(prg, cfg) {
  const value = cfg.value;
  const parent = cfg.parent;
  const variableName = cfg.name;

  const asFunction =
    stripHtml(parent) == "doc"
      ? functions.JsonDocument.as
      : functions.JsonVariant.as;

  switch (getValueType(value)) {
    case "array":
      prg.addEmptyLine();
      if (canLoop(value)) {
        const item = tokens.variable(makeItemName(parent));
        prg.addLine(
          `${keywords.for} (${types.JsonObject} ${item} : ${parent}.${asFunction}&lt;${types.JsonArray}&gt;()) {`,
        );
        prg.indent();
        extractValue(prg, {
          value: value[0],
          parent: item,
          siblings: value,
          progmem: cfg.progmem,
        });
        prg.unindent();
        prg.addLine("}");
      } else {
        let arrayName = parent;
        if (value.length > 2 && parent.indexOf("[") >= 0) {
          arrayName = tokens.variable(makeVariableName(variableName));
          prg.addLine(`${types.JsonArray} ${arrayName} = ${parent};`);
        }
        for (let i = 0; i < value.length; i++) {
          const elementExpression = `${arrayName}[${literals.number(i)}]`;
          extractValue(prg, {
            value: value[i],
            parent: elementExpression,
            name: makeVariableName(elementExpression),
            siblings: cfg.siblings?.map((x) => (x ? x[i] : null)),
            progmem: cfg.progmem,
          });
        }
      }
      prg.addEmptyLine();
      break;

    case "object":
      prg.addEmptyLine();
      if (canLoop(value)) {
        const item = makeItemName(parent);
        prg.addLine(
          `${keywords.for} (${types.JsonPair} ${tokens.variable(item)} : ${parent}.${asFunction}&lt;${types.JsonObject}&gt;()) {`,
        );
        prg.indent();
        extractValue(prg, {
          value: Object.keys(value)[0],
          name: tokens.variable(item + "_key"),
          parent: tokens.variable(item) + ".key().c_str()",
          siblings: Object.keys(value),
          progmem: cfg.progmem,
        });
        extractValue(prg, {
          value: Object.values(value)[0],
          parent: tokens.variable(item) + ".value()",
          siblings: Object.values(value),
          progmem: cfg.progmem,
        });
        prg.unindent();
        prg.addLine("}");
      } else {
        let objName = parent;
        if (variableName && Object.keys(value).length > 2) {
          objName = tokens.variable(makeVariableName(variableName));
          prg.addLine(`${types.JsonObject} ${objName} = ${parent};`);
        }
        for (const key in value) {
          const memberExpression = cfg.progmem
            ? `${objName}[${macros.F}(${literals.string(key)})]`
            : `${objName}[${literals.string(key)}]`;
          extractValue(prg, {
            value: value[key],
            parent: memberExpression,
            name: makeVariableName(memberExpression),
            siblings: cfg.siblings?.map((x) => (x ? x[key] : null)),
            progmem: cfg.progmem,
          });
        }
      }
      prg.addEmptyLine();
      break;

    default: {
      const siblings = cfg.siblings || [value];
      const type = getCommonCppTypeFor(siblings);
      if (type) {
        const statement = `${tokens.type(type)} ${tokens.variable(variableName)} = ${parent};`;
        let comment = siblings
          .map((value) => stringifyValue(type, value))
          .join(", ");
        const lineLength = stripHtml(statement).length;
        if (lineLength + comment.length > 100) {
          const spaceIndex = comment.lastIndexOf(" ", 100 - lineLength);
          if (spaceIndex > 0) {
            comment = comment.slice(0, spaceIndex + 1) + "...";
          } else {
            comment = null;
          }
        }
        if (comment) prg.addLine(`${statement} ${tokens.comment(comment)}`);
        else prg.addLine(statement);
      } else {
        prg.addLine(tokens.comment(`${parent} is null`));
      }
      break;
    }
  }
}

export function writeDecompositionCode(prg, input, cfg = {}) {
  switch (typeof input) {
    case "object":
      return extractValue(prg, {
        ...cfg,
        value: input,
        parent: tokens.variable("doc"),
      });
    default: {
      const t = getCppTypeFor(input);
      prg.addLine(
        `${tokens.type(t)} ${tokens.variable("root")} = ${tokens.variable("doc")}.${functions.JsonDocument.as}&lt;${tokens.type(t)}&gt;(); ${tokens.comment(JSON.stringify(input))}`,
      );
      break;
    }
  }
}

export function writeDeserializationCode(prg, cfg) {
  switch (cfg.inputType) {
    case "charPtr":
      prg.addLine(tokens.comment("const char* input;"));
      prg.addLine(tokens.comment("size_t inputLength; (optional)"));
      break;

    case "charArray":
      prg.addLine(tokens.comment("char input[MAX_INPUT_LENGTH];"));
      break;

    case "arduinoString":
      prg.addLine(tokens.comment("String input;"));
      break;

    case "arduinoStream":
      prg.addLine(tokens.comment("Stream& input;"));
      break;

    case "stdStream":
      prg.addLine(tokens.comment("std::istream& input;"));
      break;

    case "stdString":
      prg.addLine(tokens.comment("std::string input;"));
      break;
  }
  prg.addEmptyLine();

  const filter = cfg.filter;
  if (filter) {
    prg.addLine(`${types.JsonDocument} ${tokens.variable("filter")};`);
    writeCompositionCode(prg, { value: filter, name: "filter" });
    prg.addEmptyLine();
  }

  prg.addLine(`${types.JsonDocument} ${tokens.variable("doc")};`);

  const args = [tokens.variable("doc"), tokens.variable("input")];

  switch (cfg.inputType) {
    case "charPtr":
      args.push(tokens.variable("inputLength"));
      break;
    case "charArray":
      args.push(tokens.macro("MAX_INPUT_LENGTH"));
      break;
  }

  if (filter)
    args.push(
      `${functions.DeserializationOption.Filter}(${tokens.variable("filter")})`,
    );

  if (cfg.nestingLimit)
    args.push(
      `${functions.DeserializationOption.NestingLimit}(${literals.number(cfg.nestingLimit)})`,
    );

  prg.addEmptyLine();
  prg.addLine(
    `${types.DeserializationError} ${tokens.variable("error")} = ${functions.deserializeJson}(${args.join(", ")});`,
  );
}

export function writeErrorCheckingCode(prg, cfg) {
  prg.addLine(`${keywords.if} (${tokens.variable("error")}) {`);
  prg.indent();
  if (cfg.serial && cfg.progmem) {
    prg.addLine(
      `${functions.Serial.print}(${macros.F}(${literals.string("deserializeJson() failed: ")}));`,
    );
    prg.addLine(
      `${functions.Serial.println}(${tokens.variable("error")}.f_str());`,
    );
  } else if (cfg.serial) {
    prg.addLine(
      `${functions.Serial.print}(${literals.string("deserializeJson() failed: ")});`,
    );
    prg.addLine(
      `${functions.Serial.println}(${tokens.variable("error")}.c_str());`,
    );
  } else {
    prg.addLine(
      `${globals.std.cerr} &lt;&lt; ${literals.string("deserializeJson() failed: ")} &lt;&lt; ${tokens.variable("error")}.c_str() &lt;&lt; ${globals.std.endl};`,
    );
  }
  prg.addLine(`${keywords.return};`);
  prg.unindent();
  prg.addLine("}");
}

export function generateParsingProgram(cfg) {
  const prg = new ProgramWriter();

  writeDeserializationCode(prg, cfg);
  prg.addEmptyLine();
  writeErrorCheckingCode(prg, cfg);
  prg.addEmptyLine();

  const filteredInput = cfg.filter
    ? applyFilter(cfg.input, cfg.filter)
    : cfg.input;
  writeDecompositionCode(prg, filteredInput, cfg);

  return prg.toString();
}
