import { generateExpression } from "./assistant/SizeExpression.js"
import dataModels from "./assistant/architectures.js"
import { measureSize } from "./assistant/calculator.js"
import { generateParsingProgram } from "./assistant/parsingProgram.js"
import { generateSerializingProgram } from "./assistant/serializingProgram.js"
import examples from "./assistant/examples.js"

var inputText = document.getElementById("assistant-input")
var inputLength = document.getElementById("assistant-input-length")

function onInputChanged() {
  results.style.display = "none"
  error.style.visibility = "hidden"
  $parserDiv.style.display = "none"
  $serializerDiv.style.display = "none"

  var parsedJson
  try {
    inputLength.innerText = inputText.value.length
    parsedJson = JSON.parse(inputText.value)
  } catch (ex) {
    error.innerText = "ERROR: " + ex.message
    error.style.visibility = "visible"
    return
  }

  var expression = generateExpression(parsedJson)

  $result_expr.innerText = expression

  var extraBytes

  dataModels.forEach(function (dataModel, rowIndex) {
    var size = measureSize(parsedJson, dataModel)
    extraBytes = size[1]
    var row = $result_table.rows[rowIndex] || $result_table.insertRow(row)
    var name_cell = row.cells[0] || row.insertCell(0)
    name_cell.innerHTML = dataModel.architectures.join("<br>")
    var size_cell = row.cells[1] || row.insertCell(1)
    size_cell.className = "align-middle"
    size_cell.innerHTML =
      "<code>" +
      size[0] +
      "+" +
      size[1] +
      " = <b>" +
      (size[0] + size[1]) +
      "</b></code>"
  })
  results.style.display = "block"

  $extra_bytes.innerText = extraBytes

  $parserCode.innerHTML = generateParsingProgram({
    root: parsedJson,
    expression: expression,
    extraBytes: extraBytes
  })

  $("#assistant-long-long-alert").toggle(
    $parserCode.innerHTML.indexOf("long long ") >= 0
  )
  $parserDiv.style.display = "block"

  $serializerCode.innerHTML = generateSerializingProgram({
    root: parsedJson,
    expression: expression
  })
  $serializerDiv.style.display = "block"
}

inputText.addEventListener("input", onInputChanged)

function setJsonInput(obj) {
  inputText.value = JSON.stringify(obj, undefined, 2)
  onInputChanged()
}

setJsonInput(examples.arduinoJson)

$wundergroundAnchor.onclick = function (e) {
  setJsonInput(examples.wunderground)
  e.preventDefault()
}

$openweathermapAnchor.onclick = function (e) {
  setJsonInput(examples.openweathermap)
  e.preventDefault()
}
