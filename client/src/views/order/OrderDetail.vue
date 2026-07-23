<script setup>
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import api from "../../lib/api";
import { useToastStore } from "../../store/toast";
import { ArrowLeft, Package } from "lucide-vue-next";
import { formatPrice } from "../../lib/format";
import { formatOptionsLabel, parseOptionsFromOrderItem } from "@/lib/productOptions.js";
import {
  ORDER_TIMELINE_STEPS,
  getOrderStatusLabel,
  getOrderStatusBadgeClass,
  getOrderStepVariant,
  getOrderStepDotClass,
  getOrderStepTextClass,
  canCancelOrder,
  canRequestReturn,
} from "@/lib/orderStatus.js";

const route = useRoute();
const router = useRouter();
const toast = useToastStore();
const order = ref(null);
const loading = ref(true);
const error = ref(null);
const cancelling = ref(false);
const returnType = ref("return");
const returnReason = ref("");
const returnSubmitting = ref(false);

const formatItemOptions = (item) => {
  const options = item?.options || parseOptionsFromOrderItem(item?.options_json);
  if (!options || !Object.keys(options).length) return "";
  return formatOptionsLabel([], options);
};

const fetchOrderDetail = async () => {
  const orderId = route.params.id;
  try {
    const res = await api.get(`/orders/detail/${orderId}`);
    if (res.data.success) {
      order.value = res.data;
    } else {
      error.value = res.data.message || "주문을 찾을 수 없습니다.";
    }
  } catch (err) {
    console.error("❌ 주문 상세 불러오기 실패:", err);
    error.value = "서버 통신 중 오류가 발생했습니다.";
  } finally {
    loading.value = false;
  }
};

onMounted(fetchOrderDetail);

const cancelOrder = async () => {
  if (!order.value?.order?.id) return;
  if (!window.confirm("주문을 취소하고 결제를 환불할까요?")) {
    return;
  }
  cancelling.value = true;
  try {
    const res = await api.post(`/orders/${order.value.order.id}/cancel`);
    if (res.data?.success) {
      toast.success(res.data.message || "주문이 취소되었습니다.");
      await fetchOrderDetail();
    } else {
      toast.error(res.data?.message || "주문 취소에 실패했습니다.");
    }
  } catch (err) {
    toast.error(err.response?.data?.message || err.userMessage || "주문 취소에 실패했습니다.");
  } finally {
    cancelling.value = false;
  }
};

const submitReturnRequest = async () => {
  if (!order.value?.order?.id || returnSubmitting.value) return;
  const reason = returnReason.value.trim();
  if (reason.length < 2) {
    toast.warning("사유를 입력해 주세요.");
    return;
  }
  returnSubmitting.value = true;
  try {
    const res = await api.post(`/orders/${order.value.order.id}/returns`, {
      type: returnType.value,
      reason,
    });
    if (res.data?.success) {
      toast.success(res.data.message || "신청이 접수되었습니다.");
      returnReason.value = "";
      await fetchOrderDetail();
    } else {
      toast.error(res.data?.message || "신청에 실패했습니다.");
    }
  } catch (err) {
    toast.error(err.response?.data?.message || err.userMessage || "신청에 실패했습니다.");
  } finally {
    returnSubmitting.value = false;
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
</script>

<template>
  <div
    class="shop-page-ambient py-16 px-6 text-primary font-['Inter'] transition-colors duration-300"
  >
    <div class="max-w-4xl mx-auto">
      <button
        @click="router.back()"
        class="flex items-center gap-2 text-gray-600 dark:text-gray-300 mb-8 hover:text-indigo-500 transition"
      >
        <ArrowLeft class="w-5 h-5" /> 뒤로가기
      </button>

      <h1
        class="flex items-center gap-2 text-3xl font-extrabold mb-12 
               bg-gradient-to-r from-indigo-500 via-sky-400 to-blue-500 
               bg-clip-text text-transparent"
      >
        <Package class="w-7 h-7 text-indigo-500 dark:text-sky-400" />
        주문 상세 내역
      </h1>

      <div v-if="loading" class="text-center text-gray-500">불러오는 중...</div>
      <div v-else-if="error" class="text-center text-red-500">{{ error }}</div>

      <div
        v-else
        class="bg-white/50 dark:bg-white/10 backdrop-blur-md border border-white/40 rounded-2xl p-8 
               shadow-[0_8px_32px_rgba(31,38,135,0.15)] 
               hover:shadow-[0_0_12px_rgba(99,102,241,0.25)] 
               transition-all duration-300"
      >
        <div class="mb-6 border-b border-white/30 pb-4">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            주문번호: <span class="font-medium text-indigo-600 dark:text-sky-400">#{{ order.order.id }}</span>
          </p>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            주문일자: {{ formatDate(order.order.created_at) }}
          </p>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            상태:
            <span class="px-2 py-0.5 rounded-full text-xs font-medium" :class="getOrderStatusBadgeClass(order.order.status)">
              {{ getOrderStatusLabel(order.order.status) }}
            </span>
          </p>
        </div>

        <div class="mb-8">
          <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">배송 정보</h2>
          <p>수령인: {{ order.order.recipient_name }}</p>
          <p>주소: {{ order.order.address }}</p>
          <p>연락처: {{ order.order.phone }}</p>
          <div class="mt-4">
            <p class="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">배송 진행</p>
            <ol class="relative border-l border-slate-200 dark:border-white/10 ml-3 pl-4 space-y-4">
              <li v-for="s in ORDER_TIMELINE_STEPS" :key="s.key" class="relative">
                <span
                  class="absolute -left-[11px] top-[6px] h-3.5 w-3.5 rounded-full"
                  :class="getOrderStepDotClass(getOrderStepVariant(order.order.status, s.key))"
                />
                <p class="text-sm" :class="getOrderStepTextClass(getOrderStepVariant(order.order.status, s.key))">
                  {{ s.label }}
                </p>
              </li>
            </ol>
          </div>
          <div
            v-if="order.order.tracking_number && order.order.tracking_url"
            class="mt-4 p-4 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-500/30"
          >
            <h3 class="text-sm font-semibold text-indigo-800 dark:text-indigo-200 mb-2">배송 추적</h3>
            <p class="text-sm text-gray-700 dark:text-gray-300">
              {{ order.order.carrier_label || order.order.carrier_code }} · 송장
              <span class="font-mono font-medium">{{ order.order.tracking_number }}</span>
            </p>
            <a
              :href="order.order.tracking_url"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex mt-2 text-sm font-medium text-indigo-600 dark:text-sky-400 hover:underline"
            >
              택배사 사이트에서 조회하기 →
            </a>
          </div>
          <p
            v-else-if="['shipping', 'preparing', 'done'].includes(order.order.status)"
            class="mt-3 text-sm text-gray-500 dark:text-gray-400"
          >
            송장 등록 후 배송 조회 링크가 표시됩니다.
          </p>
        </div>

        <div>
          <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">주문 상품</h2>

          <div class="divide-y divide-white/40">
            <div
              v-for="item in order.items"
              :key="item.id"
              class="py-4 flex justify-between items-center"
            >
              <div class="flex items-center gap-4">
                <img
                  v-if="item.image_url"
                  :src="item.image_url"
                  alt="상품 이미지"
                  class="w-16 h-16 rounded-lg object-cover border border-white/30"
                />
                <div>
                  <p class="font-medium text-gray-800 dark:text-gray-100">
                    {{ item.name }}
                  </p>
                  <p
                    v-if="formatItemOptions(item)"
                    class="text-xs text-gray-500 dark:text-gray-400 mt-0.5"
                  >
                    {{ formatItemOptions(item) }}
                  </p>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    수량: {{ item.quantity }}개
                  </p>
                </div>
              </div>
              <p class="font-semibold text-indigo-600 dark:text-sky-400">
                {{ formatPrice(item.price * item.quantity) }}원
              </p>
            </div>
          </div>
        </div>

        <hr class="my-6 border-white/40" />

        <div class="flex justify-between items-center">
          <p class="text-lg font-bold text-gray-700 dark:text-gray-200">
            총 결제 금액
          </p>
          <p class="text-2xl font-extrabold text-indigo-600 dark:text-sky-400">
            {{ formatPrice(order.order.total_price) }}원
          </p>
        </div>

        <button
          v-if="canCancelOrder(order.order.status)"
          type="button"
          class="shop-btn-danger mt-6 w-full py-2.5 rounded-md font-medium"
          :disabled="cancelling"
          @click="cancelOrder"
        >
          {{ cancelling ? "취소 처리 중…" : "주문 취소 · 환불" }}
        </button>

        <div
          v-if="canRequestReturn(order.order.status)"
          class="mt-6 p-4 rounded-xl border border-neutral-200 dark:border-default space-y-3"
        >
          <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-100">반품 · 교환 신청</h3>
          <div class="flex gap-3 text-sm">
            <label class="inline-flex items-center gap-1.5">
              <input v-model="returnType" type="radio" value="return" />
              반품
            </label>
            <label class="inline-flex items-center gap-1.5">
              <input v-model="returnType" type="radio" value="exchange" />
              교환
            </label>
          </div>
          <textarea
            v-model="returnReason"
            rows="3"
            placeholder="사유를 입력해 주세요"
            class="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 px-3 py-2 text-sm"
          />
          <button
            type="button"
            class="shop-btn-secondary w-full py-2 rounded-md text-sm font-medium"
            :disabled="returnSubmitting"
            @click="submitReturnRequest"
          >
            {{ returnSubmitting ? "신청 중…" : "신청하기" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
