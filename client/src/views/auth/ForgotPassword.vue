<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 flex items-center justify-center">
    <div class="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl">
      <h1 class="text-xl font-bold text-gray-800 mb-2">비밀번호 재설정</h1>
      <p class="text-sm text-gray-500 mb-6">가입한 이메일을 입력하면 재설정 안내를 보내드립니다.</p>

      <form @submit.prevent="submit" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">이메일</label>
          <input
            v-model="email"
            type="email"
            autocomplete="email"
            required
            class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="example@domain.com"
          />
        </div>

        <button
          type="submit"
          :disabled="submitting"
          class="shop-btn-primary w-full py-2.5 rounded-lg font-semibold disabled:opacity-60"
        >
          {{ submitting ? "전송 중..." : "재설정 링크 보내기" }}
        </button>
      </form>

      <p v-if="message" class="mt-4 text-sm text-green-600">{{ message }}</p>
      <div
        v-if="devResetUrl"
        class="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-900"
      >
        <p class="font-medium mb-1">재설정 링크</p>
        <a :href="devResetUrl" class="text-indigo-600 break-all hover:underline">{{ devResetUrl }}</a>
      </div>
      <div
        v-if="mailPreviewUrl"
        class="mt-4 p-3 rounded-lg bg-sky-50 border border-sky-200 text-sm text-sky-900"
      >
        <p class="font-medium mb-1">개발용 메일 미리보기 (Ethereal)</p>
        <a :href="mailPreviewUrl" target="_blank" rel="noopener" class="text-indigo-600 break-all hover:underline">
          {{ mailPreviewUrl }}
        </a>
      </div>
      <p v-if="error" class="mt-4 text-sm text-red-500">{{ error }}</p>

      <router-link to="/login" class="inline-block mt-6 text-sm text-indigo-600 hover:underline">
        로그인으로 돌아가기
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import api from "../../lib/api";
import { useToastStore } from "../../store/toast";

const email = ref("");
const message = ref("");
const devResetUrl = ref("");
const mailPreviewUrl = ref("");
const error = ref("");
const submitting = ref(false);
const toast = useToastStore();

const submit = async () => {
  if (submitting.value) return;
  submitting.value = true;
  message.value = "";
  devResetUrl.value = "";
  mailPreviewUrl.value = "";
  error.value = "";
  try {
    const res = await api.post("/auth/forgot-password", { email: email.value });
    message.value = res.data?.message || "재설정 안내를 전송했습니다.";
    devResetUrl.value = res.data?.devResetUrl || "";
    mailPreviewUrl.value = res.data?.mailPreviewUrl || "";
    toast.success(message.value);
  } catch (err) {
    error.value = err.userMessage || "요청 처리 중 오류가 발생했습니다.";
    toast.error(error.value);
  } finally {
    submitting.value = false;
  }
};
</script>
