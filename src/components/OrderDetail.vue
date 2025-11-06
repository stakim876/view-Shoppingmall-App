<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";
import { ArrowLeft, Package } from "lucide-vue-next";

const route = useRoute();
const router = useRouter();
const order = ref(null);
const loading = ref(true);
const error = ref(null);

const fetchOrderDetail = async () => {
  const orderId = route.params.id;
  try {
    const res = await axios.get(`http://localhost:3001/api/orders/detail/${orderId}`);
    if (res.data.success) {
      order.value = res.data;
    } else {
      error.value = res.data.message || "주문을 찾을 수 없습니다.";
    }
  } catch (err) {
    console.error("❌ 주문 상세 불러오기 실패:", err);
    error.value = "서버 통신 중 오류가 발생했습니다.";
  } finally {
    loading.value = false;
  }
};

onMounted(fetchOrderDetail);

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
    <div class="max-w-4xl mx-auto">
      <button
        @click="router.back()"
        class="flex items-center gap-2 text-gray-600 dark:text-gray-300 mb-8 hover:text-indigo-500 transition"
      >
        <ArrowLeft class="w-5 h-5" /> 뒤로가기
      </button>

      <h1
        class="flex items-center gap-2 text-3xl font-extrabold mb-12 
               bg-gradient-to-r from-indigo-500 via-sky-400 to-blue-500 
               bg-clip-text text-transparent"
      >
        <Package class="w-7 h-7 text-indigo-500 dark:text-sky-400" />
        주문 상세 내역
      </h1>

      <div v-if="loading" class="text-center text-gray-500">불러오는 중...</div>
      <div v-else-if="error" class="text-center text-red-500">{{ error }}</div>

      <div
        v-else
        class="bg-white/50 dark:bg-white/10 backdrop-blur-md border border-white/40 rounded-2xl p-8 
               shadow-[0_8px_32px_rgba(31,38,135,0.15)] 
               hover:shadow-[0_0_12px_rgba(99,102,241,0.25)] 
               transition-all duration-300"
      >
        <div class="mb-6 border-b border-white/30 pb-4">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            주문번호: <span class="font-medium text-indigo-600 dark:text-sky-400">#{{ order.order.id }}</span>
          </p>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            주문일자: {{ formatDate(order.order.created_at) }}
          </p>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            상태: <span class="font-semibold text-sky-500">{{ order.order.status }}</span>
          </p>
        </div>

        <div class="mb-8">
          <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">배송 정보</h2>
          <p>수령인: {{ order.order.recipient_name }}</p>
          <p>주소: {{ order.order.address }}</p>
          <p>연락처: {{ order.order.phone }}</p>
        </div>

        <div>
          <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">주문 상품</h2>

          <div class="divide-y divide-white/40">
            <div
              v-for="item in order.items"
              :key="item.id"
              class="py-4 flex justify-between items-center"
            >
              <div class="flex items-center gap-4">
                <img
                  v-if="item.image_url"
                  :src="item.image_url"
                  alt="상품 이미지"
                  class="w-16 h-16 rounded-lg object-cover border border-white/30"
                />
                <div>
                  <p class="font-medium text-gray-800 dark:text-gray-100">
                    {{ item.name }}
                  </p>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    수량: {{ item.quantity }}개
                  </p>
                </div>
              </div>
              <p class="font-semibold text-indigo-600 dark:text-sky-400">
                {{ (item.price * item.quantity).toLocaleString() }}원
              </p>
            </div>
          </div>
        </div>

        <hr class="my-6 border-white/40" />

        <div class="flex justify-between items-center">
          <p class="text-lg font-bold text-gray-700 dark:text-gray-200">
            총 결제 금액
          </p>
          <p class="text-2xl font-extrabold text-indigo-600 dark:text-sky-400">
            {{ order.order.total_price.toLocaleString() }}원
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
