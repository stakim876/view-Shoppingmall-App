<template>
  <div class="shop-page-ambient py-16 px-6 text-primary font-['Inter']">
    <div class="max-w-xl mx-auto">
      <h1 class="text-2xl font-bold text-neutral-800 dark:text-neutral-100 mb-2">
        주문·배송 조회
      </h1>
      <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-8">
        비회원 주문은 주문 번호와 결제 시 입력한 연락처로 조회합니다.
      </p>

      <form @submit.prevent="lookup" class="space-y-4">
        <div>
          <label for="orderId" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            주문 번호
          </label>
          <input
            id="orderId"
            v-model="orderId"
            type="text"
            placeholder="예: 12"
            class="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-600
                   bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100
                   focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label for="phone" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            연락처
          </label>
          <input
            id="phone"
            v-model="phone"
            type="tel"
            placeholder="주문 시 입력한 휴대폰 번호"
            class="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-600
                   bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100
                   focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          type="submit"
          :disabled="loading"
          class="shop-btn-primary w-full py-3 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ loading ? "조회 중..." : "조회하기" }}
        </button>
      </form>

      <p v-if="lookupError" class="mt-4 text-sm text-red-600 dark:text-red-400">
        {{ lookupError }}
      </p>

      <div
        v-if="order && !lookupError"
        class="mt-8 p-6 rounded-2xl bg-white/90 dark:bg-white/10 border border-neutral-200 dark:border-neutral-600"
      >
        <h2 class="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-4">
          주문 정보
        </h2>
        <dl class="space-y-2 text-sm">
          <div class="flex justify-between">
            <dt class="text-neutral-500 dark:text-neutral-400">주문 번호</dt>
            <dd class="font-medium">{{ order.id }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-neutral-500 dark:text-neutral-400">수령인</dt>
            <dd>{{ order.recipient_name }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-neutral-500 dark:text-neutral-400">연락처</dt>
            <dd>{{ order.phone }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-neutral-500 dark:text-neutral-400">주소</dt>
            <dd class="text-right max-w-[60%]">{{ order.address }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-neutral-500 dark:text-neutral-400">결제 금액</dt>
            <dd class="font-semibold text-indigo-600 dark:text-indigo-400">
              {{ formatPrice(order.total_price) }}원
            </dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-neutral-500 dark:text-neutral-400">상태</dt>
            <dd>
              <span
                class="px-2 py-0.5 rounded-full text-xs font-medium"
                :class="getOrderStatusBadgeClass(order.status)"
              >
                {{ getOrderStatusLabel(order.status) }}
              </span>
            </dd>
          </div>
        </dl>
        <div class="mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-600">
          <h3 class="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
            주문 상품
          </h3>
          <ul class="space-y-2">
            <li
              v-for="item in orderItems"
              :key="item.id"
              class="flex justify-between text-sm"
            >
              <span>{{ item.name }} × {{ item.quantity }}</span>
              <span>{{ formatPrice(item.price * item.quantity) }}원</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { formatPrice } from "../../lib/format";
import api from "../../lib/api";
import { getOrderStatusLabel, getOrderStatusBadgeClass } from "@/lib/orderStatus.js";

const route = useRoute();
const orderId = ref(String(route.query.orderId || ""));
const phone = ref("");
const loading = ref(false);
const lookupError = ref("");
const order = ref(null);
const orderItems = ref([]);

onMounted(() => {
  try {
    const saved = JSON.parse(localStorage.getItem("myshop_last_guest_order") || "null");
    if (saved?.phone && !phone.value) phone.value = saved.phone;
    if (saved?.orderId && !orderId.value) orderId.value = String(saved.orderId);
  } catch (_) {}
});

const lookup = async () => {
  const id = String(orderId.value).trim();
  const tel = String(phone.value).trim();
  if (!id) {
    lookupError.value = "주문 번호를 입력해 주세요.";
    return;
  }
  if (!tel) {
    lookupError.value = "연락처를 입력해 주세요.";
    return;
  }
  loading.value = true;
  lookupError.value = "";
  order.value = null;
  orderItems.value = [];
  try {
    const res = await api.post("/orders/guest-lookup", { orderId: id, phone: tel });
    if (res.data.success && res.data.order) {
      order.value = res.data.order;
      orderItems.value = res.data.items || [];
    } else {
      lookupError.value = "주문 정보를 찾을 수 없습니다.";
    }
  } catch (err) {
    lookupError.value = err.response?.data?.message || err.userMessage || "조회에 실패했습니다.";
  } finally {
    loading.value = false;
  }
};
</script>
