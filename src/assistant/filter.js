export function JsonFilter(value) {
  this.mode =
    value instanceof Array
      ? "array"
      : value instanceof Object
      ? "object"
      : value === true
      ? "accept"
      : "reject";

  this.getMemberFilter = function (key) {
    switch (this.mode) {
      case "accept":
        return new JsonFilter(true);

      case "object":
        return new JsonFilter(key in value ? value[key] : value["*"]);

      default:
        return new JsonFilter(false);
    }
  };

  this.getElementFilter = function () {
    switch (this.mode) {
      case "accept":
        return new JsonFilter(true);
      case "array":
        return new JsonFilter(value[0]);
      default:
        return new JsonFilter(false);
    }
  };

  this.allowsArray = this.mode == "array" || this.mode == "accept";
  this.allowsObject = this.mode == "object" || this.mode == "accept";
  this.allowsValue = this.mode == "accept";
  this.allowsSomething = this.mode !== "reject";

  this.filterDocument = function (input) {
    switch (this.mode) {
      case "reject":
        return null;
      case "accept":
        return input;

      case "array": {
        if (!Array.isArray(input)) return null;
        const elementFilter = this.getElementFilter();
        if (elementFilter.mode === "reject") return [];
        return input.map((el) => elementFilter.filterDocument(el));
      }

      case "object": {
        const output = {};
        for (const k in input) {
          if (k in input) {
            const memberFilter = this.getMemberFilter(k);
            const memberValue = memberFilter.filterDocument(input[k]);
            if (memberValue) output[k] = memberValue;
          }
        }
        return output;
      }
    }
  };
}

export function makeJsonFilter(filter) {
  return new JsonFilter(filter);
}

export function applyFilter(input, filter) {
  return new JsonFilter(filter).filterDocument(input);
}
