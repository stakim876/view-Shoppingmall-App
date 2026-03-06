<script setup>
import { ref, computed } from "vue";
import { ShoppingCart } from "lucide-vue-next";
import { useCartStore } from "../../store/cart";
import { useAuthStore } from "../../store/auth";
import { useToastStore } from "../../store/toast";
import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";
import api from "../../lib/api";
import PortOnePayment from "./PortOnePayment.vue";
import { formatPrice } from "../../lib/format";

const cart = useCartStore();
const authStore = useAuthStore();
const toast = useToastStore();
const { totalItems, totalPrice } = storeToRefs(cart);
const router = useRouter();

const name = ref("");
const address = ref("");
const addressDetail = ref("");
const phone = ref("");
const email = ref("");
const paymentWidgetRef = ref(null);
const isProcessingPayment = ref(false);
const paymentMethod = ref("card"); // 'card' | 'naverpay'

const userId = computed(() => authStore.user?.id || null);

// 다음 주소 API 연동
const openAddressSearch = () => {
  if (typeof window === "undefined" || !window.daum) {
    // 다음 주소 API 스크립트 로드
    const script = document.createElement("script");
    script.src = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    script.onload = () => {
      new window.daum.Postcode({
        oncomplete: (data) => {
          let addr = "";
          if (data.userSelectedType === "R") {
            addr = data.roadAddress;
          } else {
            addr = data.jibunAddress;
          }
          address.value = `[${data.zonecode}] ${addr}`;
          addressDetail.value = "";
        },
      }).open();
    };
    document.head.appendChild(script);
  } else {
    new window.daum.Postcode({
      oncomplete: (data) => {
        let addr = "";
        if (data.userSelectedType === "R") {
          addr = data.roadAddress;
        } else {
          addr = data.jibunAddress;
        }
        address.value = `[${data.zonecode}] ${addr}`;
        addressDetail.value = "";
      },
    }).open();
  }
};

// 결제 요청
const requestPayment = () => {
  if (!name.value || !address.value || !phone.value) {
    toast.warning("배송 정보를 모두 입력해주세요!");
    return;
  }

  if (!userId.value) {
    toast.warning("로그인이 필요합니다.");
    router.push("/login");
    return;
  }

  if (paymentWidgetRef.value) {
    isProcessingPayment.value = true;
    paymentWidgetRef.value.requestPayment({
      buyer_name: name.value,
      buyer_tel: phone.value,
      buyer_email: email.value || undefined,
      pay_method: paymentMethod.value,
    });
  }
};

// 결제 성공 처리
const handlePaymentSuccess = async (paymentResult) => {
  try {
    const fullAddress = addressDetail.value 
      ? `${address.value} ${addressDetail.value}`
      : address.value;

    const payload = {
      userId: userId.value,
      recipient_name: name.value,
      address: fullAddress,
      phone: phone.value,
      total_price: Number(totalPrice.value),
      imp_uid: paymentResult.imp_uid,
      merchant_uid: paymentResult.merchant_uid,
      items: cart.items.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity ?? 1,
        price: Number(item.price),
      })),
    };

    console.log("📦 주문 요청 데이터:", payload);

    // 결제 검증 및 주문 생성
    const res = await api.post("/orders", payload);

    console.log("✅ 서버 응답:", res.data);

    if (res.status === 200 && res.data?.success) {
      toast.success("결제가 완료되었습니다!");
      cart.clearCart();

      router.push({
        path: "/order-complete",
        query: { orderId: res.data.orderId },
      });
    } else {
      console.warn("⚠️ 서버 응답이 예상과 다름:", res.data);
      toast.error(res.data?.message || "주문 처리 중 문제가 발생했습니다.");
    }
  } catch (error) {
    console.error("❌ 주문 처리 오류:", error);
    const errorMessage = error.userMessage || error.response?.data?.message || "주문 처리 중 오류가 발생했습니다.";
    toast.error(`주문 처리 실패: ${errorMessage}`);
  } finally {
    isProcessingPayment.value = false;
  }
};

// 결제 실패 처리
const handlePaymentError = (errorMessage) => {
  toast.error(errorMessage || "결제에 실패했습니다.");
  isProcessingPayment.value = false;
};
</script>

<template>
  <div
    class="min-h-screen px-8 py-12 
           bg-gradient-to-b from-slate-100 to-slate-200 
           dark:from-[#0f172a] dark:to-[#1e293b]
           transition-colors duration-300 flex flex-col items-center"
  >
    <h1
      class="flex items-center gap-2 text-3xl font-extrabold mb-10 
             bg-gradient-to-r from-indigo-500 to-sky-500 bg-clip-text text-transparent"
    >
      <ShoppingCart class="w-7 h-7 text-indigo-500 dark:text-sky-400" />
      주문 결제
    </h1>

    <div
      class="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl 
             bg-transparent"
    >
      <div
        class="bg-white/50 dark:bg-white/10 backdrop-blur-md 
               border border-white/40 rounded-2xl p-8
               shadow-[0_8px_32px_rgba(31,38,135,0.15)] 
               hover:shadow-[0_0_12px_rgba(99,102,241,0.2)] transition-all"
      >
        <h2 class="text-xl font-bold mb-6 text-gray-800 dark:text-white">
          배송 정보
        </h2>

        <div class="space-y-4">
          <div>
            <label class="block text-gray-700 dark:text-gray-300 mb-1">이름</label>
            <input
              v-model="name"
              type="text"
              placeholder="받는 분 이름"
              class="w-full px-4 py-2 rounded-lg bg-white/70 dark:bg-white/20 
                     border border-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-400 
                     placeholder:text-gray-400 text-gray-800 dark:text-gray-100"
            />
          </div>

          <div>
            <label class="block text-gray-700 dark:text-gray-300 mb-1">주소</label>
            <div class="flex gap-2 mb-2">
              <input
                v-model="address"
                type="text"
                placeholder="배송지 주소"
                readonly
                class="flex-1 px-4 py-2 rounded-lg bg-white/70 dark:bg-white/20 
                       border border-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-400 
                       placeholder:text-gray-400 text-gray-800 dark:text-gray-100"
              />
              <button
                type="button"
                @click="openAddressSearch"
                class="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 
                       text-white font-medium transition whitespace-nowrap"
              >
                주소 검색
              </button>
            </div>
            <input
              v-model="addressDetail"
              type="text"
              placeholder="상세 주소"
              class="w-full px-4 py-2 rounded-lg bg-white/70 dark:bg-white/20 
                     border border-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-400 
                     placeholder:text-gray-400 text-gray-800 dark:text-gray-100"
            />
          </div>

          <div>
            <label class="block text-gray-700 dark:text-gray-300 mb-1">연락처</label>
            <input
              v-model="phone"
              type="text"
              placeholder="010-XXXX-XXXX"
              class="w-full px-4 py-2 rounded-lg bg-white/70 dark:bg-white/20 
                     border border-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-400 
                     placeholder:text-gray-400 text-gray-800 dark:text-gray-100"
            />
          </div>

          <div>
            <label class="block text-gray-700 dark:text-gray-300 mb-1">이메일 (선택)</label>
            <input
              v-model="email"
              type="email"
              placeholder="example@email.com"
              class="w-full px-4 py-2 rounded-lg bg-white/70 dark:bg-white/20 
                     border border-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-400 
                     placeholder:text-gray-400 text-gray-800 dark:text-gray-100"
            />
          </div>
        </div>
      </div>

      <div
        class="bg-white/50 dark:bg-white/10 backdrop-blur-md 
               border border-white/40 rounded-2xl p-8
               shadow-[0_8px_32px_rgba(31,38,135,0.15)] 
               hover:shadow-[0_0_12px_rgba(99,102,241,0.2)] transition-all"
      >
        <h2 class="text-xl font-bold mb-6 text-gray-800 dark:text-white">
          주문 상품
        </h2>

        <div
          v-for="item in cart.items"
          :key="item.id"
          class="flex justify-between items-center mb-3 text-gray-700 dark:text-gray-200"
        >
          <span>{{ item.name }}</span>
          <span class="font-semibold text-indigo-600 dark:text-sky-400">
            {{ formatPrice(item.price * item.quantity) }}원
          </span>
        </div>

        <hr class="my-4 border-white/50" />

        <p class="text-sm text-gray-600 dark:text-gray-400">
          총 상품수: {{ totalItems }}개
        </p>
        <p class="text-lg font-bold text-indigo-600 dark:text-sky-400 mt-2">
          총 결제금액: {{ formatPrice(totalPrice) }}원
        </p>

        <!-- 결제 수단 선택 -->
        <div class="mt-6 space-y-2">
          <p class="text-sm font-medium text-gray-700 dark:text-gray-300">결제 수단</p>
          <div class="flex gap-3">
            <label
              class="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 cursor-pointer transition-all
                     border-indigo-200 dark:border-indigo-500/50 bg-white dark:bg-white/5
                     hover:border-indigo-400 dark:hover:border-indigo-400"
              :class="paymentMethod === 'card' && '!border-indigo-500 !ring-2 !ring-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-500/10'"
            >
              <input v-model="paymentMethod" type="radio" value="card" class="sr-only" />
              <span class="font-medium text-gray-800 dark:text-gray-200">카드</span>
            </label>
            <label
              class="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 cursor-pointer transition-all
                     border-indigo-200 dark:border-indigo-500/50 bg-white dark:bg-white/5
                     hover:border-indigo-400 dark:hover:border-indigo-400"
              :class="paymentMethod === 'naverpay' && '!border-indigo-500 !ring-2 !ring-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-500/10'"
            >
              <input v-model="paymentMethod" type="radio" value="naverpay" class="sr-only" />
              <span class="font-semibold text-[#03C75A]">네이버페이</span>
            </label>
          </div>
        </div>

        <button
          @click="requestPayment"
          :disabled="isProcessingPayment || totalItems === 0"
          class="mt-6 w-full py-3 rounded-lg text-white font-semibold
                 bg-gradient-to-r from-indigo-500 to-sky-500
                 hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isProcessingPayment ? "결제 처리 중..." : `${formatPrice(totalPrice)}원 결제하기` }}
        </button>
      </div>

      <!-- 결제 위젯 (숨김 처리) -->
      <div class="hidden">
        <PortOnePayment
          ref="paymentWidgetRef"
          :amount="totalPrice"
          :order-name="`${cart.items.map(i => i.name).join(', ')} 외 ${totalItems}개`"
          :customer-name="name"
          :customer-email="email"
          :customer-mobile-phone="phone"
          @success="handlePaymentSuccess"
          @error="handlePaymentError"
        />
      </div>
    </div>
  </div>
</template>
