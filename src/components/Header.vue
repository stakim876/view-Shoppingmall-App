<template>
  <header class="flex justify-between items-center px-6 py-4 bg-white shadow-md">
    <router-link to="/home" class="text-xl font-bold">
      My shop
    </router-link>

    <router-link to="/cart" class="relative text-2xl">
      🛒
      <span
        v-if="totalItems > 0"
        class="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-2"
      >
        {{ totalItems }}
      </span>
    </router-link>
  </header>
</template>

<script setup>
import { useCartStore } from '../store/cart'
import { storeToRefs } from 'pinia'

const cart = useCartStore()
const { totalItems } = storeToRefs(cart)
</script>
