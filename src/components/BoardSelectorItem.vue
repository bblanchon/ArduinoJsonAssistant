<template>
  <div class="d-flex align-items-center">
    <span class="flex-fill text-start text-truncate">{{ board.name }}</span>
    <span class="badge bg-primary ms-2">{{ board.bits }}-bit</span>
    <span class="badge bg-secondary ms-1">{{ formatBytes(board.ram) }}</span>
  </div>
</template>

<script setup>
import bytes from "bytes";

defineProps({
  board: Object,
});

const formatBytes = (value) => bytes.format(value, { decimalPlaces: 1 });
</script>
