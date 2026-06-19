<template>
  <div
    class="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200/90 dark:from-[#0d1020] dark:to-[#141826] text-neutral-800 dark:text-neutral-200 font-sans transition-colors duration-500"
  >
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <div class="shop-section-head">
        <div>
          <h1 class="shop-section-title">상품 목록</h1>
          <p class="mt-2 text-sm text-neutral-600 dark:text-neutral-400 max-w-xl">
            전체 상품을 한곳에서 둘러보세요.
            <span v-if="!loading && searchTerm.trim()" class="ml-1 tabular-nums">
              · 검색 결과 {{ catalogTotal }}건
            </span>
          </p>
        </div>
      </div>

      <div class="mb-8 max-w-xl mx-auto sm:mx-0">
        <div
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl
                 bg-white/60 dark:bg-[#1a1d2f]/60 backdrop-blur-xl
                 border border-white/50 dark:border-indigo-500/12
                 shadow-[inset_0_1px_2px_rgba(255,255,255,0.5),0_4px_16px_rgba(0,0,0,0.06)]"
        >
          <input
            v-model="searchTerm"
            type="search"
            placeholder="상품명 검색"
            aria-label="상품명 검색"
            class="flex-1 bg-transparent text-sm text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/45 rounded-md py-1"
            @keyup.enter="fetchProducts"
          />
        </div>
      </div>

      <div v-if="loading" class="text-center py-16 text-neutral-500">불러오는 중...</div>

      <div v-else-if="error" class="rounded-2xl p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-center">
        <p class="text-red-600 dark:text-red-400 font-medium mb-2">오류가 발생했습니다</p>
        <p class="text-red-500 dark:text-red-400 text-sm mb-4">{{ error }}</p>
        <button
          type="button"
          class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm font-medium"
          @click="fetchProducts"
        >
          다시 시도
        </button>
      </div>

      <div
        v-else-if="products.length === 0"
        class="text-center py-16 rounded-2xl border border-neutral-200/60 dark:border-purple-500/20 bg-white/50 dark:bg-[#1a1d2f]/40 backdrop-blur-xl"
      >
        <p class="text-neutral-500 dark:text-neutral-400">검색 결과가 없습니다.</p>
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div
          v-for="product in products"
          :key="product.id"
          class="group shop-card-product transform hover:-translate-y-[1px]"
          role="button"
          tabindex="0"
          @click="goDetail(product.id)"
          @keyup.enter="goDetail(product.id)"
        >
          <div class="absolute top-3 right-3 z-10" @click.stop>
            <WishlistButton :product-id="product.id" size="sm" />
          </div>
          <div class="shop-card-product-media h-56 sm:h-60">
            <img
              :src="normalizeImageUrl(product.image_url || product.image) || placeholderImg"
              :alt="product.name"
              loading="lazy"
              decoding="async"
              class="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
              @error="onImgError"
            />
          </div>
          <div class="p-5">
            <h2 class="font-semibold text-lg text-neutral-900 dark:text-neutral-100 mb-1 line-clamp-2">
              {{ product.name }}
            </h2>
            <p class="text-neutral-500 dark:text-neutral-400 text-sm mb-3 line-clamp-2">
              {{ product.description }}
            </p>
            <p class="text-neutral-900 dark:text-neutral-100 font-bold text-xl mb-4">
              {{ formatPrice(product.price) }}원
            </p>
            <button type="button" class="shop-btn-cart" @click.stop="add(product)">
              장바구니 담기
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import api from "@/api";
import { useCartStore } from "../../store/cart";
import { useToastStore } from "../../store/toast";
import { useRouter, useRoute } from "vue-router";
import { formatPrice, normalizeImageUrl } from "../../lib/format";
import WishlistButton from "@/components/product/WishlistButton.vue";

const searchTerm = ref("");
const products = ref([]);
const catalogTotal = ref(0);
const loading = ref(true);
const cart = useCartStore();
const toast = useToastStore();
const router = useRouter();
const route = useRoute();

const placeholderImg =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect fill='%23e5e7eb' width='200' height='200'/%3E%3Ctext fill='%239ca3af' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='14'%3E이미지%3C/text%3E%3C/svg%3E";

const onImgError = (e) => {
  e.target.src = placeholderImg;
};

const goDetail = (id) => {
  router.push(`/product/${id}`);
};

const error = ref(null);
let searchDebounceTimer = null;

const trackSearch = async (term) => {
  const clean = term.trim();
  if (!clean) return;
  try {
    await api.post("/analytics/search-events", { searchTerm: clean });
  } catch (_) {
    // UX를 막지 않음
  }
};

const fetchProducts = async () => {
  loading.value = true;
  error.value = null;
  const q = searchTerm.value.trim();
  try {
    const res = await api.get("/products", {
      params: {
        withMeta: 1,
        limit: 100,
        search: q || undefined,
      },
    });
    const payload = res.data?.items != null ? res.data : { items: res.data, pagination: {} };
    products.value = Array.isArray(payload.items) ? payload.items : [];
    catalogTotal.value = Number(payload.pagination?.total ?? products.value.length);
    if (q) await trackSearch(q);
  } catch (err) {
    error.value = err.userMessage || "상품을 불러오는 중 오류가 발생했습니다.";
    console.error("❌ 상품 불러오기 실패:", err);
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  searchTerm.value = (route.query.q || "").toString();
  await fetchProducts();
});

watch(
  () => route.query.q,
  (q) => {
    searchTerm.value = (q || "").toString();
    fetchProducts();
  }
);

watch(searchTerm, () => {
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    fetchProducts();
  }, 350);
});

const add = (product) => {
  cart.addToCart(product);
  toast.success(`${product.name} 장바구니에 담겼습니다!`);
};
</script>
