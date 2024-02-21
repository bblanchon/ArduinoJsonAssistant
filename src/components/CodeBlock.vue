<template>
  <figure class="position-relative">
    <button
      class="btn btn-sm position-absolute"
      :class="{
        'btn-outline-primary': !programCopied,
        'btn-success': programCopied,
      }"
      :disabled="programCopied"
      style="top: 5px; right: 20px; width: 6em"
      @click="copyProgram"
    >
      {{ programCopied ? "✓ Copied" : "Copy" }}
    </button>
    <div class="highlight p-3 program">
      <pre><code class="hljs" v-html="sourceHtml"></code></pre>
    </div>
  </figure>
</template>

<script setup>
import "@/assets/highlight.scss";
import hightlight from "@/highlight.js";

import { sleep } from "@/utils";
import { ref, watchEffect } from "vue";

const props = defineProps({
  source: String,
});

const programCopied = ref(false);
const sourceHtml = ref("");

async function copyProgram() {
  await navigator.clipboard.writeText(props.source);
  programCopied.value = true;
  await sleep(500);
  programCopied.value = false;
}

function escapeHtmlTags(str) {
  return str.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

watchEffect(async () => {
  const source = props.source;
  sourceHtml.value = escapeHtmlTags(source);
  await sleep(100);
  sourceHtml.value = hightlight(source);
});
</script>

<style scoped>
.program {
  max-height: 30em;
  overflow-y: auto;
}
</style>
