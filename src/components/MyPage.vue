<script setup>
import { ref, onMounted, computed } from "vue";
import axios from "axios";
import { Package } from "lucide-vue-next";

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

      <div
        v-if="groupedOrders.length === 0"
        class="text-center text-gray-400 mt-20 italic"
      >
        아직 주문 내역이 없습니다.
      </div>

      <div v-else class="space-y-8">
        <div
          v-for="(order, index) in groupedOrders"
          :key="index"
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
                  >{{ order.order_id }}</span
                >
              </p>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                주문일자: {{ formatDate(order.created_at) }}
              </p>
            </div>
            <p class="text-lg font-bold text-indigo-600 dark:text-sky-400">
              총 {{ order.total_price.toLocaleString() }}원
            </p>
          </div>

          <div class="divide-y divide-white/40">
            <div
              v-for="item in order.items"
              :key="item.product_name"
              class="py-3 flex justify-between items-center"
            >
              <div>
                <p class="font-medium text-gray-800 dark:text-gray-100">
                  {{ item.product_name }}
                </p>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  수량: {{ item.quantity }}개
                </p>
              </div>
              <p class="font-semibold text-indigo-600 dark:text-sky-400">
                {{ (item.price * item.quantity).toLocaleString() }}원
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
