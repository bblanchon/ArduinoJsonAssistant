<template>
  <div class="card">
    <h2 class="h4 card-header bg-primary text-white">Step 2: JSON</h2>

    <div class="card-body resize-lg-vertical d-flex flex-column">
      <p v-if="isDownloading">Downloading example...</p>
      <p v-else>
        Examples:
        <a
          href="#"
          @click.prevent="
            downloadSettings(
              `${baseUrl}/v6/assistant/examples/openweathermap.json`
            )
          "
          >OpenWeatherMap</a
        >,
        <a
          href="#"
          @click.prevent="
            downloadSettings(`${baseUrl}/v6/assistant/examples/reddit.json`)
          "
          >Reddit</a
        >
      </p>
      <div class="row flex-fill">
        <div class="col-lg d-flex flex-column">
          <template v-if="isSerializing">
            <h3 class="h5">Output</h3>
            <small class="text-muted"
              >Enter here the JSON document you want your program to
              generate.</small
            >
          </template>
          <template v-else>
            <h3 class="h5">Input</h3>
            <small class="text-muted"
              >Enter here the JSON document you want your program to
              parse.</small
            >
          </template>
          <textarea
            class="form-control flex-fill resize-none"
            :class="{ 'is-invalid': inputError }"
            rows="10"
            :value="inputJson"
            @input="setInputJson($event.target.value)"
          ></textarea>
          <div v-if="inputError" class="invalid-feedback">
            {{ inputError }}
          </div>
          <small v-else class="d-flex justify-content-between">
            <span class="form-text text-muted"
              >Input length: {{ inputJson.length }}</span
            >
            <a
              href="#"
              class="btn btn-sm btn-primary mt-1"
              @click.prevent="prettifyInput"
              >Prettify</a
            >
          </small>
        </div>
        <div v-if="filterEnabled" class="col-lg d-flex flex-column">
          <h3 class="h5">Filter</h3>
          <small class="text-muted"
            >Enter here the filter you want to apply to your input
            document.</small
          >
          <textarea
            class="form-control flex-fill resize-none"
            :class="{ 'is-invalid': filterError }"
            rows="10"
            @input="setFilterJson($event.target.value)"
            :value="filterJson"
          ></textarea>
          <div v-if="filterError" class="invalid-feedback">
            {{ filterError }}
          </div>
          <small v-else class="text-right">
            <a
              href="#"
              class="btn btn-sm btn-primary mt-1"
              @click.prevent="prettifyFilter"
              >Prettify</a
            >
          </small>
        </div>
        <div v-if="filterEnabled" class="col-lg d-flex flex-column">
          <h3 class="h5">Filtered input</h3>
          <small class="text-muted"
            >See here the result of applying the filter to your input
            document.</small
          >
          <textarea
            class="form-control flex-fill resize-none"
            rows="10"
            readonly
            v-model="filteredInputJson"
          ></textarea>
        </div>
      </div>
      <p
        v-if="isDeserializing && nestingLevel > cpuInfo.nestingLimit"
        class="short-warning mt-4"
      >
        This document is deeply nested; don't forget to pass
        <a :href="`${baseUrl}/v6/api/json/deserializejson/#nesting-limit`"
          ><code
            >DeserializationOption::NestingLimit({{ nestingLevel }})</code
          ></a
        >.
      </p>
      <p
        v-if="
          needsLongLong && cpuInfo.useLongLong && !cpuInfo.useLongLong.default
        "
        class="short-warning mt-4"
      >
        This document contains <code>long&nbsp;long</code>; you should define
        <a :href="`${baseUrl}/v6/api/config/use_long_long/`"
          ><code>ARDUINOJSON_USE_LONG_LONG</code></a
        >
        to <code>1</code>
      </p>
      <p
        v-if="needsDouble && cpuInfo.useDouble && !cpuInfo.useDouble.default"
        class="short-warning mt-4"
      >
        This document contains <code>double</code>; you should define
        <a :href="`${baseUrl}/v6/api/config/use_double/`"
          ><code>ARDUINOJSON_USE_DOUBLE</code></a
        >
        to <code>1</code>
      </p>
      <p v-if="needsDouble && !cpuInfo.useDouble" class="short-warning mt-4">
        This document contains double-precision floating points values but the
        selected platform ({{ cpuInfo.label }}) doesn't support them (<code
          >double</code
        >
        is the same as <code>float</code>).
      </p>
      <p v-if="hasJsonInJsonSyndrome" class="short-warning mt-4">
        This document suffers from the <q>JSON in JSON</q> syndrome, so you may
        need to call
        <a
          v-if="isDeserializing"
          :href="`${baseUrl}/v6/api/json/deserializejson/`"
          ><code>deserializeJson()</code></a
        >
        <a v-else :href="`${baseUrl}/v6/api/json/serializejson/`"
          ><code>serializeJson()</code></a
        >
        multiple time.
        <strong
          >The ArduinoJson Assistant doesn't support this scenario for the
          moment.</strong
        >
      </p>
    </div>

    <div class="card-footer">
      <div class="d-flex justify-content-between">
        <RouterLink class="btn btn-secondary" :to="{ name: 'step1' }">
          Previous
        </RouterLink>
        <RouterLink
          class="btn btn-primary"
          :class="{ disabled: hasErrors }"
          :to="{ name: 'step3' }"
        >
          Next: Size
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script>
import { RouterLink } from "vue-router";
import { mapActions, mapGetters, mapMutations, mapState } from "vuex";
import { hasJsonInJsonSyndrome, measureNesting } from "@/assistant/analyzer";
import { needsDouble, needsLongLong } from "@/assistant/analyzer";

export default {
  components: { RouterLink },
  inject: ["baseUrl"],
  data() {
    return {
      isDownloading: false,
    };
  },
  beforeUnmount() {
    this.report({
      action: "json",
      label: "Set JSON",
      value: this.inputJson.length,
    });
  },
  computed: {
    ...mapState([
      "filter",
      "filterError",
      "filterJson",
      "input",
      "inputError",
      "inputJson",
    ]),
    ...mapGetters([
      "cpuInfo",
      "filteredInput",
      "filterEnabled",
      "hasErrors",
      "hasJsonInJsonSyndrome",
      "isDeserializing",
      "isSerializing",
    ]),
    filteredInputJson() {
      return JSON.stringify(this.filteredInput, null, 2);
    },
    hasJsonInJsonSyndrome() {
      return hasJsonInJsonSyndrome(this.filteredInput);
    },
    needsDouble() {
      return needsDouble(this.filteredInput);
    },
    needsLongLong() {
      return needsLongLong(this.filteredInput);
    },
    nestingLevel() {
      return measureNesting(this.input);
    },
  },
  methods: {
    ...mapActions(["report"]),
    ...mapMutations(["setInputJson", "setFilterJson", "setSettings"]),
    prettifyInput() {
      this.setInputJson(JSON.stringify(this.input, null, 2));
    },
    prettifyFilter() {
      this.setFilterJson(JSON.stringify(this.filter, null, 2));
    },
    downloadSettings(url) {
      const request = new XMLHttpRequest();

      const that = this;
      request.onload = function () {
        that.isDownloading = false;
        that.setSettings(JSON.parse(this.responseText));
      };
      request.open("get", url);
      request.send();
      this.isDownloading = true;
    },
  },
};
</script>
