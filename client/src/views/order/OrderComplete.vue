<script setup>
import { computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { CheckCircle2 } from "lucide-vue-next";

const router = useRouter();
const route = useRoute();
const orderId = computed(() => route.query.orderId);
const guestToken = computed(() => route.query.guestToken);

const goHome = () => router.push("/home");
const goMyPage = () => router.push("/mypage");
const goLookup = () =>
  router.push({
    path: "/order-lookup",
    query: orderId.value ? { orderId: String(orderId.value) } : {},
  });
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 px-4">
    <div
      class="bg-white/80 dark:bg-white/10 backdrop-blur-md border border-white/40 rounded-2xl p-8 max-w-md w-full text-center shadow-lg"
    >
      <CheckCircle2 class="w-20 h-20 mx-auto text-indigo-500 dark:text-indigo-400" />

      <h1 class="mt-6 text-3xl font-extrabold text-slate-900 dark:text-white">
        결제가 완료되었습니다!
      </h1>

      <p class="mt-4 text-gray-600 dark:text-gray-300">
        주문이 성공적으로 처리되었습니다.
      </p>

      <p v-if="orderId" class="mt-4 text-indigo-600 dark:text-indigo-300 font-semibold">
        주문 번호: #{{ orderId }}
      </p>

      <p
        v-if="guestToken"
        class="mt-3 text-xs text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 rounded-lg px-3 py-2"
      >
        비회원 주문입니다. 주문·배송 조회에서 <strong>주문 번호 + 연락처</strong>로 확인할 수 있습니다.
      </p>

      <div class="mt-8 flex flex-wrap justify-center gap-3">
        <button type="button" @click="goHome" class="shop-btn-primary px-5 py-2 rounded-lg font-medium">
          홈으로 가기
        </button>
        <button
          v-if="guestToken"
          type="button"
          @click="goLookup"
          class="shop-btn-secondary px-5 py-2 rounded-lg font-medium"
        >
          주문 조회
        </button>
        <button
          v-else
          type="button"
          @click="goMyPage"
          class="shop-btn-secondary px-5 py-2 rounded-lg font-medium"
        >
          마이페이지
        </button>
      </div>
    </div>
  </div>
</template>
