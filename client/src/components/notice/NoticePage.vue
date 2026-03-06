<template>
  <div
    class="min-h-screen py-12 px-6
           bg-gradient-to-b from-slate-100 to-slate-200
           dark:from-[#0f172a] dark:to-[#1e293b]
           text-neutral-800 dark:text-gray-100 font-['Inter']"
  >
    <div class="max-w-3xl mx-auto">
      <h1 class="text-2xl font-bold text-neutral-800 dark:text-neutral-100 mb-8">
        공지사항
      </h1>

      <!-- 목록 -->
      <template v-if="!selectedId">
        <ul class="space-y-2">
          <li
            v-for="n in notices"
            :key="n.id"
            @click="selectedId = n.id"
            class="flex items-center justify-between p-4 rounded-xl
                   bg-white/80 dark:bg-white/10 border border-neutral-200/60 dark:border-neutral-600/40
                   hover:border-indigo-400 dark:hover:border-indigo-500 cursor-pointer transition-all"
          >
            <span class="font-medium text-neutral-800 dark:text-neutral-100">{{ n.title }}</span>
            <span class="text-sm text-neutral-500 dark:text-neutral-400">
              {{ formatDate(n.createdAt) }}
            </span>
          </li>
        </ul>
        <p v-if="notices.length === 0" class="text-neutral-500 dark:text-neutral-400 text-center py-12">
          등록된 공지가 없습니다.
        </p>
      </template>

      <!-- 상세 -->
      <template v-else>
        <div
          class="p-6 rounded-2xl bg-white/90 dark:bg-white/10 border border-neutral-200/60 dark:border-neutral-600/40"
        >
          <button
            @click="selectedId = null"
            class="text-sm text-indigo-600 dark:text-indigo-400 hover:underline mb-4"
          >
            ← 목록으로
          </button>
          <template v-if="selectedNotice">
            <h2 class="text-xl font-bold text-neutral-800 dark:text-neutral-100 mb-2">
              {{ selectedNotice.title }}
            </h2>
            <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
              {{ formatDate(selectedNotice.createdAt) }}
            </p>
            <div class="text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
              {{ selectedNotice.content }}
            </div>
          </template>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";

const selectedId = ref(null);

// 목 데이터 (추후 API 연동 시 교체)
const notices = ref([
  {
    id: 1,
    title: "My Shop 쇼핑몰 오픈 안내",
    content: "안녕하세요, My Shop입니다.\n\n쇼핑몰이 새롭게 오픈하였습니다.\n많은 이용 부탁드립니다.",
    createdAt: "2025-01-15T09:00:00",
  },
  {
    id: 2,
    title: "배송 안내",
    content: "주문 후 1~3영업일 내 출고됩니다.\n토·일·공휴일 주문은 다음 영업일에 처리됩니다.",
    createdAt: "2025-01-20T10:00:00",
  },
  {
    id: 3,
    title: "교환·반품 안내",
    content: "상품 수령 후 7일 이내 미개봉 시 교환·반품이 가능합니다.\n자세한 내용은 고객센터로 문의해 주세요.",
    createdAt: "2025-01-25T14:00:00",
  },
]);

const selectedNotice = computed(() =>
  notices.value.find((n) => n.id === selectedId.value)
);

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};
</script>
