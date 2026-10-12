/** Root-relative media also work when the preview is hosted at /repository/. */
export function assetUrl(source: string) {
  const base = (process.env.PUBLIC_URL || "").replace(/\/$/, "");
  return source.startsWith("/") && !source.startsWith("//")
    ? base + source
    : source;
}
