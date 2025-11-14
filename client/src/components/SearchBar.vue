<template>
  <div class="flex justify-center my-6">
    <input
      v-model="query"
      @keyup.enter="search"
      type="text"
      placeholder="상품명을 입력하세요"
      class="w-80 border border-gray-300 rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
    />
    <button
      @click="search"
      class="bg-blue-500 text-white px-4 py-2 rounded-r-lg hover:bg-blue-600"
    >
      검색
    </button>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useProductStore } from "@/stores/productStore";

const query = ref("");
const productStore = useProductStore();

const search = () => {
  productStore.searchProducts(query.value);
};
</script>
