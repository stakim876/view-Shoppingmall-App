<template>
  <div class="min-h-screen bg-surface-base text-primary font-sans">
    
    <div v-if="loading" class="min-h-screen flex items-center justify-center">
      <div class="text-center">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <p class="text-neutral-600 dark:text-neutral-300">상품 정보를 불러오는 중...</p>
      </div>
    </div>

    
    <div v-else-if="error" class="min-h-screen flex items-center justify-center px-6">
      <div class="text-center max-w-md">
        <div class="text-6xl mb-4">⚠️</div>
        <h2 class="text-2xl font-bold text-red-600 mb-2">오류가 발생했습니다</h2>
        <p class="text-neutral-600 dark:text-neutral-300 mb-6">{{ error }}</p>
        <div class="flex gap-3 justify-center">
          <button
            @click="$router.back()"
            class="shop-btn-secondary px-6 py-2 rounded-lg"
          >
            이전 페이지
          </button>
          <button
            @click="$router.go(0)"
            class="shop-btn-primary px-6 py-2 rounded-lg"
          >
            다시 시도
          </button>
        </div>
      </div>
    </div>

    
    <template v-else-if="product">
      <div class="max-w-6xl mx-auto px-6 pt-8">
        <Breadcrumb
          :items="[
            { label: '홈', to: '/home' },
            ...(product.category ? [{ label: product.category, to: `/home?category=${encodeURIComponent(product.category)}` }] : []),
            { label: product.name },
          ]"
        />
      </div>
      <section class="relative py-10 sm:py-16 overflow-hidden border-b border-neutral-200 dark:border-default">
        <div
          class="absolute inset-0 bg-gradient-to-br from-blue-100 via-indigo-100 to-transparent blur-3xl opacity-70"
        ></div>

        <div
          class="relative z-10 max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-10 items-center"
        >
          <div class="flex flex-col items-center gap-3">
            <img
              :src="productImages[selectedImageIndex] || (product?.image_url ? normalizeImageUrl(product.image_url) : '')"
              alt="상품 이미지"
              class="w-full max-w-md aspect-square object-contain rounded-2xl shadow-md bg-white p-6"
            />
            <div v-if="productImages.length > 1" class="flex gap-2 flex-wrap justify-center">
              <button
                v-for="(img, idx) in productImages"
                :key="idx"
                type="button"
                @click="selectedImageIndex = idx"
                :class="[
                  'w-14 h-14 rounded-lg overflow-hidden border-2 transition',
                  selectedImageIndex === idx
                    ? 'border-indigo-500 ring-2 ring-indigo-200'
                    : 'border-neutral-200 hover:border-neutral-300'
                ]"
              >
                <img :src="img" :alt="'이미지 ' + (idx + 1)" class="w-full h-full object-contain bg-white" />
              </button>
            </div>
          </div>

          <div class="flex flex-col justify-center animate-fadeInDetail">
            <h1 class="text-3xl sm:text-4xl font-bold mb-4 text-neutral-900 dark:text-neutral-50">
              {{ product?.name }}
            </h1>

            <p
              class="text-neutral-600 dark:text-neutral-300 text-base leading-relaxed mb-4 font-['Noto_Serif_KR'] italic"
            >
              {{ product?.description || "상품 설명이 준비 중입니다." }}
            </p>

            <div v-if="productOptionGroups.length" class="mb-4 space-y-4">
              <div v-for="group in productOptionGroups" :key="group.key">
                <p class="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">
                  {{ group.label }}
                </p>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="opt in group.values"
                    :key="`${group.key}-${opt.value}`"
                    type="button"
                    class="px-3 py-1.5 rounded-lg text-sm border transition-colors"
                    :class="
                      selectedOptions[group.key] === opt.value
                        ? 'bg-slate-900 text-white border-slate-900 dark:bg-indigo-500 dark:text-slate-50 dark:border-indigo-400/40 shadow-sm'
                        : 'bg-neutral-100 text-neutral-800 border-neutral-200/80 hover:border-neutral-400 dark:bg-surface-raised dark:text-neutral-200 dark:border-strong'
                    "
                    @click="selectOption(group.key, opt.value)"
                  >
                    {{ formatOptionChipLabel(opt) }}
                  </button>
                </div>
              </div>
              <p v-if="!optionsReady" class="text-xs text-amber-700 dark:text-amber-300">
                구매 전에 옵션을 모두 선택해 주세요.
              </p>
            </div>

            <div v-if="productLaptopSpecRows.length" class="mb-4 rounded-xl border border-neutral-200 dark:border-zinc-700 overflow-hidden">
              <p class="text-xs font-semibold text-neutral-500 uppercase tracking-wide px-4 pt-3 pb-2 bg-neutral-50 dark:bg-surface-sunken">
                주요 사양
              </p>
              <dl class="divide-y divide-neutral-100 dark:divide-zinc-800 text-sm">
                <div v-for="row in productLaptopSpecRows" :key="row.key" class="grid grid-cols-[6.5rem_1fr] gap-2 px-4 py-2">
                  <dt class="text-neutral-500 dark:text-neutral-400">{{ row.label }}</dt>
                  <dd class="text-neutral-800 dark:text-neutral-200 font-medium">{{ row.value }}</dd>
                </div>
              </dl>
            </div>

            <p class="text-3xl font-semibold text-indigo-700 dark:text-indigo-400 mb-2">
              {{ formatPrice(displayPrice) }}원
            </p>
            <p
              v-if="optionsReady && priceDelta > 0"
              class="text-xs text-neutral-500 dark:text-neutral-400 -mt-1 mb-2"
            >
              기본가 {{ formatPrice(product?.price) }}원 + 옵션 {{ formatPrice(priceDelta) }}원
            </p>

            <p class="mb-6 text-sm">
              <span v-if="stockNumber === 0" class="text-red-600 font-medium">품절</span>
              <span v-else class="text-neutral-600 dark:text-neutral-300">남은 수량 {{ stockNumber }}개</span>
            </p>

            <form
              v-if="stockNumber === 0"
              @submit.prevent="subscribeRestock"
              class="mb-6 p-3 rounded-xl border border-indigo-100 bg-indigo-50/60 max-w-md"
            >
              <p class="text-sm font-medium text-indigo-900 mb-2">재입고 알림 신청</p>
              <div class="flex gap-2">
                <input
                  v-model.trim="restockEmail"
                  type="email"
                  placeholder="알림 받을 이메일"
                  class="flex-1 px-3 py-2 border border-indigo-200 rounded-lg text-sm"
                  required
                />
                <button
                  type="submit"
                  :disabled="restockSubmitting"
                  class="shop-btn-primary px-4 py-2 text-sm rounded-lg disabled:opacity-50"
                >
                  {{ restockSubmitting ? "신청 중..." : "신청" }}
                </button>
              </div>
              <p v-if="restockMessage" class="mt-2 text-xs text-neutral-600 dark:text-neutral-300">{{ restockMessage }}</p>
            </form>

            <div class="flex flex-wrap items-center gap-3">
              <WishlistButton :product-id="product.id" size="lg" />
              <button
                v-if="stockNumber > 0"
                type="button"
                class="shop-btn-cart !w-auto px-6 py-3 disabled:opacity-50"
                :disabled="!optionsReady"
                @click="addToCart(product)"
              >
                장바구니 담기
              </button>
              <button
                v-else
                type="button"
                disabled
                class="px-6 py-3 rounded-xl font-medium shop-btn-disabled"
              >
                장바구니 담기
              </button>
              <button
                v-if="stockNumber > 0"
                type="button"
                class="shop-btn-secondary px-6 py-3 rounded-xl disabled:opacity-50"
                :disabled="!optionsReady"
                @click="buyNow(product)"
              >
                바로 구매
              </button>
            </div>
          </div>
        </div>
      </section>

      
      <section class="max-w-4xl mx-auto px-6 py-12 border-b border-neutral-200 dark:border-default">
        <h2 class="text-xl font-semibold text-neutral-800 dark:text-neutral-100 mb-6">구매 후기</h2>

        <form v-if="auth.isLoggedIn" @submit.prevent="submitReview" class="mb-8 p-4 bg-neutral-50 dark:bg-surface-sunken rounded-xl border border-neutral-200 dark:border-default">
          <p class="text-sm text-neutral-600 dark:text-neutral-300 mb-2">별점을 선택하고 한 줄 리뷰를 남겨 주세요.</p>
          <div class="flex items-center gap-1 mb-3">
            <button
              v-for="n in 5"
              :key="n"
              type="button"
              @click="reviewRating = n"
              class="text-2xl focus:outline-none"
            >
              {{ reviewRating >= n ? '★' : '☆' }}
            </button>
            <span class="text-sm text-neutral-500 dark:text-neutral-400 ml-2">{{ reviewRating }}점</span>
          </div>
          <textarea
            v-model="reviewContent"
            placeholder="리뷰 내용 (선택)"
            class="w-full border border-neutral-200 dark:border-zinc-700 bg-white dark:bg-surface-raised rounded-lg p-3 text-sm mb-2 resize-none"
            rows="2"
          />
          <button
            type="submit"
            :disabled="reviewSubmitting"
            class="shop-btn-primary px-4 py-2 text-sm rounded-lg disabled:opacity-50"
          >
            {{ reviewSubmitting ? '등록 중...' : '리뷰 등록' }}
          </button>
        </form>
        <p v-else class="mb-6 text-sm text-neutral-500">
          <router-link to="/login" class="text-indigo-600 hover:underline">로그인</router-link> 후 리뷰를 남길 수 있습니다.
        </p>

        <div v-if="reviews.length === 0" class="text-neutral-400 text-sm">아직 후기가 없습니다.</div>
        <ul v-else class="space-y-4">
          <li
            v-for="r in reviews"
            :key="r.id"
            class="flex gap-3 p-3 bg-white dark:bg-surface-raised border border-neutral-100 dark:border-default rounded-lg"
          >
            <div class="flex items-center gap-1 text-yellow-500 shrink-0">
              <span v-for="n in 5" :key="n">{{ r.rating >= n ? '★' : '☆' }}</span>
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-neutral-700">{{ r.user_name || '비회원' }}</p>
              <p v-if="r.content" class="text-sm text-neutral-600 mt-0.5">{{ r.content }}</p>
              <p class="text-xs text-neutral-400 mt-1">{{ formatDate(r.created_at) }}</p>
            </div>
          </li>
        </ul>
      </section>

      <div class="max-w-7xl mx-auto px-6 py-16">
        <h2
          class="text-2xl font-semibold text-neutral-800 dark:text-neutral-100 mb-8 text-center border-b border-neutral-200 dark:border-default pb-3"
        >
          비슷한 상품 추천
        </h2>

      <div v-if="relatedProducts.length === 0" class="text-center text-neutral-400">
        관련 상품이 없습니다.
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
        <div
          v-for="p in relatedProducts"
          :key="p.id"
          class="group relative overflow-hidden rounded-3xl bg-white dark:bg-surface-raised border border-neutral-200 dark:border-default hover:border-blue-400 transition-all duration-300 shadow-sm hover:shadow-lg"
        >
          <div class="absolute top-3 right-3 z-10" @click.stop>
            <WishlistButton :product-id="p.id" size="sm" />
          </div>
          <div class="overflow-hidden aspect-square flex items-center justify-center bg-white">
            <img
              :src="normalizeImageUrl(p.image_url || p.image)"
              :alt="p.name"
              class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          </div>

          <div class="p-5 text-center">
            <h3 class="font-semibold text-lg text-neutral-900 mb-2">{{ p.name }}</h3>
            <p class="text-blue-600 font-semibold text-lg mb-4">
              {{ formatPrice(p.price) }}원
            </p>
            <router-link
              :to="`/product/${p.id}`"
              class="shop-btn-primary text-sm inline-flex items-center justify-center px-4 py-2 rounded-xl"
            >
              자세히 보기
            </router-link>
          </div>
        </div>
      </div>
    </div>

      <Footer />
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import api from "../../lib/api";
import { useCartStore } from "../../store/cart";
import { useAuthStore } from "../../store/auth";
import { useToastStore } from "../../store/toast";
import { addRecentlyViewed } from "../../composables/useRecentlyViewed";
import Breadcrumb from "@/components/ui/Breadcrumb.vue";
import WishlistButton from "@/components/product/WishlistButton.vue";
import Footer from "@/app/layout/Footer.vue";
import { formatPrice, normalizeImageUrl } from "../../lib/format";
import {
  parseProductOptions,
  areAllOptionsSelected,
  formatOptionsLabel,
  optionsLineKey,
  normalizeSelectedOptions,
  computeUnitPrice,
  sumOptionPriceDelta,
  formatOptionChipLabel,
} from "@/lib/productOptions.js";

const route = useRoute();
const router = useRouter();
const product = ref(null);
const relatedProducts = ref([]);
const reviews = ref([]);
const loading = ref(true);
const error = ref(null);
const cart = useCartStore();
const auth = useAuthStore();
const toast = useToastStore();

const selectedImageIndex = ref(0);
const selectedOptions = ref({});
const reviewRating = ref(5);
const reviewContent = ref("");
const reviewSubmitting = ref(false);
const restockEmail = ref("");
const restockSubmitting = ref(false);
const restockMessage = ref("");

const duplicateGalleryFallbackByProduct = {
  "맥북 프로": "/images/macbookpro-back.png",
  "에어팟 프로": "/images/airpodspro-case.png",
  "아이패드 프로": "/images/ipadpro-back.png",
};

const productImages = computed(() => {
  if (!product.value) return [];
  const rawImages = product.value.images;
  const imageList = Array.isArray(rawImages)
    ? rawImages
    : typeof rawImages === "string"
      ? rawImages.split(",").map((s) => s.trim())
      : [];
  const fallback = [product.value.image_url, product.value.image].filter(Boolean);
  const normalizedImages = [...imageList, ...fallback]
    .map((url) => (url ? normalizeImageUrl(url) : ""))
    .filter(Boolean);

  const duplicateFallback = duplicateGalleryFallbackByProduct[product.value?.name];
  if (duplicateFallback && normalizedImages.length > 1) {
    const duplicateIndex = normalizedImages.findIndex(
      (url, idx) => idx > 0 && url === normalizedImages[0]
    );
    if (duplicateIndex !== -1) {
      normalizedImages[duplicateIndex] = normalizeImageUrl(duplicateFallback);
    }
  }

  const seen = new Set();
  return normalizedImages.filter((url) => {
    if (seen.has(url)) return false;
    seen.add(url);
    return true;
  });
});

const stockNumber = computed(() => {
  const p = product.value;
  if (!p || p.stock == null || p.stock === undefined) return 0;
  return Number(p.stock);
});

const productOptionGroups = computed(() => {
  const fromProduct = parseProductOptions(product.value?.product_options);
  if (fromProduct.length) return fromProduct;
  const colors = (() => {
    const raw = product.value?.color_options;
    if (raw == null || raw === "") return [];
    try {
      const p = typeof raw === "string" ? JSON.parse(raw) : raw;
      return Array.isArray(p) ? p.filter(Boolean).map(String) : [];
    } catch {
      return [];
    }
  })();
  if (!colors.length) return [];
  return [{ key: "color", label: "색상", values: colors.map((c) => ({ value: String(c), priceDelta: 0 })) }];
});

const optionsReady = computed(() =>
  areAllOptionsSelected(productOptionGroups.value, selectedOptions.value)
);

const priceDelta = computed(() =>
  sumOptionPriceDelta(productOptionGroups.value, selectedOptions.value)
);

const displayPrice = computed(() => {
  const base = Number(product.value?.price);
  if (!Number.isFinite(base)) return 0;
  if (!optionsReady.value) return base;
  return computeUnitPrice(base, productOptionGroups.value, selectedOptions.value) ?? base;
});

const LAPTOP_SPEC_LABELS = {
  cpu: "CPU",
  ram: "RAM",
  storage: "저장장치",
  display: "디스플레이",
  gpu: "GPU",
};

const productLaptopSpecRows = computed(() => {
  const raw = product.value?.laptop_specs;
  if (raw == null || raw === "") return [];
  let obj;
  try {
    obj = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    return [];
  }
  if (!obj || typeof obj !== "object") return [];
  return Object.entries(LAPTOP_SPEC_LABELS)
    .map(([key, label]) => {
      const value = obj[key];
      const s = value != null ? String(value).trim() : "";
      return s ? { key, label, value: s } : null;
    })
    .filter(Boolean);
});

const selectOption = (key, value) => {
  selectedOptions.value = { ...selectedOptions.value, [key]: value };
};

const buildCartPayload = (p) => {
  const options = normalizeSelectedOptions(selectedOptions.value);
  const optionsLabel = formatOptionsLabel(productOptionGroups.value, options);
  const unitPrice =
    computeUnitPrice(p.price, productOptionGroups.value, options) ?? Number(p.price);
  return {
    id: p.id,
    name: p.name,
    price: unitPrice,
    image_url: p.image_url,
    options,
    optionsLabel,
  };
};

const addToCart = (p) => {
  if (!optionsReady.value) {
    toast.warning("옵션을 모두 선택해 주세요.");
    return;
  }
  const stock = Number(p?.stock || 0);
  const lineKey = optionsLineKey(p.id, selectedOptions.value);
  const existing = cart.items.find((i) => i.lineKey === lineKey);
  const currentQty = Number(existing?.quantity || 0);
  if (stock <= 0 || currentQty >= stock) {
    toast.warning("현재 재고보다 많이 담을 수 없습니다.");
    return;
  }

  const ok = cart.addToCart(buildCartPayload(p), stock);
  if (!ok) {
    toast.warning("현재 재고보다 많이 담을 수 없습니다.");
    return;
  }
  toast.success(`${p.name}을(를) 장바구니에 담았습니다.`);
};

const buyNow = (p) => {
  if (!optionsReady.value) {
    toast.warning("옵션을 모두 선택해 주세요.");
    return;
  }
  const stock = Number(p?.stock || 0);
  const ok = cart.addToCart(buildCartPayload(p), stock);
  if (!ok) {
    toast.warning("현재 재고보다 많이 담을 수 없습니다.");
    return;
  }
  router.push("/checkout");
};

const formatDate = (str) => {
  if (!str) return "";
  const d = new Date(str);
  return d.toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" });
};

const loadReviews = async () => {
  const id = route.params.id;
  if (!id) return;
  try {
    const res = await api.get(`/products/${id}/reviews`);
    reviews.value = res.data || [];
  } catch (_) {
    reviews.value = [];
  }
};

const submitReview = async () => {
  const id = route.params.id;
  if (!id || reviewSubmitting.value) return;
  reviewSubmitting.value = true;
  try {
    await api.post(`/products/${id}/reviews`, {
      rating: reviewRating.value,
      content: reviewContent.value.trim(),
    });
    reviewContent.value = "";
    reviewRating.value = 5;
    await loadReviews();
    toast.success("리뷰가 등록되었습니다.");
  } catch (err) {
    toast.error(err.response?.data?.message || "리뷰를 등록하지 못했습니다. 잠시 후 다시 시도해 주세요.");
  } finally {
    reviewSubmitting.value = false;
  }
};

const subscribeRestock = async () => {
  if (!product.value?.id || restockSubmitting.value) return;
  const email = restockEmail.value.trim().toLowerCase();
  if (!email) return;

  restockSubmitting.value = true;
  restockMessage.value = "";
  try {
    const res = await api.post(`/products/${product.value.id}/restock-subscriptions`, { email });
    restockMessage.value = res.data?.message || "재입고 알림이 신청되었습니다.";
  } catch (err) {
    restockMessage.value = err.response?.data?.message || "재입고 알림 신청에 실패했습니다.";
  } finally {
    restockSubmitting.value = false;
  }
};

const loadProduct = async (id) => {
  loading.value = true;
  error.value = null;
  selectedImageIndex.value = 0;
  selectedOptions.value = {};
  try {
    const res = await api.get(`/products/${id}`);
    product.value = res.data;
    restockEmail.value = auth.user?.email || "";
    restockMessage.value = "";
    addRecentlyViewed(product.value);

    loadReviews();

    try {
      const all = await api.get("/products");
      const allProducts = all.data.filter((p) => p.id !== product.value.id);

      let related = allProducts.filter(
        (p) => p.category === product.value.category
      );

      if (related.length === 0) {
        related = allProducts.sort(() => Math.random() - 0.5).slice(0, 3);
      } else {
        related = related.slice(0, 3);
      }

      relatedProducts.value = related;
    } catch (err) {
      console.warn("관련 상품 불러오기 실패:", err);
      relatedProducts.value = [];
    }
  } catch (err) {
    error.value = err.userMessage || "상품 정보를 불러오는 중 오류가 발생했습니다.";
    console.error("상품 상세 불러오기 실패:", err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadProduct(route.params.id);
});

watch(
  () => route.params.id,
  (newId) => {
    if (newId) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      loadProduct(newId);
    }
  }
);
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
