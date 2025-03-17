import { JsonFilter } from "./filter";
import memoryModels from "@/assets/memoryModels.json";
import {
  isJsonArray,
  isJsonBoolean,
  isJsonNumber,
  isJsonObject,
  isJsonString,
  type JsonValue,
} from "./json";

export function getOverallocatedStringSize(s: number) {
  // [0-31] -> 31
  // [32-63] -> 63
  // [64-127] -> 127
  // ...
  let n = 31;
  while (n < s) n = n * 2 + 1;
  return n;
}

type Arch = "8-bit" | "16-bit" | "32-bit" | "64-bit";

type SlotFlags =
  | "001"
  | "011"
  | "101"
  | "111"
  | "002"
  | "012"
  | "102"
  | "112"
  | "004"
  | "014"
  | "104"
  | "114";

interface Config {
  arch: Arch;
  useDouble?: boolean;
  useLongLong?: boolean;
  slotIdSize?: number;
  ignoreKeys?: boolean;
  ignoreValues?: boolean;
  deduplicateKeys?: boolean;
  deduplicateValues?: boolean;
  filter?: JsonValue;
  stringLengthSize?: number;
  overAllocateStrings?: boolean;
}

export function getEffectiveSlotSize(cfg: Config) {
  const arch = memoryModels[cfg.arch];
  const flags = [
    (cfg.useDouble ?? true) ? "1" : "0",
    (cfg.useLongLong ?? arch.longLongIsDefault) ? "1" : "0",
    cfg.slotIdSize || arch.slotIdSize,
  ].join("") as SlotFlags;
  return arch.slotSize[flags];
}

class Memory {
  memoryUsage: number;
  peakMemoryUsage: number;

  constructor() {
    this.memoryUsage = 0;
    this.peakMemoryUsage = 0;
  }

  alloc(n: number) {
    this.memoryUsage += n;
    this.peakMemoryUsage = Math.max(this.peakMemoryUsage, this.memoryUsage);
  }

  free(n: number) {
    this.memoryUsage -= n;
  }
}

class SlotPoolList {
  private _memory: Memory;
  private _poolCapacity: number;
  private _poolOverhead: number;
  private _initialPoolListCapacity: number;
  private _slotSize: number;
  private _freeSlots: number;
  private _poolCount: number;
  private _poolListCapacity: number;
  private _totalSlots: number;

  constructor(cfg: Config, memory: Memory) {
    this._memory = memory;
    this._poolCapacity = memoryModels[cfg.arch].poolCapacity;
    this._poolOverhead = memoryModels[cfg.arch].poolOverhead;
    this._initialPoolListCapacity = 4; // preallacted in JsonDocument, not on the heap
    this._slotSize = getEffectiveSlotSize(cfg);
    this._freeSlots = 0;
    this._poolCount = 0;
    this._poolListCapacity = this._initialPoolListCapacity;
    this._totalSlots = 0;
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
    this._totalSlots++;
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

  get totalSlots() {
    return this._totalSlots;
  }
}

class JsonDocument {
  private _memory: Memory;
  private _poolList: SlotPoolList;
  private _strings: Record<string, boolean>;
  private _ignoreKeys: boolean;
  private _ignoreValues: boolean;
  private _deduplicateKeys: boolean;
  private _deduplicateValues: boolean;
  private _useLongLong: boolean;
  private _useDouble: boolean;
  private _stringOverhead: number;
  private _overAllocateStrings: boolean;

  constructor(memory: Memory, cfg: Config) {
    this._strings = {};
    this._ignoreKeys = !!cfg.ignoreKeys;
    this._ignoreValues = !!cfg.ignoreValues;
    this._deduplicateKeys = !!cfg.deduplicateKeys;
    this._deduplicateValues = !!cfg.deduplicateValues;
    this._useLongLong = !!cfg.useLongLong;
    this._useDouble = !!cfg.useDouble;

    const arch = memoryModels[cfg.arch];

    this._memory = memory;
    this._poolList = new SlotPoolList(cfg, this._memory);
    this._stringOverhead = arch.stringOverhead;
    if (cfg.stringLengthSize)
      this._stringOverhead += cfg.stringLengthSize - arch.stringLengthSize;
    this._overAllocateStrings = !!cfg.overAllocateStrings;

    this._memory.alloc(arch.documentSize);
  }

  allocSlots(n: number) {
    for (let i = 0; i < n; i++) this._poolList.allocSlot();
  }

  allocString(s: string) {
    if (this._overAllocateStrings) {
      const size = getOverallocatedStringSize(s.length) + this._stringOverhead;
      this._memory.alloc(size);
      this._memory.free(size);
    }
    this._memory.alloc(s.length + this._stringOverhead);
  }

  addArray(n: number) {
    this.allocSlots(n);
  }

  addObjectMember(key: string) {
    this.allocSlots(2);
    if (this._ignoreKeys) return;
    if (this._deduplicateKeys && this._strings[key]) return;
    this.allocString(key);
    this._strings[key] = true;
  }

  addString(s: string) {
    if (this._ignoreValues) return;
    if (this._deduplicateValues && this._strings[s]) return;
    this.allocString(s);
    this._strings[s] = true;
  }

  addNumber(value: number) {
    switch (getCppTypeFor(value)) {
      case "long long":
        if (this._useLongLong) this.allocSlots(1);
        break;
      case "double":
        if (this._useDouble) this.allocSlots(1);
        break;
    }
  }

  addIgnoredKey(s: string) {
    this.allocString(s);
    this._memory.free(s.length + this._stringOverhead);
  }

  shrinkToFit() {
    this._poolList.shrinkToFit();
  }

  get slotCount() {
    return this._poolList.totalSlots;
  }
}

function fillDocument(doc: JsonDocument, value: JsonValue, filter: JsonFilter) {
  if (isJsonArray(value) && filter.allowsArray) {
    doc.addArray(value.length);
    for (let i = 0; i < value.length; i++)
      fillDocument(doc, value[i], filter.getElementFilter());
  }

  if (isJsonObject(value) && filter.allowsObject) {
    for (const key in value) {
      const memberFilter = filter.getMemberFilter(key);
      if (memberFilter.allowsSomething) doc.addObjectMember(key);
      else doc.addIgnoredKey(key);
      fillDocument(doc, value[key], memberFilter);
    }
  }

  if (isJsonString(value) && filter.allowsValue) {
    doc.addString(value);
  }

  if (isJsonNumber(value) && filter.allowsValue) {
    doc.addNumber(value);
  }
}

export function analyze(obj: JsonValue, cfg: Config) {
  const memory = new Memory();
  const doc = new JsonDocument(memory, cfg);
  if (cfg.filter) {
    const filter = new JsonDocument(memory, cfg);
    fillDocument(filter, cfg.filter, new JsonFilter(true));
    filter.shrinkToFit();
    fillDocument(doc, obj, new JsonFilter(cfg.filter));
    doc.shrinkToFit();
  } else {
    fillDocument(doc, obj, new JsonFilter(true));
    doc.shrinkToFit();
  }
  return {
    memoryUsage: memory.memoryUsage,
    peakMemoryUsage: memory.peakMemoryUsage,
    slotCount: doc.slotCount,
  };
}

export function measureNesting(obj: JsonValue): number {
  if (obj instanceof Object === false) return 0;
  let innerNesting = 0;
  Object.values(obj).forEach((value) => {
    innerNesting = Math.max(innerNesting, measureNesting(value));
  });
  return 1 + innerNesting;
}

export function getMaxStringLength(
  obj: JsonValue,
  cfg?: Partial<Config>,
): number {
  if (isJsonArray(obj)) {
    return Math.max(...obj.map((x) => getMaxStringLength(x, cfg)));
  }

  if (isJsonObject(obj)) {
    return Math.max(
      ...(cfg?.ignoreKeys ? [] : Object.keys(obj).map((key) => key.length)),
      ...Object.values(obj).map((x) => getMaxStringLength(x, cfg)),
    );
  }

  if (isJsonString(obj)) {
    if (cfg?.ignoreValues) return 0;
    return obj.length;
  }

  return 0;
}

export function canLoop(input: JsonValue): boolean {
  function areSimilar(a: JsonValue, b: JsonValue): boolean {
    if (a === null || b === null) return true;
    if (isJsonObject(a) && isJsonObject(b)) {
      for (const k in a) {
        if (!(k in b)) return false;
      }
      for (const k in b) {
        if (!(k in a)) return false;
        if (!areSimilar(a[k], b[k])) return false;
      }
    }
    if (isJsonArray(a) && isJsonArray(b)) {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (!areSimilar(a[i], b[i])) return false;
      }
    }
    return typeof a === typeof b;
  }

  if (isJsonArray(input)) {
    if (input.length < 2) return false;
    return input.every(
      (value) => isJsonObject(value) && areSimilar(input[0], value),
    );
  }

  if (isJsonObject(input)) {
    return canLoop(Object.values(input));
  }

  return false;
}

export function getCppTypeFor(value: JsonValue) {
  return getCommonCppTypeFor([value]);
}

function hasShortMantissa(value: number): boolean {
  return value.toExponential().split("e")[0].length < 9;
}

type CppType =
  | "bool"
  | "const char*"
  | "int"
  | "long"
  | "long long"
  | "float"
  | "double";

export function getCommonCppTypeFor(values: JsonValue[]): CppType | undefined {
  if (isJsonBoolean(values[0])) {
    return "bool";
  }

  if (isJsonString(values[0])) {
    return "const char*";
  }

  if (isJsonNumber(values[0])) {
    const nums = values as number[];
    const containsFloat = nums.some((x) => x % 1);
    const max = Math.max(...nums);
    const min = Math.min(...nums);
    if (!containsFloat) {
      if (max < 32000 && min > -32000) return "int";
      if (max < 2000000000 && min > -2000000000) return "long";
      if (max < 9e18 && min > -9e18) return "long long";
    }
    if (
      max < 2e38 &&
      min > -2e38 &&
      nums.every(hasShortMantissa) &&
      (min == 0 || Math.abs(min) > 1e-45)
    )
      return "float";
    return "double";
  }

  if (values[0] === null) {
    return getCommonCppTypeFor(values.slice(1));
  }
}

function needsCppType(
  cpptype: CppType,
  value: JsonValue,
  siblings?: JsonValue[],
): boolean {
  if (isJsonArray(value)) {
    if (canLoop(value)) return needsCppType(cpptype, value[0], value);
    return value.some((x) => needsCppType(cpptype, x));
  }

  if (isJsonObject(value)) {
    return Object.keys(value).some((key) =>
      needsCppType(
        cpptype,
        value[key],
        siblings?.filter((x) => isJsonObject(x)).map((x) => x[key]),
      ),
    );
  }

  return getCommonCppTypeFor(siblings || [value]) == cpptype;
}

export function hasJsonInJsonSyndrome(val: JsonValue): boolean {
  if (isJsonArray(val)) {
    return val.some(hasJsonInJsonSyndrome);
  }

  if (isJsonObject(val)) {
    return Object.values(val).some(hasJsonInJsonSyndrome);
  }

  if (isJsonString(val)) {
    if (val[0] != "[" && val[0] != "{") return false;
    try {
      JSON.parse(val);
      return true;
    } catch {
      return false;
    }
  }

  return false;
}

export const needsDouble = (val: JsonValue) => needsCppType("double", val);
export const needsLongLong = (val: JsonValue) => needsCppType("long long", val);
