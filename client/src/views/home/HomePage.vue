<template>
  <div class="relative min-h-screen bg-surface-base text-primary font-sans">
    <div class="relative z-10 pb-8">
      <HomeHero :popular-terms="popularSearches" />
      <HomeTrustBar />
      <HomeCategoryTiles :categories="categories" :loading="categoriesLoading" />

      <HomeProductRail
        title="베스트"
        subtitle="많이 주문된 인기 상품"
        :products="bestProducts"
        :loading="bestLoading"
        :error="bestError"
        :more-to="{ path: '/products', query: { tab: 'best' } }"
        @open="goDetail"
        @add-to-cart="addToCart"
        @retry="loadBest"
      />

      <HomeProductRail
        title="신상품"
        subtitle="새로 등록된 상품"
        :products="newProducts"
        :loading="newLoading"
        :error="newError"
        :more-to="{ path: '/products', query: { tab: 'new' } }"
        @open="goDetail"
        @add-to-cart="addToCart"
        @retry="loadNew"
      />

      <HomeProductRail
        v-if="auth.isLoggedIn && (forYouLoading || forYouProducts.length > 0)"
        title="맞춤 추천"
        :subtitle="forYouSummary"
        :products="forYouProducts"
        :loading="forYouLoading"
        :error="forYouError"
        :more-to="{ path: '/products' }"
        @open="goDetail"
        @add-to-cart="addToCart"
        @retry="loadForYou"
      />

      <HomeProductRail
        v-if="recentLoading || recentProducts.length > 0"
        title="최근 본 상품"
        :products="recentProducts"
        :loading="recentLoading"
        :more-to="{ path: '/products' }"
        @open="goDetail"
        @add-to-cart="addToCart"
      />

      <Footer />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import api from "@/lib/api";
import { useCartStore } from "@/store/cart";
import { useToastStore } from "@/store/toast";
import { useAuthStore } from "@/store/auth";
import { getRecentlyViewed } from "@/composables/useRecentlyViewed";
import { parseProductListResponse } from "@/lib/productDisplay.js";
import { parseProductOptions } from "@/lib/productOptions.js";
import Footer from "@/app/layout/Footer.vue";
import HomeHero from "@/components/home/HomeHero.vue";
import HomeTrustBar from "@/components/home/HomeTrustBar.vue";
import HomeCategoryTiles from "@/components/home/HomeCategoryTiles.vue";
import HomeProductRail from "@/components/home/HomeProductRail.vue";

const router = useRouter();
const cart = useCartStore();
const toast = useToastStore();
const auth = useAuthStore();

const popularSearches = ref([]);
const categories = ref([]);
const categoriesLoading = ref(true);

const bestProducts = ref([]);
const bestLoading = ref(true);
const bestError = ref("");

const newProducts = ref([]);
const newLoading = ref(true);
const newError = ref("");

const forYouProducts = ref([]);
const forYouLoading = ref(false);
const forYouError = ref("");
const forYouSummary = ref("");

const recentProducts = ref([]);
const recentLoading = ref(true);

const productListParams = (extra = {}) => ({
  withMeta: 1,
  withReviews: 1,
  ...extra,
});

const loadPopularSearches = async () => {
  try {
    const res = await api.get("/search/popular", { params: { limit: 6 } });
    const terms = res.data?.terms;
    popularSearches.value = Array.isArray(terms) ? terms.filter(Boolean) : [];
  } catch (_) {
    popularSearches.value = [];
  }
};

const loadCategories = async () => {
  categoriesLoading.value = true;
  try {
    const res = await api.get("/categories");
    categories.value = Array.isArray(res.data) ? res.data.filter(Boolean) : [];
  } catch (_) {
    categories.value = [];
  } finally {
    categoriesLoading.value = false;
  }
};

const loadBest = async () => {
  bestLoading.value = true;
  bestError.value = "";
  try {
    const res = await api.get("/products", {
      params: productListParams({ limit: 8, sortBy: "popular", sortOrder: "desc" }),
    });
    bestProducts.value = parseProductListResponse(res);
  } catch (err) {
    bestProducts.value = [];
    bestError.value = err.userMessage || "베스트 상품을 불러오지 못했습니다.";
  } finally {
    bestLoading.value = false;
  }
};

const loadNew = async () => {
  newLoading.value = true;
  newError.value = "";
  try {
    const res = await api.get("/products", {
      params: productListParams({ limit: 8, sortBy: "created_at", sortOrder: "desc" }),
    });
    newProducts.value = parseProductListResponse(res);
  } catch (err) {
    newProducts.value = [];
    newError.value = err.userMessage || "신상품을 불러오지 못했습니다.";
  } finally {
    newLoading.value = false;
  }
};

const loadForYou = async () => {
  if (!auth.isLoggedIn) {
    forYouProducts.value = [];
    return;
  }
  forYouLoading.value = true;
  forYouError.value = "";
  try {
    const recentIds = getRecentlyViewed().map((p) => p.id).filter(Boolean);
    const res = await api.get("/recommendations/personalized", {
      params: {
        limit: 8,
        recentProductIds: recentIds.join(","),
      },
    });
    forYouProducts.value = Array.isArray(res.data?.recommendations)
      ? res.data.recommendations
      : [];
    forYouSummary.value = res.data?.summary || "";
  } catch (err) {
    forYouProducts.value = [];
    forYouError.value = err.userMessage || "맞춤 추천을 불러오지 못했습니다.";
  } finally {
    forYouLoading.value = false;
  }
};

const loadRecent = async () => {
  recentLoading.value = true;
  const viewed = getRecentlyViewed();
  if (!viewed.length) {
    recentProducts.value = [];
    recentLoading.value = false;
    return;
  }
  const ids = viewed.map((item) => item.id).filter(Boolean).slice(0, 8);
  try {
    const res = await api.get("/products", {
      params: productListParams({ ids: ids.join(","), limit: ids.length }),
    });
    const list = parseProductListResponse(res);
    recentProducts.value = list.length > 0 ? list : viewed.slice(0, 8);
  } catch (_) {
    recentProducts.value = viewed.slice(0, 8);
  } finally {
    recentLoading.value = false;
  }
};

const goDetail = (id) => {
  router.push(`/product/${id}`);
};

const addToCart = (product) => {
  if (parseProductOptions(product.product_options).length) {
    toast.warning("옵션을 선택해 주세요.");
    router.push(`/product/${product.id}`);
    return;
  }
  const maxStock = product.stock != null ? Number(product.stock) : null;
  if (maxStock != null && maxStock <= 0) {
    toast.warning("품절된 상품입니다.");
    return;
  }
  const ok = cart.addToCart(
    {
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
    },
    maxStock
  );
  if (!ok) {
    toast.warning("재고가 부족합니다.");
    return;
  }
  toast.success(`${product.name}이(가) 장바구니에 추가되었습니다.`);
};

watch(
  () => auth.isLoggedIn,
  (loggedIn) => {
    if (loggedIn) loadForYou();
    else {
      forYouProducts.value = [];
      forYouSummary.value = "";
    }
  }
);

onMounted(async () => {
  await Promise.all([
    loadPopularSearches(),
    loadCategories(),
    loadBest(),
    loadNew(),
    loadRecent(),
    loadForYou(),
  ]);
});
</script>
