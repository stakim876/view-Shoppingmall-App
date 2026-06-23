<template>
  <div
    class="min-h-screen py-12 px-6
           bg-gradient-to-b from-slate-100 to-slate-200
           dark:from-zinc-950 dark:to-neutral-950
           text-neutral-800 dark:text-gray-100"
  >
    <div class="max-w-3xl mx-auto">
      <h1 class="text-2xl font-bold mb-2">구매후기</h1>
      <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-8">
        고객님들이 남긴 상품 리뷰입니다. 상품 상세에서도 리뷰를 작성할 수 있습니다.
      </p>

      <div v-if="loading" class="text-center text-neutral-500 py-12">불러오는 중...</div>
      <p v-else-if="error" class="text-center text-red-600 dark:text-red-400 py-12">{{ error }}</p>

      <ul v-else class="space-y-4">
        <li
          v-for="review in reviews"
          :key="review.id"
          class="p-5 rounded-2xl bg-white/90 dark:bg-white/10 border border-neutral-200/60 dark:border-neutral-600/40"
        >
          <div class="flex items-start justify-between gap-3 mb-2">
            <div>
              <router-link
                :to="`/product/${review.product_id}`"
                class="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                {{ review.product_name || `상품 #${review.product_id}` }}
              </router-link>
              <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                {{ review.user_name || "회원" }} · {{ formatDate(review.created_at) }}
              </p>
            </div>
            <span class="text-amber-500 text-sm shrink-0" aria-label="별점">
              {{ "★".repeat(review.rating) }}{{ "☆".repeat(5 - review.rating) }}
            </span>
          </div>
          <p v-if="review.content" class="text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap leading-relaxed">
            {{ review.content }}
          </p>
          <p v-else class="text-neutral-400 text-sm italic">내용 없음</p>
        </li>
      </ul>

      <p v-if="!loading && !error && reviews.length === 0" class="text-center text-neutral-500 py-12">
        아직 등록된 리뷰가 없습니다. 상품을 구매한 뒤 상품 상세에서 첫 리뷰를 남겨보세요.
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import api from "../../lib/api";

const reviews = ref([]);
const loading = ref(true);
const error = ref("");

const formatDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("ko-KR");
};

onMounted(async () => {
  try {
    const res = await api.get("/reviews");
    reviews.value = res.data?.reviews || [];
  } catch (err) {
    error.value = err.userMessage || "리뷰를 불러오지 못했습니다.";
  } finally {
    loading.value = false;
  }
});
</script>
