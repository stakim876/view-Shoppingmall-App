import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";

export const useCartStore = defineStore("cart", () => {
  const items = ref(JSON.parse(localStorage.getItem("cartItems")) || []);

  const addToCart = (product) => {
    const existing = items.value.find((i) => i.id === product.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      const cleanPrice = Number(String(product.price).replace(/,/g, "")) || 0;
      items.value.push({
        ...product,
        price: cleanPrice,
        quantity: 1,
      });
    }
  };

  const increaseQuantity = (id) => {
    const item = items.value.find((i) => i.id === id);
    if (item) item.quantity += 1;
  };

  const decreaseQuantity = (id) => {
    const item = items.value.find((i) => i.id === id);
    if (item) {
      if (item.quantity > 1) item.quantity -= 1;
      else removeFromCart(id);
    }
  };

  const removeFromCart = (id) => {
    items.value = items.value.filter((i) => i.id !== id);
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
