import { normalizeImageUrl } from "./format";

export const PRODUCT_PLACEHOLDER_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect fill='%23e5e7eb' width='200' height='200'/%3E%3Ctext fill='%239ca3af' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='14'%3E이미지%3C/text%3E%3C/svg%3E";

export function productImageSrc(product) {
  if (!product) return PRODUCT_PLACEHOLDER_IMG;
  const gallery = Array.isArray(product.images) ? product.images : [];
  const raw = gallery.find(Boolean) || product.image_url || product.image;
  if (!raw) return PRODUCT_PLACEHOLDER_IMG;
  const url = normalizeImageUrl(raw);
  return url || PRODUCT_PLACEHOLDER_IMG;
}

export function onProductImageError(event) {
  if (event?.target) event.target.src = PRODUCT_PLACEHOLDER_IMG;
}

const CATEGORY_ICONS = {
  의류: "👔",
  악세서리: "💍",
  뷰티: "✨",
  "디지털/가전": "📱",
  식품: "🍱",
  생활용품: "🏠",
  "스포츠/레저": "⚽",
  "취미/문구": "✏️",
  "가구/인테리어": "🛋️",
  유아동: "🧸",
  패션잡화: "👜",
  기타: "📦",
};

export function categoryIcon(name) {
  return CATEGORY_ICONS[name] || "🛍️";
}

export function getProductReviewStat(product) {
  const count = Number(product?.review_count);
  const avg = Number(product?.review_avg);
  if (count > 0 && avg > 0) {
    return { count, avg };
  }
  return null;
}

export function parseProductListResponse(res) {
  const payload = res.data?.items != null ? res.data : { items: res.data };
  return Array.isArray(payload.items) ? payload.items : [];
}

export function getProductStockLabel(stock) {
  const n = Number(stock);
  if (!Number.isFinite(n)) return null;
  if (n <= 0) return { text: "품절", tone: "soldout" };
  if (n <= 5) return { text: `잔여 ${n}개`, tone: "low" };
  return { text: `잔여 ${n}개`, tone: "normal" };
}

export function buildReviewStatsMap(reviews = []) {
  const map = {};
  for (const review of reviews) {
    const id = Number(review?.product_id);
    const rating = Number(review?.rating);
    if (!id || !rating) continue;
    if (!map[id]) map[id] = { sum: 0, count: 0 };
    map[id].sum += rating;
    map[id].count += 1;
  }
  const result = {};
  for (const [id, stat] of Object.entries(map)) {
    result[id] = {
      count: stat.count,
      avg: Math.round((stat.sum / stat.count) * 10) / 10,
    };
  }
  return result;
}
