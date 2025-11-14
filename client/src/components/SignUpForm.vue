<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 flex items-center justify-center">
    <div class="w-full max-w-xl p-12 bg-white rounded-2xl shadow-2xl">
      <h2 class="text-4xl font-bold text-center text-gray-800 mb-10">회원가입</h2>

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
          class="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 rounded-lg text-lg font-semibold hover:opacity-90 transition"
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
import axios from 'axios';

const email = ref('');
const password = ref('');
const name = ref('');
const gender = ref('');
const message = ref('');

const handleSignup = async () => {
  try {
    const res = await axios.post('http://localhost:3001/signup', {
      email: email.value,
      password: password.value,
      name: name.value,
      gender: gender.value
    });
    message.value = res.data.message;
  } catch (err) {
    message.value = '회원가입에 실패했습니다.';
    console.error(err);
  }
};
</script>
