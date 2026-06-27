<script setup>
/*
 * [면접] 주문·결제 화면
 * 흐름: PortOne(또는 mock) 결제 → POST /orders → 서버 금액·재고 재검증
 */
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
import { calculateShippingFee, getFreeShippingMinimumWon } from "@/lib/shopPolicy.js";
import { isMockPaymentEnabled } from "@/lib/paymentConfig.js";
import { saveSeniorLastOrder } from "@/lib/seniorEasyShop.js";

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
const paymentMethod = ref("card");
const mockPayment = isMockPaymentEnabled();

const couponCode = ref("");
const appliedCoupon = ref(null);
const isValidatingCoupon = ref(false);

const userId = computed(() => authStore.user?.id || null);

const applyCoupon = async () => {
  const code = couponCode.value?.trim();
  if (!code) {
    toast.warning("쿠폰 코드를 입력해주세요.");
    return;
  }
  if (totalPrice.value <= 0) {
    toast.warning("상품을 먼저 담아주세요.");
    return;
  }
  isValidatingCoupon.value = true;
  appliedCoupon.value = null;
  try {
    const res = await api.post("/coupons/validate", {
      code,
      subtotal: totalPrice.value,
    });
    const data = res.data;
    if (data.valid && data.discount != null && data.finalTotal != null) {
      appliedCoupon.value = {
        code: data.coupon?.code || code,
        discount: data.discount,
        finalTotal: data.finalTotal,
      };
      toast.success(data.message || "쿠폰이 적용되었습니다.");
    } else {
      toast.error(data.message || "유효하지 않은 쿠폰입니다.");
    }
  } catch (err) {
    toast.error(err.response?.data?.message || err.userMessage || "쿠폰 확인에 실패했습니다.");
  } finally {
    isValidatingCoupon.value = false;
  }
};

const removeCoupon = () => {
  appliedCoupon.value = null;
  couponCode.value = "";
};

const discountedSubtotal = computed(() =>
  appliedCoupon.value ? appliedCoupon.value.finalTotal : totalPrice.value
);
const shippingFee = computed(() => calculateShippingFee(discountedSubtotal.value));
const freeShippingMinimum = getFreeShippingMinimumWon();
const finalTotal = computed(() => discountedSubtotal.value + shippingFee.value);

const openAddressSearch = () => {
  if (typeof window === "undefined" || !window.daum) {
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

const buildOrderPayload = (paymentResult) => {
  const fullAddress = addressDetail.value
    ? `${address.value} ${addressDetail.value}`
    : address.value;

  const payload = {
    userId: userId.value,
    recipient_name: name.value,
    address: fullAddress,
    phone: phone.value,
    total_price: Number(finalTotal.value),
    imp_uid: paymentResult.imp_uid,
    merchant_uid: paymentResult.merchant_uid,
    items: cart.items.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity ?? 1,
      price: Number(item.price),
    })),
  };
  if (appliedCoupon.value?.code) {
    payload.coupon_code = appliedCoupon.value.code;
  }
  return payload;
};

const completeOrderSuccess = (orderId) => {
  toast.success("결제가 완료되었습니다!");
  saveSeniorLastOrder(cart.items);
  cart.clearCart();
  router.push({
    path: "/order-complete",
    query: { orderId },
  });
};

const submitOrder = async (paymentResult) => {
  const payload = buildOrderPayload(paymentResult);
  const res = await api.post("/orders", payload);
  if (res.status === 200 && res.data?.success && res.data.orderId != null) {
    return res.data;
  }
  const err = new Error(res.data?.message || "주문 처리 중 문제가 발생했습니다.");
  err.response = { data: res.data };
  throw err;
};

const handlePaymentSuccess = async (paymentResult) => {
  try {
    let data;
    try {
      data = await submitOrder(paymentResult);
    } catch (firstError) {
      const canRetry =
        paymentResult?.imp_uid &&
        (!firstError.response || firstError.response.status >= 500);

      if (canRetry) {
        data = await submitOrder(paymentResult);
      } else {
        throw firstError;
      }
    }

    completeOrderSuccess(data.orderId);
  } catch (error) {
    console.error("❌ 주문 처리 오류:", error);
    const serverMessage = error.response?.data?.message || error.userMessage || "";
    const paymentRef = paymentResult?.imp_uid || paymentResult?.merchant_uid;

    if (paymentRef && (!error.response || error.response.status >= 500)) {
      toast.error(
        `주문 저장에 실패했습니다. 결제는 완료되었을 수 있습니다. 고객센터에 결제번호(${paymentRef})를 알려주세요.`
      );
    } else if (error.response?.data?.code === "PRICE_MISMATCH") {
      toast.error(serverMessage || "상품 가격이 변경되었습니다. 장바구니를 확인한 뒤 다시 결제해 주세요.");
    } else {
      toast.error(serverMessage || "주문 처리 중 오류가 발생했습니다.");
    }
  } finally {
    isProcessingPayment.value = false;
  }
};

const handlePaymentError = (errorMessage) => {
  toast.error(errorMessage || "결제에 실패했습니다.");
  isProcessingPayment.value = false;
};
</script>

<template>
  <div
    class="shop-page-ambient px-4 py-8 sm:px-8 sm:py-12 transition-colors duration-300 flex flex-col items-center"
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
               border border-white/40 rounded-2xl p-4 sm:p-8
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
                class="shop-btn-primary px-4 py-2 rounded-lg font-medium whitespace-nowrap"
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
               border border-white/40 rounded-2xl p-4 sm:p-8
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

        
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">쿠폰 코드</label>
          <div class="flex gap-2">
            <input
              v-model="couponCode"
              type="text"
              placeholder="쿠폰 코드 입력"
              :disabled="!!appliedCoupon"
              class="flex-1 px-4 py-2 rounded-lg bg-white/70 dark:bg-white/20 
                     border border-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-400 
                     placeholder:text-gray-400 text-gray-800 dark:text-gray-100 disabled:opacity-60"
            />
            <button
              v-if="!appliedCoupon"
              type="button"
              @click="applyCoupon"
              :disabled="isValidatingCoupon || !couponCode.trim()"
              class="shop-btn-primary px-4 py-2 rounded-lg disabled:opacity-50 font-medium whitespace-nowrap"
            >
              {{ isValidatingCoupon ? "확인 중..." : "적용" }}
            </button>
            <button
              v-else
              type="button"
              @click="removeCoupon"
              class="shop-btn-secondary px-4 py-2 rounded-lg font-medium"
            >
              해제
            </button>
          </div>
          <p v-if="appliedCoupon" class="mt-2 text-sm text-green-600 dark:text-green-400">
            {{ appliedCoupon.code }} 적용됨 · -{{ formatPrice(appliedCoupon.discount) }}원 할인
          </p>
        </div>

        <p class="text-sm text-gray-600 dark:text-gray-400">
          총 상품수: {{ totalItems }}개
        </p>
        <p v-if="appliedCoupon" class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          소계: {{ formatPrice(totalPrice) }}원
          <span class="text-green-600 dark:text-green-400"> - {{ formatPrice(appliedCoupon.discount) }}원 (쿠폰)</span>
        </p>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
          배송비:
          <span v-if="shippingFee === 0" class="text-indigo-600 dark:text-indigo-400 font-medium">
            무료
          </span>
          <span v-else>{{ formatPrice(shippingFee) }}원</span>
          <span class="ml-1 text-xs text-gray-500 dark:text-gray-500">( {{ formatPrice(freeShippingMinimum) }}원 이상 무료배송 )</span>
        </p>
        <p class="text-lg font-bold text-indigo-600 dark:text-sky-400 mt-2">
          총 결제금액: {{ formatPrice(finalTotal) }}원
        </p>

        
        <div class="mt-6 space-y-2">
          <p class="text-sm font-medium text-gray-700 dark:text-gray-300">결제 수단</p>
          <div class="flex gap-3">
            <label
              class="flex-1 flex items-center justify-center gap-2 min-h-[3.5rem] py-2 px-3 sm:px-4 rounded-lg border-2 cursor-pointer transition-all
                     border-indigo-200 dark:border-indigo-500/50 bg-white dark:bg-white/5
                     hover:border-indigo-400 dark:hover:border-indigo-400"
              :class="paymentMethod === 'card' && '!border-indigo-500 !ring-2 !ring-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-500/10'"
            >
              <input v-model="paymentMethod" type="radio" value="card" class="sr-only" />
              <span class="font-medium text-base sm:text-lg text-gray-800 dark:text-gray-200">카드</span>
            </label>
            <label
              class="flex-1 flex items-center justify-center min-h-[3.5rem] py-2 px-3 sm:px-4 rounded-lg border-2 cursor-pointer transition-all
                     border-indigo-200 dark:border-indigo-500/50 bg-white dark:bg-white/5
                     hover:border-indigo-400 dark:hover:border-indigo-400"
              :class="paymentMethod === 'naverpay' && '!border-indigo-500 !ring-2 !ring-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-500/10'"
            >
              <input v-model="paymentMethod" type="radio" value="naverpay" class="sr-only" />
              <img
                src="/images/naver-pay-logo.png"
                alt="Naver Pay"
                class="w-full max-h-12 sm:max-h-14 h-auto object-contain object-center"
                loading="lazy"
                decoding="async"
              />
            </label>
          </div>
        </div>

        <button
          @click="requestPayment"
          :disabled="isProcessingPayment || totalItems === 0"
          class="shop-btn-primary mt-6 w-full py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{
            isProcessingPayment
              ? "결제 처리 중..."
              : mockPayment
                ? `${formatPrice(finalTotal)}원 테스트 주문하기`
                : `${formatPrice(finalTotal)}원 결제하기`
          }}
        </button>
      </div>

      <PortOnePayment
          ref="paymentWidgetRef"
          :amount="finalTotal"
          :order-name="`${cart.items.map(i => i.name).join(', ')} 외 ${totalItems}개`"
          :customer-name="name"
          :customer-email="email"
          :customer-mobile-phone="phone"
          @success="handlePaymentSuccess"
          @error="handlePaymentError"
        />
    </div>
  </div>
</template>
