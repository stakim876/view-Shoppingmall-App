<template>
  <div class="min-h-screen bg-surface-base text-primary font-sans">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 class="shop-page-title">{{ pageTitle }}</h1>
          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
            <template v-if="!loading && searchQuery.trim()">검색 결과 {{ catalogTotal }}건</template>
            <template v-else-if="!loading">총 {{ catalogTotal }}개 상품</template>
          </p>
        </div>

        <div class="flex gap-3 flex-wrap items-center">
          <select v-model="priceRange" class="shop-input-select">
            <option value="">전체 가격대</option>
            <option value="0-10000">~ 1만원</option>
            <option value="10000-30000">1만원 ~ 3만원</option>
            <option value="30000-50000">3만원 ~ 5만원</option>
            <option value="50000-100000">5만원 ~ 10만원</option>
            <option value="100000">10만원 이상</option>
          </select>

          <select v-model="sortBy" class="shop-input-select">
            <option value="default">기본순</option>
            <option value="price-asc">가격 낮은순</option>
            <option value="price-desc">가격 높은순</option>
            <option value="name-asc">이름 가나다순</option>
            <option value="name-desc">이름 역순</option>
            <option value="newest">최신순</option>
            <option value="popular">인기순</option>
          </select>
        </div>
      </div>

      <div v-if="loading" class="mt-10">
        <SkeletonLoader type="product-list" :count="6" />
      </div>

      <div
        v-else-if="error"
        class="text-center mt-10 p-6 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
      >
        <p class="text-red-600 dark:text-red-400 font-medium mb-2">오류가 발생했습니다</p>
        <p class="text-red-500 text-sm">{{ error }}</p>
        <button
          type="button"
          class="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          @click="loadProducts"
        >
          다시 시도
        </button>
      </div>

      <div v-else-if="products.length === 0" class="text-center text-neutral-400 mt-10">
        {{ searchQuery ? "검색 결과가 없습니다." : "등록된 상품이 없습니다." }}
      </div>

      <div v-else class="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
        <div
          v-for="p in products"
          :key="p.id"
          class="group shop-card-product relative"
          @click="goDetail(p.id)"
        >
          <div class="absolute top-3 right-3 z-10" @click.stop>
            <WishlistButton :product-id="p.id" size="sm" />
          </div>
          <div class="shop-card-product-media aspect-square bg-white">
            <img
              :src="productImageSrc(p)"
              :alt="p.name"
              loading="lazy"
              decoding="async"
              class="w-full h-full object-cover"
              @error="onProductImageError"
            />
          </div>
          <div class="p-3 sm:p-4">
            <h3 class="font-semibold text-sm text-neutral-900 dark:text-neutral-100 mb-1 line-clamp-1">
              {{ p.name }}
            </h3>
            <p class="hidden sm:block text-neutral-500 dark:text-neutral-400 text-xs mb-2 line-clamp-2">
              {{ p.description }}
            </p>
            <p class="text-neutral-900 dark:text-neutral-100 font-semibold text-sm mb-1">
              {{ formatPrice(p.price) }}원
            </p>
            <p v-if="getProductReviewStat(p)" class="text-xs text-amber-700 dark:text-amber-300 mb-2">
              ★ {{ getProductReviewStat(p)?.avg }} ({{ getProductReviewStat(p)?.count }})
            </p>
            <p class="text-[0.65rem] font-semibold text-indigo-700 dark:text-indigo-300 mb-2">
              {{ freeShippingLabel }}
            </p>
            <button
              type="button"
              class="shop-btn-cart py-2 text-xs sm:text-sm w-full whitespace-nowrap"
              @click.stop="addToCart(p)"
            >
              장바구니 담기
            </button>
          </div>
        </div>
      </div>

      <div
        v-if="!loading && totalPages > 1"
        class="flex justify-center items-center gap-2 mt-12 flex-wrap"
      >
        <button
          type="button"
          class="shop-pagination-btn"
          :disabled="currentPage === 1"
          @click="currentPage = 1"
        >
          처음
        </button>
        <button
          type="button"
          class="shop-pagination-btn"
          :disabled="currentPage === 1"
          @click="currentPage--"
        >
          이전
        </button>
        <template v-for="page in visiblePages" :key="page">
          <button
            v-if="page !== '...'"
            type="button"
            :class="[
              'px-4 py-2 rounded-lg text-sm font-medium min-w-[40px]',
              currentPage === page
                ? 'shop-btn-primary text-white shadow-md'
                : 'shop-pagination-btn'
            ]"
            @click="currentPage = page"
          >
            {{ page }}
          </button>
          <span v-else class="px-2 py-2 text-neutral-500">...</span>
        </template>
        <button
          type="button"
          class="shop-pagination-btn"
          :disabled="currentPage === totalPages"
          @click="currentPage++"
        >
          다음
        </button>
        <button
          type="button"
          class="shop-pagination-btn"
          :disabled="currentPage === totalPages"
          @click="currentPage = totalPages"
        >
          마지막
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import api from "@/lib/api";
import { useCartStore } from "@/store/cart";
import { useToastStore } from "@/store/toast";
import { useAuthStore } from "@/store/auth";
import { formatPrice } from "@/lib/format";
import { productImageSrc, onProductImageError, getProductReviewStat } from "@/lib/productDisplay.js";
import { formatFreeShippingBadge } from "@/lib/shopPolicy.js";
import WishlistButton from "@/components/product/WishlistButton.vue";
import SkeletonLoader from "@/components/ui/SkeletonLoader.vue";

const router = useRouter();
const route = useRoute();
const cart = useCartStore();
const toast = useToastStore();
const auth = useAuthStore();

const products = ref([]);
const catalogTotal = ref(0);
const loading = ref(true);
const error = ref(null);
const searchQuery = ref("");
const selectedCategory = ref("");
const activeTab = ref("");
const sortBy = ref("default");
const priceRange = ref("");
const currentPage = ref(1);
const itemsPerPage = ref(12);

const freeShippingLabel = formatFreeShippingBadge();

const pageTitle = computed(() => {
  if (activeTab.value === "best") return "베스트";
  if (activeTab.value === "new") return "신상품";
  if (selectedCategory.value) return selectedCategory.value;
  if (searchQuery.value.trim()) return "검색 결과";
  return "전체 상품";
});

const totalPages = computed(() =>
  Math.max(1, Math.ceil(catalogTotal.value / itemsPerPage.value))
);

const visiblePages = computed(() => {
  const pages = [];
  const total = totalPages.value;
  const current = currentPage.value;
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else if (current <= 4) {
    for (let i = 1; i <= 5; i++) pages.push(i);
    pages.push("...", total);
  } else if (current >= total - 3) {
    pages.push(1, "...");
    for (let i = total - 4; i <= total; i++) pages.push(i);
  } else {
    pages.push(1, "...", current - 1, current, current + 1, "...", total);
  }
  return pages;
});

const buildProductParams = () => {
  const params = {
    withMeta: 1,
    withReviews: 1,
    page: currentPage.value,
    limit: itemsPerPage.value,
  };
  const q = searchQuery.value.trim();
  if (q) params.search = q;
  if (selectedCategory.value) params.category = selectedCategory.value;

  if (priceRange.value) {
    const parts = priceRange.value.split("-");
    params.minPrice = Number(parts[0]) || 0;
    if (parts[1]) params.maxPrice = Number(parts[1]);
  }

  if (activeTab.value === "best") {
    params.sortBy = "popular";
    params.sortOrder = "desc";
  } else if (activeTab.value === "new") {
    params.sortBy = "created_at";
    params.sortOrder = "desc";
  } else {
    switch (sortBy.value) {
      case "price-asc":
        params.sortBy = "price";
        params.sortOrder = "asc";
        break;
      case "price-desc":
        params.sortBy = "price";
        params.sortOrder = "desc";
        break;
      case "name-asc":
        params.sortBy = "name";
        params.sortOrder = "asc";
        break;
      case "name-desc":
        params.sortBy = "name";
        params.sortOrder = "desc";
        break;
      case "newest":
        params.sortBy = "created_at";
        params.sortOrder = "desc";
        break;
      case "popular":
        params.sortBy = "popular";
        params.sortOrder = "desc";
        break;
      default:
        params.sortBy = "id";
        params.sortOrder = "desc";
        break;
    }
  }

  return params;
};

const syncFromRoute = () => {
  searchQuery.value = (route.query.q || "").toString();
  selectedCategory.value = (route.query.category || "").toString();
  activeTab.value = (route.query.tab || "").toString();
  currentPage.value = Math.max(1, Number(route.query.page) || 1);

  if (activeTab.value === "best") sortBy.value = "popular";
  else if (activeTab.value === "new") sortBy.value = "newest";
};

const trackSearch = async (term) => {
  const clean = term.trim();
  if (!clean) return;
  try {
    await api.post("/analytics/search-events", {
      searchTerm: clean,
      userId: auth.user?.id || null,
    });
  } catch (_) {}
};

const loadProducts = async () => {
  loading.value = true;
  error.value = null;
  const q = searchQuery.value.trim();
  try {
    const res = await api.get("/products", { params: buildProductParams() });
    const payload = res.data?.items != null ? res.data : { items: res.data, pagination: {} };
    const list = Array.isArray(payload.items) ? payload.items : [];
    products.value = list.map((p) => ({
      ...p,
      category: p.category?.trim() ? p.category : "기타",
    }));
    catalogTotal.value = Number(payload.pagination?.total ?? list.length);
    if (q) await trackSearch(q);
  } catch (err) {
    error.value = err.userMessage || "상품을 불러오는 중 오류가 발생했습니다.";
  } finally {
    loading.value = false;
  }
};

const goDetail = (id) => {
  router.push(`/product/${id}`);
};

const addToCart = (p) => {
  cart.addToCart({
    id: p.id,
    name: p.name,
    price: p.price,
    image_url: p.image_url,
  });
  toast.success(`${p.name}이(가) 장바구니에 추가되었습니다.`);
};

watch([selectedCategory, searchQuery, priceRange, sortBy, activeTab], () => {
  if (currentPage.value !== 1) {
    currentPage.value = 1;
  } else {
    loadProducts();
  }
});

watch(currentPage, () => {
  loadProducts();
});

watch(
  () => route.query,
  () => {
    syncFromRoute();
    loadProducts();
  },
  { deep: true }
);

onMounted(async () => {
  syncFromRoute();
  await loadProducts();
});
</script>

<style scoped>
.shop-pagination-btn {
  @apply px-3 py-2 rounded-lg text-sm font-medium transition
         bg-white dark:bg-[#1a2235] text-neutral-800 dark:text-neutral-200
         border border-slate-200/80 dark:border-slate-600/45
         hover:bg-slate-100 dark:hover:bg-slate-700
         disabled:bg-neutral-200 dark:disabled:bg-neutral-700
         disabled:text-neutral-400 disabled:cursor-not-allowed;
}
</style>
