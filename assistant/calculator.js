import dataModels from "./architectures.js"

function SizeAccumulator(dataModel) {
  var _size = 0
  var _extraBytes = 0
  var _arrayBaseSize = dataModel.array[0]
  var _arrayItemSize = dataModel.array[1]
  var _objectBaseSize = dataModel.object[0]
  var _objectItemSize = dataModel.object[1]

  this.addJsonArray = function (n) {
    _size += _arrayBaseSize + n * _arrayItemSize
  }

  this.addJsonObject = function (n) {
    _size += _objectBaseSize + n * _objectItemSize
  }

  this.addString = function (s) {
    _extraBytes += s.length + 1
  }

  this.addNull = function () {
    _extraBytes += 5
  }

  this.addOther = function (o) {
    _extraBytes += o.toString().length + 1
  }

  this.extra = function () {
    return _extraBytes
  }

  this.size = function () {
    return _size
  }
}
function fillSizeAccumulator(calc, obj) {
  if (obj instanceof Array) {
    calc.addJsonArray(obj.length)
    for (var i = 0; i < obj.length; i++) fillSizeAccumulator(calc, obj[i])
  } else if (obj instanceof Object) {
    calc.addJsonObject(Object.keys(obj).length)
    for (var key in obj) {
      calc.addString(key)
      fillSizeAccumulator(calc, obj[key])
    }
  } else if (obj === null) {
    calc.addNull()
  } else if (typeof obj === "string") {
    calc.addString(obj)
  } else {
    calc.addOther(obj)
  }
}

export function measureSize(obj, dataModel) {
  if (dataModel === undefined) dataModel = dataModels[0]
  var calc = new SizeAccumulator(dataModel)
  fillSizeAccumulator(calc, obj)
  return [calc.size(), calc.extra()]
}
