<template>
  <div
    class="min-h-screen flex items-center justify-center 
           bg-gradient-to-br from-[#f4f6fb] via-[#f6f7fb] to-[#eceff7] 
           dark:from-[#0d0f1a] dark:to-[#1b1e2f] transition-all duration-700"
  >
    <div
      class="bg-white/85 backdrop-blur-xl border border-white/70 
             shadow-[0_6px_24px_rgba(31,38,135,0.12)] rounded-3xl 
             p-10 w-[380px] text-center transition-all duration-500"
    >
      <div class="flex items-center justify-center mb-5">
        <img
          src="/images/0232cce0-e560-4609-9b38-37c5e6165205.png"
          alt="My Shop"
          class="mix-blend-screen h-24 w-auto sm:h-28 sm:w-auto object-contain opacity-90 drop-shadow-[0_4px_10px_rgba(59,130,246,0.12)]"
        />
      </div>
      <p class="text-sm text-gray-500 mb-8 tracking-[0.01em]">
        Curated for your style.
      </p>

      <form @submit.prevent="login" class="flex flex-col gap-5">
        <div class="text-left">
          <label class="block text-sm font-medium text-gray-600 mb-1">이메일</label>
          <div
            class="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#f8f9fc] border border-[#e5e7f0] 
                   focus-within:border-[#7c83ff] shadow-sm transition-all"
          >
            <span class="text-gray-400">📧</span>
            <input
              v-model="email"
              type="email"
              placeholder="이메일을 입력하세요"
              autocomplete="email"
              aria-label="이메일"
              class="flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-400 text-sm"
            />
          </div>
        </div>

        <div class="text-left">
          <label class="block text-sm font-medium text-gray-600 mb-1">비밀번호</label>
          <div
            class="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#f8f9fc] border border-[#e5e7f0] 
                   focus-within:border-[#7c83ff] shadow-sm transition-all"
          >
            <span class="text-gray-400">🔒</span>
            <input
              v-model="password"
              type="password"
              placeholder="비밀번호를 입력하세요"
              autocomplete="current-password"
              aria-label="비밀번호"
              class="flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-400 text-sm"
            />
          </div>
        </div>

        <div class="flex items-center justify-between text-xs text-gray-600">
          <label class="inline-flex items-center gap-2 cursor-pointer select-none">
            <input
              v-model="rememberId"
              type="checkbox"
              class="rounded border-gray-300 text-[#5B5FEF] focus:ring-[#5B5FEF]"
            />
            아이디 저장
          </label>
          <label class="inline-flex items-center gap-2 cursor-pointer select-none">
            <input
              v-model="autoLogin"
              type="checkbox"
              class="rounded border-gray-300 text-[#5B5FEF] focus:ring-[#5B5FEF]"
            />
            자동 로그인
          </label>
        </div>

        <div v-if="requiresCaptcha" class="text-left text-xs text-gray-600">
          <div v-if="isTurnstileEnabled" ref="turnstileEl" class="min-h-[65px]"></div>
          <label v-else class="flex items-center gap-2">
            <input v-model="captchaChecked" type="checkbox" class="rounded border-gray-300" />
            본인 확인을 위해 체크해주세요.
          </label>
          <p class="mt-1 text-[11px] text-gray-500">
            보안 인증이 필요한 상태입니다.
          </p>
        </div>

        <button
          type="submit"
          :disabled="isSubmitting || !canSubmit"
          class="mt-3 py-2.5 rounded-xl font-semibold text-white
                 bg-gradient-to-r from-[#5B5FEF]/80 to-[#A45DE7]/80 backdrop-blur-md
                 border border-white/20 shadow-[0_4px_20px_rgba(91,95,239,0.3)]
                 hover:from-[#5B5FEF]/90 hover:to-[#A45DE7]/90 hover:shadow-[0_4px_25px_rgba(91,95,239,0.45)] 
                 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {{ isSubmitting ? "로그인 중..." : "로그인" }}
        </button>
      </form>

      <p v-if="error" class="text-red-500 text-sm mt-3">{{ error }}</p>

      <div class="mt-6 text-sm flex flex-col items-center gap-2">
        <router-link
          to="/signup"
          class="text-[#5B5FEF] hover:underline transition"
        >
          회원가입
        </router-link>
        <router-link
          to="/forgot-password"
          class="text-[#5B5FEF] hover:underline transition text-xs"
        >
          비밀번호를 잊으셨나요?
        </router-link>
        <span
          v-if="isAdminLoginFlow"
          class="text-gray-400 text-xs cursor-default"
          title="이미 관리자 로그인 경로입니다. 로그인 성공 시 /admin 으로 이동합니다."
        >
          관리자 로그인(진행 중)
        </span>
        <router-link
          v-else
          :to="{ path: '/login', query: { redirect: '/admin' } }"
          class="text-gray-500 hover:text-gray-700 transition text-xs"
        >
          관리자 로그인
        </router-link>
        <router-link
          to="/admin-signup"
          class="text-gray-500 hover:text-gray-700 transition text-xs"
        >
          관리자 회원가입
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import api from "../../lib/api";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "../../store/auth";
import { useToastStore } from "../../store/toast";
import { useWishlistStore } from "../../store/wishlist";
import { trackAuthEvent } from "../../lib/analytics";

const email = ref("");
const password = ref("");
const error = ref("");
const rememberId = ref(false);
const autoLogin = ref(true);
const isSubmitting = ref(false);
const requiresCaptcha = ref(false);
const captchaChecked = ref(false);
const captchaToken = ref("");
const turnstileEl = ref(null);
const turnstileWidgetId = ref(null);
const router = useRouter();
const route = useRoute();
/** 이미 /login?redirect=/admin 이면 같은 링크로 이동해도 화면이 안 바뀌어 “안 눌림”처럼 보임 */
const isAdminLoginFlow = computed(() => {
  const r = route.query.redirect;
  if (r == null) return false;
  const v = Array.isArray(r) ? r[0] : r;
  return String(v).replace(/\/+$/, "") === "/admin";
});
const authStore = useAuthStore();
const toast = useToastStore();
const wishlist = useWishlistStore();
const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || "";
const isTurnstileEnabled = computed(() => Boolean(turnstileSiteKey));
const canSubmit = computed(() => {
  if (!requiresCaptcha.value) return true;
  if (isTurnstileEnabled.value) return Boolean(captchaToken.value);
  return captchaChecked.value;
});

const mountTurnstile = () => {
  if (!isTurnstileEnabled.value || !requiresCaptcha.value || !turnstileEl.value) return;
  if (!window.turnstile?.render) return;
  if (turnstileWidgetId.value !== null) return;
  turnstileWidgetId.value = window.turnstile.render(turnstileEl.value, {
    sitekey: turnstileSiteKey,
    callback: (token) => {
      captchaToken.value = token;
    },
    "expired-callback": () => {
      captchaToken.value = "";
    },
    "error-callback": () => {
      captchaToken.value = "";
    },
  });
};

const resetTurnstile = () => {
  if (!window.turnstile || turnstileWidgetId.value === null) return;
  window.turnstile.reset(turnstileWidgetId.value);
  captchaToken.value = "";
};

const ensureTurnstileScript = () => {
  if (!isTurnstileEnabled.value) return;
  if (document.querySelector('script[data-turnstile="1"]')) {
    mountTurnstile();
    return;
  }
  const script = document.createElement("script");
  script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
  script.async = true;
  script.defer = true;
  script.dataset.turnstile = "1";
  script.onload = () => mountTurnstile();
  document.head.appendChild(script);
};

onMounted(() => {
  const savedEmail = localStorage.getItem("remembered_email");
  if (savedEmail) {
    email.value = savedEmail;
    rememberId.value = true;
  }
  ensureTurnstileScript();
});

watch([requiresCaptcha, turnstileEl], () => {
  if (requiresCaptcha.value) {
    mountTurnstile();
  } else {
    captchaToken.value = "";
    captchaChecked.value = false;
    if (isTurnstileEnabled.value) resetTurnstile();
  }
});

onBeforeUnmount(() => {
  if (window.turnstile && turnstileWidgetId.value !== null) {
    window.turnstile.remove(turnstileWidgetId.value);
  }
});

const loginWithRetry = async (payload) => {
  try {
    return await api.post("/auth/login", payload);
  } catch (err) {
    const isNetworkError = !err.response;
    if (!isNetworkError) throw err;
    return await api.post("/auth/login", payload);
  }
};

const login = async () => {
  if (isSubmitting.value) return;
  if (!canSubmit.value) {
    error.value = "본인 확인 체크 후 다시 시도해주세요.";
    toast.warning(error.value);
    return;
  }

  error.value = "";
  isSubmitting.value = true;
  try {
    const payload = {
      email: email.value,
      password: password.value,
      captchaToken: captchaToken.value || undefined,
    };
    const res = await loginWithRetry(payload);

    if (res.data.success) {
      authStore.login(res.data.user, res.data.token, {
        autoLogin: autoLogin.value,
      });
      if (rememberId.value) {
        localStorage.setItem("remembered_email", email.value);
      } else {
        localStorage.removeItem("remembered_email");
      }
      await wishlist.fetchIds();
      requiresCaptcha.value = false;
      captchaChecked.value = false;
      trackAuthEvent("login_success", { email: email.value });
      toast.success("로그인 성공!");
      const redirect = route.query.redirect;
      router.push(typeof redirect === "string" ? redirect : "/home");
    }
  } catch (err) {
    error.value = err.userMessage || "이메일 또는 비밀번호가 올바르지 않습니다.";
    requiresCaptcha.value = Boolean(err.response?.data?.requiresCaptcha);
    if (!requiresCaptcha.value) {
      captchaChecked.value = false;
      captchaToken.value = "";
    } else if (isTurnstileEnabled.value) {
      resetTurnstile();
    }
    trackAuthEvent("login_failed", {
      email: email.value,
      reason: error.value,
      status: err.response?.status || 0,
    });
    toast.error(error.value);
  } finally {
    isSubmitting.value = false;
  }
};
</script>
