<template>
  <div
    class="min-h-screen py-16 px-6
           bg-gradient-to-b from-slate-100 to-slate-200
           dark:from-zinc-950 dark:to-neutral-950
           text-neutral-800 dark:text-gray-100 font-['Inter']"
  >
    <div class="max-w-xl mx-auto">
      <h1 class="text-2xl font-bold text-neutral-800 dark:text-neutral-100 mb-2">
        주문·배송 조회
      </h1>
      <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-8">
        주문 시 발급된 주문 번호를 입력하세요.
      </p>

      <form @submit.prevent="lookup" class="space-y-4">
        <div>
          <label for="orderId" class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            주문 번호
          </label>
          <input
            id="orderId"
            v-model.number="orderId"
            type="text"
            placeholder="예: 1"
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
            <dt class="text-neutral-500 dark:text-neutral-400">주문일시</dt>
            <dd>{{ formatDate(order.created_at) }}</dd>
          </div>
          <div class="flex justify-between">
            <dt class="text-neutral-500 dark:text-neutral-400">상태</dt>
            <dd>
              <span
                class="px-2 py-0.5 rounded-full text-xs font-medium"
                :class="statusClass(order.status)"
              >
                {{ statusLabel(order.status) }}
              </span>
            </dd>
          </div>
          <div
            v-if="order.tracking_number && order.tracking_url"
            class="flex flex-col gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-600 mt-2"
          >
            <div class="flex justify-between items-start gap-2">
              <dt class="text-neutral-500 dark:text-neutral-400 shrink-0">배송 추적</dt>
              <dd class="text-right text-sm">
                <span class="block text-neutral-800 dark:text-neutral-100">
                  {{ order.carrier_label || order.carrier_code }}
                </span>
                <span class="font-mono text-xs">{{ order.tracking_number }}</span>
              </dd>
            </div>
            <a
              :href="order.tracking_url"
              target="_blank"
              rel="noopener noreferrer"
              class="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              택배 조회 페이지 열기 →
            </a>
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

      <p class="mt-8 text-xs text-neutral-500 dark:text-neutral-400">
        로그인하시면 마이페이지에서 전체 주문 내역을 확인할 수 있습니다.
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { formatPrice } from "../../lib/format";
import api from "../../lib/api";

const orderId = ref("");
const loading = ref(false);
const lookupError = ref("");
const order = ref(null);
const orderItems = ref([]);

const lookup = async () => {
  const id = String(orderId.value).trim();
  if (!id) {
    lookupError.value = "주문 번호를 입력해 주세요.";
    return;
  }
  loading.value = true;
  lookupError.value = "";
  order.value = null;
  orderItems.value = [];
  try {
    const res = await api.get(`/orders/detail/${id}`);
    if (res.data.success && res.data.order) {
      order.value = res.data.order;
      orderItems.value = res.data.items || [];
    } else {
      lookupError.value = "주문 정보를 찾을 수 없습니다.";
    }
  } catch (err) {
    const msg = err.response?.data?.message || err.userMessage || "조회에 실패했습니다.";
    lookupError.value = msg;
  } finally {
    loading.value = false;
  }
};

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const statusLabel = (status) => {
  const map = {
    paid: "결제완료",
    preparing: "상품준비중",
    shipping: "배송중",
    done: "배송완료",
    delivered: "배송완료",
    cancelled: "취소",
  };
  return map[status] || status;
};

const statusClass = (status) => {
  const map = {
    paid: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    preparing: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
    shipping: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    done: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    delivered: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    cancelled: "bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300",
  };
  return map[status] || "bg-neutral-100 text-neutral-600";
};
</script>
