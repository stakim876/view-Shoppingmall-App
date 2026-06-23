<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 flex items-center justify-center px-4">
    <div class="w-full max-w-xl mx-4 p-6 sm:p-12 bg-white rounded-2xl shadow-2xl">
      <div class="flex items-center justify-center mb-5">
        <BrandLogo size="lg" />
      </div>
      <h2 class="text-2xl font-bold text-center text-gray-800 mb-8">회원가입</h2>

      <form @submit.prevent="handleSignup" class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">이메일</label>
          <input
            v-model="email"
            type="email"
            placeholder="example@domain.com"
            class="w-full px-5 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">비밀번호</label>
          <input
            v-model="password"
            type="password"
            placeholder="••••••••"
            class="w-full px-5 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">이름</label>
          <input
            v-model="name"
            type="text"
            placeholder="홍길동"
            class="w-full px-5 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">성별</label>
          <select
            v-model="gender"
            class="w-full px-5 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          >
            <option disabled value="">성별 선택</option>
            <option value="male">남성</option>
            <option value="female">여성</option>
            <option value="other">기타</option>
          </select>
        </div>

        <button
          type="submit"
          class="w-full shop-btn-primary py-3 rounded-lg text-lg font-semibold"
        >
          회원가입
        </button>
      </form>

      <p class="mt-4 text-center text-sm text-gray-500">{{ message }}</p>

      <div class="mt-6 text-center text-sm text-gray-500">
        <a href="#" @click.prevent="$emit('changePage', 'login')" class="hover:underline">로그인</a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import api from '../../lib/api';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../store/auth';
import { useToastStore } from '../../store/toast';
import BrandLogo from '@/components/brand/BrandLogo.vue';

const email = ref('');
const password = ref('');
const name = ref('');
const gender = ref('');
const message = ref('');
const router = useRouter();
const authStore = useAuthStore();
const toast = useToastStore();

const handleSignup = async () => {
  message.value = '';
  try {
    const res = await api.post('/auth/signup', {
      email: email.value,
      password: password.value,
      name: name.value,
      gender: gender.value
    });
    
    if (res.data.success) {
      authStore.login(res.data.user, res.data.token);
      toast.success('회원가입이 완료되었습니다!');
      router.push('/home');
    }
  } catch (err) {
    message.value = err.userMessage || '회원가입에 실패했습니다.';
    toast.error(message.value);
    console.error(err);
  }
};
</script>
