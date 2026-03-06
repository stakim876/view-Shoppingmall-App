<template>
  <div class="payment-container">
    <div
      v-if="loading"
      class="flex items-center justify-center py-8"
    >
      <div class="text-center">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mb-2"></div>
        <p class="text-gray-600 dark:text-gray-400">결제를 준비하는 중...</p>
      </div>
    </div>

    <div
      v-else-if="error"
      class="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
    >
      <p class="text-red-600 dark:text-red-400 font-medium mb-2">⚠️ 결제 오류</p>
      <p class="text-red-500 dark:text-red-500 text-sm">{{ error }}</p>
      <button
        @click="$emit('retry')"
        class="mt-3 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm"
      >
        다시 시도
      </button>
    </div>

    <div
      v-else
      id="portone-payment-widget"
      class="payment-widget"
    ></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from "vue";

const props = defineProps({
  amount: {
    type: Number,
    required: true,
  },
  orderName: {
    type: String,
    required: true,
  },
  customerName: {
    type: String,
    default: "",
  },
  customerEmail: {
    type: String,
    default: "",
  },
  customerMobilePhone: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["success", "error", "retry"]);

const loading = ref(true);
const error = ref(null);
let portone = null;

onMounted(async () => {
  try {
    // 아임포트(포트원) SDK 동적 로드
    if (typeof window !== "undefined" && !window.IMP) {
      const script = document.createElement("script");
      script.src = "https://cdn.iamport.kr/js/iamport.payment-1.2.0.js";
      script.async = true;
      script.onload = initializePayment;
      script.onerror = () => {
        error.value = "포트원 SDK를 불러올 수 없습니다.";
        loading.value = false;
      };
      document.head.appendChild(script);
    } else {
      initializePayment();
    }
  } catch (err) {
    console.error("포트원 초기화 오류:", err);
    error.value = "결제 시스템 초기화에 실패했습니다.";
    loading.value = false;
  }
});

const initializePayment = () => {
  try {
    if (typeof window === "undefined" || !window.IMP) {
      error.value = "포트원 SDK를 사용할 수 없습니다.";
      loading.value = false;
      return;
    }

    portone = window.IMP;
    
    // 포트원 초기화 (테스트 모드)
    // 실제 운영 시에는 실제 storeId를 사용해야 합니다
    const storeId = import.meta.env.VITE_PORTONE_STORE_ID || "imp12345678"; // 테스트용
    
    portone.init(storeId);
    
    loading.value = false;
  } catch (err) {
    console.error("포트원 초기화 오류:", err);
    error.value = "결제 시스템 초기화에 실패했습니다.";
    loading.value = false;
  }
};

const requestPayment = (paymentData = {}) => {
  if (!portone) {
    emit("error", "결제 시스템이 초기화되지 않았습니다.");
    return;
  }

  const isNaverPay = paymentData.pay_method === "naverpay";
  const paymentRequest = {
    pg: isNaverPay ? "naverpay" : "html5_inicis",
    pay_method: isNaverPay ? "naverpay" : "card",
    merchant_uid: `order_${Date.now()}`,
    name: props.orderName,
    amount: props.amount,
    buyer_name: props.customerName || "구매자",
    buyer_email: props.customerEmail || "",
    buyer_tel: props.customerMobilePhone || "",
    ...paymentData,
  };
  // 네이버페이/카드 선택이 스프레드로 덮어쓰이도록 pg, pay_method를 마지막에 유지
  paymentRequest.pg = isNaverPay ? "naverpay" : (paymentData.pg || "html5_inicis");
  paymentRequest.pay_method = isNaverPay ? "naverpay" : (paymentData.pay_method || "card");

  portone.request_pay(paymentRequest, (response) => {
    if (response.success) {
      // 결제 성공
      emit("success", {
        imp_uid: response.imp_uid,
        merchant_uid: response.merchant_uid,
        amount: response.paid_amount,
        paymentData: response,
      });
    } else {
      // 결제 실패
      emit("error", response.error_msg || "결제에 실패했습니다.");
    }
  });
};

// 외부에서 호출할 수 있도록 expose
defineExpose({
  requestPayment,
});

onUnmounted(() => {
  // 정리 작업
});
</script>

<style scoped>
.payment-container {
  min-height: 200px;
}

.payment-widget {
  min-height: 200px;
}
</style>
