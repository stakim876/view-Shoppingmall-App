<script setup>
import { ref, onMounted } from "vue";
import { useCartStore } from "../store/cart";
import { useAuthStore } from "../store/auth";
import { storeToRefs } from "pinia";
import { ShoppingCart, Moon, Sun } from "lucide-vue-next";

const cart = useCartStore();
const { totalItems } = storeToRefs(cart);
const auth = useAuthStore();

const isDark = ref(false);

const toggleDarkMode = () => {
  isDark.value = !isDark.value;
  document.documentElement.classList.toggle("dark", isDark.value);
  localStorage.setItem("theme", isDark.value ? "dark" : "light");
};

onMounted(() => {
  isDark.value = localStorage.getItem("theme") === "dark";
  document.documentElement.classList.toggle("dark", isDark.value);
});

const logout = () => {
  auth.logout();
  localStorage.removeItem("user");
  window.location.href = "/login";
};
</script>

<template>
  <header
    class="flex justify-between items-center px-8 py-4 
           bg-white/40 dark:bg-[#0f172a]/60 backdrop-blur-lg 
           shadow-[0_8px_32px_rgba(31,38,135,0.15)]
           border-b border-white/30 sticky top-0 z-50 transition-all duration-300"
  >
    <router-link
      to="/home"
      class="flex items-center gap-2 hover:opacity-90 transition"
    >
      <img
        src="/images/download.svg"
        alt="MS Logo"
        class="w-9 h-9 object-contain drop-shadow-sm"
      />
      <span
        class="text-2xl font-extrabold tracking-tight 
               bg-gradient-to-r from-sky-400 via-indigo-400 to-blue-500 
               bg-clip-text text-transparent"
      >
        MyShop
      </span>
    </router-link>

    <div class="flex items-center space-x-6">
      <router-link
        to="/cart"
        class="relative hover:scale-110 transition-transform"
        title="장바구니"
      >
        <ShoppingCart
          class="w-6 h-6 text-indigo-500 dark:text-sky-300
                 drop-shadow-[0_0_4px_rgba(100,120,200,0.3)]
                 hover:text-sky-500 dark:hover:text-sky-200 transition"
        />
        <span
          v-if="totalItems > 0"
          class="absolute -top-2 -right-2 bg-gradient-to-r from-indigo-500 to-sky-500 
                 text-white text-xs font-semibold rounded-full w-4 h-4 flex items-center justify-center
                 shadow-[0_0_6px_rgba(0,0,0,0.25)]"
        >
          {{ totalItems }}
        </span>
      </router-link>

      <button
        @click="toggleDarkMode"
        class="cursor-pointer hover:scale-110 transition-transform"
        title="테마 전환"
      >
        <Moon
          v-if="!isDark"
          class="w-6 h-6 text-indigo-500 drop-shadow-[0_0_4px_rgba(100,120,200,0.3)]
                 hover:text-sky-500 transition"
        />
        <Sun
          v-else
          class="w-6 h-6 text-amber-400 drop-shadow-[0_0_4px_rgba(255,210,100,0.4)]
                 hover:text-yellow-300 transition"
        />
      </button>

      <div v-if="auth.isLoggedIn" class="flex items-center space-x-3">
        <span class="text-gray-800 dark:text-white/90 text-sm font-medium">
          {{ auth.user?.name }}님
        </span>

        <router-link
          v-if="auth.user?.role === 'admin'"
          to="/admin"
          class="text-sm bg-gradient-to-r from-green-500 to-emerald-400 text-white px-3 py-1 rounded-lg hover:opacity-90 transition"
        >
          관리자 페이지
        </router-link>

        <router-link
          to="/mypage"
          class="text-sm bg-gradient-to-r from-indigo-400 to-sky-400 text-white px-3 py-1 rounded-lg hover:opacity-90 transition"
        >
          마이페이지
        </router-link>

        <button
          @click="logout"
          class="text-sm bg-white/20 text-gray-800 dark:text-white px-3 py-1 rounded-lg 
                 hover:bg-white/30 transition backdrop-blur-sm"
        >
          로그아웃
        </button>
      </div>

      <div v-else>
        <router-link
          to="/login"
          class="text-sm px-4 py-2 rounded-lg text-white 
                 bg-gradient-to-r from-indigo-400 to-sky-400 hover:opacity-90 transition"
        >
          로그인
        </router-link>
      </div>
    </div>
  </header>
</template>
