import { JsonFilter } from "./filter";
import memoryModels from "@/assets/memoryModels.json";

export function getValueType(value) {
  return value === null
    ? "null"
    : value instanceof Array
    ? "array"
    : typeof value;
}

export function getOverallocatedStringSize(s) {
  // [0-31] -> 31
  // [32-63] -> 63
  // [64-127] -> 127
  // ...
  let n = 31;
  while (n < s) n = n * 2 + 1;
  return n;
}

function getEffectiveSlotSize(cfg) {
  const isLarge = cfg.useLongLong || cfg.useDouble;
  return memoryModels[cfg.memoryModel].slotSize[isLarge ? 1 : 0];
}

class Memory {
  constructor() {
    this.memoryUsage = 0;
    this.peakMemoryUsage = 0;
  }

  alloc(n) {
    this.memoryUsage += n;
    this.peakMemoryUsage = Math.max(this.peakMemoryUsage, this.memoryUsage);
  }

  free(n) {
    this.memoryUsage -= n;
  }
}

class SlotPoolList {
  constructor(cfg, memory) {
    this._memory = memory;
    this._poolCapacity = memoryModels[cfg.memoryModel].poolCapacity;
    this._poolOverhead = memoryModels[cfg.memoryModel].poolOverhead;
    this._initialPoolListCapacity = 4; // preallacted in JsonDocument, not on the heap
    this._slotSize = getEffectiveSlotSize(cfg);
    this._freeSlots = 0;
    this._poolCount = 0;
    this._poolListCapacity = this._initialPoolListCapacity;
  }

  allocSlot() {
    if (this._freeSlots == 0) {
      this._poolCount++;
      if (this._poolCount > this._poolListCapacity) {
        if (this._poolListCapacity > this._initialPoolListCapacity)
          this._memory.free(this._poolOverhead * this._poolListCapacity);
        this._poolListCapacity *= 2;
        this._memory.alloc(this._poolOverhead * this._poolListCapacity);
      }
      this._memory.alloc(this._slotSize * this._poolCapacity);
      this._freeSlots = this._poolCapacity;
    }
    this._freeSlots--;
  }

  shrinkToFit() {
    this._memory.free(this._slotSize * this._freeSlots);
    this._freeSlots = 0;
    if (this._poolListCapacity > this._initialPoolListCapacity) {
      this._memory.free(
        this._poolOverhead * (this._poolListCapacity - this._poolCount),
      );
      this._poolListCapacity = this._poolCount;
    }
  }
}

class JsonDocument {
  constructor(memory, cfg) {
    this._strings = {};
    this._ignoreKeys = cfg.ignoreKeys;
    this._ignoreValues = cfg.ignoreValues;
    this._deduplicateKeys = cfg.deduplicateKeys;
    this._deduplicateValues = cfg.deduplicateValues;
    this._filteringEnabled = !!cfg.filter;

    this._memory = memory;
    this._poolList = new SlotPoolList(cfg, this._memory);
    this._stringOverhead = memoryModels[cfg.memoryModel].stringOverhead;
    this._overAllocateStrings = cfg.overAllocateStrings;

    this._memory.alloc(memoryModels[cfg.memoryModel].documentSize);
  }

  allocSlots(n) {
    for (let i = 0; i < n; i++) this._poolList.allocSlot();
  }

  allocString(s) {
    if (this._overAllocateStrings) {
      const size = getOverallocatedStringSize(s.length) + this._stringOverhead;
      this._memory.alloc(size);
      this._memory.free(size);
    }
    this._memory.alloc(s.length + this._stringOverhead);
  }

  addArray(n) {
    this.allocSlots(n);
  }

  addObjectMember(key) {
    this.allocSlots(1);
    if (this._ignoreKeys) return;
    if (this._deduplicateKeys && this._strings[key]) return;
    this.allocString(key);
    this._strings[key] = true;
  }

  addString(s) {
    if (this._ignoreValues) return;
    if (this._deduplicateValues && this._strings[s]) return;
    this.allocString(s);
    this._strings[s] = true;
  }

  addIgnoredKey(s) {
    this.allocString(s);
    this._memory.free(s.length + this._stringOverhead);
  }

  shrinkToFit() {
    this._poolList.shrinkToFit();
  }
}

function fillDocument(doc, value, filter) {
  switch (getValueType(value)) {
    case "array":
      if (filter.allowsArray) {
        doc.addArray(value.length);
        for (let i = 0; i < value.length; i++)
          fillDocument(doc, value[i], filter.getElementFilter(i));
      }
      break;

    case "object":
      if (filter.allowsObject) {
        for (const key in value) {
          const memberFilter = filter.getMemberFilter(key);
          if (memberFilter.allowsSomething) doc.addObjectMember(key);
          else doc.addIgnoredKey(key);
          fillDocument(doc, value[key], memberFilter);
        }
      }
      break;

    case "string":
      if (filter.allowsValue) doc.addString(value);
      break;
  }
}

export function measureSize(obj, cfg) {
  const memory = new Memory();
  if (cfg.filter) {
    const filter = new JsonDocument(memory, cfg);
    fillDocument(filter, cfg.filter, new JsonFilter(true));
    filter.shrinkToFit();
    const doc = new JsonDocument(memory, cfg);
    fillDocument(doc, obj, new JsonFilter(cfg.filter));
    doc.shrinkToFit();
  } else {
    const doc = new JsonDocument(memory, cfg);
    fillDocument(doc, obj, new JsonFilter(true));
    doc.shrinkToFit();
  }
  return {
    memoryUsage: memory.memoryUsage,
    peakMemoryUsage: memory.peakMemoryUsage,
  };
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
    const ta = getValueType(a);
    const tb = getValueType(b);
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

  switch (getValueType(input)) {
    case "array":
      if (input.length < 2) return false;
      return input.every(
        (value) =>
          getValueType(value) === "object" && areSimilar(input[0], value),
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
  switch (getValueType(values[0])) {
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
  switch (getValueType(value)) {
    case "array":
      if (canLoop(value)) return needsCppType(cpptype, value[0], value);
      return value.some((x) => needsCppType(cpptype, x));

    case "object":
      return Object.keys(value).some((key) =>
        needsCppType(
          cpptype,
          value[key],
          siblings?.filter((x) => !!x).map((x) => x[key]),
        ),
      );

    default:
      return getCommonCppTypeFor(siblings || [value]) == cpptype;
  }
}

export function hasJsonInJsonSyndrome(val) {
  switch (getValueType(val)) {
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
