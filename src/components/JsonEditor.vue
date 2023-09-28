<template>
  <div class="position-relative" :class="{ 'is-invalid': !!error }">
    <textarea
      class="form-control resize-none"
      :class="{ 'is-invalid': !!error }"
      rows="10"
      spellcheck="false"
      v-model="text"
      :readonly="readonly"
    ></textarea>
    <button
      v-if="!readonly"
      class="btn btn-sm btn-primary prettify-btn"
      @click.prevent="prettify"
      :disabled="prettyText == text"
    >
      🧹
    </button>
  </div>
  <div v-if="error" class="invalid-feedback">
    {{ error }}
  </div>
</template>

<script>
export default {
  emits: ["update:modelValue"],
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
.prettify-btn {
  position: absolute;
  right: 25px;
  bottom: 10px;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  box-shadow: 1px 1px 5px 0 rgba(0, 0, 0, 0.4);
}
</style>
