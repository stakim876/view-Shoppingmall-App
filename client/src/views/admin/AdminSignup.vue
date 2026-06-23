<template>
  <div
    class="min-h-screen flex items-center justify-center 
           bg-gradient-to-br from-[#eef2ff] via-[#f3f4fa] to-[#dfe3f7] 
           dark:from-[#0d0f1a] dark:to-[#1b1e2f] transition-all duration-700"
  >
    <div
      class="bg-white/80 backdrop-blur-xl border border-white/50 
             shadow-[0_8px_32px_rgba(31,38,135,0.2)] rounded-3xl 
             p-6 sm:p-10 w-full max-w-[380px] mx-4 text-center transition-all duration-500"
    >
      <div class="flex items-center justify-center mb-5">
        <BrandLogo size="lg" stacked show-tagline />
      </div>
      <h2 class="text-xl font-bold text-gray-800 mb-6">관리자 회원가입</h2>

      <form @submit.prevent="handleSignup" class="flex flex-col gap-4 text-left">
        <div>
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

        <div>
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

        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">이름</label>
          <div
            class="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#f8f9fc] border border-[#e5e7f0] 
                   focus-within:border-[#7c83ff] shadow-sm transition-all"
          >
            <input
              v-model="name"
              type="text"
              placeholder="이름"
              class="flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-400 text-sm"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">관리자 초대 코드</label>
          <div
            class="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#f8f9fc] border border-[#e5e7f0] 
                   focus-within:border-[#7c83ff] shadow-sm transition-all"
          >
            <span class="text-gray-400">🔑</span>
            <input
              v-model="inviteCode"
              type="password"
              placeholder="초대 코드 입력"
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
          관리자 회원가입
        </button>
      </form>

      <p v-if="message" class="text-red-500 text-sm mt-3">{{ message }}</p>

      <div class="mt-6 text-sm flex flex-col items-center gap-2">
        <router-link to="/login" class="text-[#5B5FEF] hover:underline transition">
          로그인
        </router-link>
        <router-link
          :to="{ path: '/login', query: { redirect: '/admin' } }"
          class="text-gray-500 hover:text-gray-700 transition text-xs"
        >
          관리자 로그인
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import api from "../../lib/api";
import { useAuthStore } from "../../store/auth";
import BrandLogo from "@/components/brand/BrandLogo.vue";

const email = ref("");
const password = ref("");
const name = ref("");
const inviteCode = ref("");
const message = ref("");
const router = useRouter();
const authStore = useAuthStore();
const toast = useToastStore();

const handleSignup = async () => {
  message.value = "";
  try {
    const res = await api.post("/auth/signup-admin", {
      email: email.value,
      password: password.value,
      name: name.value,
      inviteCode: inviteCode.value,
    });

    if (res.data.success) {
      authStore.login(res.data.user, res.data.token);
      toast.success("관리자 계정이 생성되었습니다.");
      router.push("/admin");
    }
  } catch (err) {
    message.value = err.response?.data?.message || err.userMessage || "관리자 회원가입에 실패했습니다.";
    toast.error(message.value);
    console.error(err);
  }
};
</script>
