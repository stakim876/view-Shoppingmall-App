<template>
  <header
    class="flex justify-between items-center px-8 py-4 bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100"
  >
    <router-link
      to="/home"
      class="flex items-center gap-2 hover:opacity-80 transition"
    >
      <img
        src="/images/download.svg"
        alt="MS Logo"
        class="w-9 h-9 object-contain drop-shadow-sm"
      />
      <span
        class="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 bg-clip-text text-transparent"
      >
        MyShop
      </span>
    </router-link>

    <div class="flex items-center space-x-6">
      <router-link to="/cart" class="relative text-2xl hover:scale-110 transition">
        🛒
        <span
          v-if="totalItems > 0"
          class="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-2"
        >
          {{ totalItems }}
        </span>
      </router-link>

      <div v-if="auth.isLoggedIn" class="flex items-center space-x-3">
        <span class="text-gray-700 text-sm font-medium">
          {{ auth.user?.name }}님
        </span>

        <router-link
          v-if="auth.user?.role === 'admin'"
          to="/admin"
          class="text-sm bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition"
        >
          관리자 페이지
        </router-link>

        <router-link
          to="/mypage"
          class="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition"
        >
          마이페이지
        </router-link>

        <button
          @click="logout"
          class="text-sm bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300 transition"
        >
          로그아웃
        </button>
      </div>

      <div v-else>
        <router-link
          to="/login"
          class="text-sm bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
        >
          로그인
        </router-link>
      </div>
    </div>
  </header>
</template>

<script setup>
import { useCartStore } from "../store/cart";
import { useAuthStore } from "../store/auth";
import { storeToRefs } from "pinia";

const cart = useCartStore();
const { totalItems } = storeToRefs(cart);
const auth = useAuthStore();

const logout = () => {
  auth.logout();
  localStorage.removeItem("user");
  window.location.href = "/login";
};
</script>
