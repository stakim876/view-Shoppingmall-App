<template>
  <div class="min-h-screen bg-[#f9fafb] text-neutral-800 font-['Inter'] py-16 px-6">
    <div class="max-w-4xl mx-auto bg-white rounded-2xl shadow-md border border-neutral-200 p-8">
      <div class="mb-10 text-center">
        <h1
          class="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent"
        >
          📦 주문 상세
        </h1>
        <p class="text-neutral-500 text-sm">
          주문번호 <span class="font-medium text-blue-600">{{ order?.id }}</span> /
          {{ formatDate(order?.created_at) }}
        </p>
      </div>

      <div class="mb-10">
        <h2 class="text-xl font-semibold text-neutral-700 mb-4">배송 정보</h2>
        <div class="bg-neutral-50 p-5 rounded-xl border border-neutral-200">
          <p><span class="font-semibold">이름:</span> {{ order?.shipping_name }}</p>
          <p><span class="font-semibold">주소:</span> {{ order?.shipping_address }}</p>
          <p><span class="font-semibold">연락처:</span> {{ order?.shipping_phone }}</p>
        </div>
      </div>

      <div>
        <h2 class="text-xl font-semibold text-neutral-700 mb-4">주문 상품</h2>
        <div
          v-for="item in items"
          :key="item.id"
          class="flex justify-between items-center border-b border-neutral-100 py-3"
        >
          <div class="flex items-center space-x-4">
            <img
              :src="item.image_url"
              alt="상품 이미지"
              class="w-20 h-20 object-contain rounded-lg bg-neutral-100"
            />
            <div>
              <p class="font-medium text-neutral-800">{{ item.name }}</p>
              <p class="text-sm text-neutral-500">수량: {{ item.quantity }}개</p>
            </div>
          </div>
          <p class="font-semibold text-blue-600">
            {{ (item.price * item.quantity).toLocaleString() }}원
          </p>
        </div>
      </div>

      <div class="mt-8 text-right">
        <p class="text-lg text-neutral-600">
          총 {{ items.length }}개 상품
        </p>
        <p class="text-2xl font-bold text-indigo-600 mt-1">
          총 결제금액: {{ order?.total_price?.toLocaleString() }}원
        </p>
      </div>

      <div class="mt-10 text-center">
        <button
          @click="goBack"
          class="px-6 py-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 text-white font-medium hover:from-indigo-600 hover:to-purple-500 transition-all shadow"
        >
          ← 마이페이지로 돌아가기
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";

const route = useRoute();
const router = useRouter();

const order = ref(null);
const items = ref([]);

onMounted(async () => {
  const orderId = route.params.id;

  try {
    const res = await axios.get(`http://localhost:3001/api/orders/detail/${orderId}`);
    order.value = res.data.order;
    items.value = res.data.items;
  } catch (err) {
    console.error("❌ 주문 상세 불러오기 실패:", err);
    alert("주문 상세 정보를 불러오지 못했습니다.");
    router.push("/mypage");
  }
});

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const goBack = () => {
  router.push("/mypage");
};
</script>
