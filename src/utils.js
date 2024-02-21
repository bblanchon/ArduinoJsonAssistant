export const sleep = (m) => new Promise((r) => setTimeout(r, m));

const integerFormatter = new Intl.NumberFormat("en-US", {
  style: "decimal",
  maximumFractionDigits: 0,
});

export function formatInteger(value) {
  return integerFormatter.format(value);
}
