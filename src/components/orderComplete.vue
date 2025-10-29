<template>
  <div class="min-h-screen flex items-center justify-center bg-green-100">
    <div class="bg-white p-10 rounded shadow-lg w-full max-w-md text-center">
      <h2 class="text-2xl font-bold mb-4 text-green-700">주문 완료 🎉</h2>
      <p class="text-gray-700 mb-4">주문이 성공적으로 처리되었습니다.</p>

      <div v-if="orderId" class="mb-6 text-gray-600">
        <p>주문 번호: <span class="font-semibold text-blue-600">{{ orderId }}</span></p>
        <p v-if="totalPrice" class="mt-2">
          결제 금액: <span class="font-bold">{{ totalPrice.toLocaleString() }}원</span>
        </p>
        <p v-if="orderDate" class="text-sm text-gray-400 mt-1">
          결제일: {{ orderDate }}
        </p>
      </div>

      <button
        @click="goHome"
        class="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 transition"
      >
        홈으로 가기
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const orderId = ref("");
const totalPrice = ref(0);
const orderDate = ref("");

onMounted(() => {
  const orderData = JSON.parse(localStorage.getItem("latestOrder"));
  if (orderData) {
    orderId.value = orderData.id;
    totalPrice.value = orderData.total;
    orderDate.value = orderData.date;
  } else {
    router.push("/products");
  }
});

const goHome = () => {
  router.push("/products");
};
</script>
