import { JsonFilter } from "./filter.mjs";

export function roundCapacity(value) {
  const pow2 = Math.pow(2, Math.max(3, Math.ceil(Math.log2(value) - 2)));
  return Math.ceil(value / pow2) * pow2;
}

export function type(value) {
  return value === null
    ? "null"
    : value instanceof Array
    ? "array"
    : typeof value;
}

function getEffectiveSlotSize(cfg) {
  if (cfg.useLongLong && cfg.useDouble)
    return Math.max(cfg.cpu.useLongLong.slotSize, cfg.cpu.useDouble.slotSize);
  if (cfg.useDouble) return cfg.cpu.useDouble.slotSize;
  if (cfg.useLongLong) return cfg.cpu.useLongLong.slotSize;
  return cfg.cpu.slotSize;
}

class SizeAccumulator {
  constructor(cfg) {
    this._totalSlotSize = 0;
    this._totalStringSize = 0;
    this._strings = {};
    this._largestIgnoredKey = 0;
    this._ignoreKeys = cfg.ignoreKeys;
    this._ignoreValues = cfg.ignoreValues;
    this._deduplicateKeys = cfg.deduplicateKeys;
    this._deduplicateValues = cfg.deduplicateValues;
    this._filteringEnabled = !!cfg.filter;
    this._slotSize = getEffectiveSlotSize(cfg);
  }

  addArray(n) {
    this._totalSlotSize += n * this._slotSize;
  }

  addObjectMember(key) {
    this._totalSlotSize += this._slotSize;
    if (this._ignoreKeys) return;
    if (this._deduplicateKeys && this._strings[key]) return;
    this._totalStringSize += key.length + 1;
    this._strings[key] = true;
  }

  addString(s) {
    if (this._ignoreValues) return;
    if (this._deduplicateValues && this._strings[s]) return;
    this._totalStringSize += s.length + 1;
    this._strings[s] = true;
  }

  addIgnoredKey(s) {
    this._largestIgnoredKey = Math.max(this._largestIgnoredKey, s.length + 1);
  }

  get results() {
    const minimum =
      this._totalSlotSize + this._totalStringSize + this._largestIgnoredKey;

    const variableSize = this._totalStringSize + this._largestIgnoredKey;
    const slack = variableSize && Math.max(10, 0.1 * variableSize);

    const result = {
      slots: this._totalSlotSize,
      strings: this._totalStringSize,
      minimum: minimum,
      recommended: roundCapacity(minimum + slack),
    };
    if (this._filteringEnabled) result.filter = this._largestIgnoredKey;
    return result;
  }
}

function fillAccumulator(acc, value, filter) {
  switch (type(value)) {
    case "array":
      if (filter.allowsArray) {
        acc.addArray(value.length);
        for (let i = 0; i < value.length; i++)
          fillAccumulator(acc, value[i], filter.getElementFilter(i));
      }
      break;

    case "object":
      if (filter.allowsObject) {
        for (const key in value) {
          const memberFilter = filter.getMemberFilter(key);
          if (memberFilter.allowsSomething) acc.addObjectMember(key);
          else acc.addIgnoredKey(key);
          fillAccumulator(acc, value[key], memberFilter);
        }
      }
      break;

    case "string":
      if (filter.allowsValue) acc.addString(value);
      break;
  }
}

export function measureSize(obj, cfg) {
  cfg = cfg || {};
  const acc = new SizeAccumulator(cfg);
  fillAccumulator(acc, obj, new JsonFilter(cfg.filter || true));
  return acc.results;
}

export function measureNesting(obj) {
  if (obj instanceof Object === false) return 0;
  let innerNesting = 0;
  for (const key in obj) {
    innerNesting = Math.max(innerNesting, measureNesting(obj[key]));
  }
  return 1 + innerNesting;
}

export function canLoop(input) {
  function areSimilar(a, b) {
    const ta = type(a);
    const tb = type(b);
    if (ta === "null" || tb === "null") return true;
    if (ta !== tb) return false;
    if (ta === "object") {
      for (const k in a) {
        if (!(k in b)) return false;
      }
      for (const k in b) {
        if (!(k in a)) return false;
        if (!areSimilar(a[k], b[k])) return false;
      }
    }
    if (ta === "array") {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (!areSimilar(a[i], b[i])) return false;
      }
    }
    return true;
  }

  switch (type(input)) {
    case "array":
      if (input.length < 2) return false;
      return input.every(
        (value) => type(value) === "object" && areSimilar(input[0], value)
      );

    case "object":
      return canLoop(Object.values(input));

    default:
      return false;
  }
}

export function getCppTypeFor(value) {
  return getCommonCppTypeFor([value]);
}

function hasShortMantissa(value) {
  return value.toExponential().split("e")[0].length < 9;
}

export function getCommonCppTypeFor(values) {
  switch (type(values[0])) {
    case "boolean":
      return "bool";

    case "string":
      return "const char*";

    case "number": {
      const containsFloat = values.some((x) => x % 1);
      const max = Math.max(...values);
      const min = Math.min(...values);
      if (!containsFloat) {
        if (max < 32000 && min > -32000) return "int";
        if (max < 2000000000 && min > -2000000000) return "long";
        if (max < 9e18 && min > -9e18) return "long long";
      }
      if (max < 2e38 && min > -2e38 && values.every(hasShortMantissa))
        return "float";
      return "double";
    }

    case "null":
      return getCommonCppTypeFor(values.slice(1));
  }
}

function needsCppType(cpptype, value, siblings) {
  switch (type(value)) {
    case "array":
      if (canLoop(value)) return needsCppType(cpptype, value[0], value);
      return value.some((x) => needsCppType(cpptype, x));

    case "object":
      return Object.keys(value).some((key) =>
        needsCppType(
          cpptype,
          value[key],
          siblings?.filter((x) => !!x).map((x) => x[key])
        )
      );

    default:
      return getCommonCppTypeFor(siblings || [value]) == cpptype;
  }
}

export function hasJsonInJsonSyndrome(val) {
  switch (type(val)) {
    case "string":
      if (val[0] != "[" && val[0] != "{") return false;
      try {
        JSON.parse(val);
        return true;
      } catch {
        return false;
      }
    case "object":
      return Object.values(val).some(hasJsonInJsonSyndrome);
    case "array":
      return val.some(hasJsonInJsonSyndrome);
  }
  return false;
}

export const needsLongLong = (val) => needsCppType("long long", val);
export const needsDouble = (val) => needsCppType("double", val);
