<template>
  <div
    class="fixed bottom-24 right-6 z-[45] w-[min(100vw-2rem,20rem)] max-h-[min(85dvh,calc(100dvh-7rem))] bg-white dark:bg-surface-raised rounded-2xl shadow-xl flex flex-col overflow-hidden border border-gray-200 dark:border-default"
  >
    <div
      class="bg-gradient-to-br from-indigo-700 via-indigo-800 to-violet-950 dark:from-indigo-800 dark:via-indigo-900 dark:to-surface-sunken text-white px-4 py-3 flex justify-between items-start gap-2 border-b border-white/15 dark:border-default"
    >
      <div class="min-w-0">
        <span class="font-semibold tracking-tight block">쇼핑 도움말</span>
        <span class="text-[11px] text-white/80 font-normal leading-snug block mt-0.5">
          배송·교환·상품 문의를 도와드려요
        </span>
      </div>
      <button
        type="button"
        @click="$emit('close')"
        class="shrink-0 rounded-lg p-1.5 text-white/90 hover:bg-white/15 hover:text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
        aria-label="닫기"
      >
        <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" stroke-linecap="round" />
        </svg>
      </button>
    </div>

    <div class="flex-1 min-h-0 p-3 overflow-y-auto overscroll-contain space-y-2 text-sm">
      <div
        v-for="(msg, idx) in messages"
        :key="idx"
        :class="msg.role === 'user' ? 'text-right' : 'text-left'"
      >
        <div
          :class="[
            'inline-block px-3 py-2 rounded-xl max-w-[85%] whitespace-pre-line break-words text-left',
            msg.role === 'user'
              ? 'bg-neutral-100 text-neutral-800 dark:bg-neutral-700/50 dark:text-neutral-100'
              : 'bg-neutral-100 text-neutral-700 dark:bg-white/10 dark:text-neutral-200',
          ]"
        >
          {{ msg.text }}
        </div>
      </div>
    </div>

    <div class="p-3 border-t flex gap-2">
      <input
        v-model="input"
        @keyup.enter="send"
        type="text"
        placeholder="궁금한 점을 입력해 주세요"
        class="flex-1 border border-slate-200 dark:border-default rounded-xl px-3 py-2 text-sm bg-white dark:bg-surface-raised text-slate-800 dark:text-primary focus:outline-none focus:ring-2 focus:ring-indigo-500/45"
        :disabled="sending"
      />
      <button
        type="button"
        @click="send"
        class="shop-btn-primary px-3 py-2 rounded-lg text-sm shrink-0 disabled:opacity-50 disabled:pointer-events-none"
        :disabled="sending"
      >
        {{ sending ? "응답 중…" : "전송" }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { askChatBot } from "../../lib/openai.js";

const input = ref("");
const sending = ref(false);
const messages = ref([
  {
    role: "assistant",
    text: "안녕하세요. Myshop 쇼핑 도움말입니다. 배송, 교환, 상품 관련해서 편하게 물어보세요.",
  },
]);

const send = async () => {
  if (sending.value || !input.value) return;
  const userText = input.value.trim();
  if (!userText) return;
  messages.value.push({ role: "user", text: userText });
  input.value = "";
  sending.value = true;

  try {
    const reply = await askChatBot(userText);
    messages.value.push({ role: "assistant", text: reply });
  } catch (e) {
    messages.value.push({
      role: "assistant",
      text: "죄송합니다. 지금은 연결이 원활하지 않습니다. 잠시 후 다시 시도해 주세요.",
    });
  } finally {
    sending.value = false;
  }
};
</script>
