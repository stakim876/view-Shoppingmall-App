<template>
  <div>
    <button
      @click="toggleChat"
      class="fixed bottom-6 right-6 bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-4 rounded-full shadow-lg hover:scale-105 transition"
    >
      💬
    </button>

    <ChatBot v-if="isOpen" @close="toggleChat" />
  </div>
</template>

<script setup>
import { ref } from "vue";
import ChatBot from "./ChatBot.vue";

const isOpen = ref(false);
const toggleChat = () => (isOpen.value = !isOpen.value);
</script>
