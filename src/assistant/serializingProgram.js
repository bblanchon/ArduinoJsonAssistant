import { ProgramWriter, sanitizeName } from "./programWriter.js";
import { measureSize } from "./analyzer.js";

function stringifyValue(value) {
  return value === null ? "nullptr" : JSON.stringify(value);
}

function addArray(prg, { name, value, parent, key }) {
  const childrenCount = value.length;

  if (parent === undefined) {
    if (childrenCount == 0) prg.addLine(`${name}.to&lt;JsonArray&gt;();`);
    if (childrenCount == 1)
      return assignVariant(prg, {
        parent: name,
        name: name + "_0",
        key: 0,
        value: value[0],
      });
  } else if (childrenCount == 1) {
    return assignVariant(prg, {
      parent: parent + JSON.stringify([key]),
      name: name + "_0",
      key: 0,
      value: value[0],
    });
  } else {
    prg.addEmptyLine();
    key = key ? JSON.stringify(key) : "";
    prg.addLine(`JsonArray ${name} = ${parent}.createNestedArray(${key});`);
  }
  value.forEach((elem, index) => {
    addArrayElement(prg, {
      key: index,
      array: name,
      name: name + "_" + index,
      value: elem,
    });
  });
}

function addObject(prg, { parent, key, name, value }) {
  const childrenCount = Object.keys(value).length;
  let objectName = name;

  if (parent === undefined) {
    if (childrenCount == 0)
      return prg.addLine(`${name}.to&lt;JsonObject&gt;();`);
  } else if (childrenCount == 1) {
    objectName = parent + JSON.stringify([key]);
  } else {
    prg.addEmptyLine();
    key = key ? JSON.stringify(key) : "";
    prg.addLine(`JsonObject ${name} = ${parent}.createNestedObject(${key});`);
  }

  const memberPrefix = name !== "doc" ? name + "_" : "";

  for (const key in value) {
    addObjectMember(prg, {
      object: objectName,
      name: memberPrefix + sanitizeName(key),
      key: key,
      value: value[key],
    });
  }
}

function addArrayElement(prg, { array, name, value, key }) {
  if (value instanceof Array) {
    addArray(prg, { parent: array, name, value });
  } else if (value instanceof Object) {
    addObject(prg, { parent: array, key, name, value });
  } else {
    prg.addLine(`${array}.add(${stringifyValue(value)});`);
  }
}

function addObjectMember(prg, { key, object, value, name }) {
  if (value instanceof Array)
    addArray(prg, { parent: object, key, name, value });
  else if (value instanceof Object)
    addObject(prg, { parent: object, key, name, value });
  else {
    key = JSON.stringify(key);
    prg.addLine(`${object}[${key}] = ${stringifyValue(value)};`);
  }
}

function assignVariant(prg, { value, name, parent, key }) {
  if (value instanceof Array) {
    addArray(prg, { value, name, parent, key });
  } else if (value instanceof Object) {
    addObject(prg, { value, name, parent, key });
  } else if (parent) {
    key = JSON.stringify(key);
    prg.addLine(`${parent}[${key}] = ${stringifyValue(value)};`);
  } else if (value != null) {
    prg.addLine(`${name}.set(${stringifyValue(value)});`);
  }
}

export function writeCompositionCode(prg, value, name) {
  assignVariant(prg, { name, value });
}

export function generateSerializingProgram(cfg) {
  const prg = new ProgramWriter();

  switch (cfg.outputType) {
    case "charPtr":
      prg.addLine("// char* output;");
      prg.addLine("// size_t outputCapacity;");
      break;
    case "arduinoStream":
      prg.addLine("// Stream& output;");
      break;
    case "stdStream":
      prg.addLine("// std::ostream& output;");
      break;
  }
  prg.addEmptyLine();

  const capacity = measureSize(cfg.root, cfg).recommended;

  if (cfg.cpu && cfg.cpu.heapThreshold < capacity) {
    prg.addLine(`DynamicJsonDocument doc(${capacity});`);
  } else {
    prg.addLine(`StaticJsonDocument<${capacity}> doc;`);
  }

  prg.addEmptyLine();
  writeCompositionCode(prg, cfg.root, "doc");
  prg.addEmptyLine();

  const args = ["doc"];
  switch (cfg.outputType) {
    case "charPtr":
      args.push("output", "outputCapacity");
      break;
    case "charArray":
      prg.addLine("char output[MAX_OUTPUT_SIZE];");
      args.push("output");
      break;
    case "arduinoString":
      prg.addLine("String output;");
      args.push("output");
      break;
    case "stdString":
      prg.addLine("std::string output;");
      args.push("output");
      break;
    default:
      args.push("output");
  }
  prg.addLine(`serializeJson(${args.join(", ")});`);

  return prg.toString();
}
