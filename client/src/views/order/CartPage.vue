<script setup>
import { useCartStore } from "../../store/cart";
import { useToastStore } from "../../store/toast";
import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";
import { ShoppingCart } from "lucide-vue-next";
import { formatPrice, normalizeImageUrl } from "../../lib/format";
import { ref, computed, onMounted, watch } from "vue";
import api from "../../lib/api";

const cart = useCartStore();
const toast = useToastStore();
const { totalItems, totalPrice } = storeToRefs(cart);
const router = useRouter();
const stockMap = ref({});

const refreshStock = async () => {
  try {
    const res = await api.get("/products");
    const map = {};
    for (const p of res.data || []) {
      map[Number(p.id)] = Number(p.stock || 0);
    }
    stockMap.value = map;
  } catch (_) {
  }
};

const itemStock = (id) => {
  const v = stockMap.value[Number(id)];
  return Number.isFinite(v) ? v : null;
};

const isSoldOut = (id) => {
  const s = itemStock(id);
  return s != null && s <= 0;
};

const canIncrease = (item) => {
  const s = itemStock(item.id);
  if (s == null) return true;
  return Number(item.quantity || 0) < s;
};

const hasStockIssue = computed(() =>
  cart.items.some((item) => {
    const s = itemStock(item.id);
    if (s == null) return false;
    return s <= 0 || Number(item.quantity || 0) > s;
  })
);

onMounted(refreshStock);
watch(
  () => cart.items.map((i) => i.id).join(","),
  () => {
    refreshStock();
  }
);

const checkout = () => {
  if (cart.items.length === 0) {
    toast.warning("담긴 상품이 없습니다. 먼저 상품을 담아 주세요.");
    return;
  }
  if (hasStockIssue.value) {
    toast.warning("품절 또는 재고 부족 상품이 있습니다. 수량을 조정해 주세요.");
    return;
  }
  router.push("/checkout");
};
</script>

<template>
  <div
    class="min-h-screen px-8 py-10 
           bg-gradient-to-b from-slate-100 to-slate-200 
           dark:from-zinc-950 dark:to-neutral-950
           transition-colors duration-300"
  >
    <h1
      class="text-2xl font-bold mb-8 flex items-center gap-2 
             text-gray-800 dark:text-white/90"
    >
      <ShoppingCart class="w-6 h-6 text-indigo-500 dark:text-sky-400" />
      장바구니
    </h1>

    <div
      v-if="cart.items.length === 0"
      class="mx-auto max-w-md rounded-2xl border border-white/50 bg-white/60 px-8 py-12 text-center shadow-[0_12px_40px_rgba(79,70,229,0.12)] backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:shadow-none"
    >
      <ShoppingCart class="mx-auto mb-4 h-12 w-12 text-indigo-400/80 dark:text-sky-400/80" aria-hidden="true" />
      <p class="text-base font-medium text-gray-800 dark:text-gray-100">장바구니가 비어 있어요</p>
      <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">마음에 드는 상품을 담아 보세요.</p>
      <button
        type="button"
        class="shop-btn-primary mt-6 rounded-lg px-5 py-2.5 text-sm font-semibold"
        @click="router.push('/home')"
      >
        쇼핑하러 가기
      </button>
    </div>

    <div v-else class="space-y-5">
      <div
        v-for="item in cart.items"
        :key="item.id"
        class="flex items-center justify-between 
               bg-white/50 dark:bg-white/10 backdrop-blur-md 
               border border-white/40 rounded-2xl 
               shadow-[0_8px_32px_rgba(31,38,135,0.15)] 
               hover:shadow-[0_0_12px_rgba(99,102,241,0.25)] 
               transition-all duration-300 p-5"
      >
        <div class="flex items-center space-x-5">
          <img
            :src="normalizeImageUrl(item.image_url)"
            alt="상품 이미지"
            class="w-20 h-20 object-contain rounded-lg shadow-sm"
          />
          <div>
            <h2 class="font-semibold text-gray-800 dark:text-gray-100">
              {{ item.name }}
            </h2>
            <p class="text-gray-500 dark:text-gray-400 text-sm">
              {{ formatPrice(item.price) }}원
            </p>
            <p v-if="isSoldOut(item.id)" class="text-xs text-rose-600 dark:text-rose-400 mt-1 font-medium">
              품절
            </p>
            <p v-else-if="itemStock(item.id) != null" class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              재고 {{ itemStock(item.id) }}개
            </p>
            <p class="font-semibold text-gray-700 dark:text-gray-200 mt-1">
              합계:
              <span class="text-indigo-600 dark:text-sky-400">
                {{ formatPrice(item.price * item.quantity) }}원
              </span>
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            @click="cart.decreaseQuantity(item.id)"
            class="px-3 py-1 rounded-lg bg-white/70 dark:bg-white/20 
                   hover:bg-white/90 dark:hover:bg-white/30 
                   transition"
          >
            −
          </button>
          <span class="text-gray-800 dark:text-gray-200">
            {{ item.quantity }}
          </span>
          <button
            @click="cart.increaseQuantity(item.id, itemStock(item.id))"
            :disabled="!canIncrease(item)"
            class="px-3 py-1 rounded-lg bg-white/70 dark:bg-white/20 
                   hover:bg-white/90 dark:hover:bg-white/30 disabled:opacity-40 disabled:cursor-not-allowed
                   transition"
          >
            ＋
          </button>
          <button
            @click="cart.removeFromCart(item.id)"
            class="shop-btn-danger ml-2 px-3 py-1 rounded-lg text-sm"
          >
            삭제
          </button>
        </div>
      </div>

      <div class="text-right mt-8">
        <p class="text-gray-700 dark:text-gray-300">
          총 상품수:
          <span class="font-semibold">{{ totalItems }}</span>개
        </p>
        <p
          class="text-lg font-semibold mt-1 
                 text-green-600 dark:text-green-400"
        >
          총 금액:
          <span class="text-2xl font-bold">
            {{ formatPrice(totalPrice) }}원
          </span>
        </p>
        <button
          @click="checkout"
          :disabled="hasStockIssue"
          class="shop-btn-primary mt-4 px-6 py-2 rounded-lg font-semibold"
        >
          결제하기
        </button>
        <p v-if="hasStockIssue" class="text-xs text-rose-600 dark:text-rose-400 mt-2">
          품절/재고 부족 상품이 있어 결제를 진행할 수 없습니다.
        </p>
      </div>
    </div>
  </div>
</template>
