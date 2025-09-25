<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 flex items-center justify-center">
    <div class="w-full max-w-xl p-12 bg-white rounded-2xl shadow-2xl">
      <h2 class="text-4xl font-bold text-center text-gray-800 mb-10">로그인</h2>

      <form @submit.prevent="login" class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">이메일</label>
          <div class="relative">
            <input
              v-model="email"
              type="email"
              placeholder="example@domain.com"
              class="w-full px-5 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
            <span class="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">📧</span>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">비밀번호</label>
          <div class="relative">
            <input
              v-model="password"
              type="password"
              placeholder="••••••••"
              class="w-full px-5 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
            <span class="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">🔒</span>
          </div>
        </div>

        <button
          type="submit"
          class="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-lg text-lg font-semibold hover:opacity-90 transition"
        >
          로그인
        </button>
      </form>

      <p class="text-center text-red-500 mt-4">{{ message }}</p>

      <div class="mt-6 text-center text-sm text-gray-500">
        <a href="#" @click.prevent="$emit('changePage', 'signup')" class="hover:underline">회원가입</a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';

const email = ref('');
const password = ref('');
const message = ref('');

const login = async () => {
  try {
    const res = await axios.post('http://localhost:3001/api/login', {
      email: email.value,
      password: password.value
    });

    message.value = `${res.data.user.name}님 환영합니다!`;
    console.log(res.data.user);

    localStorage.setItem('userInfo', JSON.stringify (res.data.user));

    window.location.href = '/home'; 
  } catch (err) {
    message.value = '이메일 또는 비밀번호가 틀렸습니다.';
    console.error(err);
  }
};
</script>
