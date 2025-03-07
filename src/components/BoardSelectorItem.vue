<template>
  <div class="d-flex align-items-center">
    <span class="flex-fill text-start text-truncate">{{ board.name }}</span>
    <span class="badge bg-primary ms-2">{{ board.bits }}-bit</span>
    <span class="badge bg-secondary ms-1">{{ formatBytes(board.ram) }}</span>
  </div>
</template>

<script setup lang="ts">
import bytes from "bytes";
import { type BoardData } from "@/stores/board";

defineProps<{
  board: BoardData;
}>();

const formatBytes = (value: number) =>
  bytes.format(value, { decimalPlaces: 1 });
</script>
