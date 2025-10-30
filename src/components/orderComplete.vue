<template>
  <div class="min-h-screen flex items-center justify-center bg-blue-50">
    <div class="bg-white p-10 rounded-xl shadow-lg text-center max-w-md w-full">
      <h2 class="text-3xl font-bold mb-4 text-blue-600">🎉 주문 완료!</h2>
      <p class="text-neutral-700 mb-6">
        주문이 성공적으로 처리되었습니다.<br />
        빠른 시일 내에 배송해드릴게요.
      </p>

      <router-link
        to="/home"
        class="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-500 text-white rounded-full font-medium hover:from-indigo-600 hover:to-purple-500 transition-all"
      >
        홈으로 돌아가기
      </router-link>
    </div>
  </div>
</template>
