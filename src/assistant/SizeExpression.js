function SizeExpression() {
  var arrays = []
  var objects = []

  this.addJsonArray = function (size) {
    if (arrays[size]) arrays[size]++
    else arrays[size] = 1
  }

  this.addJsonObject = function (size) {
    if (objects[size]) objects[size]++
    else objects[size] = 1
  }

  this.toString = function () {
    var elements = []
    for (var size in arrays) {
      var count = arrays[size]
      if (count > 1) elements.push(count + "*JSON_ARRAY_SIZE(" + size + ")")
      else elements.push("JSON_ARRAY_SIZE(" + size + ")")
    }
    for (var size in objects) {
      var count = objects[size]
      if (count > 1) elements.push(count + "*JSON_OBJECT_SIZE(" + size + ")")
      else elements.push("JSON_OBJECT_SIZE(" + size + ")")
    }
    if (elements.length > 0) return elements.join(" + ")
    else return "0"
  }
}

function fillExpression(expr, obj) {
  if (obj instanceof Array) {
    expr.addJsonArray(obj.length)
    for (var i = 0; i < obj.length; i++) fillExpression(expr, obj[i])
  } else if (obj instanceof Object) {
    expr.addJsonObject(Object.keys(obj).length)
    for (var key in obj) fillExpression(expr, obj[key])
  }
}

export function generateExpression(obj) {
  var expr = new SizeExpression()
  fillExpression(expr, obj)
  return expr.toString()
}
