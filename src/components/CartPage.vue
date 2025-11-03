<script setup>
import { useCartStore } from "../store/cart";
import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";
import { ShoppingCart } from "lucide-vue-next";

const cart = useCartStore();
const { totalItems, totalPrice } = storeToRefs(cart);
const router = useRouter();

const checkout = () => {
  if (cart.items.length === 0) {
    alert("장바구니가 비어 있습니다!");
    return;
  }
  router.push("/checkout");
};
</script>

<template>
  <div
    class="min-h-screen px-8 py-10 
           bg-gradient-to-b from-slate-100 to-slate-200 
           dark:from-[#0f172a] dark:to-[#1e293b]
           transition-colors duration-300"
  >
    <h1
      class="text-2xl font-bold mb-8 flex items-center gap-2 
             text-gray-800 dark:text-white/90"
    >
      <ShoppingCart class="w-6 h-6 text-indigo-500 dark:text-sky-400" />
      장바구니
    </h1>

    <div
      v-if="cart.items.length === 0"
      class="text-center text-gray-500 dark:text-gray-400 italic py-10"
    >
      장바구니가 비어 있습니다.
    </div>

    <div v-else class="space-y-5">
      <div
        v-for="item in cart.items"
        :key="item.id"
        class="flex items-center justify-between 
               bg-white/50 dark:bg-white/10 backdrop-blur-md 
               border border-white/40 rounded-2xl 
               shadow-[0_8px_32px_rgba(31,38,135,0.15)] 
               hover:shadow-[0_0_12px_rgba(99,102,241,0.25)] 
               transition-all duration-300 p-5"
      >
        <div class="flex items-center space-x-5">
          <img
            :src="item.image_url"
            alt="상품 이미지"
            class="w-20 h-20 object-contain rounded-lg shadow-sm"
          />
          <div>
            <h2 class="font-semibold text-gray-800 dark:text-gray-100">
              {{ item.name }}
            </h2>
            <p class="text-gray-500 dark:text-gray-400 text-sm">
              {{ item.price.toLocaleString() }}원
            </p>
            <p class="font-semibold text-gray-700 dark:text-gray-200 mt-1">
              합계:
              <span class="text-indigo-600 dark:text-sky-400">
                {{ (item.price * item.quantity).toLocaleString() }}원
              </span>
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            @click="cart.decreaseQuantity(item.id)"
            class="px-3 py-1 rounded-lg bg-white/70 dark:bg-white/20 
                   hover:bg-white/90 dark:hover:bg-white/30 
                   transition"
          >
            −
          </button>
          <span class="text-gray-800 dark:text-gray-200">
            {{ item.quantity }}
          </span>
          <button
            @click="cart.increaseQuantity(item.id)"
            class="px-3 py-1 rounded-lg bg-white/70 dark:bg-white/20 
                   hover:bg-white/90 dark:hover:bg-white/30 
                   transition"
          >
            ＋
          </button>
          <button
            @click="cart.removeFromCart(item.id)"
            class="ml-2 px-3 py-1 text-white rounded-lg text-sm 
                   bg-gradient-to-r from-rose-500 to-pink-500 
                   hover:opacity-90 transition"
          >
            삭제
          </button>
        </div>
      </div>

      <div class="text-right mt-8">
        <p class="text-gray-700 dark:text-gray-300">
          총 상품수:
          <span class="font-semibold">{{ totalItems }}</span>개
        </p>
        <p
          class="text-lg font-semibold mt-1 
                 text-green-600 dark:text-green-400"
        >
          총 금액:
          <span class="text-2xl font-bold">
            {{ totalPrice.toLocaleString() }}원
          </span>
        </p>
        <button
          @click="checkout"
          class="mt-4 px-6 py-2 rounded-lg text-white font-semibold 
                 bg-gradient-to-r from-indigo-500 to-sky-500 
                 hover:opacity-90 transition"
        >
          결제하기
        </button>
      </div>
    </div>
  </div>
</template>
