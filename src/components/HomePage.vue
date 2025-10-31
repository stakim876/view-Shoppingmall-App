<template>
  <div class="min-h-screen bg-[#f9fafb] dark:bg-[#0f172a] text-neutral-800 dark:text-neutral-200 font-['Inter'] transition-colors duration-500">

    <section
      class="relative text-center py-32 overflow-hidden border-b border-neutral-200 dark:border-neutral-700"
    >
      <div
        class="absolute inset-0 bg-gradient-to-br from-blue-100 via-indigo-100 to-transparent dark:from-indigo-900/40 dark:via-purple-900/30 dark:to-transparent blur-3xl opacity-70 animate-gradientMotion"
      ></div>

      <div class="relative z-10 px-4 flex flex-col items-center justify-center">
        <div class="flex items-center gap-3 mb-6 animate-slideUpBlur">
          <img
            src="/images/download.svg"
            alt="MyShop Logo"
            class="w-14 h-14 object-contain drop-shadow-sm"
          />
          <h1
            class="text-6xl font-extrabold tracking-tight bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 bg-clip-text text-transparent"
          >
            MyShop
          </h1>
        </div>

        <p
          class="text-neutral-700 dark:text-neutral-300 text-[1.1rem] font-light max-w-2xl mx-auto leading-relaxed font-['Noto_Serif_KR'] italic tracking-wide animate-fadeInDelayed"
        >
          당신의 감성을 채우는 프리미엄 셀렉트샵 — 오늘의 선택이 내일의 기준이 됩니다.
        </p>
      </div>
    </section>

    <div class="max-w-5xl mx-auto px-6 mt-16 mb-10 text-center">
      <div class="flex justify-center gap-5 flex-wrap">
        <button
          v-for="cat in categories"
          :key="cat"
          @click="selectedCategory = cat"
          :class="[
            'px-6 py-2 rounded-full font-medium transition-all border backdrop-blur-md',
            'relative overflow-hidden group duration-300',
            selectedCategory === cat
              ? 'bg-gradient-to-r from-blue-600 to-indigo-500 text-white border-transparent shadow-lg scale-105'
              : 'bg-white/70 dark:bg-neutral-800/60 text-neutral-700 dark:text-neutral-200 border-neutral-200 dark:border-neutral-700 hover:border-blue-300 dark:hover:border-indigo-400 hover:shadow-md hover:-translate-y-[2px]'
          ]"
        >
          <span class="relative z-10">{{ cat }}</span>
          <span
            class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-white/10 to-transparent translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-700 ease-out"
          ></span>
        </button>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-6 py-10">
      <h2
        class="text-2xl font-semibold text-neutral-800 dark:text-neutral-100 mb-10 text-center border-b border-neutral-200 dark:border-neutral-700 pb-3"
      >
        {{ selectedCategory === '전체' ? 'Featured Products' : selectedCategory }}
      </h2>

      <div v-if="loading" class="text-center text-neutral-400 mt-10">
        상품을 불러오는 중입니다...
      </div>

      <div
        v-else-if="filteredProducts.length === 0"
        class="text-center text-neutral-400 mt-10"
      >
        등록된 상품이 없습니다.
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
        <div
          v-for="p in filteredProducts"
          :key="p.id"
          class="group relative overflow-hidden rounded-3xl 
                 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 
                 hover:border-blue-400 dark:hover:border-indigo-500 transition-all duration-300 shadow-sm hover:shadow-lg"
        >
          <div class="overflow-hidden h-80 flex items-center justify-center bg-neutral-100 dark:bg-neutral-700">
            <img
              :src="p.image_url"
              :alt="p.name"
              class="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
            />
          </div>

          <div class="p-6">
            <h3 class="font-semibold text-lg text-neutral-900 dark:text-neutral-100 mb-1">{{ p.name }}</h3>
            <p class="text-neutral-500 dark:text-neutral-400 text-sm mb-3 line-clamp-2">{{ p.description }}</p>
            <p class="text-blue-600 dark:text-indigo-400 font-semibold text-lg mb-6">
              {{ p.price.toLocaleString() }}원
            </p>
            <button
              @click="addToCart(p)"
              class="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-indigo-500 dark:to-purple-600 
                     text-white rounded-full font-medium hover:from-indigo-600 hover:to-purple-500 transition-all"
            >
              장바구니 담기
            </button>
          </div>
        </div>
      </div>
    </div>

    <footer class="text-center text-neutral-500 dark:text-neutral-400 text-sm py-10 border-t border-neutral-200 dark:border-neutral-700">
      ⓒ 2025 MyShop — Designed with 💙 in Seoul.
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import axios from "axios";
import { useCartStore } from "../store/cart";

const cart = useCartStore();
const products = ref([]);
const loading = ref(true);

const categories = ["전체", "스마트기기", "노트북", "액세서리"];
const selectedCategory = ref("전체");

const filteredProducts = computed(() => {
  if (selectedCategory.value === "전체") return products.value;
  return products.value.filter((p) => p.category === selectedCategory.value);
});

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
    const res = await axios.get("http://localhost:3001/api/products");
    products.value = res.data;
  } catch (err) {
    console.error("상품 불러오기 실패:", err);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
html {
  scroll-behavior: smooth;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@keyframes slideUpBlur {
  0% {
    opacity: 0;
    transform: translateY(30px);
    filter: blur(6px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0);
  }
}
.animate-slideUpBlur {
  animation: slideUpBlur 1s ease-out both;
}

@keyframes fadeInDelayed {
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fadeInDelayed {
  animation: fadeInDelayed 1s ease-out both;
  animation-delay: 0.4s;
}
@keyframes gradientMotion {
  0% {
    background-position: 0% 50%;
    filter: blur(2px);
    opacity: 0.6;
  }
  50% {
    background-position: 100% 50%;
    filter: blur(4px);
    opacity: 0.8;
  }
  100% {
    background-position: 0% 50%;
    filter: blur(2px);
    opacity: 0.6;
  }
}

.animate-gradientMotion {
  background-size: 400% 400%;
  animation: gradientMotion 6s ease-in-out infinite;
  transition: all 4s ease;
}
</style>
