<template>
  <div
    class="shop-page-ambient py-12 px-6 text-primary font-['Inter']"
  >
    <div class="max-w-3xl mx-auto">
      <h1 class="text-2xl font-bold text-neutral-800 dark:text-neutral-100 mb-8">
        공지사항
      </h1>

      <div v-if="listLoading" class="text-center text-neutral-500 py-12">불러오는 중...</div>
      <p v-else-if="listError" class="text-center text-red-600 dark:text-red-400 py-12">{{ listError }}</p>

      <template v-else-if="!selectedId">
        <ul class="space-y-2">
          <li
            v-for="n in notices"
            :key="n.id"
            @click="openDetail(n.id)"
            class="flex items-center justify-between p-4 rounded-xl
                   bg-white/80 dark:bg-white/10 border border-neutral-200/60 dark:border-neutral-600/40
                   hover:border-indigo-400 dark:hover:border-indigo-500 cursor-pointer transition-all"
          >
            <span class="font-medium text-neutral-800 dark:text-neutral-100">{{ n.title }}</span>
            <span class="text-sm text-neutral-500 dark:text-neutral-400 shrink-0 ml-2">
              {{ formatDate(n.created_at) }}
            </span>
          </li>
        </ul>
        <p v-if="notices.length === 0" class="text-neutral-500 dark:text-neutral-400 text-center py-12">
          등록된 공지가 없습니다.
        </p>
      </template>

      <template v-else>
        <div
          class="p-6 rounded-2xl bg-white/90 dark:bg-white/10 border border-neutral-200/60 dark:border-neutral-600/40"
        >
          <button
            type="button"
            @click="closeDetail"
            class="text-sm text-indigo-600 dark:text-indigo-400 hover:underline mb-4"
          >
            ← 목록으로
          </button>
          <div v-if="detailLoading" class="text-neutral-500">불러오는 중...</div>
          <p v-else-if="detailError" class="text-red-600 dark:text-red-400">{{ detailError }}</p>
          <template v-else-if="selectedNotice">
            <h2 class="text-xl font-bold text-neutral-800 dark:text-neutral-100 mb-2">
              {{ selectedNotice.title }}
            </h2>
            <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
              {{ formatDate(selectedNotice.created_at) }}
            </p>
            <div class="text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
              {{ selectedNotice.body }}
            </div>
          </template>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import api from "../../lib/api";

const route = useRoute();
const router = useRouter();

const notices = ref([]);
const listLoading = ref(true);
const listError = ref("");
const selectedId = ref(null);
const selectedNotice = ref(null);
const detailLoading = ref(false);
const detailError = ref("");

const loadList = async () => {
  listLoading.value = true;
  listError.value = "";
  try {
    const res = await api.get("/notices");
    if (res.data?.success && Array.isArray(res.data.notices)) {
      notices.value = res.data.notices;
    } else {
      listError.value = "목록을 불러오지 못했습니다.";
    }
  } catch (e) {
    listError.value = e.response?.data?.message || e.userMessage || "목록을 불러오지 못했습니다.";
  } finally {
    listLoading.value = false;
  }
};

const openDetail = async (id) => {
  selectedId.value = id;
  selectedNotice.value = null;
  detailError.value = "";
  detailLoading.value = true;
  router.replace({ path: "/notice", query: { id: String(id) } }).catch(() => {});
  try {
    const res = await api.get(`/notices/${id}`);
    if (res.data?.success && res.data.notice) {
      selectedNotice.value = res.data.notice;
    } else {
      detailError.value = "공지를 찾을 수 없습니다.";
    }
  } catch (e) {
    detailError.value = e.response?.data?.message || e.userMessage || "공지를 불러오지 못했습니다.";
  } finally {
    detailLoading.value = false;
  }
};

const closeDetail = () => {
  selectedId.value = null;
  selectedNotice.value = null;
  router.replace({ path: "/notice" }).catch(() => {});
};

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

onMounted(async () => {
  await loadList();
  const num = Number(route.query.id);
  if (num) await openDetail(num);
});
</script>
