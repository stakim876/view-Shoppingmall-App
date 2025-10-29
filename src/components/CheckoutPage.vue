<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="bg-white p-10 rounded shadow-lg w-full max-w-md">
      <h2 class="text-2xl font-bold mb-6 text-center">결제하기</h2>

      <div class="mb-4">
        <div
          v-for="item in cart.items"
          :key="item.id"
          class="flex justify-between border-b py-2"
        >
          <span>{{ item.name }} (x{{ item.quantity }})</span>
          <span>{{ (item.price * item.quantity).toLocaleString() }}원</span>
        </div>
      </div>

      <p class="mb-6 text-lg">
        총 결제 금액:
        <span class="font-semibold text-blue-600">
          {{ totalPrice.toLocaleString() }}원
        </span>
      </p>

      <button
        @click="placeOrder"
        class="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
      >
        결제 완료
      </button>
    </div>
  </div>
</template>

<script setup>
import { useCartStore } from "../store/cart";
import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";
import axios from "axios";

const cart = useCartStore();
const { totalPrice } = storeToRefs(cart);
const router = useRouter();

const placeOrder = async () => {
  try {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    if (!userInfo) {
      alert("로그인이 필요합니다.");
      router.push("/");
      return;
    }

    const payload = {
      userId: userInfo.id,
      totalPrice: totalPrice.value,
      items: cart.items.map((i) => ({
        id: i.id,
        quantity: i.quantity,
        price: i.price, 
      })),
    };

    const res = await axios.post(
      `${import.meta.env.VITE_API_BASE_URL}/orders`,
      payload
    );

    if (res.data.success) {
      cart.$reset(); 
      router.push({
        path: "/order-complete",
        query: { orderId: res.data.orderId },
      });
    }
  } catch (err) {
    console.error("주문 오류:", err);
    alert("주문 중 오류가 발생했습니다.");
  }
};
</script>
