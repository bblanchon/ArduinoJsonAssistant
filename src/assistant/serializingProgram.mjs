import { ProgramWriter, sanitizeName } from "./programWriter.mjs";
import { measureSize } from "./analyzer.mjs";

function stringifyValue(value) {
  return value === null ? "nullptr" : JSON.stringify(value);
}

function addArray(prg, cfg) {
  const arrayName = cfg.name;
  const array = cfg.value;
  const parentName = cfg.parent;
  const key = cfg.key;
  const childrenCount = array.length;

  if (parentName === undefined) {
    if (childrenCount == 0) prg.addLine(arrayName + ".to&lt;JsonArray&gt;();");
    if (childrenCount == 1)
      return assignVariant(prg, {
        parent: arrayName,
        name: arrayName + "_0",
        key: 0,
        value: array[0],
      });
  } else if (childrenCount == 1) {
    return assignVariant(prg, {
      parent: parentName + JSON.stringify([key]),
      name: arrayName + "_0",
      key: 0,
      value: array[0],
    });
  } else {
    prg.addEmptyLine();
    if (typeof key === "string") {
      prg.addLine(
        "JsonArray ",
        arrayName,
        " = ",
        parentName,
        ".createNestedArray(",
        JSON.stringify(key),
        ");"
      );
    } else {
      prg.addLine(
        "JsonArray ",
        arrayName,
        " = ",
        parentName,
        ".createNestedArray();"
      );
    }
  }
  for (let i = 0; i < array.length; i++) {
    const elementName = cfg.name + "_" + i;
    addArrayElement(prg, {
      array: arrayName,
      name: elementName,
      value: array[i],
    });
  }
}

function addObject(prg, cfg) {
  const parentName = cfg.parent;
  const key = cfg.key;
  let objectName = cfg.name;
  const object = cfg.value;
  const childrenCount = Object.keys(object).length;

  if (parentName === undefined) {
    if (childrenCount == 0)
      return prg.addLine(objectName + ".to&lt;JsonObject&gt;();");
  } else if (childrenCount == 1) {
    objectName = parentName + JSON.stringify([key]);
  } else {
    prg.addEmptyLine();
    if (typeof key === "string") {
      prg.addLine(
        "JsonObject ",
        objectName,
        " = ",
        parentName,
        ".createNestedObject(",
        JSON.stringify(key),
        ");"
      );
    } else {
      prg.addLine(
        "JsonObject ",
        objectName,
        " = ",
        parentName,
        ".createNestedObject();"
      );
    }
  }

  for (const key in object) {
    const memberName =
      cfg.name !== "doc"
        ? cfg.name + "_" + sanitizeName(key)
        : sanitizeName(key);
    addObjectMember(prg, {
      object: objectName,
      name: memberName,
      key: key,
      value: object[key],
    });
  }
}

function addArrayElement(prg, cfg) {
  const arrayName = cfg.array;
  const elementName = cfg.name;
  const value = cfg.value;

  if (value instanceof Array) {
    addArray(prg, {
      parent: arrayName,
      name: elementName,
      value: value,
    });
  } else if (value instanceof Object) {
    addObject(prg, {
      parent: arrayName,
      name: elementName,
      value: value,
    });
  } else {
    prg.addLine(arrayName, ".add(", stringifyValue(value), ");");
  }
}

function addObjectMember(prg, cfg) {
  const objectName = cfg.object;
  const key = cfg.key;
  const value = cfg.value;
  const memberName = cfg.name;
  if (value instanceof Array)
    addArray(prg, {
      parent: objectName,
      key: key,
      name: memberName,
      value: value,
    });
  else if (value instanceof Object)
    addObject(prg, {
      parent: objectName,
      key: key,
      name: memberName,
      value: value,
    });
  else
    prg.addLine(
      objectName,
      JSON.stringify([key]),
      " = ",
      stringifyValue(value),
      ";"
    );
}

function assignVariant(prg, cfg) {
  const value = cfg.value;
  const name = cfg.name;
  const parentName = cfg.parent;
  const key = cfg.key;

  if (value instanceof Array) {
    addArray(prg, cfg);
  } else if (value instanceof Object) {
    addObject(prg, cfg);
  } else if (parentName) {
    prg.addLine(
      parentName,
      "[",
      JSON.stringify(key),
      "] = ",
      stringifyValue(value),
      ";"
    );
  } else if (value != null) {
    prg.addLine(name, ".set(", stringifyValue(value), ");");
  }
}

export function writeCompositionCode(prg, root, name) {
  assignVariant(prg, {
    name: name,
    value: root,
  });
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
    prg.addLine("DynamicJsonDocument doc(", capacity, ");");
  } else {
    prg.addLine("StaticJsonDocument<", capacity, "> doc;");
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
  prg.addLine("serializeJson(", args.join(", "), ");");

  return prg.toString();
}
