<template>
  <div
    class="min-h-screen px-6 py-10
           bg-gradient-to-b from-slate-100 to-slate-200
           dark:from-[#0f172a] dark:to-[#1e293b]
           transition-colors duration-300"
  >
    <h1
      class="text-2xl font-bold mb-8 flex items-center gap-2
             text-gray-800 dark:text-white/90"
    >
      <Heart class="w-6 h-6 text-rose-500 dark:text-rose-400" />
      찜 목록
    </h1>

    <div
      v-if="!auth.isLoggedIn"
      class="text-center py-16 text-gray-500 dark:text-gray-400"
    >
      <p class="mb-4">찜 목록을 보려면 로그인해 주세요.</p>
      <router-link
        to="/login"
        class="text-indigo-600 dark:text-indigo-400 hover:underline"
      >
        로그인하기
      </router-link>
    </div>

    <div
      v-else-if="loading"
      class="flex justify-center py-16"
    >
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
    </div>

    <div
      v-else-if="wishlist.items.length === 0"
      class="text-center py-16 text-gray-500 dark:text-gray-400"
    >
      찜한 상품이 없습니다.
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <div
        v-for="item in wishlist.items"
        :key="item.product_id"
        class="group bg-white/80 dark:bg-white/10 backdrop-blur-md rounded-2xl border border-white/40
               shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
      >
        <router-link
          :to="`/product/${item.product_id}`"
          class="block overflow-hidden"
        >
          <div class="h-56 flex items-center justify-center bg-neutral-100/80 dark:bg-[#25283c]/70">
            <img
              :src="normalizeImageUrl(item.image_url) || placeholderImg"
              :alt="item.name"
              class="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
              @error="($e) => ($e.target.src = placeholderImg)"
            />
          </div>
          <div class="p-4">
            <h2 class="font-semibold text-gray-800 dark:text-gray-100 line-clamp-2 mb-1">
              {{ item.name }}
            </h2>
            <p class="text-indigo-600 dark:text-indigo-400 font-bold text-lg">
              {{ formatPrice(item.price) }}원
            </p>
          </div>
        </router-link>
        <div class="px-4 pb-4 flex gap-2">
          <router-link
            :to="`/product/${item.product_id}`"
            class="shop-btn-primary flex-1 py-2 text-center rounded-lg"
          >
            자세히 보기
          </router-link>
          <button
            @click.prevent="removeItem(item.product_id)"
            class="shop-btn-danger px-4 py-2 rounded-lg"
          >
            찜 해제
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { Heart } from "lucide-vue-next";
import { useWishlistStore } from "../../store/wishlist";
import { useAuthStore } from "../../store/auth";
import { formatPrice, normalizeImageUrl } from "../../lib/format";
import { useToastStore } from "../../store/toast";

const auth = useAuthStore();
const wishlist = useWishlistStore();
const toast = useToastStore();
const loading = ref(true);

const placeholderImg =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect fill='%23e5e7eb' width='200' height='200'/%3E%3Ctext fill='%239ca3af' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='14'%3E이미지%3C/text%3E%3C/svg%3E";

async function removeItem(productId) {
  const ok = await wishlist.remove(productId);
  if (ok) toast.success("찜 목록에서 제거되었습니다.");
  else toast.error("찜 해제에 실패했습니다.");
}

onMounted(async () => {
  loading.value = true;
  if (auth.isLoggedIn) {
    await wishlist.fetchItems();
  }
  loading.value = false;
});
</script>
