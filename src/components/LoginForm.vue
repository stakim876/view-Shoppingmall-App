<template>
  <div
    class="min-h-screen flex items-center justify-center 
           bg-gradient-to-br from-[#eef2ff] via-[#f3f4fa] to-[#dfe3f7] 
           dark:from-[#0d0f1a] dark:to-[#1b1e2f] transition-all duration-700"
  >
    <div
      class="bg-white/80 backdrop-blur-xl border border-white/50 
             shadow-[0_8px_32px_rgba(31,38,135,0.2)] rounded-3xl 
             p-10 w-[380px] text-center transition-all duration-500"
    >
      <h1 class="text-3xl font-extrabold mb-2">
        <span class="text-[#5B5FEF]">Ｍ</span>
        <span class="text-[#A45DE7]">Ｓ</span>
        <span class="ml-2 bg-gradient-to-r from-[#5B5FEF] to-[#A45DE7] bg-clip-text text-transparent">
          MyShop
        </span>
      </h1>
      <p class="text-sm text-gray-500 mb-8">
        당신의 감성을 채우는 프리미엄 셀렉트샵
      </p>

      <form @submit.prevent="login" class="flex flex-col gap-5">
        <div class="text-left">
          <label class="block text-sm font-medium text-gray-600 mb-1">이메일</label>
          <div
            class="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#f8f9fc] border border-[#e5e7f0] 
                   focus-within:border-[#7c83ff] shadow-sm transition-all"
          >
            <span class="text-gray-400">📧</span>
            <input
              v-model="email"
              type="email"
              placeholder="이메일을 입력하세요"
              class="flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-400 text-sm"
            />
          </div>
        </div>

        <div class="text-left">
          <label class="block text-sm font-medium text-gray-600 mb-1">비밀번호</label>
          <div
            class="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#f8f9fc] border border-[#e5e7f0] 
                   focus-within:border-[#7c83ff] shadow-sm transition-all"
          >
            <span class="text-gray-400">🔒</span>
            <input
              v-model="password"
              type="password"
              placeholder="비밀번호를 입력하세요"
              class="flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-400 text-sm"
            />
          </div>
        </div>

        <button
          type="submit"
          class="mt-3 py-2.5 rounded-xl font-semibold text-white
                 bg-gradient-to-r from-[#5B5FEF]/80 to-[#A45DE7]/80 backdrop-blur-md
                 border border-white/20 shadow-[0_4px_20px_rgba(91,95,239,0.3)]
                 hover:from-[#5B5FEF]/90 hover:to-[#A45DE7]/90 hover:shadow-[0_4px_25px_rgba(91,95,239,0.45)]
                 active:scale-[0.98] transition-all"
        >
          로그인
        </button>
      </form>

      <p v-if="error" class="text-red-500 text-sm mt-3">{{ error }}</p>

      <div class="mt-6 text-sm">
        <router-link
          to="/signup"
          class="text-[#5B5FEF] hover:underline transition"
        >
          회원가입
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import axios from "axios";
import { ref } from "vue";
import { useRouter } from "vue-router";

const email = ref("");
const password = ref("");
const error = ref("");
const router = useRouter();

const login = async () => {
  error.value = "";
  try {
    const res = await axios.post("http://localhost:3001/api/login", {
      email: email.value,
      password: password.value,
    });

    if (res.data.success) {
      localStorage.setItem("user", JSON.stringify(res.data.user));
      router.push("/home");
    }
  } catch (err) {
    error.value = "이메일 또는 비밀번호가 올바르지 않습니다.";
  }
};
</script>
