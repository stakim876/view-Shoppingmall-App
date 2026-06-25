<template>
  <section
    id="senior-easy-shop"
    class="max-w-7xl mx-auto px-4 sm:px-6 py-2 scroll-mt-24"
    aria-label="쉬운 장보기"
  >
    <div class="senior-easy-strip">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div class="min-w-0">
          <h2 class="shop-page-title">
            쉬운 장보기
          </h2>
          <p class="mt-0.5 text-sm text-slate-600 dark:text-slate-300">
            자주 사는 상품만 모아 빠르게 담을 수 있어요.
          </p>
        </div>

        <button
          type="button"
          class="shop-btn-secondary shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold"
          :aria-expanded="expanded"
          @click="expanded = !expanded"
        >
          {{ expanded ? "접기" : "펼치기" }}
        </button>
      </div>

      <div v-show="expanded" class="mt-3 space-y-3">
        <p class="text-xs text-slate-500 dark:text-slate-400">
          <span class="font-semibold text-slate-700 dark:text-slate-200">1. 담기</span>
          <span class="mx-1.5" aria-hidden="true">→</span>
          <span class="font-semibold text-slate-700 dark:text-slate-200">2. 장바구니</span>
          <span class="mx-1.5" aria-hidden="true">→</span>
          <span class="font-semibold text-slate-700 dark:text-slate-200">3. 주문</span>
        </p>

        <div class="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            class="shop-btn-secondary rounded-xl px-4 py-2.5 text-sm font-semibold w-full"
            @click="reorderLast"
          >
            지난 주문 다시 담기
          </button>
          <button
            type="button"
            class="shop-btn-primary rounded-xl px-4 py-2.5 text-sm font-semibold w-full"
            @click="goCart"
          >
            장바구니 보기 ({{ cartCount }})
          </button>
        </div>

        <div
          v-if="isAdmin && editMode"
          class="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-white/80 dark:bg-zinc-900/50 p-4"
        >
          <p class="text-sm font-bold text-slate-800 dark:text-slate-100 mb-3">
            단골 상품 선택 (관리자)
          </p>
          <div class="grid gap-2 max-h-48 overflow-y-auto">
            <label
              v-for="p in allProducts"
              :key="`fav-${p.id}`"
              class="flex items-center gap-3 text-sm py-1 cursor-pointer"
            >
              <input
                type="checkbox"
                class="senior-checkbox"
                :checked="favoriteIds.includes(p.id)"
                @change="toggleFavorite(p.id)"
              />
              <span>{{ p.name }}</span>
            </label>
          </div>
          <button
            type="button"
            class="shop-btn-secondary mt-3 w-full py-2.5 rounded-xl text-sm font-semibold"
            @click="editMode = false"
          >
            완료
          </button>
        </div>

        <div class="flex flex-wrap items-center justify-between gap-2">
          <p class="text-sm font-semibold text-slate-800 dark:text-slate-100">
            단골 상품 {{ displayProducts.length }}개
          </p>
          <button
            v-if="isAdmin"
            type="button"
            class="shop-link-muted"
            @click="editMode = !editMode"
          >
            {{ editMode ? "편집 닫기" : "단골 상품 편집" }}
          </button>
        </div>

        <div
          v-if="displayProducts.length === 0"
          class="text-center py-8 text-base text-slate-500 dark:text-slate-400"
        >
          등록된 단골 상품이 없습니다.
        </div>

        <div
          v-else
          class="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
        >
          <article
            v-for="p in displayProducts"
            :key="`senior-${p.id}`"
            class="shop-card-product flex flex-col !cursor-default"
          >
            <div class="shop-card-product-media h-28 sm:h-32 p-2">
              <img
                :src="imgSrc(p)"
                :alt="p.name"
                class="max-h-full max-w-full object-contain"
                @error="onImgError"
              />
            </div>
            <div class="relative z-[1] p-3 flex flex-col flex-1">
              <h3 class="text-sm font-semibold text-slate-900 dark:text-white leading-snug line-clamp-2">
                {{ p.name }}
              </h3>
              <p class="mt-1 text-sm font-bold tabular-nums text-slate-900 dark:text-white">
                {{ formatPrice(p.price) }}원
              </p>
              <button
                type="button"
                class="shop-btn-cart mt-2 py-2 text-xs sm:text-sm"
                :class="justAddedId === p.id ? 'senior-added' : ''"
                @click="addProduct(p)"
              >
                {{ justAddedId === p.id ? "담았습니다 ✓" : "장바구니 담기" }}
              </button>
            </div>
          </article>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { storeToRefs } from "pinia";
import { useCartStore } from "@/store/cart";
import { useToastStore } from "@/store/toast";
import { useAuthStore } from "@/store/auth";
import { formatPrice, normalizeImageUrl } from "@/lib/format";
import {
  getSeniorFavoriteIds,
  setSeniorFavoriteIds,
  getSeniorLastOrder,
} from "@/lib/seniorEasyShop";

const props = defineProps({
  allProducts: { type: Array, default: () => [] },
});

const router = useRouter();
const route = useRoute();
const cart = useCartStore();
const toast = useToastStore();
const auth = useAuthStore();
const { totalItems: cartCount } = storeToRefs(cart);

const expanded = ref(route.hash === "#senior-easy-shop");
const editMode = ref(false);
const favoriteIds = ref(getSeniorFavoriteIds());
const justAddedId = ref(null);
let addedTimer = null;

watch(
  () => route.hash,
  (hash) => {
    if (hash === "#senior-easy-shop") expanded.value = true;
  }
);

const isAdmin = computed(() => auth.user?.role === "admin");

const placeholderImg =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23e5e7eb' width='200' height='200'/%3E%3Ctext fill='%239ca3af' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='14'%3E이미지%3C/text%3E%3C/svg%3E";

const imgSrc = (p) => {
  const gallery = Array.isArray(p?.images) ? p.images : [];
  const raw = gallery.find(Boolean) || p?.image_url || p?.image;
  if (!raw) return placeholderImg;
  return normalizeImageUrl(raw) || placeholderImg;
};

const onImgError = (e) => {
  e.target.src = placeholderImg;
};

const displayProducts = computed(() => {
  const list = props.allProducts || [];
  const picked = favoriteIds.value.length > 0
    ? favoriteIds.value.map((id) => list.find((p) => p.id === id)).filter(Boolean)
    : list;
  return picked.slice(0, 6);
});

watch(
  () => props.allProducts,
  (list) => {
    if (favoriteIds.value.length === 0 && list.length > 0) {
      const defaults = list.slice(0, 6).map((p) => p.id);
      favoriteIds.value = defaults;
      setSeniorFavoriteIds(defaults);
    }
  },
  { immediate: true }
);

const toggleFavorite = (id) => {
  const set = new Set(favoriteIds.value);
  if (set.has(id)) set.delete(id);
  else if (set.size < 6) set.add(id);
  else {
    toast.info("단골 상품은 최대 6개까지 등록할 수 있습니다.");
    return;
  }
  favoriteIds.value = [...set];
  setSeniorFavoriteIds(favoriteIds.value);
};

const addProduct = (p) => {
  cart.addToCart({
    id: p.id,
    name: p.name,
    price: p.price,
    image_url: p.image_url,
  });
  justAddedId.value = p.id;
  clearTimeout(addedTimer);
  addedTimer = setTimeout(() => {
    if (justAddedId.value === p.id) justAddedId.value = null;
  }, 1800);
  toast.success(`${p.name}을(를) 담았습니다.`);
};

const reorderLast = () => {
  const lastOrder = getSeniorLastOrder();
  if (!lastOrder.length) {
    toast.info("지난 주문이 없습니다. 먼저 한 번 주문해 주세요.");
    return;
  }
  lastOrder.forEach((item) => {
    for (let i = 0; i < (item.quantity || 1); i += 1) {
      cart.addToCart({
        id: item.id,
        name: item.name,
        price: item.price,
        image_url: item.image_url,
      });
    }
  });
  toast.success("지난 주문을 장바구니에 담았습니다.");
  router.push("/cart");
};

const goCart = () => router.push("/cart");
</script>

<style scoped>
.senior-easy-strip {
  border-radius: 1rem;
  border: 1px solid rgba(99, 102, 241, 0.2);
  background: linear-gradient(135deg, rgba(238, 242, 255, 0.5), rgba(255, 255, 255, 0.92));
  padding: 0.75rem 0.85rem;
}

:global(.dark) .senior-easy-strip {
  border-color: rgba(129, 140, 248, 0.22);
  background: linear-gradient(135deg, rgba(49, 46, 129, 0.24), rgba(15, 23, 42, 0.58));
}

.senior-checkbox {
  width: 1.15rem;
  height: 1.15rem;
  accent-color: rgb(99 102 241);
  flex-shrink: 0;
}

.senior-added {
  @apply ring-2 ring-violet-500/60 ring-offset-1
         dark:ring-violet-400/55 dark:ring-offset-zinc-950;
}
</style>
