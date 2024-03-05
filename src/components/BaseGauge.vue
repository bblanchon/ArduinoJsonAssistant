<template>
  <div ref="el" class="gauge"></div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import JustGage from "justgage";

const props = defineProps({
  value: {
    type: Number,
    required: true,
  },
  valueText: {
    type: String,
    default: "",
  },
  warning: {
    type: Number,
    default: 0.5,
  },
  danger: {
    type: Number,
    default: 0.75,
  },
  max: {
    type: Number,
    default: 100,
  },
  label: {
    type: String,
    default: "",
  },
  bytes: {
    type: Boolean,
    default: false,
  },
});

const el = ref();
const gauge = ref(null);

const green = "#28a745";
const yellow = "#ffc107";
const red = "#dc3545";

import { format } from "bytes";

function formatValue(value) {
  const result = format(value, { decimalPlaces: 1 });
  return props.bytes ? result : result?.substring(0, result.length - 1);
}

function createGauge() {
  gauge.value = new JustGage({
    parentNode: el.value,
    max: props.max,
    value: props.value,
    label: props.label,
    textRenderer: props.valueText ? () => props.valueText : formatValue,
    maxTxt: formatValue(props.max),
    customSectors: {
      percents: true, // lo and hi values are in %
      ranges: [
        {
          color: green,
          lo: 0,
          hi: props.warning * 100,
        },
        {
          color: yellow,
          lo: props.warning * 100,
          hi: props.danger * 100,
        },
        {
          color: red,
          lo: props.danger * 100,
          hi: 100,
        },
      ],
    },
  });
}

onMounted(createGauge);

watch(
  () => props.value,
  () => {
    gauge.value?.refresh(props.value, props.max);
  },
);

watch(
  [() => props.max, () => props.warning, () => props.danger, () => props.label],
  () => {
    if (gauge.value) {
      gauge.value.destroy();
      createGauge();
    }
  },
);
</script>

<style scoped>
.gauge {
  width: 100%;
  max-width: 200px;
}
</style>
