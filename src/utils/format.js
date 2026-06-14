export function formatFileSize(value) {
  if (value === null || value === undefined || value === "") return "-";
  const bytes = Number(value);
  if (!Number.isFinite(bytes) || bytes < 0) return "-";
  if (bytes === 0) return "0 B";

  const units = ["B", "K", "M", "G"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  if (unitIndex === 0) return Math.round(size) + " B";
  const precision = size >= 10 ? 1 : 2;
  return Number(size.toFixed(precision)) + units[unitIndex];
}
