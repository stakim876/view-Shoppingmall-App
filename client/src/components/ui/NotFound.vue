<template>
  <div
    class="min-h-screen flex items-center justify-center 
           bg-gradient-to-br from-slate-100 to-slate-200 
           dark:from-[#0f172a] dark:to-[#1e293b]
           px-6"
  >
    <div class="text-center max-w-md">
      <div class="mb-8">
        <h1
          class="text-9xl font-extrabold bg-gradient-to-r 
                 from-indigo-500 via-sky-400 to-blue-500 
                 bg-clip-text text-transparent mb-4"
        >
          404
        </h1>
        <h2 class="text-3xl font-bold text-gray-800 dark:text-white mb-4">
          페이지를 찾을 수 없습니다
        </h2>
        <p class="text-gray-600 dark:text-gray-400 mb-8">
          요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
        </p>
      </div>

      <div class="flex gap-4 justify-center">
        <router-link
          to="/home"
          class="shop-btn-primary px-6 py-3 rounded-lg font-semibold"
        >
          홈으로 가기
        </router-link>
        <button
          @click="$router.go(-1)"
          class="shop-btn-secondary px-6 py-3 rounded-lg font-semibold"
        >
          이전 페이지
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
</style>
