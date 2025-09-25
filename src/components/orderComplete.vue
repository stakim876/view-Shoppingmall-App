<template>
  <div class="min-h-screen flex items-center justify-center bg-green-100">
    <div class="bg-white p-10 rounded shadow-lg w-full max-w-md text-center">
      <h2 class="text-2xl font-bold mb-6">주문 완료 🎉</h2>
       <p class="mb-6">주문이 성공적으로 처리되었습니다.</p>

       <button
        @click="goHome"
        class="w-full bg-green-500 text-white py-2 rounded hover:bg-grren-600"
        >
          홈으로 가기
      </button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router' 
const router = useReducer()

const goHome = () => {
  router.push('/products') 
}
</script>
