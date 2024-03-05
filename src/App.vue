<template>
  <div class="alert alert-warning" :class="{ invisible: !error }" role="alert">
    {{ error }}
  </div>
  <div class="row">
    <div class="col-md-6">
      <div class="card">
        <h4 class="card-header bg-primary text-white">Input</h4>
        <div class="card-body">
          <p>Examples:
            <a href="#" @click.prevent="setExample(examples.openweathermap)">OpenWeatherMap</a>,
            <a href="#" @click.prevent="setExample(examples.wunderground)">Weather Underground</a>
          </p>
          <textarea class="form-control" rows=20 v-model="input"></textarea>
          <p class="text-muted">Input length: {{ input.length }}</p>
        </div>
      </div>
    </div>
    <div class="col-md-6" v-if="!error">
      <div class="card">
        <h4 class="card-header bg-success text-white">Memory pool size</h4>
        <div class="card-body">
          <h3>Expression</h3>
          <p><code v-html="expression"></code></p>
          <h3>Additional bytes for input duplication</h3>
          <p><code>{{ extraBytes }}</code></p>
          <table class="table table-hover">
            <thead>
              <tr>
                <th>Platform</th>
                <th>Size</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in rows" :key="row">
                <td>
                  <ul class="list-unstyled">
                    <li v-for="arch in row.architectures" :key="arch">{{ arch }}</li>
                  </ul>
                </td>
                <td>
                  <code>{{ row.slotsSizes }} + {{ row.extraBytes }} = <b>{{ row.totalSize }}</b></code>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <p class="short-warning mt-2">Sizes can be significantly larger on a computer.</p>
    </div>
  </div>
  <div class="alert alert-warning my-4" v-if="longLongAlert">
    ⚠️ The programs below assume you defined <a
      href="https://arduinojson.org/v5/api/config/use_long_long/"><code>ARDUINOJSON_USE_LONG_LONG</code></a> to
    <code>1</code>
  </div>
  <div class="row">
    <div class="col-12 my-2" v-if="!error">
      <div class="card">
        <h4 class="card-header bg-success text-white">Parsing program</h4>
        <div class="card-body">
          <div class="highlight">
            <pre><code v-html="parserCode" class="highlight"></code></pre>
          </div>
          <p class="mb-0">See also: <a href="https://arduinojson.org/v5/doc/deserialization/">Deserialization
              Tutorial</a></p>
        </div>
      </div>
    </div>
    <div class="col-12 my-2" v-if="!error">
      <div class="card">
        <h4 class="card-header bg-success text-white">Serializing program</h4>
        <div class="card-body">
          <div class="highlight">
            <pre><code v-html="serializerCode"></code></pre>
          </div>
          <p class="mb-0">See also: <a href="https://arduinojson.org/v5/doc/serialization/">Serialization Tutorial</a>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { generateExpression } from "./assistant/SizeExpression.js"
import dataModels from "./assistant/architectures.js"
import { measureSize } from "./assistant/calculator.js"
import { generateParsingProgram } from "./assistant/parsingProgram.js"
import { generateSerializingProgram } from "./assistant/serializingProgram.js"
import examples from "./assistant/examples.js"
import { ref, watch, computed, watchEffect } from "vue"

const input = ref('')
const error = ref(null)
const parsedJson = ref()

watchEffect(() => {
  try {
    parsedJson.value = JSON.parse(input.value)
    error.value = ""
  } catch (ex) {
    parsedJson.value = null
    error.value = "ERROR: " + ex.message
  }
})

const expression = computed(() => generateExpression(parsedJson.value))

const extraBytes = computed(() => measureSize(parsedJson.value, dataModels[0])[1])

const rows = computed(() => dataModels.map((dataModel) => {
  const size = measureSize(parsedJson.value, dataModel)
  return {
    architectures: dataModel.architectures,
    slotsSizes: size[0],
    extraBytes: size[1],
    totalSize: size[0] + size[1]
  }
}))

const parserCode = computed(() => generateParsingProgram({
  root: parsedJson.value,
  expression: expression,
  extraBytes: extraBytes
}))

const serializerCode = computed(() => generateSerializingProgram({
  root: parsedJson.value,
  expression: expression
}))

const longLongAlert = computed(() => parserCode.value.indexOf("long long ") >= 0)

function setExample(obj) {
  input.value = JSON.stringify(obj, undefined, 2)
}

setExample(examples.arduinoJson)
</script>