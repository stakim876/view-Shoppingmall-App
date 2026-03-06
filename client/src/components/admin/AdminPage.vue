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
      <form @submit.prevent="addProduct" class="space-y-3 mb-6 max-w-xl">
        <input v-model="newProduct.name" placeholder="상품명 *" class="border p-2 rounded w-full" required />
        <textarea v-model="newProduct.description" placeholder="설명" class="border p-2 rounded w-full" rows="2"></textarea>
        <input v-model.number="newProduct.price" type="number" placeholder="가격 (원) *" class="border p-2 rounded w-full" required />
        <select v-model="newProduct.category" class="border p-2 rounded w-full">
          <option value="">카테고리 선택</option>
          <option v-for="c in categoryOptions" :key="c" :value="c">{{ c }}</option>
        </select>
        <input v-model.number="newProduct.stock" type="number" min="0" placeholder="재고 수량" class="border p-2 rounded w-full" />
        <input v-model="newProduct.image_url" placeholder="이미지 URL (예: /images/상품.jpg)" class="border p-2 rounded w-full" />
        <button type="submit" class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
          등록하기
        </button>
      </form>

      <h2 class="text-lg font-semibold mb-2">상품 목록</h2>
      <div class="overflow-x-auto">
        <table class="w-full border">
          <thead>
            <tr class="bg-gray-100">
              <th class="p-2 border">ID</th>
              <th class="p-2 border">상품명</th>
              <th class="p-2 border">카테고리</th>
              <th class="p-2 border">가격</th>
              <th class="p-2 border">재고</th>
              <th class="p-2 border">수정</th>
              <th class="p-2 border">삭제</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in products" :key="p.id" class="text-center">
              <td class="p-2 border">{{ p.id }}</td>
              <td class="p-2 border text-left">{{ p.name }}</td>
              <td class="p-2 border">{{ p.category || "-" }}</td>
              <td class="p-2 border">{{ formatPrice(p.price) }}원</td>
              <td class="p-2 border">{{ p.stock ?? "-" }}</td>
              <td class="p-2 border">
                <button type="button" @click="openEdit(p)" class="text-blue-500 hover:underline">수정</button>
              </td>
              <td class="p-2 border">
                <button type="button" @click="deleteProduct(p.id)" class="text-red-500 hover:underline">삭제</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 상품 수정 모달 -->
      <div
        v-if="editingProduct"
        class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        @click.self="editingProduct = null"
      >
        <div class="bg-white rounded-xl shadow-xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto">
          <h3 class="text-lg font-semibold mb-4">상품 수정 (ID: {{ editingProduct.id }})</h3>
          <form @submit.prevent="updateProduct" class="space-y-3">
            <input v-model="editForm.name" placeholder="상품명 *" class="border p-2 rounded w-full" required />
            <textarea v-model="editForm.description" placeholder="설명" class="border p-2 rounded w-full" rows="2"></textarea>
            <input v-model.number="editForm.price" type="number" placeholder="가격 (원) *" class="border p-2 rounded w-full" required />
            <select v-model="editForm.category" class="border p-2 rounded w-full">
              <option value="">카테고리 선택</option>
              <option v-for="c in categoryOptions" :key="c" :value="c">{{ c }}</option>
            </select>
            <input v-model.number="editForm.stock" type="number" min="0" placeholder="재고 수량" class="border p-2 rounded w-full" />
            <input v-model="editForm.image_url" placeholder="이미지 URL" class="border p-2 rounded w-full" />
            <div class="flex gap-2 pt-2">
              <button type="submit" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">저장</button>
              <button type="button" @click="editingProduct = null" class="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">취소</button>
            </div>
          </form>
        </div>
      </div>
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
            <td class="p-2 border">{{ formatPrice(o.total_price) }}원</td>
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
import api from "../../lib/api";
import { useToastStore } from "../../store/toast";
import { formatPrice } from "../../lib/format";

const toast = useToastStore();
const activeTab = ref("products");
const products = ref([]);
const orders = ref([]);

const categoryOptions = [
  "의류", "악세서리", "뷰티", "디지털/가전", "식품", "생활용품", "스포츠/레저",
  "취미/문구", "가구/인테리어", "유아동", "패션잡화", "기타",
];

const newProduct = ref({
  name: "",
  description: "",
  price: "",
  image_url: "",
  category: "",
  stock: "",
});

const editingProduct = ref(null);
const editForm = ref({
  name: "",
  description: "",
  price: "",
  image_url: "",
  category: "",
  stock: "",
});

const fetchProducts = async () => {
  const res = await api.get("/products");
  products.value = res.data;
};

const addProduct = async () => {
  try {
    await api.post("/products/add", newProduct.value);
    toast.success("상품이 등록되었습니다!");
    fetchProducts();
    newProduct.value = { name: "", description: "", price: "", image_url: "", category: "", stock: "" };
  } catch (error) {
    toast.error(error.userMessage || "상품 등록 중 오류가 발생했습니다.");
  }
};

const openEdit = (p) => {
  editingProduct.value = p;
  editForm.value = {
    name: p.name || "",
    description: p.description || "",
    price: p.price ?? "",
    image_url: p.image_url || "",
    category: p.category || "",
    stock: p.stock ?? "",
  };
};

const updateProduct = async () => {
  if (!editingProduct.value) return;
  try {
    await api.put(`/products/${editingProduct.value.id}`, editForm.value);
    toast.success("상품이 수정되었습니다!");
    editingProduct.value = null;
    fetchProducts();
  } catch (error) {
    toast.error(error.userMessage || "상품 수정 중 오류가 발생했습니다.");
  }
};

const deleteProduct = async (id) => {
  try {
    await api.delete(`/products/${id}`);
    toast.success("상품이 삭제되었습니다!");
    fetchProducts();
  } catch (error) {
    toast.error(error.userMessage || "상품 삭제 중 오류가 발생했습니다.");
  }
};

const fetchOrders = async () => {
  const res = await api.get("/admin/orders");
  orders.value = res.data;
};

const updateOrderStatus = async (id, status) => {
  try {
    await api.put(`/admin/orders/${id}/status`, { status });
    toast.success("주문 상태가 변경되었습니다!");
  } catch (err) {
    console.error("❌ 상태 변경 실패:", err);
    toast.error(err.userMessage || "상태 변경 중 오류가 발생했습니다.");
  }
};

const formatDate = (d) => new Date(d).toLocaleString();

onMounted(() => {
  fetchProducts();
  fetchOrders();
});
</script>
