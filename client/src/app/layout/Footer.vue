<template>
  <footer
    class="text-sm bg-slate-100 dark:bg-zinc-950 border-t border-slate-200/80 dark:border-slate-800/80"
  >
    <div class="max-w-6xl mx-auto px-6 py-10">
      <div class="flex flex-col lg:flex-row gap-8 lg:gap-12">
        <div class="flex-shrink-0 flex flex-col items-start gap-2">
          <BrandLogo size="sm" link-to="/home" />
          <p class="text-slate-600 dark:text-white/80 text-xs max-w-[220px]">
            {{ BRAND_TAGLINE }}
          </p>
        </div>

        <div class="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <div>
            <h3 class="font-semibold text-slate-800 dark:text-white mb-3 pb-1 border-b border-slate-300/80 dark:border-slate-600/50 inline-block">
              고객센터
            </h3>
            <ul class="space-y-1.5 text-slate-700 dark:text-white/90">
              <li>전화: {{ contact.phone }}</li>
              <li>팩스: {{ contact.fax }}</li>
              <li>
                <a
                  :href="contact.kakaoUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-slate-700 dark:text-neutral-300 hover:text-indigo-800 dark:hover:text-indigo-400 hover:underline transition-colors"
                >
                  카카오 문의
                </a>
              </li>
              <li>
                <router-link
                  to="/order-lookup"
                  class="text-slate-700 dark:text-neutral-300 hover:text-indigo-800 dark:hover:text-indigo-400 hover:underline transition-colors"
                >
                  주문/배송 조회
                </router-link>
              </li>
              <li>{{ contact.hours }}</li>
              <li>{{ contact.lunch }}</li>
              <li>{{ contact.holidays }}</li>
            </ul>
          </div>
          <div>
            <h3 class="font-semibold text-slate-800 dark:text-white mb-3 pb-1 border-b border-slate-300/80 dark:border-slate-600/50 inline-block">
              배송/반품지 주소
            </h3>
            <p class="text-slate-700 dark:text-white/90 leading-relaxed">
              {{ address.line1 }}<br />
              {{ address.line2 }}
            </p>
          </div>
          <div>
            <h3 class="font-semibold text-slate-800 dark:text-white mb-3 pb-1 border-b border-slate-300/80 dark:border-slate-600/50 inline-block">
              계좌번호
            </h3>
            <ul class="space-y-1.5 text-slate-700 dark:text-white/90">
              <li>{{ bank.account }}</li>
              <li>예금주: {{ bank.holder }}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <div class="border-t border-slate-200/90 dark:border-white/12" />

    <div class="max-w-6xl mx-auto px-6 py-6">
      <div class="space-y-1 text-slate-600 dark:text-white/85 text-xs leading-relaxed">
        <p>{{ company.name }} | 대표자: {{ company.representative }}</p>
        <p>{{ company.address }}</p>
        <p>사업자등록번호: {{ company.bizNo }} | 통신판매신고번호: {{ company.mailOrderNo }}</p>
        <p>E-MAIL: {{ company.email }}</p>
        <p
          v-if="visitorStats"
          class="text-slate-500 dark:text-white/70"
        >
          오늘 {{ formatCount(visitorStats.today) }} · 누적 {{ formatCount(visitorStats.total) }}
        </p>
        <p class="text-slate-500 dark:text-white/70 pt-1">{{ company.copyright }}</p>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { onMounted } from "vue";
import { fetchVisitorStats } from "../../lib/analytics.js";
import BrandLogo from "@/components/brand/BrandLogo.vue";
import { BRAND_TAGLINE, BRAND_NAME } from "@/lib/brand.js";
import { getKakaoChatUrl } from "../../lib/kakaoChat.js";
import { visitorStats } from "../../lib/visitorStats.js";

function formatCount(value) {
  return Number(value || 0).toLocaleString("ko-KR");
}

onMounted(async () => {
  if (visitorStats.value) return;
  try {
    visitorStats.value = await fetchVisitorStats();
  } catch {
    visitorStats.value = null;
  }
});

const contact = {
  phone: "010-5599-8710",
  fax: "123-456-789",
  kakaoUrl: getKakaoChatUrl(import.meta.env.VITE_KAKAO_CHAT_URL),
  hours: "월~금요일 09:00 - 18:00",
  lunch: "점심시간 12:00 - 13:00",
  holidays: "토·일·공휴일 휴무",
};

const address = {
  line1: "경기도 수원시 권선구",
  line2: "",
};

const bank = {
  account: "123-789-456",
  holder: "김승태",
};

const company = {
  name: BRAND_NAME,
  representative: "김승태",
  address: "경기도 수원시",
  bizNo: "123-45-67890",
  mailOrderNo: "2026-수원권선-0001",
  email: "stkim8719@gmail.com",
  copyright: "COPYRIGHT © 2025 MY Shop. ALL RIGHTS RESERVED.",
};
</script>
