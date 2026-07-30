<template>
  <div class="min-h-screen bg-surface-base text-primary font-sans">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <header class="mb-6">
        <h1 class="shop-page-title">쉬운 장보기</h1>
        <p class="mt-1 text-sm text-secondary">
          자주 사는 상품만 모아 빠르게 담을 수 있어요.
        </p>
      </header>

      <SeniorEasyShopPanel :all-products="catalogProducts" start-expanded />
    </div>

    <Footer />
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import api from "@/lib/api";
import Footer from "@/app/layout/Footer.vue";
import SeniorEasyShopPanel from "@/components/senior/SeniorEasyShopPanel.vue";

const catalogProducts = ref([]);

onMounted(async () => {
  try {
    const res = await api.get("/products", {
      params: { page: 1, limit: 50, sortBy: "id", sortOrder: "desc" },
    });
    const payload = res.data?.items != null ? res.data : { items: res.data };
    catalogProducts.value = Array.isArray(payload.items) ? payload.items : [];
  } catch (_) {
    catalogProducts.value = [];
  }
});
</script>
