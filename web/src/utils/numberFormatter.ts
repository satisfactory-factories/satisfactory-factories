export function formatNumber(value: number): string {
  if (Number.isInteger(value)) {
    return value.toString();
  } else {
    // If the number is 2.25, show 2.25
    // If the number is 2.50, show 2.5
    // If the number is 2.333, show 2.33
    return value.toFixed(value % 1 === 0 ? 1 : 2);
  }
}
