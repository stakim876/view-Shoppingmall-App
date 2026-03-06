<template>
  <footer
    class="text-sm
           bg-gradient-to-b from-[#d3dae4] to-[#c0c8d4]
           dark:from-[#141826] dark:to-[#0d1020]
           border-t border-[#c0c8d4] dark:border-neutral-700/80"
  >
    <div class="max-w-6xl mx-auto px-6 py-10">
      <div class="flex flex-col lg:flex-row gap-8 lg:gap-12">
        
        <div class="flex-shrink-0 flex flex-col items-start gap-2">
          <router-link to="/home" class="flex items-center hover:opacity-90 transition opacity-95">
            <img src="/images/e5dc74d2-42c2-41cf-9dba-7eb9114fcbf9.png" alt="Myshop" class="h-16 w-auto sm:h-20 sm:w-auto object-contain" />
          </router-link>
          <p class="text-neutral-600 dark:text-white/80 text-xs max-w-[200px]">
            {{ slogan }}
          </p>
        </div>

        <div class="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <div>
            <h3 class="font-semibold text-neutral-800 dark:text-white mb-3 pb-1 border-b border-neutral-400/60 dark:border-white/30 inline-block">
              고객센터
            </h3>
            <ul class="space-y-1.5 text-neutral-700 dark:text-white/90">
              <li>전화:010-5599-8710 {{ contact.phone }}</li>
              <li>팩스: {{ contact.fax }}</li>
              <li>
                <a
                  :href="contact.kakaoUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-indigo-600 dark:text-indigo-300 hover:underline"
                >
                  카카오 문의
                </a>
              </li>
              <li>
                <router-link to="/order-lookup" class="text-indigo-600 dark:text-indigo-300 hover:underline">
                  주문/배송 조회
                </router-link>
              </li>
              <li>{{ contact.hours }}</li>
              <li>{{ contact.lunch }}</li>
              <li>{{ contact.holidays }}</li>
            </ul>
          </div>
          <div>
            <h3 class="font-semibold text-neutral-800 dark:text-white mb-3 pb-1 border-b border-neutral-400/60 dark:border-white/30 inline-block">
              배송/반품지 주소
            </h3>
            <p class="text-neutral-700 dark:text-white/90 leading-relaxed">
              {{ address.line1 }}<br />
              {{ address.line2 }}
            </p>
          </div>
          <div>
            <h3 class="font-semibold text-neutral-800 dark:text-white mb-3 pb-1 border-b border-neutral-400/60 dark:border-white/30 inline-block">
              계좌번호
            </h3>
            <ul class="space-y-1.5 text-neutral-700 dark:text-white/90">
              <li>{{ bank.account }}</li>
              <li>예금주: {{ bank.holder }}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <div class="border-t border-neutral-300/80 dark:border-white/15" />

    <div class="max-w-6xl mx-auto px-6 py-6">
      <div class="space-y-1 text-neutral-600 dark:text-white/85 text-xs leading-relaxed">
        <p>{{ company.name }} | 대표자: {{ company.representative }}</p>
        <p>{{ company.address }}</p>
        <p>사업자등록번호: {{ company.bizNo }} | 통신판매신고번호: {{ company.mailOrderNo }}</p>
        <p>E-MAIL: {{ company.email }}</p>
        <p class="text-neutral-500 dark:text-white/70 pt-1">{{ company.copyright }}</p>
      </div>
    </div>
  </footer>
</template>

<script setup>
const slogan = "세련 된 선택 ";

const contact = {
  phone: "",
  fax: "",
  kakaoUrl: "https://pf.kakao.com/_xXXXXX/chat",
  hours: "월~금요일 09:00 - 18:00",
  lunch: "점심시간 12:00 - 13:00",
  holidays: "토·일·공휴일 휴무",
};

const address = {
  line1: "경기도 수원시 권선구",
  line2: "",
};

const bank = {
  account: "-",
  holder: "-",
};

const company = {
  name: "My Shop",
  representative: "김승태",
  address: "경기도 수원시",
  bizNo: "123-456-789",
  mailOrderNo: "-",
  email: "-",
  copyright: "COPYRIGHT © 2025 MY Shop. ALL RIGHTS RESERVED.",
};
</script>
