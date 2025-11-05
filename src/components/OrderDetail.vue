<template>
  <div
    class="min-h-screen px-6 py-12 bg-gradient-to-b from-slate-100 to-slate-200 
           dark:from-[#0f172a] dark:to-[#1e293b] flex flex-col items-center transition"
  >
    <div
      class="bg-white/70 dark:bg-white/10 backdrop-blur-lg 
             border border-white/30 rounded-2xl p-10 w-full max-w-4xl 
             shadow-[0_8px_30px_rgba(0,0,0,0.1)]"
    >
      <h1 class="text-3xl font-extrabold mb-8 text-center text-indigo-600 dark:text-sky-400">
        🧾 주문 상세 내역
      </h1>

      <div v-if="loading" class="text-center text-gray-500">불러오는 중...</div>
      <div v-else-if="error" class="text-center text-red-500">{{ error }}</div>

      <div v-else>
        <div class="mb-8 border-b border-gray-300/50 pb-6">
          <h2 class="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
            📦 주문 정보
          </h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-gray-700 dark:text-gray-300">
            <p><span class="font-semibold text-indigo-600">주문번호:</span> {{ order.id }}</p>
            <p><span class="font-semibold text-indigo-600">결제금액:</span> {{ order.total_price.toLocaleString() }}원</p>
            <p><span class="font-semibold text-indigo-600">받는 분:</span> {{ order.recipient_name }}</p>
            <p><span class="font-semibold text-indigo-600">연락처:</span> {{ order.phone }}</p>
            <p class="sm:col-span-2"><span class="font-semibold text-indigo-600">배송지:</span> {{ order.address }}</p>
            <p class="sm:col-span-2"><span class="font-semibold text-indigo-600">주문일:</span> {{ formattedDate }}</p>
          </div>
        </div>

        <h2 class="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
          🛒 주문 상품
        </h2>

        <div class="overflow-x-auto">
          <table class="w-full border-collapse">
            <thead>
              <tr class="bg-indigo-100 dark:bg-indigo-900/50 text-left">
                <th class="p-3">상품명</th>
                <th class="p-3 text-center">수량</th>
                <th class="p-3 text-right">가격</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in items"
                :key="item.id"
                class="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-100/50 dark:hover:bg-white/10 transition"
              >
                <td class="p-3 flex items-center gap-3">
                  <img
                    :src="item.image_url || 'https://via.placeholder.com/60x80?text=No+Image'"
                    alt="상품 이미지"
                    class="w-14 h-14 object-cover rounded-lg shadow-sm"
                  />
                  <span class="font-medium">{{ item.name }}</span>
                </td>
                <td class="p-3 text-center">{{ item.quantity }}</td>
                <td class="p-3 text-right">{{ (item.price * item.quantity).toLocaleString() }}원</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="text-center mt-10">
          <router-link
            to="/"
            class="inline-block bg-gradient-to-r from-indigo-500 to-sky-500 
                   text-white py-3 px-8 rounded-lg font-semibold hover:opacity-90 transition"
          >
            🏠 홈으로 돌아가기
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute } from "vue-router";
import axios from "axios";

const route = useRoute();
const orderId = route.params.id;

const order = ref({});
const items = ref([]);
const loading = ref(true);
const error = ref(null);

const formattedDate = computed(() =>
  order.value.created_at
    ? new Date(order.value.created_at).toLocaleString("ko-KR")
    : "-"
);

onMounted(async () => {
  try {
    const res = await axios.get(`http://localhost:3001/api/orders/detail/${orderId}`);
    if (res.data.success) {
      order.value = res.data.order;
      items.value = res.data.items;
    } else {
      error.value = "주문 정보를 불러올 수 없습니다.";
    }
  } catch (err) {
    console.error("❌ 주문 상세 조회 실패:", err);
    error.value = "서버 오류로 주문 내역을 불러올 수 없습니다.";
  } finally {
    loading.value = false;
  }
});
</script>
