<template>
  <div class="min-h-screen bg-[#f9fafb] text-neutral-800 font-['Inter']">
    <div class="max-w-5xl mx-auto py-16 px-6">
      <h1
        class="text-3xl font-bold text-center mb-10 bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent"
      >
        🛒 주문 결제
      </h1>

      <div class="grid md:grid-cols-2 gap-10">
        <div class="bg-white shadow-md rounded-xl p-6 border border-neutral-200">
          <h2 class="text-xl font-semibold mb-4">배송 정보</h2>
          <form class="space-y-4">
            <div>
              <label class="block text-sm text-neutral-600 mb-1">이름</label>
              <input
                v-model="shipping.name"
                type="text"
                placeholder="받는 분 이름"
                class="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
              />
            </div>
            <div>
              <label class="block text-sm text-neutral-600 mb-1">주소</label>
              <input
                v-model="shipping.address"
                type="text"
                placeholder="배송지 주소"
                class="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
              />
            </div>
            <div>
              <label class="block text-sm text-neutral-600 mb-1">연락처</label>
              <input
                v-model="shipping.phone"
                type="text"
                placeholder="010-XXXX-XXXX"
                class="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
              />
            </div>
          </form>
        </div>

        <div class="bg-white shadow-md rounded-xl p-6 border border-neutral-200">
          <h2 class="text-xl font-semibold mb-4">주문 상품</h2>

          <div v-if="cart.items.length === 0" class="text-center text-neutral-400">
            장바구니가 비어 있습니다.
          </div>

          <div v-else>
            <div
              v-for="item in cart.items"
              :key="item.id"
              class="flex justify-between items-center border-b py-2"
            >
              <div>
                <p class="font-medium">{{ item.name }}</p>
                <p class="text-sm text-neutral-500">{{ item.quantity }}개</p>
              </div>
              <p class="text-blue-600 font-semibold">
                {{ (item.price * item.quantity).toLocaleString() }}원
              </p>
            </div>

            <div class="mt-6 text-right">
              <p class="text-lg font-semibold text-neutral-700">
                총 상품수: {{ cart.totalItems }}개
              </p>
              <p class="text-2xl font-bold text-blue-600 mt-1">
                총 결제금액: {{ cart.totalPrice.toLocaleString() }}원
              </p>
            </div>

            <button
              @click="handleOrder"
              class="mt-8 w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-500 text-white rounded-full font-medium hover:from-indigo-600 hover:to-purple-500 transition-all shadow-md"
            >
              결제 완료
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";
import { useCartStore } from "../store/cart";
import axios from "axios";
import { ref } from "vue";

const router = useRouter();
const cart = useCartStore();

const shipping = ref({
  name: "",
  address: "",
  phone: "",
});

const handleOrder = async () => {
  if (!shipping.value.name || !shipping.value.address || !shipping.value.phone) {
    alert("배송 정보를 모두 입력해주세요.");
    return;
  }

  try {
    const orderRes = await axios.post("http://localhost:3001/api/orders", {
      user_id: 1, 
      total_price: cart.totalPrice,
      items: cart.items,
      shipping: shipping.value,
    });

    console.log("주문 성공:", orderRes.data);
    localStorage.setItem(
      "latestOrder",
      JSON.stringify({
        id: orderRes.data.order_id || "TEMP-" + Date.now(),
        total: cart.totalPrice,
        date: new Date().toLocaleString("ko-KR", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }),
      })
    );

    cart.items = [];

    router.push("/order-complete");
  } catch (err) {
    console.error("주문 실패:", err);
    alert("주문 처리 중 오류가 발생했습니다.");
  }
};
</script>
