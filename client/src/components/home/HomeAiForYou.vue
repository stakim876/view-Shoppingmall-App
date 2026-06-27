<template>
  <section
    v-if="loading || products.length > 0 || showEmptyHint"
    class="max-w-7xl mx-auto px-4 sm:px-6 pt-3 scroll-mt-24"
    aria-label="AI 맞춤 추천"
  >
    <div class="home-ai-strip home-ai-for-you">
      <div class="flex items-center gap-2 mb-1">
        <Sparkles class="w-4 h-4 text-indigo-600 dark:text-violet-300 shrink-0" aria-hidden="true" />
        <span class="text-xs font-bold tracking-wide text-indigo-600 dark:text-indigo-300 uppercase">
          AI 맞춤
        </span>
      </div>
      <h2 class="text-lg font-bold text-slate-900 dark:text-white">
        당신을 위한 AI 추천
      </h2>
      <p v-if="summary" class="mt-1 text-sm text-slate-600 dark:text-slate-300">
        {{ summary }}
      </p>

      <p v-if="loading" class="mt-3 text-sm text-slate-500 dark:text-slate-400">
        취향을 분석하는 중…
      </p>

      <div v-else-if="products.length > 0" class="home-ai-results mt-3">
        <article
          v-for="p in products"
          :key="`for-you-${p.id}`"
          class="home-ai-result"
        >
          <button type="button" class="text-left w-full" @click="openProduct(p.id)">
            <div class="home-ai-result__media">
              <img :src="imgSrc(p)" :alt="p.name" class="h-full w-full object-contain" @error="onImgError" />
            </div>
            <h3 class="mt-2 font-semibold text-sm text-slate-900 dark:text-white line-clamp-2">
              {{ p.name }}
            </h3>
            <p class="mt-1 text-sm font-bold tabular-nums text-slate-900 dark:text-white">
              {{ formatPrice(p.price) }}원
            </p>
            <p v-if="p.reason" class="mt-1 text-xs text-indigo-600/90 dark:text-violet-300/90 line-clamp-2">
              AI · {{ p.reason }}
            </p>
          </button>
          <button
            type="button"
            class="mt-2 shop-btn-cart py-2 text-xs sm:text-sm w-full"
            @click="addToCart(p)"
          >
            장바구니
          </button>
        </article>
      </div>

      <p
        v-else-if="showEmptyHint"
        class="mt-3 text-sm text-slate-500 dark:text-slate-400 leading-relaxed"
      >
        상품을 둘러보거나 로그인하시면 AI가 취향에 맞는 상품을 골라 드립니다.
      </p>
    </div>
  </section>
</template>

<script setup>
/*
 * [면접] AI 맞춤 추천 섹션
 * GET /recommendations/personalized — 최근 본 상품 ID를 넘기면 서버가 행동 기반 추천 반환
 */
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { Sparkles } from "lucide-vue-next";
import api from "@/lib/api";
import { useCartStore } from "@/store/cart";
import { useToastStore } from "@/store/toast";
import { getRecentlyViewed } from "@/composables/useRecentlyViewed";
import { formatPrice, normalizeImageUrl } from "@/lib/format";

const router = useRouter();
const cart = useCartStore();
const toast = useToastStore();

const products = ref([]);
const summary = ref("");
const loading = ref(true);
const showEmptyHint = ref(false);

const placeholderImg =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23e5e7eb' width='200' height='200'/%3E%3Ctext fill='%239ca3af' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='14'%3E이미지%3C/text%3E%3C/svg%3E";

const imgSrc = (p) => {
  const raw = p?.image_url || p?.image;
  if (!raw) return placeholderImg;
  return normalizeImageUrl(raw) || placeholderImg;
};

const onImgError = (e) => {
  e.target.src = placeholderImg;
};

const openProduct = (id) => router.push(`/product/${id}`);

const addToCart = (p) => {
  cart.addToCart({
    id: p.id,
    name: p.name,
    price: p.price,
    image_url: p.image_url,
  });
  toast.success(`${p.name}이(가) 장바구니에 추가되었습니다.`);
};

onMounted(async () => {
  loading.value = true;
  try {
    const recentIds = getRecentlyViewed().map((p) => p.id).filter(Boolean);
    // [면접] recentProductIds — 클라이언트 localStorage의 최근 본 상품을 서버 추천 가중치에 활용
    const res = await api.get("/recommendations/personalized", {
      params: {
        recentProductIds: recentIds.join(","),
        limit: 3,
      },
    });
    products.value = Array.isArray(res.data?.recommendations) ? res.data.recommendations : [];
    summary.value = res.data?.summary || "";
    showEmptyHint.value = products.value.length === 0;
  } catch {
    products.value = [];
    showEmptyHint.value = true;
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.home-ai-for-you {
  padding: 0.85rem 0.9rem;
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
  height: 5.5rem;
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
