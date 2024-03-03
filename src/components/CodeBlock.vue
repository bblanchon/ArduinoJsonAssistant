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
      <pre><code class="hl" v-html="props.source" ref="codeElement" @mouseover="onMouseOver"></code></pre>
    </div>
  </figure>
</template>

<script setup>
import { sleep } from "@/utils";
import { ref } from "vue";

const props = defineProps({
  source: String,
});

const programCopied = ref(false);
const codeElement = ref(null);

async function copyProgram() {
  await navigator.clipboard.writeText(codeElement.value.innerText);
  programCopied.value = true;
  await sleep(500);
  programCopied.value = false;
}

function highlightVariable(variable) {
  codeElement.value.querySelectorAll(".hl-variable").forEach((el) => {
    el.classList.toggle("active", el.innerText === variable);
  });
}

function onMouseOver(event) {
  const target = event.target;
  if (target.classList.contains("hl-variable")) {
    highlightVariable(target.innerText);
  } else {
    highlightVariable("");
  }
}
</script>

<style scoped>
.program {
  max-height: 30em;
  overflow-y: auto;
}
</style>

<style>
.hl-built_in,
.hl-literal {
  color: #d35400;
}

.hl-type,
.hl-string {
  color: #00979d;
}

.hl-comment {
  color: rgba(149, 165, 166, 0.8);
}

.hl-keyword,
.hl-meta-keyword {
  color: #728e00;
}

.hl-number {
  color: #8a7b52;
}

.hl-variable.active {
  background-color: #fff;
  cursor: pointer;
}
</style>
