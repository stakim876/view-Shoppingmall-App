import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import {
  normalizeSelectedOptions,
  optionsLineKey,
  formatOptionsLabel,
} from "@/lib/productOptions.js";

function ensureLineKey(item) {
  if (item.lineKey) return item.lineKey;
  return optionsLineKey(item.id, item.options);
}

export const useCartStore = defineStore("cart", () => {
  const raw = JSON.parse(localStorage.getItem("cartItems") || "[]");
  const items = ref(
    (Array.isArray(raw) ? raw : []).map((item) => {
      const options = normalizeSelectedOptions(item.options);
      const lineKey = optionsLineKey(item.id, options);
      return {
        ...item,
        options,
        optionsLabel: item.optionsLabel || formatOptionsLabel([], options) || "",
        lineKey,
        price: Number(String(item.price).replace(/,/g, "")) || 0,
        quantity: Number(item.quantity) || 1,
      };
    })
  );

  const addToCart = (product, maxStock = null) => {
    const options = normalizeSelectedOptions(product.options);
    const lineKey = optionsLineKey(product.id, options);
    const existing = items.value.find((i) => ensureLineKey(i) === lineKey);
    if (existing) {
      if (maxStock != null && existing.quantity >= Number(maxStock)) return false;
      existing.quantity += 1;
      return true;
    }
    if (maxStock != null && Number(maxStock) <= 0) return false;
    const cleanPrice = Number(String(product.price).replace(/,/g, "")) || 0;
    items.value.push({
      id: product.id,
      name: product.name,
      price: cleanPrice,
      image_url: product.image_url,
      options,
      optionsLabel: product.optionsLabel || formatOptionsLabel([], options),
      lineKey,
      quantity: 1,
    });
    return true;
  };

  const increaseQuantity = (lineKey, maxStock = null) => {
    const item = items.value.find((i) => ensureLineKey(i) === lineKey);
    if (!item) return false;
    if (maxStock != null && item.quantity >= Number(maxStock)) return false;
    item.quantity += 1;
    return true;
  };

  const decreaseQuantity = (lineKey) => {
    const item = items.value.find((i) => ensureLineKey(i) === lineKey);
    if (!item) return;
    if (item.quantity > 1) item.quantity -= 1;
    else removeFromCart(lineKey);
  };

  const removeFromCart = (lineKey) => {
    items.value = items.value.filter((i) => ensureLineKey(i) !== lineKey);
  };

  const clearCart = () => {
    items.value = [];
    localStorage.removeItem("cartItems");
  };

  const totalItems = computed(() =>
    items.value.reduce((sum, i) => sum + i.quantity, 0)
  );

  const totalPrice = computed(() =>
    items.value.reduce((sum, i) => sum + i.price * i.quantity, 0)
  );

  watch(
    items,
    (val) => {
      localStorage.setItem("cartItems", JSON.stringify(val));
    },
    { deep: true }
  );

  return {
    items,
    addToCart,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    clearCart,
    totalItems,
    totalPrice,
  };
});
