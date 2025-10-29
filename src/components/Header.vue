<template>
  <header
    class="flex justify-between items-center px-6 py-4 bg-white shadow-md sticky top-0 z-50"
  >
    <router-link to="/home" class="text-xl font-bold text-gray-800">
      My Shop
    </router-link>

    <div class="flex items-center space-x-6">
      <router-link to="/cart" class="relative text-2xl">
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
          {{ auth.user.name }}님
        </span>

        <router-link
          v-if="auth.user.role === 'admin'"
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
  window.location.href = "/login"; 
};
</script>
