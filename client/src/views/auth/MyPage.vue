<script setup>
import { ref, onMounted } from "vue";
import api from "../../lib/api";
import { Package } from "lucide-vue-next";
import { useAuthStore } from "../../store/auth";
import { useToastStore } from "../../store/toast";
import { formatPrice } from "../../lib/format";
import { getRecentlyViewed } from "../../composables/useRecentlyViewed";
import {
  ORDER_TIMELINE_STEPS,
  getOrderStatusLabel,
  getOrderStepVariant,
  getOrderStepDotClass,
  getOrderStepTextClass,
} from "@/lib/orderStatus.js";

const auth = useAuthStore();
const toast = useToastStore();
const orders = ref([]);
const loading = ref(true);
const error = ref(null);
const userName = ref(auth.user?.name || "");
const personalizedProducts = ref([]);
const personalizedSummary = ref("");
const personalizedLoading = ref(false);

const fetchOrders = async () => {
  if (!auth.user) {
    error.value = "로그인 후 이용해주세요.";
    loading.value = false;
    return;
  }

  try {
    const res = await api.get(`/orders`, {
      params: { userId: auth.user.id },
    });

    if (res.data.success) {
      orders.value = res.data.orders;
    } else {
      error.value = res.data.message;
    }
  } catch (err) {
    console.error("❌ 주문 내역 불러오기 실패:", err);
    error.value = err.userMessage || "주문 내역을 불러오는 중 오류가 발생했습니다.";
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  await fetchOrders();
  await loadPersonalizedRecommendations();
});

const loadPersonalizedRecommendations = async () => {
  personalizedLoading.value = true;
  try {
    const recentIds = getRecentlyViewed().map((p) => p.id).filter(Boolean);
    const res = await api.get("/recommendations/personalized", {
      params: {
        recentProductIds: recentIds.join(","),
        limit: 6,
      },
    });
    personalizedProducts.value = Array.isArray(res.data?.recommendations)
      ? res.data.recommendations
      : [];
    personalizedSummary.value = res.data?.summary || "";
  } catch (_) {
    personalizedProducts.value = [];
    personalizedSummary.value = "";
  } finally {
    personalizedLoading.value = false;
  }
};

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const updateUserInfo = async () => {
  if (!userName.value.trim()) {
    toast.warning("이름을 입력해주세요.");
    return;
  }

  try {
    const res = await api.put("/auth/me", {
      name: userName.value,
    });

    if (res.data.success) {
      auth.user.name = userName.value;
      localStorage.setItem("user", JSON.stringify(auth.user));
      toast.success("정보가 수정되었습니다.");
    }
  } catch (err) {
    toast.error(err.userMessage || "정보 수정에 실패했습니다.");
    console.error("정보 수정 오류:", err);
  }
};
</script>

<template>
  <div
    class="min-h-screen py-16 px-6 
           bg-gradient-to-b from-slate-100 to-slate-200 
           dark:from-zinc-950 dark:to-neutral-950
           text-neutral-800 dark:text-gray-100 font-['Inter']
           transition-colors duration-300"
  >
    <div class="max-w-5xl mx-auto">
      <h1
        class="flex items-center justify-center gap-2 text-3xl font-extrabold mb-12 
               bg-gradient-to-r from-indigo-500 via-sky-400 to-blue-500 
               bg-clip-text text-transparent"
      >
        <Package class="w-7 h-7 text-indigo-500 dark:text-sky-400" />
        마이페이지
      </h1>

      
      <div
        class="bg-white/50 dark:bg-white/10 backdrop-blur-md 
               border border-white/40 rounded-2xl p-6 mb-8
               shadow-[0_8px_32px_rgba(31,38,135,0.15)]"
      >
        <h2 class="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-200">
          내 정보
        </h2>
        <div class="space-y-3">
          <div>
            <label class="block text-sm text-gray-600 dark:text-gray-400 mb-1">이름</label>
            <input
              v-model="userName"
              type="text"
              class="w-full px-4 py-2 rounded-lg bg-white/70 dark:bg-white/20 
                     border border-white/50 text-gray-800 dark:text-gray-100"
            />
          </div>
          <div>
            <label class="block text-sm text-gray-600 dark:text-gray-400 mb-1">이메일</label>
            <input
              :value="auth.user?.email"
              type="email"
              disabled
              class="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 
                     border border-gray-300 dark:border-gray-700 text-gray-500"
            />
          </div>
          <button
            @click="updateUserInfo"
            class="shop-btn-primary mt-4 px-6 py-2 rounded-lg"
          >
            정보 수정
          </button>
        </div>
      </div>

      <div
        v-if="personalizedProducts.length > 0"
        class="bg-white/50 dark:bg-white/10 backdrop-blur-md border border-white/40 rounded-2xl p-6 mb-8 shadow-[0_8px_32px_rgba(31,38,135,0.15)]"
      >
        <h2 class="text-xl font-semibold mb-1 text-gray-700 dark:text-gray-200">맞춤 추천</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">{{ personalizedSummary }}</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <router-link
            v-for="p in personalizedProducts"
            :key="p.id"
            :to="`/product/${p.id}`"
            class="rounded-xl border border-white/50 dark:border-white/10 p-4 hover:border-indigo-300 dark:hover:border-indigo-500/40 transition"
          >
            <p class="font-medium text-gray-800 dark:text-gray-100 line-clamp-2">{{ p.name }}</p>
            <p class="text-sm text-indigo-600 dark:text-sky-400 mt-1">{{ formatPrice(p.price) }}원</p>
            <p class="text-xs text-gray-500 mt-2">{{ p.reason }}</p>
          </router-link>
        </div>
      </div>
      <div v-else-if="personalizedLoading" class="text-center text-gray-500 mb-8">맞춤 추천 불러오는 중...</div>

      <h2 class="text-xl font-semibold text-center mb-8 text-gray-700 dark:text-gray-200">
        주문 내역
      </h2>

      <div v-if="loading" class="text-center text-gray-500">불러오는 중...</div>
      <div v-else-if="error" class="text-center text-red-500">{{ error }}</div>

      <div
        v-else-if="!orders.length"
        class="text-center text-gray-400 mt-20 italic"
      >
        아직 주문 내역이 없습니다.
      </div>

      <div v-else class="space-y-8">
        <div
          v-for="order in orders"
          :key="order.id"
          class="bg-white/50 dark:bg-white/10 backdrop-blur-md 
                 border border-white/40 rounded-2xl p-6 
                 shadow-[0_8px_32px_rgba(31,38,135,0.15)] 
                 hover:shadow-[0_0_12px_rgba(99,102,241,0.25)] 
                 transition-all duration-300"
        >
          <div
            class="flex justify-between items-center border-b border-white/40 pb-3 mb-4"
          >
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                주문번호:
                <span
                  class="font-medium text-indigo-600 dark:text-sky-400"
                  >#{{ order.id }}</span
                >
              </p>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                주문일자: {{ formatDate(order.created_at) }}
              </p>
            </div>
            <p class="text-lg font-bold text-indigo-600 dark:text-sky-400">
              {{ formatPrice(order.total_price) }}원
            </p>
          </div>

          <div class="space-y-2">
            <p class="text-gray-700 dark:text-gray-300">
              상품: <span class="font-semibold">{{ order.products }}</span>
            </p>
            <p class="text-gray-700 dark:text-gray-300">
              배송지: {{ order.address }}
            </p>

            <div class="pt-1">
              <div class="flex items-center justify-between gap-4 mb-3">
                <p class="text-sm font-semibold text-gray-700 dark:text-gray-200">배송 진행</p>
                <p
                  class="text-xs font-medium"
                  :class="
                    order.status === 'cancelled'
                      ? 'text-rose-500 dark:text-rose-400'
                      : 'text-sky-600 dark:text-sky-300'
                  "
                >
                  {{ getOrderStatusLabel(order.status) }}
                </p>
              </div>

              <ol class="relative border-l border-slate-200 dark:border-white/10 ml-3 pl-4 space-y-4">
                <li v-for="s in ORDER_TIMELINE_STEPS" :key="s.key" class="relative">
                  <span
                    class="absolute -left-[11px] top-[6px] h-3.5 w-3.5 rounded-full"
                    :class="getOrderStepDotClass(getOrderStepVariant(order.status, s.key))"
                  />
                  <div class="flex items-start justify-between gap-3">
                    <p class="text-sm" :class="getOrderStepTextClass(getOrderStepVariant(order.status, s.key))">
                      {{ s.label }}
                    </p>
                    <p
                      v-if="s.key === 'shipping' && order.tracking_url"
                      class="text-[11px] font-medium text-indigo-600 dark:text-sky-300 whitespace-nowrap"
                    >
                      송장 등록
                    </p>
                  </div>
                </li>
              </ol>
            </div>

            <p v-if="order.tracking_url" class="text-sm pt-2">
              <a
                :href="order.tracking_url"
                target="_blank"
                rel="noopener noreferrer"
                class="font-medium text-indigo-600 dark:text-sky-400 hover:underline"
              >
                배송 조회 ({{ order.carrier_label || "택배" }})
              </a>
            </p>
          </div>

          <button
            @click="$router.push(`/order/${order.id}`)"
            class="shop-btn-primary mt-4 px-4 py-2 rounded-md"
          >
            상세보기
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
