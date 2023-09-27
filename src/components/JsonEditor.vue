<template>
  <textarea
    class="form-control flex-fill resize-none"
    :class="{ 'is-invalid': !!error }"
    rows="10"
    spellcheck="false"
    v-model="text"
    :readonly="readonly"
  ></textarea>
  <div v-if="error" class="invalid-feedback">
    {{ error }}
  </div>
  <div v-else-if="!readonly" class="text-right">
    <button
      class="btn btn-sm btn-primary mt-1"
      @click.prevent="prettify"
      :disabled="!!error"
    >
      Prettify
    </button>
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
      this.$emit(
        "update:modelValue",
        JSON.stringify(JSON.parse(this.modelValue), null, 2),
      );
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
