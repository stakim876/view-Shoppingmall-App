<template>
  <div class="relative min-h-screen bg-surface-base text-primary font-sans">
    <div class="relative z-10 pb-8">
      <HomeHero />
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
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import api from "@/lib/api";
import { useCartStore } from "@/store/cart";
import { useToastStore } from "@/store/toast";
import { getRecentlyViewed } from "@/composables/useRecentlyViewed";
import { parseProductListResponse } from "@/lib/productDisplay.js";
import Footer from "@/app/layout/Footer.vue";
import HomeHero from "@/components/home/HomeHero.vue";
import HomeTrustBar from "@/components/home/HomeTrustBar.vue";
import HomeCategoryTiles from "@/components/home/HomeCategoryTiles.vue";
import HomeProductRail from "@/components/home/HomeProductRail.vue";

const router = useRouter();
const cart = useCartStore();
const toast = useToastStore();

const categories = ref([]);
const categoriesLoading = ref(true);

const bestProducts = ref([]);
const bestLoading = ref(true);
const bestError = ref("");

const newProducts = ref([]);
const newLoading = ref(true);
const newError = ref("");

const recentProducts = ref([]);
const recentLoading = ref(true);

const productListParams = (extra = {}) => ({
  withMeta: 1,
  withReviews: 1,
  ...extra,
});

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
  cart.addToCart({
    id: product.id,
    name: product.name,
    price: product.price,
    image_url: product.image_url,
  });
  toast.success(`${product.name}이(가) 장바구니에 추가되었습니다.`);
};

onMounted(async () => {
  await Promise.all([loadCategories(), loadBest(), loadNew(), loadRecent()]);
});
</script>
