import { getCommonCppTypeFor } from "./cpptypes";
import { applyFilter } from "./filter";
import {
  isJsonArray,
  isJsonObject,
  type JsonArray,
  type JsonObject,
  type JsonValue,
} from "./json";
import { canLoop } from "./loops";
import {
  ProgramWriter,
  makeItemName,
  makeVariableName,
  stringifyValue,
  stripHtml,
} from "./programWriter";
import { writeCompositionCode } from "./serializingProgram";
import { functions, globals, keywords, literals, tokens } from "./tokens";

interface VariableContext {
  parent?: string;
  name?: string;
  siblings?: JsonValue[] | undefined;
}

interface DecompositionCodeConfig {
  auto?: boolean;
  progmem?: boolean;
}

class DecompositionCodeBuilder {
  private prg: ProgramWriter;
  private cfg: DecompositionCodeConfig;

  constructor(prg: ProgramWriter, cfg: DecompositionCodeConfig) {
    this.prg = prg;
    this.cfg = cfg;
  }

  private addLine(line: string = "") {
    this.prg.addLine(line);
  }

  private indent() {
    this.prg.indent();
  }

  private unindent() {
    this.prg.unindent();
  }

  extractValue(value: JsonValue, ctx: VariableContext = {}) {
    if (isJsonArray(value)) {
      this.extractArray(value, ctx);
    } else if (isJsonObject(value)) {
      this.extractObject(value, ctx);
    } else {
      this.extractSimpleValue(value, ctx);
    }
  }

  private declaration(
    type: string,
    name: string,
    expr: string,
    ctx: VariableContext,
  ) {
    const dotAsType = !ctx.parent
      ? `.${functions.JsonDocument.as}&lt;${tokens.type(type)}&gt;()`
      : this.cfg.auto
        ? `.${functions.JsonVariant.as}&lt;${tokens.type(type)}&gt;()`
        : "";
    return `${tokens.type(type, this.cfg.auto)} ${tokens.variable(name)} = ${expr}${dotAsType};`;
  }

  private extractArray(value: JsonArray, ctx: VariableContext) {
    const parent = ctx.parent ?? tokens.variable("doc");
    const variableName = ctx.name ?? "";

    const asFunction = ctx.parent
      ? functions.JsonVariant.as
      : functions.JsonDocument.as;

    this.addLine();
    if (canLoop(value)) {
      const item = tokens.variable(makeItemName(parent));
      this.addLine(
        `${keywords.for} (${tokens.type("JsonObject")} ${item} : ${parent}.${asFunction}&lt;${tokens.type("JsonArray")}&gt;()) {`,
      );
      this.indent();
      this.extractValue(value[0]!, {
        parent: item,
        siblings: value,
      });
      this.unindent();
      this.addLine("}");
    } else {
      let arrayName = parent;
      if (value.length > 2 && parent.indexOf("[") >= 0) {
        const varName = makeVariableName(variableName);
        this.addLine(this.declaration("JsonArray", varName, parent, ctx));
        arrayName = varName;
      }
      for (let i = 0; i < value.length; i++) {
        const elementExpression = `${arrayName}[${literals.number(i)}]`;
        this.extractValue(value[i]!, {
          parent: elementExpression,
          name: makeVariableName(elementExpression),
          siblings: ctx.siblings?.map((x) => (isJsonArray(x) ? x[i]! : null)),
        });
      }
    }
    this.addLine();
  }

  private extractObject(value: JsonObject, ctx: VariableContext) {
    const parent = ctx.parent ?? tokens.variable("doc");

    const asFunction = ctx.parent
      ? functions.JsonVariant.as
      : functions.JsonDocument.as;

    this.addLine();
    if (canLoop(value)) {
      const item = makeItemName(parent);
      this.addLine(
        `${keywords.for} (${tokens.type("JsonPair")} ${tokens.variable(item)} : ${parent}.${asFunction}&lt;${tokens.type("JsonObject")}&gt;()) {`,
      );
      this.indent();
      this.extractValue(Object.keys(value)[0]!, {
        name: tokens.variable(item + "_key"),
        parent: tokens.variable(item) + ".key().c_str()",
        siblings: Object.keys(value),
      });
      this.extractValue(Object.values(value)[0]!, {
        parent: tokens.variable(item) + ".value()",
        siblings: Object.values(value),
      });
      this.unindent();
      this.addLine("}");
    } else {
      let objName = parent;
      if (ctx.name && Object.keys(value).length > 2) {
        const varName = makeVariableName(ctx.name);
        this.addLine(this.declaration("JsonObject", varName, parent, ctx));
        objName = tokens.variable(varName);
      }
      for (const key in value) {
        const memberExpression = `${objName}[${literals.string(key, this.cfg.progmem)}]`;
        this.extractValue(value[key]!, {
          parent: memberExpression,
          name: makeVariableName(memberExpression),
          siblings: ctx.siblings?.map((x) =>
            isJsonObject(x) ? x[key]! : null,
          ),
        });
      }
    }
    this.addLine();
  }

  private extractSimpleValue(
    value: string | number | boolean | null,
    ctx: VariableContext,
  ) {
    const variableName = ctx.name ?? "root";
    const siblings = ctx.siblings || [value];
    const variableType = getCommonCppTypeFor(siblings);

    if (!variableType)
      return this.addLine(tokens.comment(`${ctx.parent ?? "doc"} is null`));

    const statement = this.declaration(
      variableType,
      variableName,
      ctx.parent ?? tokens.variable("doc"),
      ctx,
    );
    let comment: string | null = siblings
      .map((value) => stringifyValue(variableType, value))
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
    if (comment) this.addLine(`${statement} ${tokens.comment(comment)}`);
    else this.addLine(statement);
  }
}

export interface ParsingProgramConfig extends DecompositionCodeConfig {
  input?: JsonValue;
  inputType?: string;
  filter?: JsonValue | undefined;
  nestingLimit?: number | undefined;
  serial?: boolean | undefined;
}

export function writeDecompositionCode(
  prg: ProgramWriter,
  input: JsonValue,
  cfg: ParsingProgramConfig = {},
) {
  return new DecompositionCodeBuilder(prg, cfg).extractValue(input);
}

export function writeDeserializationCode(
  prg: ProgramWriter,
  cfg: ParsingProgramConfig,
) {
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
  prg.addLine();

  const filter = cfg.filter;
  if (filter) {
    prg.addLine(`${tokens.type("JsonDocument")} ${tokens.variable("filter")};`);
    writeCompositionCode(prg, { value: filter, name: "filter" }, cfg);
    prg.addLine();
  }

  prg.addLine(`${tokens.type("JsonDocument")} ${tokens.variable("doc")};`);

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

  prg.addLine();
  prg.addLine(
    `${tokens.type("DeserializationError", cfg.auto)} ${tokens.variable("error")} = ${functions.deserializeJson}(${args.join(", ")});`,
  );
}

export function writeErrorCheckingCode(
  prg: ProgramWriter,
  cfg: ParsingProgramConfig,
) {
  prg.addLine(`${keywords.if} (${tokens.variable("error")}) {`);
  prg.indent();
  if (cfg.serial) {
    prg.addLine(
      `${functions.Serial.print}(${literals.string("deserializeJson() failed: ", cfg.progmem)});`,
    );
    if (cfg.progmem)
      prg.addLine(
        `${functions.Serial.println}(${tokens.variable("error")}.f_str());`,
      );
    else
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

export function generateParsingProgram(cfg: ParsingProgramConfig) {
  const prg = new ProgramWriter();

  writeDeserializationCode(prg, cfg);
  prg.addLine();
  writeErrorCheckingCode(prg, cfg);
  prg.addLine();

  if (cfg.input === undefined) throw new Error("input is required");

  const filteredInput = cfg.filter
    ? applyFilter(cfg.input, cfg.filter)
    : cfg.input;
  writeDecompositionCode(prg, filteredInput, cfg);

  return prg.toString();
}
