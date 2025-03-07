<template>
  <div class="dropdown" v-on="{ 'shown.bs.dropdown': focusSearchInput }">
    <button
      class="btn dropdown-toggle border w-100 d-flex align-items-center justify-content-between"
      type="button"
      data-bs-toggle="dropdown"
      aria-expanded="false"
    >
      <BoardSelectorItem
        v-if="selectedBoard"
        class="flex-fill"
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
          @click="$emit('update:modelValue', key)"
        >
          <BoardSelectorItem :board="board" />
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import boards from "@/assets/boards.json";
import { type BoardDatabase } from "@/stores/board";

import BoardSelectorItem from "@/components/BoardSelectorItem.vue";

export default {
  components: { BoardSelectorItem },
  props: {
    modelValue: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      boards: boards as BoardDatabase,
      search: "",
    };
  },
  computed: {
    selectedBoard() {
      return this.boards[this.modelValue];
    },
    filteredBoards() {
      const search = this.search.toLowerCase().trim();
      if (!search) return this.boards;

      // filter the boards object
      return Object.fromEntries(
        Object.entries(this.boards).filter(([, board]) =>
          board.name.toLowerCase().includes(search),
        ),
      );
    },
  },
  methods: {
    focusSearchInput() {
      this.search = "";
      (this.$refs.input as HTMLInputElement).focus();
    },
  },
};
</script>

<style scoped>
.options {
  max-height: 10em;
  overflow-y: auto;
}
</style>
