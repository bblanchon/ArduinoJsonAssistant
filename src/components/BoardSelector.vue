<template>
  <div
    class="dropdown"
    v-on="{ 'shown.bs.dropdown': focusSearchInput }"
    ref="dropdown"
  >
    <button
      class="btn dropdown-toggle border w-100 d-flex align-items-center justify-content-between"
      type="button"
      data-bs-toggle="dropdown"
      aria-expanded="false"
    >
      <BoardSelectorItem
        v-if="selectedBoard"
        class="flex-fill"
        style="max-width: calc(100% - 2ch)"
        :board="selectedBoard"
      />
      <span v-else class="flex-fill text-start text-truncate text-muted">
        Select a board
      </span>
    </button>
    <div class="dropdown-menu w-100">
      <div class="mx-2 mb-1">
        <input
          type="search"
          class="form-control"
          ref="input"
          :placeholder="`Search among ${Object.values(boards).length} boards`"
          v-model="search"
          spellcheck="false"
          @keydown.enter.prevent.stop="selectFirstBoard"
          @keydown.down.prevent.stop="focusFirstBoard"
          @keydown.up.prevent.stop="focusLastBoard"
        />
        <small class="form-text text-muted" v-if="search.trim()">
          {{ Object.values(filteredBoards).length }} boards found
        </small>
      </div>
      <div class="options">
        <button
          v-for="(board, key) in filteredBoards"
          type="button"
          :key="key"
          class="dropdown-item"
          @click="boardId = key"
        >
          <BoardSelectorItem :board="board" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef } from "vue";

import boards from "@/assets/boards.json";
import { type BoardData, type BoardDatabase } from "@/stores/board";

import BoardSelectorItem from "@/components/BoardSelectorItem.vue";

const boardId = defineModel<string>({ required: true });

const search = ref("");

const selectedBoard = computed<BoardData>(
  () => (boards as BoardDatabase)[boardId.value]!,
);

const filteredBoards = computed<BoardDatabase>(() => {
  const searchText = search.value.toLowerCase().trim();
  if (!searchText) return boards;

  // filter the boards object
  return Object.fromEntries(
    Object.entries(boards).filter(([, board]) =>
      board.name.toLowerCase().includes(searchText),
    ),
  );
});

const inputRef = useTemplateRef("input");
const dropdown = useTemplateRef("dropdown");

function focusSearchInput() {
  search.value = "";
  inputRef.value!.focus();
}

function focusFirstBoard() {
  const btn = dropdown.value!.querySelector(
    ".dropdown-item",
  ) as HTMLButtonElement | null;
  btn?.focus();
}

function focusLastBoard() {
  const btn = dropdown.value!.querySelector(
    ".dropdown-item:last-child",
  ) as HTMLButtonElement | null;
  btn?.focus();
}

function hideDropdown() {
  bootstrap.Dropdown.getOrCreateInstance(dropdown.value!).hide();
}

function selectFirstBoard() {
  const firstBoardKey = Object.keys(filteredBoards.value)[0];
  if (firstBoardKey) {
    boardId.value = firstBoardKey;
    hideDropdown();
  }
}
</script>

<style scoped>
.options {
  max-height: 10em;
  overflow-y: auto;
}
</style>
