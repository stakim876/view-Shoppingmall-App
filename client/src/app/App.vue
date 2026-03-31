<template>
  <div class="min-h-screen bg-gray-50 dark:bg-[#0f172a] transition-colors duration-300">
    <Header v-if="!isAuthPage" />
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

const isAuthPage = computed(() => ["/", "/login", "/signup"].includes(route.path));

onMounted(() => {
  initTheme();
});
</script>
