<template>
  <div
    class="min-h-dvh min-h-screen bg-gray-50 transition-colors duration-300
           dark:bg-[radial-gradient(ellipse_120%_80%_at_50%_-25%,rgba(99, 102, 241,0.055),transparent_48%),#09090b]"
  >
    <Header v-if="showShopChrome" />
    <router-view />
    <Toast />
  </div>
</template>

<script setup>
import { useRoute } from "vue-router";
import { computed, onMounted } from "vue";
import Header from "@/app/layout/Header.vue";
import Toast from "@/components/ui/Toast.vue";
import { useTheme } from "@/composables/useTheme";

const route = useRoute();
const { initTheme } = useTheme();

const authOnlyPaths = ["/login", "/signup", "/forgot-password", "/reset-password", "/admin-signup"];

const showShopChrome = computed(() => {
  if (route.path === "/") return false;
  if (authOnlyPaths.includes(route.path)) return false;
  if (route.path.startsWith("/admin")) return false;
  return true;
});

onMounted(() => {
  initTheme();
});
</script>
