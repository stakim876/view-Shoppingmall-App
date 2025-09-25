
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useCartStore = defineStore('cart', () => {
  const items = ref([])

  const addToCart = (product) => {
    const existing = items.value.find((i) => i.id === product.id)
    if (existing) {
      existing.quantity += 1
    } else {
      items.value.push({ ...product, quantity: 1 })
    }
  }

  const removeFromCart = (id) => {
    items.value = items.value.filter((i) => i.id !== id)
  }

  const increaseQuantity = (id) => {
    const item = items.value.find((i) => i.id === id)
    if (item) item.quantity += 1
  }

  const decreaseQuantity = (id) => {
    const item = items.value.find((i) => i.id === id)
    if (item) {
      if (item.quantity > 1) item.quantity -= 1
      else removeFromCart(id)
    }
  }

  const totalItems = computed(() =>
    items.value.reduce((sum, i) => sum + i.quantity, 0)
  )

  const totalPrice = computed(() =>
    items.value.reduce((sum, i) => sum + i.price * i.quantity, 0)
  )

  return {
    items,
    addToCart,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    totalItems,
    totalPrice,
  }
})
