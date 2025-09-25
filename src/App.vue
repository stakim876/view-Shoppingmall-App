<template>
  <component :is="currentPage" @changePage="handleChangePage" />
</template>

<script setup>
import { shallowRef, onMounted } from 'vue'

import LoginForm from './components/LoginForm.vue'
import SignUpForm from './components/SignUpForm.vue'
import HomePage from './components/HomePage.vue'

const currentPage = shallowRef(LoginForm)

const handleChangePage = (target) => {
  if (target === 'signup') {
    currentPage.value = SignUpForm
  } else if (target === 'login') {
    currentPage.value = LoginForm
  } else if (target === 'home') {
    currentPage.value = HomePage
  }
}

onMounted(() => {
  const userInfo = localStorage.getItem('userInfo')
  if (userInfo) {
    currentPage.value = HomePage
  }
})
</script>
