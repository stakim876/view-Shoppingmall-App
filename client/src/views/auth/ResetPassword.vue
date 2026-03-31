<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 flex items-center justify-center">
    <div class="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl">
      <h1 class="text-xl font-bold text-gray-800 mb-2">새 비밀번호 설정</h1>
      <p class="text-sm text-gray-500 mb-6">8자 이상의 새 비밀번호를 입력해주세요.</p>

      <form @submit.prevent="submit" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">새 비밀번호</label>
          <input
            v-model="newPassword"
            type="password"
            autocomplete="new-password"
            required
            minlength="8"
            class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="8자 이상 입력"
          />
        </div>

        <button
          type="submit"
          :disabled="submitting"
          class="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-semibold hover:bg-indigo-500 transition disabled:opacity-60"
        >
          {{ submitting ? "변경 중..." : "비밀번호 변경" }}
        </button>
      </form>

      <p v-if="message" class="mt-4 text-sm text-green-600">{{ message }}</p>
      <p v-if="error" class="mt-4 text-sm text-red-500">{{ error }}</p>

      <router-link to="/login" class="inline-block mt-6 text-sm text-indigo-600 hover:underline">
        로그인으로 이동
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import api from "../../lib/api";
import { useToastStore } from "../../store/toast";

const route = useRoute();
const router = useRouter();
const toast = useToastStore();

const newPassword = ref("");
const message = ref("");
const error = ref("");
const submitting = ref(false);
const token = computed(() => String(route.query.token || ""));

const submit = async () => {
  if (submitting.value) return;
  if (!token.value) {
    error.value = "유효한 재설정 토큰이 없습니다.";
    return;
  }

  submitting.value = true;
  message.value = "";
  error.value = "";
  try {
    const res = await api.post("/auth/reset-password", {
      token: token.value,
      newPassword: newPassword.value,
    });
    message.value = res.data?.message || "비밀번호가 변경되었습니다.";
    toast.success(message.value);
    setTimeout(() => router.push("/login"), 1200);
  } catch (err) {
    error.value = err.userMessage || "비밀번호 변경에 실패했습니다.";
    toast.error(error.value);
  } finally {
    submitting.value = false;
  }
};
</script>
