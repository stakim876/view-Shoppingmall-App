<template>
  <div class="min-h-screen bg-gray-50">
  
    <Header v-if="!isAuthPage" />
    <router-view />
  </div>
</template>

<script setup>
import { useRoute } from "vue-router";
import { computed } from "vue";
import Header from "./components/Header.vue";

const route = useRoute();

const isAuthPage = computed(() =>
  ["/", "/login", "/signup"].includes(route.path)
);
</script>
