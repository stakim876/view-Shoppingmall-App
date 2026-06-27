<template>
  <div class="min-h-dvh min-h-screen bg-surface-base text-primary">
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
