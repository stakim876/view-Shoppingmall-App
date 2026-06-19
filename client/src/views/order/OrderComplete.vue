<script setup>
import { useRouter, useRoute } from "vue-router";
import { CheckCircle2 } from "lucide-vue-next";

const router = useRouter();
const route = useRoute();
const orderId = route.query.orderId; 

const goHome = () => router.push("/home");
const goMyPage = () => router.push("/mypage");
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b ...">
    <div class="bg-white/40 ...">
      <CheckCircle2 class="w-20 h-20 mx-auto text-indigo-500 dark:text-indigo-400 drop-shadow-[0_0_10px_rgba(99,102,241,0.4)]" />

      <h1 class="mt-6 text-3xl font-extrabold bg-gradient-to-r from-indigo-500 via-sky-400 to-blue-500 bg-clip-text text-transparent">
        결제가 완료되었습니다!
      </h1>

      <p class="mt-4 text-gray-600 dark:text-gray-300">
        주문이 성공적으로 처리되었습니다.<br />
        소중한 선택에 감사드립니다 💙
      </p>

      <p v-if="orderId" class="mt-4 text-indigo-600 font-semibold">
        주문 번호: #{{ orderId }}
      </p>

      <div class="mt-8 flex justify-center gap-4">
        <button @click="goHome" class="shop-btn-primary px-5 py-2 rounded-lg font-medium">
          홈으로 가기
        </button>
        <button @click="goMyPage" class="shop-btn-secondary px-5 py-2 rounded-lg font-medium">
          마이페이지
        </button>
      </div>
    </div>
  </div>
</template>
