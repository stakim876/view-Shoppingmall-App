<template>
  <div
    class="fixed bottom-24 right-6 w-80 bg-white dark:bg-[#0f172a] rounded-2xl shadow-xl flex flex-col overflow-hidden border border-gray-200 dark:border-white/10"
  >
    <div class="bg-gradient-to-br from-sky-600 via-sky-700 to-sky-900 dark:from-slate-700 dark:via-slate-800 dark:to-slate-900 text-white px-4 py-2 flex justify-between items-center border-b border-white/15 dark:border-slate-600/40">
      <span class="font-semibold">Myshop AI 도우미</span>
      <button @click="$emit('close')" class="text-white hover:text-gray-200">✖</button>
    </div>

    <div class="flex-1 p-3 overflow-y-auto space-y-2 text-sm">
      <div
        v-for="(msg, idx) in messages"
        :key="idx"
        :class="msg.role === 'user' ? 'text-right' : 'text-left'"
      >
        <div
          :class="[
            'inline-block px-3 py-2 rounded-xl max-w-[80%]',
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
        placeholder="무엇을 찾고 계신가요?"
        class="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none"
      />
      <button
        @click="send"
        class="shop-btn-primary px-3 py-2 rounded-lg text-sm shrink-0"
      >
        전송
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { askChatBot } from "../../lib/openai.js";

const input = ref("");
const messages = ref([
  { role: "assistant", text: "안녕하세요 😊 Myshop AI 도우미입니다. 무엇을 도와드릴까요?" },
]);

const send = async () => {
  if (!input.value) return;
  const userText = input.value.trim();
  messages.value.push({ role: "user", text: userText });
  input.value = "";

  try {
    const reply = await askChatBot(userText);
    messages.value.push({ role: "assistant", text: reply });
  } catch (e) {
    messages.value.push({
      role: "assistant",
      text: "죄송합니다. 지금은 잠시 연결이 원활하지 않습니다 😢",
    });
  }
};
</script>
