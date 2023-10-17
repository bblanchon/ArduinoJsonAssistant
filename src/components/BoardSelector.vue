<template>
  <div class="dropdown" ref="dropdown">
    <button
      class="btn dropdown-toggle border w-100 d-flex align-items-center justify-content-between"
      type="button"
      data-toggle="dropdown"
      aria-expanded="false"
    >
      <BoardSelectorItem class="flex-fill" :board="selectedBoard" />
    </button>
    <div class="dropdown-menu" style="min-width: 100%">
      <div class="mx-2 mb-1">
        <input
          type="search"
          class="form-control"
          ref="input"
          :placeholder="`Search among ${Object.values(boards).length} boards`"
          v-model="search"
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

<script>
import boards from "@/assets/boards.json";

export default {
  props: {
    modelValue: String,
  },
  data() {
    return {
      boards,
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
        Object.entries(this.boards).filter(([_key, board]) =>
          board.name.toLowerCase().includes(search),
        ),
      );
    },
  },
  mounted() {
    $(this.$refs.dropdown).on("shown.bs.dropdown", () => {
      this.search = "";
      this.$refs.input.focus();
    });
  },
};
</script>

<style scoped>
.options {
  max-height: 10em;
  overflow-y: auto;
}
</style>
