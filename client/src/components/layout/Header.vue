<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useCartStore } from "../../store/cart";
import { useWishlistStore } from "../../store/wishlist";
import { useAuthStore } from "../../store/auth";
import { storeToRefs } from "pinia";
import { ShoppingCart, Moon, Sun, Search, Heart } from "lucide-vue-next";
import api from "../../lib/api.js";
const router = useRouter();
const route = useRoute();
const cart = useCartStore();
const wishlist = useWishlistStore();
const { totalItems } = storeToRefs(cart);
const wishlistCount = computed(() => wishlist.count);
const auth = useAuthStore();

const isDark = ref(false);
const headerSearch = ref("");

const toggleDarkMode = () => {
  isDark.value = !isDark.value;
  document.documentElement.classList.toggle("dark", isDark.value);
  localStorage.setItem("theme", isDark.value ? "dark" : "light");
};

// 라우트 쿼리와 검색어 동기화
watch(
  () => route.query.q,
  (q) => {
    headerSearch.value = q || "";
  },
  { immediate: true }
);

const onSearch = () => {
  router.push({
    path: "/home",
    query: { ...route.query, q: headerSearch.value?.trim() || undefined },
  });
};

const goCategory = (category) => {
  router.push({
    path: "/home",
    query: { ...route.query, category: category === "전체" ? undefined : category },
  });
};

const currentCategory = () => route.query.category || "전체";
const isCategoryActive = (item) => {
  const cur = currentCategory();
  if (cur !== item.category) return false;
  if (cur === "전체") return item.name === "전체";
  return true;
};

// 실제 등록된 상품 기준 카테고리 (API에서 로드)
const categoryList = ref([]);

onMounted(async () => {
  isDark.value = localStorage.getItem("theme") === "dark";
  document.documentElement.classList.toggle("dark", isDark.value);
  headerSearch.value = route.query.q || "";
  if (auth.isLoggedIn) wishlist.fetchIds();
  try {
    const res = await api.get("/categories");
    categoryList.value = Array.isArray(res.data) ? res.data : [];
  } catch (_) {
    categoryList.value = [];
  }
});

const logout = () => {
  auth.logout();
  localStorage.removeItem("user");
  localStorage.removeItem("token");
  window.location.href = "/login";
};

const topLinks = [
  { label: "찜", path: "/wishlist" },
  { label: "공지사항", path: "/notice" },
  { label: "견적문의", path: "/home" },
  { label: "카카오 문의", external: true, url: "https://pf.kakao.com/_xXXXXX/chat" },
  { label: "주문/배송 조회", path: "/order-lookup" },
  { label: "구매후기", path: "/home" },
  { label: "개인결제창", path: "/home" },
];

const defaultCategories = [
  "의류", "악세서리", "뷰티", "디지털/가전", "식품", "생활용품", "스포츠/레저",
  "취미/문구", "가구/인테리어", "유아동", "패션잡화", "기타",
];

const secondaryNavItems = computed(() => {
  const fixed = [
    { name: "신상품", emoji: "✨", category: "전체" },
    { name: "베스트", emoji: "🏆", category: "전체" },
    { name: "상시할인", category: "전체" },
  ];
  const fromApi = categoryList.value && categoryList.value.length > 0
    ? categoryList.value
    : defaultCategories;
  const fromProducts = fromApi.map((c) => ({ name: c, category: c }));
  const allItem = { name: "전체", category: "전체" };
  return [...fixed, ...fromProducts, allItem];
});
</script>

<template>
  <header class="sticky top-0 z-50 flex flex-col shadow-[0_8px_32px_rgba(31,38,135,0.12)]">
    <!-- 상단 유틸 바 (유리감 유지) -->
    <div
      class="flex items-center justify-center gap-6 px-4 py-2 text-sm
             bg-indigo-500/20 dark:bg-indigo-900/30 backdrop-blur-md
             border-b border-white/20 dark:border-indigo-400/10"
    >
      <template v-for="link in topLinks" :key="link.label">
        <router-link
          v-if="!link.external"
          :to="link.path"
          class="text-neutral-700 dark:text-neutral-300 hover:text-indigo-600 dark:hover:text-indigo-300 transition"
        >
          {{ link.label }}
        </router-link>
        <a
          v-else
          :href="link.url"
          target="_blank"
          rel="noopener noreferrer"
          class="text-neutral-700 dark:text-neutral-300 hover:text-indigo-600 dark:hover:text-indigo-300 transition"
        >
          {{ link.label }}
        </a>
      </template>
    </div>

    <!-- 메인 헤더: 로고 | 검색(중앙) | 장바구니·로그인 -->
    <div
      class="flex justify-between items-center gap-4 px-4 sm:px-6 py-3
             bg-white/50 dark:bg-[#0f172a]/70 backdrop-blur-xl
             border-b border-white/30 dark:border-indigo-400/10"
    >
      <router-link
        to="/home"
        class="flex items-center hover:opacity-90 transition shrink-0"
      >
        <img
          src="/images/e5dc74d2-42c2-41cf-9dba-7eb9114fcbf9.png"
          alt="제이 제이 패키지"
          class="h-14 w-auto sm:h-16 sm:w-auto md:h-20 md:w-auto object-contain object-left drop-shadow-md"
        />
      </router-link>

      <!-- 중앙 검색 (유리 스타일) -->
      <div
        class="flex-1 max-w-xl mx-4 flex items-center gap-2 px-4 py-2.5 rounded-full
               bg-white/40 dark:bg-white/10 backdrop-blur-xl
               border border-white/50 dark:border-indigo-400/20
               shadow-[inset_0_1px_2px_rgba(255,255,255,0.5),_0_4px_16px_rgba(0,0,0,0.06)]"
      >
        <Search class="w-4 h-4 text-indigo-500 dark:text-indigo-400 shrink-0" />
        <input
          v-model="headerSearch"
          type="text"
          placeholder="상품 검색"
          class="flex-1 bg-transparent text-neutral-800 dark:text-neutral-100
                 placeholder-neutral-400 focus:outline-none text-sm"
          @keyup.enter="onSearch"
        />
        <button
          @click="onSearch"
          class="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
        >
          검색
        </button>
      </div>

      <div class="flex items-center gap-3 sm:gap-4 shrink-0">
        <router-link
          to="/wishlist"
          class="relative hover:scale-110 transition-transform"
          title="찜 목록"
        >
          <Heart
            class="w-6 h-6 text-rose-500 dark:text-rose-400
                   drop-shadow-[0_0_4px_rgba(244,63,94,0.3)]
                   hover:text-rose-600 dark:hover:text-rose-300 transition"
          />
          <span
            v-if="wishlistCount > 0"
            class="absolute -top-2 -right-2 bg-gradient-to-r from-rose-500 to-pink-500
                   text-white text-xs font-semibold rounded-full min-w-[1.25rem] h-5 flex items-center justify-center
                   shadow-[0_0_6px_rgba(0,0,0,0.25)]"
          >
            {{ wishlistCount }}
          </span>
        </router-link>
        <router-link
          to="/cart"
          class="relative hover:scale-110 transition-transform"
          title="장바구니"
        >
          <ShoppingCart
            class="w-6 h-6 text-indigo-500 dark:text-sky-300
                   drop-shadow-[0_0_4px_rgba(100,120,200,0.3)]
                   hover:text-sky-500 dark:hover:text-sky-200 transition"
          />
          <span
            v-if="totalItems > 0"
            class="absolute -top-2 -right-2 bg-gradient-to-r from-indigo-500 to-sky-500
                   text-white text-xs font-semibold rounded-full min-w-[1.25rem] h-5 flex items-center justify-center
                   shadow-[0_0_6px_rgba(0,0,0,0.25)]"
          >
            {{ totalItems }}
          </span>
        </router-link>

        <button
          @click="toggleDarkMode"
          class="cursor-pointer hover:scale-110 transition-transform"
          title="테마 전환"
        >
          <Moon
            v-if="!isDark"
            class="w-6 h-6 text-indigo-500 drop-shadow-[0_0_4px_rgba(100,120,200,0.3)]
                   hover:text-sky-500 transition"
          />
          <Sun
            v-else
            class="w-6 h-6 text-amber-400 drop-shadow-[0_0_4px_rgba(255,210,100,0.4)]
                   hover:text-yellow-300 transition"
          />
        </button>

        <div v-if="auth.isLoggedIn" class="flex items-center gap-2">
          <span class="text-gray-800 dark:text-white/90 text-sm font-medium hidden sm:inline">
            {{ auth.user?.name }}님
          </span>
          <router-link
            v-if="auth.user?.role === 'admin'"
            to="/admin"
            class="text-sm bg-gradient-to-r from-green-500 to-emerald-400 text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition"
          >
            관리자
          </router-link>
          <router-link
            to="/mypage"
            class="text-sm bg-white/60 dark:bg-white/20 text-gray-800 dark:text-white px-3 py-1.5 rounded-lg hover:bg-white/80 transition"
          >
            마이페이지
          </router-link>
          <button
            @click="logout"
            class="text-sm text-gray-600 dark:text-neutral-300 hover:underline"
          >
            로그아웃
          </button>
        </div>

        <div v-else class="flex items-center gap-2">
          <router-link
            to="/signup"
            class="text-sm text-neutral-600 dark:text-neutral-400 hover:text-indigo-600"
          >
            회원가입
          </router-link>
          <router-link
            to="/login"
            class="text-sm px-4 py-2 rounded-lg text-white
                   bg-gradient-to-r from-indigo-400 to-sky-400 hover:opacity-90 transition"
          >
            로그인
          </router-link>
        </div>
      </div>
    </div>

    <!-- 2단 네비: 카테고리 바 (글래스 스타일) -->
    <div class="group/cat w-full">
      <div
        class="category-glass-bar relative flex items-center gap-2 overflow-x-auto overflow-y-hidden px-4 py-3 no-scrollbar
               bg-white/25 dark:bg-[#0f1020]/35
               backdrop-blur-2xl
               border-b border-white/30 dark:border-indigo-400/20
               shadow-[inset_0_1px_0_rgba(255,255,255,0.85),inset_0_2px_4px_rgba(255,255,255,0.2),inset_0_-1px_0_rgba(0,0,0,0.04),0_4px_20px_rgba(0,0,0,0.06)]
               dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-1px_0_rgba(0,0,0,0.1),0_4px_24px_rgba(0,0,0,0.2)]
               transition-all duration-300 ease-out
               group-hover/cat:bg-white/40 dark:group-hover/cat:bg-[#0f1020]/45
               group-hover/cat:backdrop-blur-3xl
               group-hover/cat:border-white/50 dark:group-hover/cat:border-indigo-400/25
               group-hover/cat:shadow-[inset_0_1px_0_rgba(255,255,255,0.95),inset_0_3px_12px_rgba(255,255,255,0.35),inset_0_-1px_0_rgba(0,0,0,0.05),0_8px_32px_rgba(0,0,0,0.08)]"
      >
      <button
        v-for="item in secondaryNavItems"
        :key="item.name + (item.emoji || '')"
        @click="goCategory(item.category)"
        :class="[
          'relative z-10 shrink-0 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 backdrop-blur-md active:scale-[0.97]',
          isCategoryActive(item)
            ? 'bg-gradient-to-r from-blue-600 to-indigo-500 text-white border-transparent shadow-[0_2px_8px_rgba(79,70,229,0.35)]'
            : 'bg-white/50 dark:bg-white/5 border border-indigo-200/60 dark:border-indigo-400/25 text-neutral-700 dark:text-neutral-200 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),_0_1px_3px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.1),_0_1px_4px_rgba(0,0,0,0.15)] hover:bg-white/80 dark:hover:bg-white/10 hover:border-indigo-300 dark:hover:border-indigo-400/40'
        ]"
      >
        {{ item.name }}{{ item.emoji ? ` ${item.emoji}` : "" }}
      </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
/* 글래스 바: 위쪽 하이라이트 */
.category-glass-bar::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.6) 0%,
    rgba(255, 255, 255, 0.35) 12%,
    rgba(255, 255, 255, 0.12) 30%,
    transparent 55%
  );
}
/* 호버 시 하이라이트 강화 */
.category-glass-bar:hover::before,
:global(.group\/cat:hover) .category-glass-bar::before {
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.75) 0%,
    rgba(255, 255, 255, 0.4) 15%,
    rgba(255, 255, 255, 0.15) 35%,
    transparent 60%
  );
}
:global(.dark) .category-glass-bar::before {
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.2) 0%,
    rgba(255, 255, 255, 0.08) 20%,
    transparent 50%
  );
}
:global(.dark) .category-glass-bar:hover::before,
:global(.dark) :global(.group\/cat:hover) .category-glass-bar::before {
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.28) 0%,
    rgba(255, 255, 255, 0.1) 25%,
    transparent 55%
  );
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
