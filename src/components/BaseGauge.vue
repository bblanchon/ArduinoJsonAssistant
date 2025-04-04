<template>
  <div ref="el" class="gauge"></div>
</template>

<script setup lang="ts">
import { format } from "bytes";
import JustGage from "justgage";
import { onMounted, ref, useTemplateRef, watch } from "vue";

const props = defineProps<{
  value: number;
  valueText?: string;
  warning?: number;
  danger?: number;
  max?: number;
  label?: string;
  bytes?: boolean;
}>();

const el = useTemplateRef("el");
const gauge = ref<JustGage>();

function formatValue(value: number) {
  const result = format(value, { decimalPlaces: 1 });
  return props.bytes ? result : result?.substring(0, result.length - 1);
}

function createGauge() {
  gauge.value = new JustGage({
    parentNode: el.value,
    max: props.max,
    value: props.value,
    label: props.label ?? "",
    textRenderer: props.valueText ? () => props.valueText : formatValue,
    maxTxt: props.max && formatValue(props.max),
    customSectors: props.warning &&
      props.danger && {
        percents: true, // lo and hi values are in %
        ranges: [
          {
            color: "#28a745",
            lo: 0,
            hi: props.warning * 100,
          },
          {
            color: "#ffc107",
            lo: props.warning * 100,
            hi: props.danger * 100,
          },
          {
            color: "#dc3545",
            lo: props.danger * 100,
            hi: 100,
          },
        ],
      },
  });
}

onMounted(createGauge);

watch([() => props.value, () => props.valueText], () => {
  gauge.value?.refresh(props.value, props.max);
});

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
