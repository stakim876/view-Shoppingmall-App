
export function formatPrice(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return "0";
  return n.toLocaleString("ko-KR", { maximumFractionDigits: 0 });
}

export function normalizeImageUrl(url) {
  if (!url || typeof url !== "string") return "";
  const s = url.replace(/\\/g, "/").trim();
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  return s.startsWith("/") ? s : `/${s}`;
}
