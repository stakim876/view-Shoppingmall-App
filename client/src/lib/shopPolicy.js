/**
 * 클라이언트 .env:
 * - VITE_FREE_SHIPPING_MIN (원 단위, 기본 30000)
 * - VITE_SHIPPING_FEE (원 단위, 기본 3000)
 */
export function getFreeShippingMinimumWon() {
  const raw = import.meta.env.VITE_FREE_SHIPPING_MIN;
  const fallback = 30000;
  if (raw === undefined || raw === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function getShippingFeeWon() {
  const raw = import.meta.env.VITE_SHIPPING_FEE;
  const fallback = 3000;
  if (raw === undefined || raw === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export function calculateShippingFee(subtotalWon, freeMinWon = getFreeShippingMinimumWon(), shippingFeeWon = getShippingFeeWon()) {
  const subtotal = Number(subtotalWon || 0);
  if (!Number.isFinite(subtotal) || subtotal <= 0) return 0;
  return subtotal >= freeMinWon ? 0 : shippingFeeWon;
}

/** 예: 30000 -> "3만원 이상 무료배송" */
export function formatFreeShippingBadge(minWon = getFreeShippingMinimumWon()) {
  if (!minWon || minWon <= 0) return "배송비 안내 상품별 상이";
  if (minWon >= 10000 && minWon % 10000 === 0) {
    const man = minWon / 10000;
    return `${man}만원 이상 무료배송`;
  }
  return `${minWon.toLocaleString("ko-KR")}원 이상 무료배송`;
}
