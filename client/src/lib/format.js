/**
 * 한국 원화 가격 포맷 (천 단위 콤마, 소수점 없음)
 * @param {number} value
 * @returns {string}
 */
export function formatPrice(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return "0";
  return n.toLocaleString("ko-KR", { maximumFractionDigits: 0 });
}

/**
 * 상품 이미지 URL 정규화 (백슬래시 → 슬래시, 상대경로 시 / 붙임)
 * @param {string} url
 * @returns {string}
 */
export function normalizeImageUrl(url) {
  if (!url || typeof url !== "string") return "";
  const s = url.replace(/\\/g, "/").trim();
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  return s.startsWith("/") ? s : `/${s}`;
}
