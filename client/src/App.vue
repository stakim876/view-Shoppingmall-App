<template>
  <div class="min-h-screen bg-gray-50 dark:bg-[#0f172a] transition-colors duration-300">
    <button
      @click="toggleDark"
      class="fixed top-4 right-4 px-3 py-2 rounded-full text-sm
             bg-white/80 dark:bg-neutral-800 border dark:border-neutral-700
             text-neutral-700 dark:text-neutral-200 shadow-sm
             hover:shadow-md hover:-translate-y-[1px] transition-all"
    >
      {{ isDark ? '☀️ Light' : '🌙 Dark' }}
    </button>

    <Header v-if="!isAuthPage" />
    <router-view />
    <Toast />
  </div>
</template>

<script setup>
import { useRoute } from "vue-router";
import { computed, ref, onMounted } from "vue";
import Header from "./components/layout/Header.vue";
import Toast from "./components/common/Toast.vue";

const route = useRoute();

const isAuthPage = computed(() => ["/", "/login", "/signup"].includes(route.path));

const isDark = ref(false);

const toggleDark = () => {
  isDark.value = !isDark.value;
  document.documentElement.classList.toggle("dark", isDark.value);
  localStorage.setItem("theme", isDark.value ? "dark" : "light");
};

onMounted(() => {
  isDark.value = localStorage.getItem("theme") === "dark";
  document.documentElement.classList.toggle("dark", isDark.value);
});
</script>
