<template>
  <div class="min-h-screen bg-[#f9fafb] text-neutral-800 font-['Inter'] py-16 px-6">
    <div class="max-w-5xl mx-auto">
      <h1
        class="text-3xl font-bold text-center mb-10 bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent"
      >
        💼 마이페이지
      </h1>

      <h2 class="text-xl font-semibold text-neutral-700 mb-6 text-center">
        주문 내역
      </h2>

      <div
        v-if="groupedOrders.length === 0"
        class="text-center text-neutral-400 mt-20"
      >
        아직 주문 내역이 없습니다.
      </div>

      <div v-else class="space-y-8">
        <div
          v-for="(order, index) in groupedOrders"
          :key="index"
          class="bg-white border border-neutral-200 rounded-2xl shadow-sm p-6 hover:shadow-lg transition-all duration-300"
        >
          <div class="flex justify-between items-center border-b border-neutral-200 pb-3 mb-4">
            <div>
              <p class="text-sm text-neutral-500">
                주문번호:
                <span class="font-medium text-blue-600">{{ order.order_id }}</span>
              </p>
              <p class="text-sm text-neutral-500">
                주문일자: {{ formatDate(order.created_at) }}
              </p>
            </div>
            <p class="text-lg font-bold text-indigo-600">
              총 {{ order.total_price.toLocaleString() }}원
            </p>
          </div>

          <div class="divide-y divide-neutral-100">
            <div
              v-for="item in order.items"
              :key="item.product_name"
              class="py-3 flex justify-between items-center"
            >
              <div class="flex flex-col">
                <p class="font-medium text-neutral-800">{{ item.product_name }}</p>
                <p class="text-sm text-neutral-500">수량: {{ item.quantity }}개</p>
              </div>
              <p class="font-semibold text-blue-600">
                {{ (item.price * item.quantity).toLocaleString() }}원
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import axios from "axios";

const userId = 1;
const orders = ref([]);

const fetchOrders = async () => {
  try {
    const res = await axios.get(`http://localhost:3001/api/orders/${userId}`);
    orders.value = res.data;
  } catch (err) {
    console.error("❌ 주문 내역 불러오기 실패:", err);
  }
};

onMounted(fetchOrders);

const groupedOrders = computed(() => {
  const map = {};
  orders.value.forEach((order) => {
    if (!map[order.order_id]) {
      map[order.order_id] = {
        order_id: order.order_id,
        created_at: order.created_at,
        total_price: order.total_price,
        items: [],
      };
    }
    map[order.order_id].items.push({
      product_name: order.product_name,
      quantity: order.quantity,
      price: order.price,
    });
  });
  return Object.values(map);
});

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

<style scoped>
body {
  background-color: #f9fafb;
}
</style>
