<template>
  <div class="card">
    <h2 class="h4 card-header bg-primary text-white">Step 1: Configuration</h2>

    <div class="card-body">
      <div class="row">
        <form class="col-lg-8 mb-4">
          <div class="form-group row">
            <label for="cpu-selector" class="col-sm-3 col-form-label"
              >Board</label
            >
            <div class="col-sm-9">
              <BoardSelector
                :model-value="cpu"
                @update:model-value="selectCpu"
                id="cpu-selector"
              />
            </div>
          </div>
          <div class="form-group row">
            <span class="col-sm-3 col-form-label">Mode</span>
            <div class="col-sm-9">
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
            <label for="io-type" class="col-sm-3 col-form-label">
              {{ ioLabel }}
            </label>
            <div class="col-sm-9">
              <select id="io-type" class="form-control" v-model="ioType">
                <option v-for="(name, id) in ioTypeNames" :key="id" :value="id">
                  {{ name }}
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
import { mapState, mapActions, mapWritableState } from "pinia";
import boards from "@/assets/boards.json";
import { useSettingsStore } from "@/stores/settings";

export default {
  inject: ["version", "sponsors"],
  data() {
    return {
      boards,
    };
  },
  beforeRouteLeave(to) {
    if (to.name == "step2") {
      window.plausible("ArduinoJson Assistant: Configuration", {
        props: {
          mode: this.mode,
          board: this.boards[this.cpu].name,
          type: this.ioTypeNames[this.ioType],
        },
      });
    }
  },
  computed: {
    ...mapState(useSettingsStore, ["ioTypeNames", "cpu", "mode"]),
    ...mapWritableState(useSettingsStore, ["ioType"]),
    selectedMode: {
      get() {
        return this.mode;
      },
      set(value) {
        this.selectMode(value);
      },
    },
    ioLabel() {
      return {
        serialize: "Output",
        deserialize: "Input",
      }[this.mode];
    },
  },
  methods: mapActions(useSettingsStore, ["selectCpu", "selectMode"]),
};
</script>
