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
        class="border p-4 rounded shadow hover:shadow-lg bg-white w-64 cursor-pointer relative"
        @click="goDetail(product.id)"
      >
        <div class="absolute top-2 right-2 z-10">
          <WishlistButton :product-id="product.id" size="sm" />
        </div>
        <div class="w-full h-48 flex items-center justify-center bg-gray-50 rounded mb-4 overflow-hidden">
          <img
            :src="normalizeImageUrl(product.image_url || product.image) || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\' viewBox=\'0 0 200 200\'%3E%3Crect fill=\'%23e5e7eb\' width=\'200\' height=\'200\'/%3E%3Ctext fill=\'%239ca3af\' x=\'50%25\' y=\'50%25\' dominant-baseline=\'middle\' text-anchor=\'middle\' font-size=\'14\'%3E이미지%3C/text%3E%3C/svg%3E'"
            alt="상품 이미지"
            class="h-full object-contain"
            @error="($e) => ($e.target.src = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'200\' viewBox=\'0 0 200 200\'%3E%3Crect fill=\'%23e5e7eb\' width=\'200\' height=\'200\'/%3E%3Ctext fill=\'%239ca3af\' x=\'50%25\' y=\'50%25\' dominant-baseline=\'middle\' text-anchor=\'middle\' font-size=\'14\'%3E이미지%3C/text%3E%3C/svg%3E')"
          />
        </div>

        <h2 class="font-semibold text-lg">{{ product.name }}</h2>
        <p class="text-gray-500 text-sm">{{ product.description }}</p>
        <p class="text-gray-800 font-bold mt-2">
          {{ formatPrice(product.price) }}원
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
      v-if="error"
      class="text-center mt-6 p-4 bg-red-50 border border-red-200 rounded-lg"
    >
      <p class="text-red-600 font-medium mb-2">⚠️ 오류가 발생했습니다</p>
      <p class="text-red-500 text-sm">{{ error }}</p>
      <button
        @click="fetchProducts"
        class="mt-2 px-4 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition text-sm"
      >
        다시 시도
      </button>
    </div>

    <div
      v-else-if="filteredProducts.length === 0"
      class="text-center text-gray-500 mt-6"
    >
      검색 결과가 없습니다.
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../../lib/api'
import { useCartStore } from '../../store/cart'
import { useToastStore } from '../../store/toast'
import { useRouter } from 'vue-router'
import { formatPrice, normalizeImageUrl } from '../../lib/format'
import WishlistButton from './WishlistButton.vue'

const searchTerm = ref('')
const products = ref([])
const cart = useCartStore()
const toast = useToastStore()
const router = useRouter()

const goDetail = (id) => {
  router.push(`/product/${id}`)
}

const error = ref(null)

const fetchProducts = async () => {
  error.value = null
  try {
    const res = await api.get('/products')
    products.value = res.data
  } catch (err) {
    error.value = err.userMessage || '상품을 불러오는 중 오류가 발생했습니다.'
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
  toast.success(`${product.name} 장바구니에 담겼습니다!`)
}
</script>
