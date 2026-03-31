const STORAGE_KEY = "myshop_recently_viewed";
const MAX_ITEMS = 10;

export function getRecentlyViewed() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function addRecentlyViewed(product) {
  if (!product?.id) return;
  const list = getRecentlyViewed();
  const filtered = list.filter((p) => p.id !== product.id);
  const item = {
    id: product.id,
    name: product.name,
    image_url: product.image_url || "",
    price: product.price,
  };
  const next = [item, ...filtered].slice(0, MAX_ITEMS);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (e) {
    console.warn("최근 본 상품 저장 실패:", e);
  }
}
