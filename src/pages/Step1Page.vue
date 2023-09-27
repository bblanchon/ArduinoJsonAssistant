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
            <span class="col-sm-2 col-form-label">Mode</span>
            <div class="col-sm-10">
              <div class="form-check">
                <input
                  class="form-check-input"
                  type="radio"
                  v-model="selectedMode"
                  value="deserialize"
                  id="deserialize-radio"
                />
                <label class="form-check-label" for="deserialize-radio">
                  Deserialize
                </label>
              </div>
              <div class="form-check">
                <input
                  class="form-check-input"
                  type="radio"
                  v-model="selectedMode"
                  name="mode"
                  value="serialize"
                  id="serialize-radio"
                />
                <label class="form-check-label" for="serialize-radio">
                  Serialize
                </label>
              </div>
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
            </div>
          </div>
        </form>
        <div class="d-none d-lg-block col-4 mb-2" id="assistant-sponsors">
          <div class="bg-light p-2 h-100">
            <div class="text-center text-muted">Our sponsors</div>
            <div class="m-4" v-for="sponsor in sponsors" :key="sponsor">
              <a :href="sponsor.url" rel="sponsored" target="_blank"
                ><img
                  class="img img-fluid"
                  :src="sponsor.image.url"
                  :alt="sponsor.name"
              /></a>
            </div>
          </div>
        </div>
      </div>
      <p class="short-tip">
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
import { useStore } from "@/store";

export default {
  inject: ["version", "baseUrl", "sponsors"],
  data() {
    return {
      cpuInfos,
    };
  },
  beforeRouteLeave(to) {
    if (to.name == "step2") {
      window.plausible("ArduinoJson Assistant: Configuration", {
        props: {
          mode: this.mode,
          cpu: this.cpuInfos[this.cpu].label,
          type: this.ioTypes[this.ioTypeId].label,
        },
      });
    }
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
    selectedMode: {
      get() {
        return this.mode;
      },
      set(value) {
        this.selectMode(value);
      },
    },
  },
  methods: mapActions(useStore, ["selectCpu", "selectMode", "selectIoType"]),
};
</script>
