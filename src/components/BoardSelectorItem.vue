<template>
  <div class="d-flex align-items-center">
    <span class="flex-fill text-left">{{ board.name }}</span>
    <span class="badge badge-primary ml-2">{{ board.bits }}-bit</span>
    <span class="badge badge-secondary ml-1">{{ formatBytes(board.ram) }}</span>
  </div>
</template>

<script setup>
import bytes from "bytes";

defineProps({
  board: Object,
});

const formatBytes = (value) => bytes.format(value, { decimalPlaces: 1 });
</script>
