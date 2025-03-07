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

<script setup lang="ts">
import PrettifyIcon from "bootstrap-icons/icons/magic.svg";
import { computed } from "vue";

const text = defineModel<string>({ default: "" });

defineProps<{
  readonly?: boolean;
}>();

defineOptions({
  inheritAttrs: false,
});

const prettyText = computed<string>(() => {
  try {
    return JSON.stringify(JSON.parse(text.value), null, 2);
  } catch {
    return text.value;
  }
});

function prettify() {
  text.value = prettyText.value;
}

const error = computed<string | null>(() => {
  if (!text.value.trim()) return "Please enter a JSON document";
  try {
    JSON.parse(text.value);
    return null;
  } catch (e: any) {
    return e.message;
  }
});
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
