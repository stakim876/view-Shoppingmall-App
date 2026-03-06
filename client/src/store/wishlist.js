import { defineStore } from "pinia";
import { ref, computed } from "vue";
import api from "../lib/api";

export const useWishlistStore = defineStore("wishlist", () => {
  const productIds = ref(new Set());
  const items = ref([]);

  const hasProduct = (productId) => productIds.value.has(Number(productId));
  const count = computed(() => productIds.value.size);

  async function fetchIds() {
    const token = localStorage.getItem("token");
    if (!token) {
      productIds.value = new Set();
      return;
    }
    try {
      const res = await api.get("/wishlist/ids");
      productIds.value = new Set((res.data || []).map(Number));
    } catch (_) {
      productIds.value = new Set();
    }
  }

  async function fetchItems() {
    const token = localStorage.getItem("token");
    if (!token) {
      items.value = [];
      return [];
    }
    try {
      const res = await api.get("/wishlist");
      items.value = res.data || [];
      productIds.value = new Set((res.data || []).map((i) => Number(i.product_id)));
      return items.value;
    } catch (_) {
      items.value = [];
      return [];
    }
  }

  async function add(productId) {
    const id = Number(productId);
    if (!id || Number.isNaN(id)) {
      console.warn("찜 추가: 유효하지 않은 상품 ID", productId);
      return false;
    }
    try {
      await api.post(`/wishlist/${id}`);
      productIds.value = new Set([...productIds.value, id]);
      return true;
    } catch (err) {
      console.error("찜 추가 실패:", err);
      throw err;
    }
  }

  async function remove(productId) {
    const id = Number(productId);
    if (!id || Number.isNaN(id)) return false;
    try {
      await api.delete(`/wishlist/${id}`);
      const next = new Set(productIds.value);
      next.delete(id);
      productIds.value = next;
      items.value = items.value.filter((i) => Number(i.product_id) !== id);
      return true;
    } catch (err) {
      console.error("찜 제거 실패:", err);
      throw err;
    }
  }

  async function toggle(productId) {
    if (hasProduct(productId)) {
      return remove(productId).then(() => false);
    }
    return add(productId).then(() => true);
  }

  return {
    productIds,
    items,
    hasProduct,
    count,
    fetchIds,
    fetchItems,
    add,
    remove,
    toggle,
  };
});
