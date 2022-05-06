class Accumulator {
  constructor() {
    this.arrays = [];
    this.objects = [];
  }

  addArray(size) {
    if (this.arrays[size]) this.arrays[size]++;
    else this.arrays[size] = 1;
  }

  addObject(size) {
    if (this.objects[size]) this.objects[size]++;
    else this.objects[size] = 1;
  }

  toString() {
    const elements = [];
    for (const size in this.arrays) {
      const count = this.arrays[size];
      if (count > 1) elements.push(count + "*JSON_ARRAY_SIZE(" + size + ")");
      else elements.push("JSON_ARRAY_SIZE(" + size + ")");
    }
    for (const size in this.objects) {
      const count = this.objects[size];
      if (count > 1) elements.push(count + "*JSON_OBJECT_SIZE(" + size + ")");
      else elements.push("JSON_OBJECT_SIZE(" + size + ")");
    }
    if (elements.length > 0) return elements.join(" + ");
    else return "0";
  }
}

function fillAccumulatorRecursively(accumulator, value) {
  let children = [];
  if (value instanceof Array) {
    children = value;
    accumulator.addArray(children.length);
  } else if (value instanceof Object) {
    children = Object.values(value);
    accumulator.addObject(children.length);
  }
  children.forEach((elem) => fillAccumulatorRecursively(accumulator, elem));
}

export function buildExpression(obj) {
  const expr = new Accumulator();
  fillAccumulatorRecursively(expr, obj);
  return expr.toString();
}
