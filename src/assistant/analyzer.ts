import memoryModels from "@/assets/memoryModels.json";
import { JsonFilter } from "./filter";
import {
  isJsonArray,
  isJsonNumber,
  isJsonObject,
  isJsonString,
  type JsonValue,
} from "./json";
import { getCppTypeFor } from "./cpptypes";

export function getOverallocatedStringSize(s: number) {
  // [0-31] -> 31
  // [32-63] -> 63
  // [64-127] -> 127
  // ...
  let n = 31;
  while (n < s) n = n * 2 + 1;
  return n;
}

function isTinyString(s: string) {
  return s.length <= 3 && !s.includes("\u0000");
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
  private memory: Memory;
  private cfg: Config;
  private poolList: SlotPoolList;
  private strings: Set<string>;
  private stringOverhead: number;

  constructor(memory: Memory, cfg: Config) {
    this.memory = memory;
    this.cfg = cfg;
    this.strings = new Set();
    this.poolList = new SlotPoolList(cfg, memory);

    const arch = memoryModels[cfg.arch];

    this.stringOverhead = arch.stringOverhead;
    if (cfg.stringLengthSize)
      this.stringOverhead += cfg.stringLengthSize - arch.stringLengthSize;

    this.memory.alloc(arch.documentSize);
  }

  getStringSize(s: string, { overAllocate }: { overAllocate?: boolean } = {}) {
    let length = s.length;
    if (overAllocate) length = getOverallocatedStringSize(length);
    return length + this.stringOverhead;
  }

  allocSlots(n: number) {
    for (let i = 0; i < n; i++) this.poolList.allocSlot();
  }

  allocTempString(s: string) {
    const size = this.getStringSize(s, {
      overAllocate: this.cfg.overAllocateStrings,
    });
    this.memory.alloc(size);
    this.memory.free(size);
  }

  allocString(
    s: string,
    opt: { overAllocate?: boolean; dontStore?: boolean; deduplicate?: boolean },
  ) {
    // when deserializing, we store the string in a buffer, before deciding if we keep it
    if (opt.overAllocate) this.allocTempString(s);

    // if the string is small enough, we can store it in the slot
    if (isTinyString(s)) return;

    // when serializing, we can store strings as pointers
    if (opt.dontStore) return;

    // check if the string is already stored
    if (opt.deduplicate && this.strings.has(s)) return;

    // all checks passed, we can store the string
    this.memory.alloc(this.getStringSize(s));
    this.strings.add(s);
  }

  addArray(n: number) {
    this.allocSlots(n);
  }

  addObjectMember(key: string) {
    this.allocSlots(2);
    this.allocString(key, {
      overAllocate: this.cfg.overAllocateStrings,
      dontStore: this.cfg.ignoreKeys,
      deduplicate: this.cfg.deduplicateKeys,
    });
  }

  addString(s: string) {
    this.allocString(s, {
      overAllocate: this.cfg.overAllocateStrings,
      dontStore: this.cfg.ignoreValues,
      deduplicate: this.cfg.deduplicateValues,
    });
  }

  addNumber(value: number) {
    switch (getCppTypeFor(value)) {
      case "long long":
        if (this.cfg.useLongLong) this.allocSlots(1);
        break;
      case "double":
        if (this.cfg.useDouble) this.allocSlots(1);
        break;
    }
  }

  shrinkToFit() {
    this.poolList.shrinkToFit();
  }

  get slotCount() {
    return this.poolList.totalSlots;
  }
}

function fillDocument(doc: JsonDocument, value: JsonValue, filter: JsonFilter) {
  if (!filter.allows(value)) return;

  if (isJsonArray(value)) {
    doc.addArray(value.length);
    for (let i = 0; i < value.length; i++)
      fillDocument(doc, value[i], filter.getElementFilter());
  }

  if (isJsonObject(value)) {
    for (const key in value) {
      const memberFilter = filter.getMemberFilter(key);
      if (memberFilter.allows(value[key])) doc.addObjectMember(key);
      else doc.allocTempString(key);
      fillDocument(doc, value[key], memberFilter);
    }
  }

  if (isJsonString(value)) {
    doc.addString(value);
  }

  if (isJsonNumber(value)) {
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
