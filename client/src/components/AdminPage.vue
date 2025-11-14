<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold mb-6 text-gray-800">관리자 페이지</h1>

    <div class="flex space-x-4 mb-6">
      <button
        @click="activeTab = 'products'"
        :class="[
          'px-4 py-2 rounded',
          activeTab === 'products' ? 'bg-blue-500 text-white' : 'bg-gray-200'
        ]"
      >
        상품 관리
      </button>
      <button
        @click="activeTab = 'orders'"
        :class="[
          'px-4 py-2 rounded',
          activeTab === 'orders' ? 'bg-blue-500 text-white' : 'bg-gray-200'
        ]"
      >
        주문 관리
      </button>
    </div>

    <div v-if="activeTab === 'products'">
      <h2 class="text-lg font-semibold mb-4">상품 등록</h2>
      <form @submit.prevent="addProduct" class="space-y-3 mb-6">
        <input v-model="newProduct.name" placeholder="상품명" class="border p-2 rounded w-full" />
        <input v-model="newProduct.description" placeholder="설명" class="border p-2 rounded w-full" />
        <input v-model.number="newProduct.price" placeholder="가격" class="border p-2 rounded w-full" />
        <input v-model="newProduct.image_url" placeholder="이미지 URL" class="border p-2 rounded w-full" />
        <button class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
          등록하기
        </button>
      </form>

      <h2 class="text-lg font-semibold mb-2">상품 목록</h2>
      <table class="w-full border">
        <thead>
          <tr class="bg-gray-100">
            <th class="p-2 border">ID</th>
            <th class="p-2 border">상품명</th>
            <th class="p-2 border">가격</th>
            <th class="p-2 border">삭제</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in products" :key="p.id" class="text-center">
            <td class="p-2 border">{{ p.id }}</td>
            <td class="p-2 border">{{ p.name }}</td>
            <td class="p-2 border">{{ p.price.toLocaleString() }}원</td>
            <td class="p-2 border">
              <button @click="deleteProduct(p.id)" class="text-red-500 hover:underline">삭제</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else>
      <h2 class="text-lg font-semibold mb-2">전체 주문 내역</h2>
      <table class="w-full border">
        <thead>
          <tr class="bg-gray-100">
            <th class="p-2 border">주문번호</th>
            <th class="p-2 border">사용자 ID</th>
            <th class="p-2 border">총 금액</th>
            <th class="p-2 border">상태</th>
            <th class="p-2 border">상품 목록</th>
            <th class="p-2 border">주문일</th>
            <th class="p-2 border">상태 변경</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="o in orders" :key="o.id" class="text-center">
            <td class="p-2 border">{{ o.id }}</td>
            <td class="p-2 border">{{ o.user_id }}</td>
            <td class="p-2 border">{{ o.total_price.toLocaleString() }}원</td>
            <td class="p-2 border text-blue-500 font-semibold">{{ o.status }}</td>
            <td class="p-2 border text-gray-600">{{ o.products }}</td>
            <td class="p-2 border">{{ formatDate(o.created_at) }}</td>
            <td class="p-2 border">
              <select v-model="o.status" @change="updateOrderStatus(o.id, o.status)" class="border p-1 rounded">
                <option value="paid">결제완료</option>
                <option value="shipped">배송중</option>
                <option value="completed">배송완료</option>
                <option value="cancelled">취소됨</option>
              </select>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";

const activeTab = ref("products");
const products = ref([]);
const orders = ref([]);

const newProduct = ref({
  name: "",
  description: "",
  price: "",
  image_url: "",
});

const fetchProducts = async () => {
  const res = await axios.get("http://localhost:3001/api/products");
  products.value = res.data;
};

const addProduct = async () => {
  await axios.post("http://localhost:3001/api/products/add", newProduct.value);
  alert("상품이 등록되었습니다!");
  fetchProducts();
  newProduct.value = { name: "", description: "", price: "", image_url: "" };
};

const deleteProduct = async (id) => {
  await axios.delete(`http://localhost:3001/api/products/${id}`);
  alert("상품이 삭제되었습니다!");
  fetchProducts();
};

const fetchOrders = async () => {
  const res = await axios.get("http://localhost:3001/api/admin/orders");
  orders.value = res.data;
};

const updateOrderStatus = async (id, status) => {
  try {
    await axios.put(`http://localhost:3001/api/admin/orders/${id}/status`, { status });
    alert("주문 상태가 변경되었습니다!");
  } catch (err) {
    console.error("❌ 상태 변경 실패:", err);
    alert("상태 변경 중 오류가 발생했습니다.");
  }
};

const formatDate = (d) => new Date(d).toLocaleString();

onMounted(() => {
  fetchProducts();
  fetchOrders();
});
</script>
