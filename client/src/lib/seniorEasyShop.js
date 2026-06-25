const FAVORITE_IDS_KEY = "myshop_senior_favorite_ids";
const LAST_ORDER_KEY = "myshop_senior_last_order";

const safeParse = (raw, fallback) => {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

export function getSeniorFavoriteIds() {
  return safeParse(localStorage.getItem(FAVORITE_IDS_KEY), []);
}

export function setSeniorFavoriteIds(ids) {
  localStorage.setItem(FAVORITE_IDS_KEY, JSON.stringify(ids));
}

export function getSeniorLastOrder() {
  return safeParse(localStorage.getItem(LAST_ORDER_KEY), []);
}

export function saveSeniorLastOrder(items) {
  if (!Array.isArray(items) || items.length === 0) return;
  const snapshot = items.map((item) => ({
    id: item.id,
    name: item.name,
    price: Number(item.price),
    quantity: item.quantity ?? 1,
    image_url: item.image_url || item.image || null,
  }));
  localStorage.setItem(LAST_ORDER_KEY, JSON.stringify(snapshot));
}
