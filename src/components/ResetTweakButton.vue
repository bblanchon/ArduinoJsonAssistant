<template>
  <button
    v-show="modelValue != defaultValue"
    type="button"
    class="btn btn-outline-warning btn-sm py-0 mx-1"
    style="margin-top: -3px"
    @click="$emit('update:modelValue', defaultValue)"
  >
    Reset
  </button>
</template>

<script>
export default {
  props: ["modelValue", "defaultValue"],
};
</script>
