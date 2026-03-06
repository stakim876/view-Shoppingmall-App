<template>
  <div
    class="fixed bottom-24 right-6 w-80 bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden border border-gray-200"
  >
    <div class="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2 flex justify-between items-center">
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
              ? 'bg-indigo-100 text-gray-800'
              : 'bg-gray-100 text-gray-700',
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
        class="bg-indigo-500 text-white px-3 py-2 rounded-lg hover:bg-indigo-600"
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
