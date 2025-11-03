<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import { useRoute } from "vue-router";
import { Package, CreditCard, Truck } from "lucide-vue-next";

const route = useRoute();
const orderId = route.params.id;
const order = ref(null);

const fetchOrderDetail = async () => {
  try {
    const res = await axios.get(`http://localhost:3001/api/order/${orderId}`);
    order.value = res.data;
  } catch (err) {
    console.error("❌ 주문 상세 불러오기 실패:", err);
  }
};

onMounted(fetchOrderDetail);
</script>

<template>
  <div
    class="min-h-screen px-8 py-12 
           bg-gradient-to-b from-slate-100 to-slate-200 
           dark:from-[#0f172a] dark:to-[#1e293b]
           transition-colors duration-300 flex flex-col items-center"
  >
    <h1
      class="flex items-center gap-2 text-3xl font-extrabold mb-10 
             bg-gradient-to-r from-indigo-500 to-sky-500 bg-clip-text text-transparent"
    >
      <Package class="w-7 h-7 text-indigo-500 dark:text-sky-400" />
      주문 상세
    </h1>

    <div v-if="!order" class="text-gray-400 dark:text-gray-500 mt-20">
      주문 정보를 불러오는 중입니다...
    </div>

    <div
      v-else
      class="max-w-4xl w-full bg-white/50 dark:bg-white/10 backdrop-blur-md 
             border border-white/40 rounded-2xl p-8 shadow-[0_8px_32px_rgba(31,38,135,0.15)] 
             hover:shadow-[0_0_12px_rgba(99,102,241,0.25)] transition-all duration-300"
    >
      <div
        class="flex justify-between items-center border-b border-white/40 pb-4 mb-6"
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
            주문일자:
            {{ new Date(order.created_at).toLocaleString("ko-KR") }}
          </p>
        </div>

        <p
          class="text-xl font-bold text-indigo-600 dark:text-sky-400"
        >
          총 결제금액:
          {{ order.total_price.toLocaleString() }}원
        </p>
      </div>

      <div
        class="bg-white/40 dark:bg-white/10 backdrop-blur-md 
               rounded-xl p-5 mb-6 border border-white/30"
      >
        <h2
          class="flex items-center gap-2 font-semibold mb-3 
                 text-gray-800 dark:text-gray-100"
        >
          <Truck class="w-5 h-5 text-indigo-500 dark:text-sky-400" />
          배송 정보
        </h2>
        <ul class="text-sm text-gray-600 dark:text-gray-300 space-y-1">
          <li>수령인: <strong>{{ order.recipient_name }}</strong></li>
          <li>주소: {{ order.address }}</li>
          <li>연락처: {{ order.phone }}</li>
          <li>
            배송 상태:
            <span
              class="text-green-600 dark:text-green-400 font-semibold"
              >{{ order.status || "배송 준비 중" }}</span
            >
          </li>
        </ul>
      </div>

      <div
        class="bg-white/40 dark:bg-white/10 backdrop-blur-md 
               rounded-xl p-5 mb-6 border border-white/30"
      >
        <h2
          class="flex items-center gap-2 font-semibold mb-3 
                 text-gray-800 dark:text-gray-100"
        >
          <CreditCard class="w-5 h-5 text-indigo-500 dark:text-sky-400" />
          결제 정보
        </h2>
        <p class="text-sm text-gray-600 dark:text-gray-300">
          결제 수단: {{ order.payment_method || "신용카드" }}
        </p>
        <p class="text-sm text-gray-600 dark:text-gray-300">
          결제 상태:
          <span
            class="text-blue-600 dark:text-sky-400 font-semibold"
            >{{ order.payment_status || "결제 완료" }}</span
          >
        </p>
      </div>

      <div
        class="bg-white/40 dark:bg-white/10 backdrop-blur-md 
               rounded-xl p-5 border border-white/30"
      >
        <h2
          class="font-semibold mb-3 flex items-center gap-2 
                 text-gray-800 dark:text-gray-100"
        >
          📦 주문 상품
        </h2>

        <div class="divide-y divide-white/30">
          <div
            v-for="item in order.items"
            :key="item.product_name"
            class="flex justify-between items-center py-3"
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
</template>
