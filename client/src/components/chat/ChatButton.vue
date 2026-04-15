<template>
  <div>
    <button
      type="button"
      @click="toggleChat"
      :aria-expanded="isOpen"
      aria-controls="shop-chatbot-panel"
      :aria-label="isOpen ? '쇼핑 도움말 닫기' : '쇼핑 도움말 열기'"
      class="group fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center
             rounded-2xl text-white
             bg-gradient-to-br from-sky-500 via-sky-600 to-sky-800
             shadow-[0_12px_40px_-8px_rgba(2,132,199,0.55),0_4px_14px_-6px_rgba(15,23,42,0.25)]
             ring-1 ring-white/25 ring-inset
             transition-all duration-200 ease-out
             hover:scale-[1.04] hover:shadow-[0_16px_44px_-8px_rgba(2,132,199,0.6)]
             active:scale-[0.98]
             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 dark:focus-visible:ring-violet-400
             dark:from-violet-900 dark:via-purple-900 dark:to-zinc-950
             dark:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.5)]
             dark:ring-white/15"
    >
      <span class="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100 dark:from-black/25" />
      <svg
        class="relative h-7 w-7 drop-shadow-sm"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M8 4.5h8A3.5 3.5 0 0119.5 8v5a3.5 3.5 0 01-3.5 3.5h-1.8L9 20.5v-4H8A3.5 3.5 0 014.5 13V8A3.5 3.5 0 018 4.5z"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linejoin="round"
          class="opacity-[0.98]"
        />
        <path
          d="M8.75 10.25h.01M12 10.25h.01M15.25 10.25h.01"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        />
        <g
          transform="translate(17.25,4.25)"
          stroke="currentColor"
          stroke-linecap="round"
          class="opacity-[0.92]"
        >
          <path d="M0-2.5v5M-2.5 0h5" stroke-width="1.35" />
          <path d="M-1.75-1.75L1.75 1.75M1.75-1.75L-1.75 1.75" stroke-width="1.1" />
        </g>
      </svg>
    </button>

    <ChatBot v-if="isOpen" id="shop-chatbot-panel" @close="toggleChat" />
  </div>
</template>

<script setup>
import { ref } from "vue";
import ChatBot from "./ChatBot.vue";

const isOpen = ref(false);
const toggleChat = () => (isOpen.value = !isOpen.value);
</script>
