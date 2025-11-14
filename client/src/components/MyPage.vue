<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import { Package } from "lucide-vue-next";
import { useAuthStore } from "../store/auth";

const auth = useAuthStore();
const orders = ref([]);
const loading = ref(true);
const error = ref(null);

const fetchOrders = async () => {
  if (!auth.user) {
    error.value = "로그인 후 이용해주세요.";
    loading.value = false;
    return;
  }

  try {
    const res = await axios.get(`http://localhost:3001/api/orders`, {
      params: { userId: auth.user.id },
    });

    if (res.data.success) {
      orders.value = res.data.orders;
    } else {
      error.value = res.data.message;
    }
  } catch (err) {
    console.error("❌ 주문 내역 불러오기 실패:", err);
    error.value = "주문 내역을 불러오는 중 오류가 발생했습니다.";
  } finally {
    loading.value = false;
  }
};

onMounted(fetchOrders);

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
</script>


<template>
  <div
    class="min-h-screen py-16 px-6 
           bg-gradient-to-b from-slate-100 to-slate-200 
           dark:from-[#0f172a] dark:to-[#1e293b]
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
              {{ order.total_price.toLocaleString() }}원
            </p>
          </div>

          <div class="space-y-2">
            <p class="text-gray-700 dark:text-gray-300">
              상품: <span class="font-semibold">{{ order.products }}</span>
            </p>
            <p class="text-gray-700 dark:text-gray-300">
              배송지: {{ order.address }}
            </p>
            <p class="text-gray-700 dark:text-gray-300">
              상태: <span class="font-medium text-sky-500">{{ order.status }}</span>
            </p>
          </div>

          <button
            @click="$router.push(`/order/${order.id}`)"
            class="mt-4 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-md"
          >
            상세보기
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
