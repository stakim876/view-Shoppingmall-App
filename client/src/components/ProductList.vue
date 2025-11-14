<template>
  <div class="min-h-screen bg-gray-50 py-12 px-4">
    <h1 class="text-3xl font-bold mb-8 text-center">상품 목록</h1>

    <div class="mb-4 flex justify-center">
      <input
        v-model="searchTerm"
        type="text"
        placeholder="상품명을 입력하세요"
        class="border border-gray-300 rounded px-3 py-2 w-1/2"
      />
    </div>

    <div class="flex flex-wrap justify-center gap-6">
      <div
        v-for="product in filteredProducts"
        :key="product.id"
        class="border p-4 rounded shadow hover:shadow-lg bg-white w-64 cursor-pointer"
        @click="goDetail(product.id)"
      >
        <div class="w-full h-48 flex items-center justify-center bg-gray-50 rounded mb-4 overflow-hidden">
          <img
            :src="product.image_url"
            alt="상품 이미지"
            class="h-full object-contain"
          />
        </div>

        <h2 class="font-semibold text-lg">{{ product.name }}</h2>
        <p class="text-gray-500 text-sm">{{ product.description }}</p>
        <p class="text-gray-800 font-bold mt-2">
          {{ product.price.toLocaleString() }}원
        </p>

        <button
          @click.stop="add(product)"
          class="mt-3 bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
        >
          장바구니 담기
        </button>
      </div>
    </div>

    <div
      v-if="filteredProducts.length === 0"
      class="text-center text-gray-500 mt-6"
    >
      검색 결과가 없습니다.
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { useCartStore } from '../store/cart'
import { useRouter } from 'vue-router'

const searchTerm = ref('')
const products = ref([])
const cart = useCartStore()
const router = useRouter()

const goDetail = (id) => {
  router.push(`/product/${id}`)
}

const fetchProducts = async () => {
  try {
    const res = await axios.get('http://localhost:3001/api/products')
    products.value = res.data
  } catch (err) {
    console.error('❌ 상품 불러오기 실패:', err)
  }
}

onMounted(() => {
  fetchProducts()
})

const filteredProducts = computed(() => {
  if (!searchTerm.value) return products.value
  return products.value.filter(product =>
    product.name.toLowerCase().includes(searchTerm.value.toLowerCase())
  )
})

const add = (product) => {
  cart.addToCart(product)
  alert(`${product.name} 장바구니에 담겼습니다!`)
}
</script>
