<template>
  <div class="min-h-screen bg-[#f9fafb] text-neutral-800 font-['Inter']">
    <section class="relative py-24 overflow-hidden border-b border-neutral-200">
      <div
        class="absolute inset-0 bg-gradient-to-br from-blue-100 via-indigo-100 to-transparent blur-3xl opacity-70"
      ></div>

      <div class="relative z-10 max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <div class="flex justify-center">
          <img
            :src="product?.image_url"
            alt="상품 이미지"
            class="w-full max-w-md h-auto object-contain rounded-2xl shadow-md bg-white p-6"
          />
        </div>

        <div class="flex flex-col justify-center animate-fadeInDetail">
          <h1 class="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
            {{ product?.name }}
          </h1>

          <p class="text-neutral-600 text-base leading-relaxed mb-6 font-['Noto_Serif_KR'] italic">
            {{ product?.description || '상품 설명이 준비 중입니다.' }}
          </p>

          <p class="text-3xl font-semibold text-blue-600 mb-8">
            {{ product?.price?.toLocaleString() }}원
          </p>

          <div class="flex gap-3">
            <button
              @click="addToCart(product)"
              class="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-500 text-white rounded-full font-medium hover:from-indigo-600 hover:to-purple-500 transition-all"
            >
              장바구니 담기
            </button>
            <router-link
              to="/checkout"
              class="px-6 py-3 border border-neutral-300 rounded-full text-neutral-700 hover:bg-neutral-100 transition-all"
            >
              바로 구매
            </router-link>
          </div>
        </div>
      </div>
    </section>

    <div class="max-w-7xl mx-auto px-6 py-16">
      <h2 class="text-2xl font-semibold text-neutral-800 mb-8 text-center border-b border-neutral-200 pb-3">
        비슷한 상품 추천
      </h2>

      <div v-if="relatedProducts.length === 0" class="text-center text-neutral-400">
        관련 상품이 없습니다.
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
        <div
          v-for="p in relatedProducts"
          :key="p.id"
          class="group relative overflow-hidden rounded-3xl bg-white border border-neutral-200 hover:border-blue-400 transition-all duration-300 shadow-sm hover:shadow-lg"
        >
          <div class="overflow-hidden h-72 flex items-center justify-center bg-neutral-100">
            <img
              :src="p.image_url"
              :alt="p.name"
              class="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
            />
          </div>

          <div class="p-5 text-center">
            <h3 class="font-semibold text-lg text-neutral-900 mb-2">{{ p.name }}</h3>
            <p class="text-blue-600 font-semibold text-lg mb-4">{{ p.price.toLocaleString() }}원</p>
            <router-link
              :to="`/product/${p.id}`"
              class="text-sm bg-gradient-to-r from-blue-600 to-indigo-500 text-white px-4 py-2 rounded-full hover:from-indigo-600 hover:to-purple-500 transition-all"
            >
              자세히 보기
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <footer class="text-center text-neutral-500 text-sm py-10 border-t border-neutral-200">
      ⓒ 2025 MyShop — Designed with 💙 in Seoul.
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import axios from "axios";
import { useCartStore } from "../store/cart";

const route = useRoute();
const product = ref(null);
const relatedProducts = ref([]);
const cart = useCartStore();

const addToCart = (p) => {
  cart.addToCart({
    id: p.id,
    name: p.name,
    price: p.price,
    image_url: p.image_url,
  });
  alert(`${p.name}이(가) 장바구니에 추가되었습니다.`);
};

onMounted(async () => {
  try {
    const id = route.params.id;
    const res = await axios.get(`http://localhost:3001/api/products/${id}`);
    product.value = res.data;

    const all = await axios.get("http://localhost:3001/api/products");
    relatedProducts.value = all.data
      .filter((p) => p.category === product.value.category && p.id !== product.value.id)
      .slice(0, 3);
  } catch (err) {
    console.error("상품 상세 불러오기 실패:", err);
  }
});
</script>

<style scoped>
html {
  scroll-behavior: smooth;
}

@keyframes fadeInDetail {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeInDetail {
  animation: fadeInDetail 0.8s ease-out both;
}
</style>
