<template>
  <section class="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
    <p class="text-sm text-neutral-500 mb-2">404</p>
    <h1 class="text-2xl font-bold text-neutral-900 mb-3">페이지를 찾을 수 없습니다</h1>
    <p class="text-neutral-600 mb-6">
      요청하신 주소가 변경되었거나 삭제되었습니다.
    </p>
    <router-link
      to="/home"
      class="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 transition"
    >
      홈으로 이동
    </router-link>
  </section>
</template>
