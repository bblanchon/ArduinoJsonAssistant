import {
  isJsonBoolean,
  isJsonNumber,
  isJsonString,
  type JsonArray,
  type JsonObject,
  type JsonValue,
} from "./json";
import { ProgramWriter, makeVariableName, stripHtml } from "./programWriter";
import { literals, keywords, types, functions, tokens } from "./tokens";

function stringifyValue(value: JsonValue): string {
  if (isJsonString(value)) return literals.string(value);
  if (isJsonNumber(value)) return literals.number(value);
  if (isJsonBoolean(value)) return literals.bool(value);
  if (value === null) return keywords.nullptr;
  return value.toString();
}

interface ArrayDetails {
  name: string;
  value: JsonArray;
  parent?: string;
  key?: string | number;
}

interface ObjectDetails {
  name: string;
  value: JsonObject;
  parent?: string;
  key?: string | number;
}

interface ArrayElementDetails {
  array: string;
  name: string;
  value: JsonValue;
  key?: string | number;
}

interface ObjectMemberDetails {
  object: string;
  key: string;
  value: JsonValue;
  name: string;
}

interface VariantDetails {
  name: string;
  value: JsonValue;
  parent?: string;
  key?: string | number;
}

class CompositionCodeBuilder {
  private prg: ProgramWriter;

  constructor(prg: ProgramWriter) {
    this.prg = prg;
  }

  private addLine(line: string = "") {
    this.prg.addLine(line);
  }

  addArray({ name, value, parent, key }: ArrayDetails) {
    const childrenCount = value.length;

    if (parent === undefined) {
      if (childrenCount == 0)
        this.addLine(
          `${tokens.variable(name)}.${name == "doc" ? functions.JsonDocument.to : functions.JsonVariant.to}&lt;${types.JsonArray}&gt;();`,
        );
      if (childrenCount == 1)
        return this.addVariant({
          parent: tokens.variable(name),
          name: name + "_0",
          key: 0,
          value: value[0],
        });
    } else if (childrenCount == 1) {
      if (key === undefined)
        throw new Error("key is required if parent is set");
      return this.addVariant({
        parent: `${parent}[${stringifyValue(key)}]`,
        name: name + "_0",
        key: 0,
        value: value[0],
      });
    } else {
      this.addLine();
      if (typeof key === "string")
        this.addLine(
          `${types.JsonArray} ${tokens.variable(name)} = ${parent}[${stringifyValue(
            key,
          )}].${stripHtml(parent) == "doc" ? functions.JsonDocument.to : functions.JsonVariant.to}&lt;${types.JsonArray}&gt;();`,
        );
      else
        this.addLine(
          `${types.JsonArray} ${tokens.variable(name)} = ${parent}.${stripHtml(parent) == "doc" ? functions.JsonDocument.add : functions.JsonArray.add}&lt;${types.JsonArray}&gt;();`,
        );
    }
    value.forEach((elem, index) => {
      this.addArrayElement({
        key: index,
        array: tokens.variable(name),
        name: name + "_" + index,
        value: elem,
      });
    });
  }

  addObject({ parent, key, name, value }: ObjectDetails) {
    const childrenCount = Object.keys(value).length;
    let objectName = tokens.variable(name);

    if (parent === undefined) {
      if (childrenCount == 0)
        return this.addLine(
          `${tokens.variable(name)}.${name == "doc" ? functions.JsonDocument.to : functions.JsonVariant.to}&lt;${types.JsonObject}&gt;();`,
        );
    } else if (childrenCount == 1) {
      if (key === undefined)
        throw new Error("key is required if parent is set");
      objectName = `${parent}[${stringifyValue(key)}]`;
    } else {
      this.addLine();
      if (typeof key === "string")
        this.addLine(
          `${types.JsonObject} ${tokens.variable(name)} = ${parent}[${stringifyValue(
            key,
          )}].${stripHtml(parent) == "doc" ? functions.JsonDocument.to : functions.JsonVariant.to}&lt;${types.JsonObject}&gt;();`,
        );
      else
        this.addLine(
          `${types.JsonObject} ${tokens.variable(name)} = ${parent}.${stripHtml(parent) == "doc" ? functions.JsonDocument.add : functions.JsonArray.add}&lt;${types.JsonObject}&gt;();`,
        );
    }

    for (const key in value) {
      this.addObjectMember({
        object: objectName,
        name: makeVariableName(`${name}[${key}]`),
        key: key,
        value: value[key],
      });
    }
  }

  addArrayElement({ array, name, value, key }: ArrayElementDetails) {
    if (value instanceof Array) {
      this.addArray({ parent: array, name, value });
    } else if (value instanceof Object) {
      this.addObject({ parent: array, key, name, value });
    } else {
      this.addLine(
        `${array}.${functions.JsonArray.add}(${stringifyValue(value)});`,
      );
    }
  }

  addObjectMember({ key, object, value, name }: ObjectMemberDetails) {
    if (value instanceof Array)
      this.addArray({ parent: object, key, name, value });
    else if (value instanceof Object)
      this.addObject({ parent: object, key, name, value });
    else {
      this.addLine(
        `${object}[${literals.string(key)}] = ${stringifyValue(value)};`,
      );
    }
  }

  addVariant({ value, name, parent, key }: VariantDetails) {
    if (value instanceof Array) {
      this.addArray({ value, name, parent, key });
    } else if (value instanceof Object) {
      this.addObject({ value, name, parent, key });
    } else if (parent) {
      if (key === undefined)
        throw new Error("key is required if parent is set");
      this.addLine(
        `${parent}[${stringifyValue(key)}] = ${stringifyValue(value)};`,
      );
    } else if (value != null) {
      this.addLine(
        `${tokens.variable(name)}.${name == "doc" ? functions.JsonDocument.set : functions.JsonVariant.set}(${stringifyValue(value)});`,
      );
    }
  }
}

export function writeCompositionCode(
  prg: ProgramWriter,
  { value, name }: { value: JsonValue; name: string },
) {
  new CompositionCodeBuilder(prg).addVariant({ name, value });
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

  prg.addLine(`${types.JsonDocument} ${tokens.variable("doc")};`);

  prg.addLine();
  writeCompositionCode(prg, {
    value: cfg.output ?? null,
    name: "doc",
  });
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
      prg.addLine(`${types.String} ${tokens.variable("output")};`);
      args.push(tokens.variable("output"));
      break;
    case "stdString":
      prg.addLine(`${types.std.string} ${tokens.variable("output")};`);
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
