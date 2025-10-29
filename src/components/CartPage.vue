<script setup>
import { useCartStore } from "../store/cart";
import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";
import axios from "axios";

const cart = useCartStore()
const { totalItems, totalPrice } = storeToRefs(cart)
</script>

<template>
  <div class="min-h-screen bg-gray-50 p-8">
    <h1 class="text-2xl font-bold mb-6">🛒 장바구니</h1>

    <div v-if="cart.items.length === 0" class="text-center text-gray-500">
      장바구니가 비어 있습니다.
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="item in cart.items"
        :key="item.id"
        class="flex items-center justify-between bg-white shadow rounded p-4"
      >
        <div class="flex items-center space-x-4">
          <img
            :src="item.image_url"
            alt="상품 이미지"
            class="w-20 h-20 object-contain"
          />
          <div>
            <h2 class="font-semibold">{{ item.name }}</h2>
            <p class="text-gray-500 text-sm">
              {{ item.price.toLocaleString() }}원
            </p>
            <p class="font-bold text-gray-800">
              합계: {{ (item.price * item.quantity).toLocaleString() }}원
            </p>
          </div>
        </div>

        <div class="flex items-center space-x-2">
          <button
            @click="cart.decreaseQuantity(item.id)"
            class="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
          >
            ➖
          </button>
          <span class="px-2">{{ item.quantity }}</span>
          <button
            @click="cart.increaseQuantity(item.id)"
            class="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
          >
            ➕
          </button>
          <button
            @click="cart.removeFromCart(item.id)"
            class="ml-3 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
          >
            삭제
          </button>
        </div>
      </div>

      <div class="mt-6 text-right">
        <p class="text-lg font-bold">총 상품수: {{ totalItems }}개</p>
        <p class="text-xl font-bold text-green-600">
          총 금액: {{ totalPrice.toLocaleString() }}원
        </p>
      </div>

      <div class="mt-4 text-right">
        <router-link
          to="/checkout"
          class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          결제하기
        </router-link>
      </div>
    </div>
  </div>
</template>
