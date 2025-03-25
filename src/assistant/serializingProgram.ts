import {
  isJsonArray,
  isJsonBoolean,
  isJsonNumber,
  isJsonObject,
  isJsonString,
  type JsonArray,
  type JsonObject,
  type JsonValue,
} from "./json";
import { ProgramWriter, makeVariableName, stripHtml } from "./programWriter";
import { literals, keywords, type, functions, tokens } from "./tokens";

interface VariableContext {
  name: string;
  parent?: string;
  key?: string | number;
}

interface CompositionCodeConfig {
  progmem?: boolean;
}

class CompositionCodeBuilder {
  private prg: ProgramWriter;
  private cfg: CompositionCodeConfig;

  constructor(prg: ProgramWriter, cfg: CompositionCodeConfig = {}) {
    this.prg = prg;
    this.cfg = cfg;
  }

  private addLine(line: string = "") {
    this.prg.addLine(line);
  }

  stringify(value: JsonValue): string {
    if (isJsonString(value)) return literals.string(value, this.cfg.progmem);
    if (isJsonNumber(value)) return literals.number(value);
    if (isJsonBoolean(value)) return literals.bool(value);
    if (value === null) return keywords.nullptr;
    return value.toString();
  }

  addArray(value: JsonArray, { name, parent, key }: VariableContext) {
    const childrenCount = value.length;

    if (parent === undefined) {
      if (childrenCount == 0)
        this.addLine(
          `${tokens.variable(name)}.${name == "doc" ? functions.JsonDocument.to : functions.JsonVariant.to}&lt;${type("JsonArray")}&gt;();`,
        );
      if (childrenCount == 1)
        return this.addVariant(value[0], {
          parent: tokens.variable(name),
          name: name + "_0",
          key: 0,
        });
    } else if (childrenCount == 1) {
      if (key === undefined)
        throw new Error("key is required if parent is set");
      return this.addVariant(value[0], {
        parent: `${parent}[${this.stringify(key)}]`,
        name: name + "_0",
        key: 0,
      });
    } else {
      this.addLine();
      if (typeof key === "string")
        this.addLine(
          `${type("JsonArray")} ${tokens.variable(name)} = ${parent}[${this.stringify(
            key,
          )}].${stripHtml(parent) == "doc" ? functions.JsonDocument.to : functions.JsonVariant.to}&lt;${type("JsonArray")}&gt;();`,
        );
      else
        this.addLine(
          `${type("JsonArray")} ${tokens.variable(name)} = ${parent}.${stripHtml(parent) == "doc" ? functions.JsonDocument.add : functions.JsonArray.add}&lt;${type("JsonArray")}&gt;();`,
        );
    }
    value.forEach((elem, index) => {
      this.addArrayElement(elem, {
        key: index,
        parent: tokens.variable(name),
        name: name + "_" + index,
      });
    });
  }

  addObject(value: JsonObject, { parent, key, name }: VariableContext) {
    const childrenCount = Object.keys(value).length;
    let objectName = tokens.variable(name);

    if (parent === undefined) {
      if (childrenCount == 0)
        return this.addLine(
          `${tokens.variable(name)}.${name == "doc" ? functions.JsonDocument.to : functions.JsonVariant.to}&lt;${type("JsonObject")}&gt;();`,
        );
    } else if (childrenCount == 1) {
      if (key === undefined)
        throw new Error("key is required if parent is set");
      objectName = `${parent}[${this.stringify(key)}]`;
    } else {
      this.addLine();
      if (typeof key === "string")
        this.addLine(
          `${type("JsonObject")} ${tokens.variable(name)} = ${parent}[${this.stringify(
            key,
          )}].${stripHtml(parent) == "doc" ? functions.JsonDocument.to : functions.JsonVariant.to}&lt;${type("JsonObject")}&gt;();`,
        );
      else
        this.addLine(
          `${type("JsonObject")} ${tokens.variable(name)} = ${parent}.${stripHtml(parent) == "doc" ? functions.JsonDocument.add : functions.JsonArray.add}&lt;${type("JsonObject")}&gt;();`,
        );
    }

    for (const key in value) {
      this.addObjectMember(value[key], {
        parent: objectName,
        name: makeVariableName(`${name}[${key}]`),
        key: key,
      });
    }
  }

  addArrayElement(value: JsonValue, ctx: VariableContext): void {
    const { parent } = ctx;
    if (parent === undefined) throw new Error("parent is required");

    if (isJsonArray(value)) return this.addArray(value, ctx);
    if (isJsonObject(value)) return this.addObject(value, ctx);
    this.addLine(
      `${parent}.${functions.JsonArray.add}(${this.stringify(value)});`,
    );
  }

  addObjectMember(value: JsonValue, ctx: VariableContext) {
    if (isJsonArray(value)) return this.addArray(value, ctx);
    if (isJsonObject(value)) return this.addObject(value, ctx);

    const { parent, key } = ctx;
    if (typeof key !== "string") throw new Error("key must be a string");

    this.addLine(
      `${parent}[${literals.string(key, this.cfg.progmem)}] = ${this.stringify(value)};`,
    );
  }

  addVariant(value: JsonValue, ctx: VariableContext): void {
    if (isJsonArray(value)) return this.addArray(value, ctx);
    if (isJsonObject(value)) return this.addObject(value, ctx);

    const { parent, key, name } = ctx;
    if (parent) {
      if (key === undefined)
        throw new Error("key is required if parent is set");
      this.addLine(
        `${parent}[${this.stringify(key)}] = ${this.stringify(value)};`,
      );
    } else if (value != null) {
      this.addLine(
        `${tokens.variable(name)}.${name == "doc" ? functions.JsonDocument.set : functions.JsonVariant.set}(${this.stringify(value)});`,
      );
    }
  }
}

export function writeCompositionCode(
  prg: ProgramWriter,
  { value, name }: { value: JsonValue; name: string },
  cfg: CompositionCodeConfig = {},
) {
  new CompositionCodeBuilder(prg, cfg).addVariant(value, { name });
}

interface SerializingProgramConfig {
  output?: JsonValue;
  outputType?:
    | "charPtr"
    | "charArray"
    | "arduinoString"
    | "stdString"
    | "arduinoStream"
    | "stdStream";
  progmem?: boolean;
}

export function generateSerializingProgram(cfg: SerializingProgramConfig) {
  const prg = new ProgramWriter();

  switch (cfg.outputType) {
    case "charPtr":
      prg.addLine(tokens.comment("char* output;"));
      prg.addLine(tokens.comment("size_t outputCapacity;"));
      break;
    case "arduinoStream":
      prg.addLine(tokens.comment("Stream& output;"));
      break;
    case "stdStream":
      prg.addLine(tokens.comment("std::ostream& output;"));
      break;
  }
  prg.addLine();

  prg.addLine(`${type("JsonDocument")} ${tokens.variable("doc")};`);

  prg.addLine();
  writeCompositionCode(
    prg,
    {
      value: cfg.output ?? null,
      name: "doc",
    },
    cfg,
  );
  prg.addLine();

  const args = [tokens.variable("doc")];
  switch (cfg.outputType) {
    case "charPtr":
      args.push(tokens.variable("output"), tokens.variable("outputCapacity"));
      break;
    case "charArray":
      prg.addLine(
        `${tokens.type("char")} ${tokens.variable("output")}[${tokens.macro("MAX_OUTPUT_SIZE")}];`,
      );
      args.push(tokens.variable("output"));
      break;
    case "arduinoString":
      prg.addLine(`${type("String")} ${tokens.variable("output")};`);
      args.push(tokens.variable("output"));
      break;
    case "stdString":
      prg.addLine(`${type("std::string")} ${tokens.variable("output")};`);
      args.push(tokens.variable("output"));
      break;
    default:
      args.push(tokens.variable("output"));
  }

  if (cfg.output) {
    prg.addLine();
    prg.addLine(
      `${tokens.variable("doc")}.${functions.JsonDocument.shrinkToFit}();  ${tokens.comment("optional")}`,
    );
    prg.addLine();
  }

  prg.addLine(`${functions.serializeJson}(${args.join(", ")});`);

  return prg.toString();
}
