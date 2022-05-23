<template>
  <div class="card">
    <h2 class="h4 card-header bg-primary text-white">Step 1: Configuration</h2>

    <div class="card-body">
      <div class="row">
        <form class="col-lg-8 mb-4">
          <div class="form-group row">
            <label for="cpu-selector" class="col-sm-2 col-form-label"
              >Processor</label
            >
            <div class="col-sm-10">
              <select
                id="cpu-selector"
                class="form-control"
                :value="cpu"
                @input="selectCpu($event.target.value)"
              >
                <option
                  v-for="(value, key) in cpuInfos"
                  :value="key"
                  :key="key"
                >
                  {{ value.label }}
                </option>
              </select>
            </div>
          </div>
          <div class="form-group row">
            <label for="mode-selector" class="col-sm-2 col-form-label"
              >Mode</label
            >
            <div class="col-sm-10">
              <select
                id="mode-selector"
                class="form-control"
                :value="mode"
                @input="selectMode($event.target.value)"
              >
                <option value="deserialize">Deserialize</option>
                <option value="deserialize-filter">
                  Deserialize and filter
                </option>
                <option value="serialize">Serialize</option>
              </select>
            </div>
          </div>
          <div class="form-group row">
            <label for="io-type" class="col-sm-2 col-form-label">
              {{ isSerializing ? "Output" : "Input" }} type
            </label>
            <div class="col-sm-10">
              <select
                id="io-type"
                class="form-control"
                :value="ioTypeId"
                @input="selectIoType($event.target.value)"
              >
                <option
                  v-for="(type, key) in ioTypes"
                  :key="key"
                  :value="key"
                  :disabled="type.disabled"
                >
                  {{ type.label }}
                </option>
              </select>
              <small
                v-if="ioTypeInfo"
                class="form-text text-muted"
                v-html="ioTypeInfo"
              ></small>
            </div>
          </div>
        </form>
        <div class="d-none d-lg-block col-4 mb-2" id="assistant-sponsors">
          <div class="bg-light p-2 h-100">
            <div class="text-center text-muted">Our sponsors</div>
            <div class="m-4" v-for="sponsor in sponsors" :key="sponsor">
              <a :href="sponsor.url" rel="sponsored"
                ><img
                  class="img img-fluid"
                  :src="sponsor.image.url"
                  :alt="sponsor.name"
              /></a>
            </div>
          </div>
        </div>
      </div>
      <p class="short-warning" v-if="adBlocked">
        <strong>Your adblocker is blocking web analytics.</strong>
        Please consider whitelisting <code>arduinojson.org</code>
      </p>
      <p class="short-tip" v-else>
        This is the Assistant for ArduinoJson {{ version }}. Make sure the same
        version is installed on your computer.
      </p>
    </div>

    <div class="card-footer">
      <div class="d-flex justify-content-between">
        &nbsp;
        <RouterLink class="btn btn-primary" :to="{ name: 'step2' }"
          >Next: JSON</RouterLink
        >
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapActions } from "pinia";
import cpuInfos from "@/assistant/cpus";
import { RouterLink } from "vue-router";
import { useStore } from "@/store";

export default {
  components: { RouterLink },
  inject: ["version", "baseUrl", "sponsors"],
  data() {
    return {
      adBlocked: false,
      cpuInfos,
    };
  },
  mounted() {
    if (window.google_tag_data === undefined) {
      this.adBlocked = true;
    }
  },
  beforeUnmount() {
    this.report({ action: "config", label: "Set configuration" });
  },
  computed: {
    ...mapState(useStore, [
      "isDeserializing",
      "isSerializing",
      "cpuInfo",
      "ioTypes",
      "ioType",
      "cpu",
      "mode",
      "ioTypeId",
    ]),
    ioTypeInfo() {
      switch (this.ioTypeId) {
        case "charPtr":
        case "charArray":
          return (
            this.isDeserializing &&
            "Uses the zero-copy mode: the <code>JsonDocument</code> stores pointer instead of copies of strings"
          );
        case "constCharPtr":
        case "arduinoString":
        case "stdString":
          return (
            this.isDeserializing &&
            "This is most likely a bad choice, prefer <code>char*</code> or stream"
          );
        case "arduinoStream":
          return `This is the most memory efficient option, but not the fastest; <a href="${this.baseUrl}/v6/how-to/improve-speed/">see this page if your program is slow</a>.`;
        default:
          return null;
      }
    },
  },
  methods: mapActions(useStore, [
    "selectCpu",
    "selectMode",
    "selectIoType",
    "report",
  ]),
};
</script>
