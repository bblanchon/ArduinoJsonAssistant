import { getValueType } from "./analyzer";
import { ProgramWriter, makeVariableName, stripHtml } from "./programWriter";
import { literals, keywords, types, functions, tokens } from "./tokens";

function stringifyValue(value: any) {
  switch (getValueType(value)) {
    case "string":
      return literals.string(value);
    case "number":
      return literals.number(value);
    case "boolean":
      return literals.bool(value);
    case "null":
      return keywords.nullptr;
    default:
      return value;
  }
}

interface ArrayDetails {
  name: string;
  value: any[];
  parent?: string;
  key?: any;
}

function addArray(
  prg: ProgramWriter,
  { name, value, parent, key }: ArrayDetails,
) {
  const childrenCount = value.length;

  if (parent === undefined) {
    if (childrenCount == 0)
      prg.addLine(
        `${tokens.variable(name)}.${name == "doc" ? functions.JsonDocument.to : functions.JsonVariant.to}&lt;${types.JsonArray}&gt;();`,
      );
    if (childrenCount == 1)
      return assignVariant(prg, {
        parent: tokens.variable(name),
        name: name + "_0",
        key: 0,
        value: value[0],
      });
  } else if (childrenCount == 1) {
    return assignVariant(prg, {
      parent: `${parent}[${stringifyValue(key)}]`,
      name: name + "_0",
      key: 0,
      value: value[0],
    });
  } else {
    prg.addEmptyLine();
    if (typeof key === "string")
      prg.addLine(
        `${types.JsonArray} ${tokens.variable(name)} = ${parent}[${stringifyValue(
          key,
        )}].${stripHtml(parent) == "doc" ? functions.JsonDocument.to : functions.JsonVariant.to}&lt;${types.JsonArray}&gt;();`,
      );
    else
      prg.addLine(
        `${types.JsonArray} ${tokens.variable(name)} = ${parent}.${stripHtml(parent) == "doc" ? functions.JsonDocument.add : functions.JsonArray.add}&lt;${types.JsonArray}&gt;();`,
      );
  }
  value.forEach((elem, index) => {
    addArrayElement(prg, {
      key: index,
      array: tokens.variable(name),
      name: name + "_" + index,
      value: elem,
    });
  });
}

interface ObjectDetails {
  name: string;
  value: { [key: string]: any };
  parent?: string;
  key?: any;
}

function addObject(
  prg: ProgramWriter,
  { parent, key, name, value }: ObjectDetails,
) {
  const childrenCount = Object.keys(value).length;
  let objectName = tokens.variable(name);

  if (parent === undefined) {
    if (childrenCount == 0)
      return prg.addLine(
        `${tokens.variable(name)}.${name == "doc" ? functions.JsonDocument.to : functions.JsonVariant.to}&lt;${types.JsonObject}&gt;();`,
      );
  } else if (childrenCount == 1) {
    objectName = `${parent}[${stringifyValue(key)}]`;
  } else {
    prg.addEmptyLine();
    if (typeof key === "string")
      prg.addLine(
        `${types.JsonObject} ${tokens.variable(name)} = ${parent}[${stringifyValue(
          key,
        )}].${stripHtml(parent) == "doc" ? functions.JsonDocument.to : functions.JsonVariant.to}&lt;${types.JsonObject}&gt;();`,
      );
    else
      prg.addLine(
        `${types.JsonObject} ${tokens.variable(name)} = ${parent}.${stripHtml(parent) == "doc" ? functions.JsonDocument.add : functions.JsonArray.add}&lt;${types.JsonObject}&gt;();`,
      );
  }

  for (const key in value) {
    addObjectMember(prg, {
      object: objectName,
      name: makeVariableName(`${name}[${key}]`),
      key: key,
      value: value[key],
    });
  }
}

interface ArrayElementDetails {
  array: string;
  name: string;
  value: any;
  key?: any;
}

function addArrayElement(
  prg: ProgramWriter,
  { array, name, value, key }: ArrayElementDetails,
) {
  if (value instanceof Array) {
    addArray(prg, { parent: array, name, value });
  } else if (value instanceof Object) {
    addObject(prg, { parent: array, key, name, value });
  } else {
    prg.addLine(
      `${array}.${functions.JsonArray.add}(${stringifyValue(value)});`,
    );
  }
}

interface ObjectMemberDetails {
  object: string;
  key: string;
  value: any;
  name: string;
}

function addObjectMember(
  prg: ProgramWriter,
  { key, object, value, name }: ObjectMemberDetails,
) {
  if (value instanceof Array)
    addArray(prg, { parent: object, key, name, value });
  else if (value instanceof Object)
    addObject(prg, { parent: object, key, name, value });
  else {
    prg.addLine(
      `${object}[${literals.string(key)}] = ${stringifyValue(value)};`,
    );
  }
}

interface VariantDetails {
  name: string;
  value: any;
  parent?: string;
  key?: any;
}

function assignVariant(
  prg: ProgramWriter,
  { value, name, parent, key }: VariantDetails,
) {
  if (value instanceof Array) {
    addArray(prg, { value, name, parent, key });
  } else if (value instanceof Object) {
    addObject(prg, { value, name, parent, key });
  } else if (parent) {
    prg.addLine(
      `${parent}[${stringifyValue(key)}] = ${stringifyValue(value)};`,
    );
  } else if (value != null) {
    prg.addLine(
      `${tokens.variable(name)}.${name == "doc" ? functions.JsonDocument.set : functions.JsonVariant.set}(${stringifyValue(value)});`,
    );
  }
}

export function writeCompositionCode(
  prg: ProgramWriter,
  { value, name }: { value: any; name: string },
) {
  assignVariant(prg, { name, value });
}

interface SerializingProgramConfig {
  output?: any;
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
  prg.addEmptyLine();

  prg.addLine(`${types.JsonDocument} ${tokens.variable("doc")};`);

  prg.addEmptyLine();
  writeCompositionCode(prg, {
    value: cfg.output,
    name: "doc",
  });
  prg.addEmptyLine();

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
    prg.addEmptyLine();
    prg.addLine(
      `${tokens.variable("doc")}.${functions.JsonDocument.shrinkToFit}();  ${tokens.comment("optional")}`,
    );
    prg.addEmptyLine();
  }

  prg.addLine(`${functions.serializeJson}(${args.join(", ")});`);

  return prg.toString();
}
