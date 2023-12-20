<template>
  <div class="position-relative" :class="{ 'is-invalid': !!error }">
    <textarea
      class="form-control resize-none"
      :class="{ 'is-invalid': !!error }"
      rows="15"
      spellcheck="false"
      v-model="text"
      :readonly="readonly"
      v-bind="$attrs"
      data-gramm="false"
    ></textarea>
    <button
      v-if="!readonly"
      class="btn btn-sm btn-primary prettify-btn"
      @click.prevent="prettify"
      :disabled="prettyText == text"
      v-tooltip="'Prettify JSON'"
    >
      <PrettifyIcon />
    </button>
  </div>
  <div v-if="error" class="invalid-feedback">
    {{ error }}
  </div>
</template>

<script>
import PrettifyIcon from "bootstrap-icons/icons/magic.svg";

export default {
  emits: ["update:modelValue"],
  inheritAttrs: false,
  components: { PrettifyIcon },
  props: {
    modelValue: {
      type: String,
      default: "",
    },
    readonly: {
      type: Boolean,
      default: false,
    },
  },
  methods: {
    prettify() {
      this.$emit("update:modelValue", this.prettyText);
    },
  },
  computed: {
    text: {
      set(value) {
        this.$emit("update:modelValue", value);
      },
      get() {
        return this.modelValue;
      },
    },
    prettyText() {
      try {
        return JSON.stringify(JSON.parse(this.text), null, 2);
      } catch (e) {
        return this.text;
      }
    },
    error() {
      if (!this.text.trim()) return "Please enter a JSON document";
      try {
        JSON.parse(this.text);
        return null;
      } catch (e) {
        return e.message;
      }
    },
  },
};
</script>

<style scoped>
textarea {
  overflow-x: auto;
  overflow-y: scroll;
}
.prettify-btn {
  position: absolute;
  right: 25px;
  bottom: 10px;
  width: 27px;
  height: 27px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  box-shadow: 1px 1px 5px 0 rgba(0, 0, 0, 0.4);
}
</style>
