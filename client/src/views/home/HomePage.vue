<template>
  <div
    class="relative min-h-screen bg-slate-50 dark:bg-[#0c0f16]
           text-slate-700 dark:text-slate-200
           font-sans transition-colors duration-500"
  >
    <div class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div
        class="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(15,23,42,0.04),transparent_55%)] dark:bg-[radial-gradient(ellipse_70%_40%_at_50%_0%,rgba(255,255,255,0.03),transparent_50%)]"
      />
    </div>

    <div class="relative z-10">

      <div class="relative mx-auto max-w-7xl px-4 sm:px-6 pt-6 pb-1">
        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          말로 고르는 쇼핑
        </h1>
        <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
          <template v-if="!loading">지금 살 수 있는 상품 {{ catalogTotal }}개 · </template>
          조건을 말하면 맞는 상품을 골라 드려요
        </p>
      </div>

      <section
        id="home-curator"
        class="max-w-7xl mx-auto px-4 sm:px-6 py-3 scroll-mt-24"
        aria-label="말로 상품 찾기"
      >
        <div class="home-ai-strip">
          <div class="home-ai-strip__row">
            <label for="ai-curator-prompt" class="sr-only">상품 검색 조건</label>
            <input
              id="ai-curator-prompt"
              v-model.trim="aiRecommendPrompt"
              type="text"
              :placeholder="rotatingPlaceholder"
              class="home-ai-strip__input"
              @keydown.enter.prevent="requestAiRecommendation"
            />
            <button
              type="button"
              class="shop-btn-ai home-ai-strip__btn shrink-0"
              :disabled="aiRecommendLoading || !aiRecommendPrompt"
              @click="requestAiRecommendation"
            >
              {{ aiRecommendLoading ? "추천 중…" : "추천 받기" }}
            </button>
          </div>
          <div class="mt-2 flex flex-wrap gap-1.5">
            <button
              v-for="suggestion in aiPromptSuggestions.slice(0, 3)"
              :key="suggestion"
              type="button"
              class="home-ai-chip"
              :disabled="aiRecommendLoading"
              @click="applyAiSuggestion(suggestion)"
            >
              {{ suggestion }}
            </button>
          </div>
          <p v-if="aiRecommendError" class="mt-2 text-sm text-red-500">{{ aiRecommendError }}</p>
        </div>

        <div
          v-if="aiRecommendLoading || aiRecommendedProducts.length > 0"
          id="home-ai-results"
          class="mt-4"
        >
          <p v-if="aiRecommendLoading" class="text-sm text-slate-500 dark:text-slate-400">맞는 상품을 찾는 중…</p>
          <template v-else>
            <p v-if="aiRecommendSummary" class="text-sm text-slate-600 dark:text-slate-300 mb-3">
              {{ aiRecommendSummary }}
            </p>
            <div class="home-ai-results">
              <article
                v-for="p in aiRecommendedTop"
                :key="`ai-rec-${p.id}`"
                class="home-ai-result"
              >
                <button type="button" class="text-left w-full" @click="openAiRecommendedProduct(p)">
                  <div class="home-ai-result__media">
                    <img :src="imgSrc(p)" :alt="p.name" class="h-full w-full object-contain" @error="onImgError" />
                  </div>
                  <h3 class="mt-2 font-semibold text-sm text-slate-900 dark:text-white line-clamp-2">
                    {{ p.name }}
                  </h3>
                  <p class="mt-1 text-sm font-bold tabular-nums text-slate-900 dark:text-white">
                    {{ formatPrice(p.price) }}원
                  </p>
                  <p v-if="p.reasons?.[0]" class="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {{ p.reasons[0] }}
                  </p>
                </button>
                <button type="button" class="mt-2 shop-btn-cart py-2 text-xs sm:text-sm w-full" @click="addAiRecommendedToCart(p)">
                  장바구니
                </button>
              </article>
            </div>
          </template>
        </div>
      </section>

    <div id="home-catalog" class="max-w-7xl mx-auto px-4 sm:px-6 pt-4 pb-8 sm:pb-10 scroll-mt-24 border-t border-slate-200/60 dark:border-slate-800/50">
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 class="shop-page-title">
            {{ selectedCategory === '전체' ? '전체 상품' : selectedCategory }}
          </h2>
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
        <p class="text-red-600 dark:text-red-400 font-medium mb-2">⚠️ 오류가 발생했습니다</p>
        <p class="text-red-500 dark:text-red-500 text-sm">{{ error }}</p>
        <button
          @click="loadProducts"
          class="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
        >
          다시 시도
        </button>
      </div>

      <div
        v-else-if="products.length === 0"
        class="text-center text-neutral-400 mt-10"
      >
        {{ searchQuery ? "검색 결과가 없습니다." : "등록된 상품이 없습니다." }}
      </div>

      <div
        v-else
        class="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8"
      >
        <div
          v-for="p in products"
          :key="p.id"
          @click="goDetail(p.id)"           
          class="group shop-card-product" 
        >
          <div class="absolute top-3 right-3 z-10" @click.stop>
            <WishlistButton :product-id="p.id" size="sm" />
          </div>
          <div
            class="shop-card-product-media h-52 sm:h-80"
          >
            <img
              :src="imgSrc(p)"
              :alt="p.name"
              loading="lazy"
              decoding="async"
              class="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
              @error="onImgError"
            />
          </div>

          <div class="p-3 sm:p-6">
            <h3 class="font-semibold text-sm sm:text-lg text-neutral-900 dark:text-neutral-100 mb-1 line-clamp-1">
              {{ p.name }}
            </h3>
            <p class="hidden sm:block text-neutral-500 dark:text-neutral-400 text-sm mb-3 line-clamp-2">
              {{ p.description }}
            </p>
            <p class="text-neutral-900 dark:text-neutral-100 font-semibold text-sm sm:text-lg mb-3 sm:mb-6">
              {{ formatPrice(p.price) }}원
            </p>
            <button type="button" class="shop-btn-cart group py-1.5 sm:py-2 text-xs sm:text-sm" @click.stop="addToCart(p)">
              장바구니 담기
            </button>
          </div>
        </div>
      </div>

      
      <div
        v-if="!loading && totalPages > 1"
        class="flex justify-center items-center gap-2 mt-12"
      >
        <button
          @click="currentPage = 1"
          :disabled="currentPage === 1"
          :class="[
            'px-3 py-2 rounded-lg text-sm font-medium transition-all',
            currentPage === 1
              ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-400 cursor-not-allowed'
              : 'bg-white dark:bg-[#1a2235] text-neutral-800 dark:text-neutral-200 hover:bg-slate-100 hover:text-neutral-900 dark:hover:bg-slate-700 dark:hover:text-neutral-100 border border-slate-200/80 dark:border-slate-600/45'
          ]"
        >
          처음
        </button>
        
        <button
          @click="currentPage--"
          :disabled="currentPage === 1"
          :class="[
            'px-3 py-2 rounded-lg text-sm font-medium transition-all',
            currentPage === 1
              ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-400 cursor-not-allowed'
              : 'bg-white dark:bg-[#1a2235] text-neutral-800 dark:text-neutral-200 hover:bg-slate-100 hover:text-neutral-900 dark:hover:bg-slate-700 dark:hover:text-neutral-100 border border-slate-200/80 dark:border-slate-600/45'
          ]"
        >
          이전
        </button>

        <div class="flex gap-1">
          <template v-for="page in visiblePages" :key="page">
            <button
              v-if="page !== '...'"
              @click="currentPage = page"
              :class="[
                'px-4 py-2 rounded-lg text-sm font-medium transition-all min-w-[40px]',
                currentPage === page
                  ? 'shop-btn-primary text-white shadow-md scale-105'
                  : 'bg-white dark:bg-[#1a2235] text-neutral-800 dark:text-neutral-200 hover:bg-slate-100 hover:text-neutral-900 dark:hover:bg-slate-700 dark:hover:text-neutral-100 border border-slate-200/80 dark:border-slate-600/45'
              ]"
            >
              {{ page }}
            </button>
            <span
              v-else
              class="px-2 py-2 text-neutral-500 dark:text-neutral-400"
            >
              ...
            </span>
          </template>
        </div>

        <button
          @click="currentPage++"
          :disabled="currentPage === totalPages"
          :class="[
            'px-3 py-2 rounded-lg text-sm font-medium transition-all',
            currentPage === totalPages
              ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-400 cursor-not-allowed'
              : 'bg-white dark:bg-[#1a2235] text-neutral-800 dark:text-neutral-200 hover:bg-slate-100 hover:text-neutral-900 dark:hover:bg-slate-700 dark:hover:text-neutral-100 border border-slate-200/80 dark:border-slate-600/45'
          ]"
        >
          다음
        </button>
        
        <button
          @click="currentPage = totalPages"
          :disabled="currentPage === totalPages"
          :class="[
            'px-3 py-2 rounded-lg text-sm font-medium transition-all',
            currentPage === totalPages
              ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-400 cursor-not-allowed'
              : 'bg-white dark:bg-[#1a2235] text-neutral-800 dark:text-neutral-200 hover:bg-slate-100 hover:text-neutral-900 dark:hover:bg-slate-700 dark:hover:text-neutral-100 border border-slate-200/80 dark:border-slate-600/45'
          ]"
        >
          마지막
        </button>
      </div>
    </div>

    <Footer />

    <ChatButton />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import api from "../../lib/api";
import { useRouter, useRoute } from "vue-router";
import { useCartStore } from "../../store/cart";
import { useToastStore } from "../../store/toast";
import { useAuthStore } from "../../store/auth";
import ChatButton from "@/components/chat/ChatButton.vue";
import Footer from "@/app/layout/Footer.vue";
import SkeletonLoader from "@/components/ui/SkeletonLoader.vue";
import { getRecentlyViewed } from "../../composables/useRecentlyViewed";
import { formatPrice, normalizeImageUrl } from "../../lib/format";
import WishlistButton from "@/components/product/WishlistButton.vue";

const router = useRouter();
const route = useRoute();

const goDetail = (id) => {
  router.push(`/product/${id}`);
};

const goCategory = (catName) => {
  router.push({
    path: "/home",
    query: {
      ...route.query,
      category: catName === "전체" ? undefined : catName,
    },
  });
};

const cart = useCartStore();
const toast = useToastStore();
const auth = useAuthStore();
const products = ref([]);
const catalogTotal = ref(0);
const categoryList = ref([]);

const placeholderImg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect fill='%23e5e7eb' width='200' height='200'/%3E%3Ctext fill='%239ca3af' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='14'%3E이미지%3C/text%3E%3C/svg%3E";
const normalizeSearchText = (value) =>
  (value || "")
    .toString()
    .normalize("NFC")
    .toLowerCase()
    .trim();
const imgSrc = (p) => {
  if (!p) return placeholderImg;
  const gallery = Array.isArray(p.images) ? p.images : [];
  const raw = gallery.find(Boolean) || p.image_url || p.image;
  if (!raw) return placeholderImg;
  const url = normalizeImageUrl(raw);
  return url || placeholderImg;
};
const onImgError = (e) => { e.target.src = placeholderImg; };
const loading = ref(true);
const error = ref(null);
const searchQuery = ref("");
const selectedCategory = ref("전체");
const sortBy = ref("default");
const priceRange = ref("");
const currentPage = ref(1);
const itemsPerPage = ref(9);
const recentlyViewed = ref([]);
const placeholderExamples = [
  "출퇴근용 백팩, 5만 원대",
  "데님·캐주얼 코디, 10만 원 이하",
  "선물용 액세서리, 3만 원대",
];
const rotatingPlaceholderIndex = ref(0);
let placeholderTimer = null;

const rotatingPlaceholder = computed(
  () => `예) ${placeholderExamples[rotatingPlaceholderIndex.value]}`
);

const aiRecommendPrompt = ref("");
const aiRecommendLoading = ref(false);
const aiRecommendError = ref("");
const aiRecommendedProducts = ref([]);
const aiRecommendedTop = computed(() => aiRecommendedProducts.value.slice(0, 3));
const aiRecommendIntent = ref(null);
const aiRecommendSessionId = ref(
  `ai-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
);
const aiRecommendSummary = ref("");
const aiPromptSuggestions = [
  "출퇴근용 백팩, 5만 원대",
  "데님·캐주얼 코디, 10만 원 이하",
  "선물용 액세서리, 3만 원대",
  "가벼운 태블릿, 150만 원 이하",
];

const buildProductParams = () => {
  const params = {
    withMeta: 1,
    page: currentPage.value,
    limit: itemsPerPage.value,
  };
  const q = searchQuery.value.trim();
  if (q) params.search = q;
  if (selectedCategory.value && selectedCategory.value !== "전체") {
    params.category = selectedCategory.value;
  }
  if (priceRange.value) {
    const parts = priceRange.value.split("-");
    params.minPrice = Number(parts[0]) || 0;
    if (parts[1]) params.maxPrice = Number(parts[1]);
  }
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
    default:
      params.sortBy = "id";
      params.sortOrder = "desc";
      break;
  }
  return params;
};

const trackSearch = async (term) => {
  const clean = term.trim();
  if (!clean) return;
  try {
    await api.post("/analytics/search-events", {
      searchTerm: clean,
      userId: auth.user?.id || null,
    });
  } catch (_) {
  }
};

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(catalogTotal.value / itemsPerPage.value));
});

const visiblePages = computed(() => {
  const pages = [];
  const total = totalPages.value;
  const current = currentPage.value;
  
  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
  } else {
    if (current <= 4) {
      for (let i = 1; i <= 5; i++) {
        pages.push(i);
      }
      pages.push("...");
      pages.push(total);
    } else if (current >= total - 3) {
      pages.push(1);
      pages.push("...");
      for (let i = total - 4; i <= total; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      pages.push("...");
      for (let i = current - 1; i <= current + 1; i++) {
        pages.push(i);
      }
      pages.push("...");
      pages.push(total);
    }
  }
  
  return pages;
});

const addToCart = (p) => {
  cart.addToCart({
    id: p.id,
    name: p.name,
    price: p.price,
    image_url: p.image_url,
  });
  toast.success(`${p.name}이(가) 장바구니에 추가되었습니다.`);
};

const sendAiRecommendEvent = async (eventName, extra = {}) => {
  try {
    await api.post("/analytics/ai-recommend-events", {
      eventName,
      promptText: aiRecommendPrompt.value || null,
      productId: extra.productId || null,
      source: "home_ai_widget",
      sessionId: aiRecommendSessionId.value,
      meta: extra.meta || null,
    });
  } catch (_) {
  }
};

const openAiRecommendedProduct = async (p) => {
  await sendAiRecommendEvent("ai_recommend_click", {
    productId: p?.id,
    meta: { productName: p?.name || "" },
  });
  goDetail(p.id);
};

const addAiRecommendedToCart = async (p) => {
  await sendAiRecommendEvent("ai_recommend_add_to_cart", {
    productId: p?.id,
    meta: { productName: p?.name || "" },
  });
  addToCart(p);
};

const applyAiSuggestion = (text) => {
  aiRecommendPrompt.value = text;
  requestAiRecommendation();
};

const requestAiRecommendation = async () => {
  if (!aiRecommendPrompt.value || aiRecommendLoading.value) return;
  aiRecommendLoading.value = true;
  aiRecommendError.value = "";
  aiRecommendSummary.value = "";
  aiRecommendedProducts.value = [];
  aiRecommendIntent.value = null;
  aiRecommendSessionId.value = `ai-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  await sendAiRecommendEvent("ai_recommend_request", {
    meta: { promptLength: aiRecommendPrompt.value.length },
  });
  try {
    const res = await api.post("/ai/recommend", { prompt: aiRecommendPrompt.value });
    aiRecommendedProducts.value = Array.isArray(res.data?.recommendations) ? res.data.recommendations : [];
    aiRecommendIntent.value = res.data?.intent || null;
    aiRecommendSummary.value = res.data?.summary || "";
    if (aiRecommendedProducts.value.length > 0) {
      await sendAiRecommendEvent("ai_recommend_impression", {
        meta: {
          resultCount: aiRecommendedProducts.value.length,
          recommendedProductIds: aiRecommendedProducts.value.map((p) => p.id),
        },
      });
      requestAnimationFrame(() => {
        document.getElementById("home-ai-results")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    }
    if (aiRecommendedProducts.value.length === 0) {
      aiRecommendError.value = "추천 결과가 없어 다른 조건으로 시도해 주세요.";
    }
  } catch (err) {
    aiRecommendError.value = err.userMessage || "AI 추천을 불러오지 못했습니다.";
  } finally {
    aiRecommendLoading.value = false;
  }
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

    if (
      selectedCategory.value !== "전체" &&
      !categoryList.value.includes(selectedCategory.value)
    ) {
      selectedCategory.value = "전체";
    }

    if (q) await trackSearch(q);
  } catch (err) {
    error.value = err.userMessage || "상품을 불러오는 중 오류가 발생했습니다.";
    console.error("상품 불러오기 실패:", err);
  } finally {
    loading.value = false;
  }
};

const loadCategories = async () => {
  try {
    const res = await api.get("/categories");
    categoryList.value = Array.isArray(res.data) ? res.data.filter(Boolean) : [];
  } catch (_) {
    categoryList.value = [];
  }
};

watch([selectedCategory, searchQuery, priceRange, sortBy], () => {
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
  () => [route.query.q, route.query.category],
  ([q, category]) => {
    searchQuery.value = (q || "").toString();
    selectedCategory.value = category || "전체";
    currentPage.value = 1;
    loadProducts();
  }
);

onMounted(async () => {
  searchQuery.value = (route.query.q || "").toString();
  selectedCategory.value = route.query.category || "전체";
  recentlyViewed.value = getRecentlyViewed();
  await Promise.all([loadCategories(), loadProducts()]);
  placeholderTimer = setInterval(() => {
    rotatingPlaceholderIndex.value = (rotatingPlaceholderIndex.value + 1) % placeholderExamples.length;
  }, 3200);
});

onUnmounted(() => {
  clearInterval(placeholderTimer);
});
</script>

<style scoped>
.home-ai-strip {
  border-radius: 1rem;
  border: 1px solid rgba(99, 102, 241, 0.2);
  background: linear-gradient(135deg, rgba(238, 242, 255, 0.65), rgba(255, 255, 255, 0.92));
  padding: 0.75rem;
}
:global(.dark) .home-ai-strip {
  border-color: rgba(129, 140, 248, 0.22);
  background: linear-gradient(135deg, rgba(49, 46, 129, 0.28), rgba(15, 23, 42, 0.55));
}

.home-ai-strip__row {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
@media (min-width: 640px) {
  .home-ai-strip__row {
    flex-direction: row;
    align-items: center;
  }
}

.home-ai-strip__input {
  flex: 1;
  min-width: 0;
  border-radius: 0.75rem;
  border: 1px solid rgba(15, 23, 42, 0.1);
  background: white;
  padding: 0.65rem 0.85rem;
  font-size: 0.875rem;
}
.home-ai-strip__input:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.3);
  border-color: rgba(99, 102, 241, 0.4);
}
:global(.dark) .home-ai-strip__input {
  border-color: rgba(255, 255, 255, 0.12);
  background: rgba(15, 23, 42, 0.7);
  color: rgb(241 245 249);
}

.home-ai-strip__btn {
  @apply rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-60;
}

.home-ai-chip {
  border-radius: 9999px;
  border: 1px solid rgba(99, 102, 241, 0.2);
  background: rgba(255, 255, 255, 0.85);
  padding: 0.2rem 0.6rem;
  font-size: 0.68rem;
  color: rgb(67 56 202);
}
.home-ai-chip:hover:not(:disabled) {
  background: white;
}
:global(.dark) .home-ai-chip {
  border-color: rgba(129, 140, 248, 0.28);
  background: rgba(30, 27, 75, 0.45);
  color: rgb(199 210 254);
}

.home-ai-results {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
}
@media (min-width: 640px) {
  .home-ai-results {
    grid-template-columns: repeat(3, 1fr);
  }
}

.home-ai-result {
  border-radius: 0.85rem;
  border: 1px solid rgba(99, 102, 241, 0.15);
  background: rgba(255, 255, 255, 0.9);
  padding: 0.75rem;
}
:global(.dark) .home-ai-result {
  border-color: rgba(129, 140, 248, 0.18);
  background: rgba(15, 23, 42, 0.5);
}

.home-ai-result__media {
  height: 6.5rem;
  border-radius: 0.65rem;
  background: rgb(248 250 252);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
:global(.dark) .home-ai-result__media {
  background: rgb(24 24 27);
}
</style>
