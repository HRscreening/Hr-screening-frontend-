export function snakeCaseToTitle(text?: string) {
  if (!text) return "";
  return text
    .split("_")
    .filter(Boolean)
    .map(w => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}


export function titleToSnakeCase(text?: string) {
  if (!text) return "";

  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}
