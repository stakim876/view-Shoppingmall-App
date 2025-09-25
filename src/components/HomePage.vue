<template>
  <div class="min-h-screen bg-green-50">
 
    <Header />

    <div class="py-10 px-4">
      <h1 class="text-3xl font-bold text-green-700 text-center mb-8">
        Welcome to the mall!!
      </h1>

      <ProductList />
    </div>
  </div>
</template>


<script setup>
import Header from './Header.vue';
import ProductList from './ProductList.vue';
</script>