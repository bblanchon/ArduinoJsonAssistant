<template>
  <button
    v-show="value != defaultValue"
    type="button"
    class="btn btn-outline-warning btn-sm py-0 mx-1"
    style="margin-top: -3px"
    @click="value = defaultValue"
  >
    Reset
  </button>
</template>

<script setup lang="ts">
type ValueType = boolean | number;

const value = defineModel<ValueType>();

defineProps<{
  defaultValue: ValueType;
}>();
</script>
