<template>
  <div class="payment-container">
    <div
      v-if="mockMode"
      class="p-4 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 text-sm text-amber-900 dark:text-amber-100"
    >
      <p class="font-medium mb-1">개발용 테스트 결제 모드</p>
      <p class="text-amber-800 dark:text-amber-200/90">
        PortOne 상점 ID가 없어 실제 PG 없이 주문만 생성합니다.
        실제 결제 테스트는 <code class="text-xs">client/.env</code>에
        <code class="text-xs">VITE_PORTONE_STORE_ID</code>를 넣고
        <code class="text-xs">VITE_DEV_MOCK_PAYMENT=false</code>로 설정하세요.
      </p>
    </div>

    <div
      v-else-if="loading"
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
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { getPortOneStoreId, isMockPaymentEnabled } from "../../lib/paymentConfig.js";

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
const mockMode = ref(isMockPaymentEnabled());
let portone = null;

onMounted(async () => {
  if (mockMode.value) {
    loading.value = false;
    return;
  }

  try {
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
    const storeId = getPortOneStoreId();
    if (!storeId) {
      error.value = "VITE_PORTONE_STORE_ID가 설정되지 않았습니다. client/.env를 확인해주세요.";
      loading.value = false;
      return;
    }

    portone.init(storeId);
    loading.value = false;
  } catch (err) {
    console.error("포트원 초기화 오류:", err);
    error.value = "결제 시스템 초기화에 실패했습니다.";
    loading.value = false;
  }
};

const requestPayment = (paymentData = {}) => {
  if (mockMode.value) {
    const merchantUid = `dev_order_${Date.now()}`;
    emit("success", {
      imp_uid: `dev_imp_${Date.now()}`,
      merchant_uid: merchantUid,
      amount: props.amount,
      paymentData: { mock: true, pay_method: paymentData.pay_method || "card" },
    });
    return;
  }

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
  paymentRequest.pg = isNaverPay ? "naverpay" : (paymentData.pg || "html5_inicis");
  paymentRequest.pay_method = isNaverPay ? "naverpay" : (paymentData.pay_method || "card");

  portone.request_pay(paymentRequest, (response) => {
    if (response.success) {
      emit("success", {
        imp_uid: response.imp_uid,
        merchant_uid: response.merchant_uid,
        amount: response.paid_amount,
        paymentData: response,
      });
    } else {
      emit("error", response.error_msg || "결제에 실패했습니다.");
    }
  });
};

defineExpose({
  requestPayment,
  mockMode,
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
