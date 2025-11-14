<script setup>
import { ref } from "vue";
import { ShoppingCart } from "lucide-vue-next";
import { useCartStore } from "../store/cart";
import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";
import axios from "axios";

const cart = useCartStore();
const { totalItems, totalPrice } = storeToRefs(cart);
const router = useRouter();

const name = ref("");
const address = ref("");
const phone = ref("");
const userId = 1;

const completeOrder = async () => {
  if (!name.value || !address.value || !phone.value) {
    alert("배송 정보를 모두 입력해주세요!");
    return;
  }

  const payload = {
    userId,
    recipient_name: name.value,
    address: address.value,
    phone: phone.value,
    total_price: Number(totalPrice.value),
    items: cart.items.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity ?? 1,
      price: Number(item.price),
    })),
  };

  try {
    console.log("📦 주문 요청 데이터:", payload);

    const res = await axios.post("http://localhost:3001/api/orders", payload, {
      headers: { "Content-Type": "application/json" },
    });

    console.log("✅ 서버 응답:", res.data);

    if (res.status === 200 && res.data?.success) {
      alert("✅ 결제가 완료되었습니다!");
      cart.clearCart();

      router.push({
        path: "/order-complete",
        query: { orderId: res.data.orderId },
      });
    } else {
      console.warn("⚠️ 서버 응답이 예상과 다름:", res.data);
      alert(res.data?.message || "❌ 결제 처리 중 문제가 발생했습니다.");
    }
  } catch (error) {
    console.error("❌ 결제 오류:", error.response?.data || error.message);
    alert(
      `서버 오류로 결제를 완료할 수 없습니다.\n\n${
        error.response?.data?.message || error.message
      }`
    );
  }
};
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
      <ShoppingCart class="w-7 h-7 text-indigo-500 dark:text-sky-400" />
      주문 결제
    </h1>

    <div
      class="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl 
             bg-transparent"
    >
      <div
        class="bg-white/50 dark:bg-white/10 backdrop-blur-md 
               border border-white/40 rounded-2xl p-8
               shadow-[0_8px_32px_rgba(31,38,135,0.15)] 
               hover:shadow-[0_0_12px_rgba(99,102,241,0.2)] transition-all"
      >
        <h2 class="text-xl font-bold mb-6 text-gray-800 dark:text-white">
          배송 정보
        </h2>

        <div class="space-y-4">
          <div>
            <label class="block text-gray-700 dark:text-gray-300 mb-1">이름</label>
            <input
              v-model="name"
              type="text"
              placeholder="받는 분 이름"
              class="w-full px-4 py-2 rounded-lg bg-white/70 dark:bg-white/20 
                     border border-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-400 
                     placeholder:text-gray-400 text-gray-800 dark:text-gray-100"
            />
          </div>

          <div>
            <label class="block text-gray-700 dark:text-gray-300 mb-1">주소</label>
            <input
              v-model="address"
              type="text"
              placeholder="배송지 주소"
              class="w-full px-4 py-2 rounded-lg bg-white/70 dark:bg-white/20 
                     border border-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-400 
                     placeholder:text-gray-400 text-gray-800 dark:text-gray-100"
            />
          </div>

          <div>
            <label class="block text-gray-700 dark:text-gray-300 mb-1">연락처</label>
            <input
              v-model="phone"
              type="text"
              placeholder="010-XXXX-XXXX"
              class="w-full px-4 py-2 rounded-lg bg-white/70 dark:bg-white/20 
                     border border-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-400 
                     placeholder:text-gray-400 text-gray-800 dark:text-gray-100"
            />
          </div>
        </div>
      </div>

      <div
        class="bg-white/50 dark:bg-white/10 backdrop-blur-md 
               border border-white/40 rounded-2xl p-8
               shadow-[0_8px_32px_rgba(31,38,135,0.15)] 
               hover:shadow-[0_0_12px_rgba(99,102,241,0.2)] transition-all"
      >
        <h2 class="text-xl font-bold mb-6 text-gray-800 dark:text-white">
          주문 상품
        </h2>

        <div
          v-for="item in cart.items"
          :key="item.id"
          class="flex justify-between items-center mb-3 text-gray-700 dark:text-gray-200"
        >
          <span>{{ item.name }}</span>
          <span class="font-semibold text-indigo-600 dark:text-sky-400">
            {{ (item.price * item.quantity).toLocaleString() }}원
          </span>
        </div>

        <hr class="my-4 border-white/50" />

        <p class="text-sm text-gray-600 dark:text-gray-400">
          총 상품수: {{ totalItems }}개
        </p>
        <p class="text-lg font-bold text-indigo-600 dark:text-sky-400 mt-2">
          총 결제금액: {{ totalPrice.toLocaleString() }}원
        </p>

        <button
          @click="completeOrder"
          class="mt-6 w-full py-3 rounded-lg text-white font-semibold
                 bg-gradient-to-r from-indigo-500 to-sky-500
                 hover:opacity-90 transition"
        >
          결제 완료
        </button>
      </div>
    </div>
  </div>
</template>
