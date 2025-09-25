<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="bg-white p-10 rounded shadow-lg w-full max-w-md">
      <h2 class="text-2xl font-bold mb-6 text-center">결제하기</h2>

      <div class="mb-4">
        <div
          v-for="item in cart.items"
          :key="item.id"
          class="flex justify-between border-b py-2"
        >
          <span>{{ item.name }} (x{{ item.quantity }})</span>
          <span>{{ (item.price * item.quantity).toLocaleString() }}원</span>
        </div>
      </div>

      <p class="mb-6 text-lg">
        총 결제 금액:
        <span class="font-semibold text-blue-600">
          {{ cart.totalPrice.toLocaleString() }}원
        </span>
      </p>

      <button
        @click="goToComplete"
        class="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
      >
        결제 완료
      </button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useCartStore } from '../store/cart'

const router = useRouter()
const cart = useCartStore()

const goToComplete = () => {
  cart.resetCart()
  router.push('/order-complete')
}
</script>
