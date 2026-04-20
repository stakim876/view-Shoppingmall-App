<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useCartStore } from "../../store/cart";
import { useWishlistStore } from "../../store/wishlist";
import { useAuthStore } from "../../store/auth";
import { storeToRefs } from "pinia";
import { ShoppingCart, Moon, Sun, Search, Sparkles, Megaphone, X } from "lucide-vue-next";
import api from "../../lib/api.js";
import { getKakaoChatUrl } from "../../lib/kakaoChat.js";
import { useTheme } from "@/composables/useTheme";
const router = useRouter();
const route = useRoute();
const cart = useCartStore();
const wishlist = useWishlistStore();
const { totalItems } = storeToRefs(cart);
const wishlistCount = computed(() => wishlist.count);
const auth = useAuthStore();

const { isDark, toggleTheme, initTheme } = useTheme();
const headerSearch = ref("");
const searchDropdownOpen = ref(false);
const productSearchPool = ref([]);
const recentSearches = ref([]);
const recentSearchesKey = "myshop_recent_searches";
const popularSearchesKey = "myshop_popular_searches";
const popularSearchMap = ref({});
const highlightedIndex = ref(-1);

const toggleDarkMode = () => {
  toggleTheme();
};

watch(
  () => route.query.q,
  (q) => {
    headerSearch.value = (q || "").toString();
  },
  { immediate: true }
);

const onSearch = () => {
  const targetPath = route.path === "/products" ? "/products" : "/home";
  const term = (headerSearch.value || "").toString().trim();
  const q = term || undefined;
  const nextQuery = targetPath === "/home"
    ? { q, category: undefined }
    : { ...route.query, q };
  if (term) {
    saveRecentSearch(term);
    trackPopularSearch(term);
  }
  searchDropdownOpen.value = false;
  router.push({
    path: targetPath,
    query: nextQuery,
  });
};

const normalizeSearchText = (value) =>
  (value || "").toString().normalize("NFC").toLowerCase().trim();

const searchSuggestions = computed(() => {
  const q = normalizeSearchText(headerSearch.value);
  if (!q) return [];
  const unique = new Set();
  const matches = [];
  for (const name of productSearchPool.value) {
    const normalizedName = normalizeSearchText(name);
    if (!normalizedName.includes(q)) continue;
    if (unique.has(name)) continue;
    unique.add(name);
    matches.push(name);
    if (matches.length >= 6) break;
  }
  return matches;
});

const popularSearches = computed(() => {
  const fallback = ["에어팟", "맥북", "아이폰", "애플워치", "아이패드"];
  const tracked = Object.entries(popularSearchMap.value || {})
    .filter(([term]) => Boolean(term))
    .sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0))
    .map(([term]) => term)
    .slice(0, 5);
  if (tracked.length >= 5) return tracked;
  const fromProducts = [...new Set(productSearchPool.value)]
    .filter((name) => !tracked.includes(name))
    .slice(0, 5 - tracked.length);
  const fromFallback = fallback
    .filter((name) => !tracked.includes(name) && !fromProducts.includes(name))
    .slice(0, 5 - tracked.length - fromProducts.length);
  return [...tracked, ...fromProducts, ...fromFallback].slice(0, 5);
});

const dropdownItems = computed(() => {
  const items = [];
  for (const text of searchSuggestions.value) items.push({ type: "suggestion", text });
  for (const text of recentSearches.value) items.push({ type: "recent", text });
  if (!normalizeSearchText(headerSearch.value)) {
    for (const text of popularSearches.value) items.push({ type: "popular", text });
  }
  return items;
});

const showSearchDropdown = computed(() =>
  searchDropdownOpen.value && dropdownItems.value.length > 0
);

const saveRecentSearch = (term) => {
  const clean = term.trim();
  if (!clean) return;
  const deduped = [clean, ...recentSearches.value.filter((s) => s !== clean)].slice(0, 8);
  recentSearches.value = deduped;
  localStorage.setItem(recentSearchesKey, JSON.stringify(deduped));
};

const savePopularSearchMap = () => {
  localStorage.setItem(popularSearchesKey, JSON.stringify(popularSearchMap.value));
};

const trackPopularSearch = (term) => {
  const clean = term.trim();
  if (!clean) return;
  const current = Number(popularSearchMap.value[clean] || 0);
  popularSearchMap.value = {
    ...popularSearchMap.value,
    [clean]: current + 1,
  };
  savePopularSearchMap();
};

const removeRecentSearch = (term) => {
  recentSearches.value = recentSearches.value.filter((s) => s !== term);
  localStorage.setItem(recentSearchesKey, JSON.stringify(recentSearches.value));
};

const pickSuggestion = (term) => {
  headerSearch.value = term;
  onSearch();
};

const openSearchDropdown = () => {
  searchDropdownOpen.value = true;
  highlightedIndex.value = -1;
};

const closeSearchDropdown = () => {
  window.setTimeout(() => {
    searchDropdownOpen.value = false;
    highlightedIndex.value = -1;
  }, 120);
};

const moveHighlight = (direction) => {
  const total = dropdownItems.value.length;
  if (!total) return;
  if (highlightedIndex.value < 0) {
    highlightedIndex.value = direction > 0 ? 0 : total - 1;
    return;
  }
  highlightedIndex.value = (highlightedIndex.value + direction + total) % total;
};

const onSearchKeydown = (e) => {
  if (!showSearchDropdown.value) return;
  if (e.key === "ArrowDown") {
    e.preventDefault();
    moveHighlight(1);
    return;
  }
  if (e.key === "ArrowUp") {
    e.preventDefault();
    moveHighlight(-1);
    return;
  }
  if (e.key === "Escape") {
    e.preventDefault();
    searchDropdownOpen.value = false;
    highlightedIndex.value = -1;
    return;
  }
  if (e.key === "Enter" && highlightedIndex.value >= 0) {
    e.preventDefault();
    pickSuggestion(dropdownItems.value[highlightedIndex.value]?.text || "");
  }
};

watch([searchSuggestions, recentSearches, () => headerSearch.value], () => {
  if (!showSearchDropdown.value) return;
  const total = dropdownItems.value.length;
  if (total === 0) {
    highlightedIndex.value = -1;
  } else if (highlightedIndex.value >= total) {
    highlightedIndex.value = 0;
  }
});

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

const categoryList = ref([]);

const bannerNotice = ref(null);
const bannerClosed = ref(false);
const noticesUnsupportedKey = "notices_api_unsupported";

const loadNoticeBanner = async () => {
  if (localStorage.getItem(noticesUnsupportedKey) === "1") {
    bannerNotice.value = null;
    bannerClosed.value = true;
    return;
  }
  try {
    const res = await api.get("/notices", { params: { limit: 1 } });
    const list = res.data?.notices || [];
    bannerNotice.value = list[0] || null;
    const dismissed = localStorage.getItem("notice_banner_dismissed");
    bannerClosed.value =
      Boolean(bannerNotice.value) && dismissed === String(bannerNotice.value.id);
  } catch (err) {
    const status = err?.response?.status;
    if (status === 404) localStorage.setItem(noticesUnsupportedKey, "1");
    bannerNotice.value = null;
    bannerClosed.value = true;
  }
};

const dismissNoticeBanner = () => {
  if (bannerNotice.value) {
    localStorage.setItem("notice_banner_dismissed", String(bannerNotice.value.id));
  }
  bannerClosed.value = true;
};

onMounted(async () => {
  initTheme();
  headerSearch.value = (route.query.q || "").toString();
  try {
    const parsed = JSON.parse(localStorage.getItem(recentSearchesKey) || "[]");
    recentSearches.value = Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch (_) {
    recentSearches.value = [];
  }
  try {
    const parsed = JSON.parse(localStorage.getItem(popularSearchesKey) || "{}");
    popularSearchMap.value = parsed && typeof parsed === "object" ? parsed : {};
  } catch (_) {
    popularSearchMap.value = {};
  }
  if (auth.isLoggedIn) wishlist.fetchIds();
  loadNoticeBanner();
  try {
    const res = await api.get("/categories");
    categoryList.value = Array.isArray(res.data) ? res.data : [];
  } catch (_) {
    categoryList.value = [];
  }
  try {
    const res = await api.get("/products");
    const list = Array.isArray(res.data) ? res.data : [];
    productSearchPool.value = list
      .map((p) => (p?.name || "").toString().trim())
      .filter(Boolean);
  } catch (_) {
    productSearchPool.value = [];
  }
});

const logout = () => {
  auth.logout();
  localStorage.removeItem("user");
  localStorage.removeItem("token");
  window.location.href = "/login";
};

const kakaoChatUrl = import.meta.env.VITE_KAKAO_CHAT_URL?.trim() || "";
const openExternal = (url) => {
  window.open(getKakaoChatUrl(url), "_blank", "noopener,noreferrer");
};

const topLinks = [
  { label: "찜", path: "/wishlist" },
  { label: "공지사항", path: "/notice" },
  { label: "견적문의", path: "/home" },
  { label: "카카오 문의", external: true, url: kakaoChatUrl },
  { label: "주문/배송 조회", path: "/order-lookup" },
  { label: "구매후기", path: "/home" },
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
    <div
      v-if="bannerNotice && !bannerClosed"
      class="flex items-center gap-2 px-3 py-2 text-sm
             bg-emerald-50/95 dark:bg-emerald-950/75 text-emerald-950 dark:text-emerald-100
             border-b border-emerald-200/70 dark:border-emerald-800/45"
    >
      <Megaphone class="w-4 h-4 shrink-0 opacity-80" aria-hidden="true" />
      <router-link
        :to="{ path: '/notice', query: { id: String(bannerNotice.id) } }"
        class="flex-1 min-w-0 font-medium truncate hover:underline text-left"
      >
        {{ bannerNotice.title }}
      </router-link>
      <button
        type="button"
        class="shrink-0 p-1 rounded-md hover:bg-emerald-200/55 dark:hover:bg-emerald-900/45
               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        aria-label="공지 배너 닫기"
        @click="dismissNoticeBanner"
      >
        <X class="w-4 h-4" />
      </button>
    </div>

    <div
      class="flex items-center justify-start sm:justify-center gap-4 sm:gap-6 px-4 py-2.5 text-xs sm:text-sm leading-none
             overflow-x-auto no-scrollbar whitespace-nowrap
             bg-slate-50/95 dark:bg-slate-900
             border-b border-slate-200/70 dark:border-slate-700/55"
    >
      <template v-for="(link, idx) in topLinks" :key="link.label">
        <router-link
          v-if="!link.external"
          :to="link.path"
          class="header-utility-link"
          :class="idx >= 4 ? 'hidden sm:inline-flex' : 'inline-flex'"
        >
          {{ link.label }}
        </router-link>
        <a
          v-else
          href="#"
          @click.prevent="openExternal(link.url)"
          class="header-utility-link"
          :class="idx >= 4 ? 'hidden sm:inline-flex' : 'inline-flex'"
        >
          {{ link.label }}
        </a>
      </template>
    </div>

    <div
      class="flex flex-wrap sm:flex-nowrap justify-between items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3.5
             bg-gradient-to-b from-white to-slate-50/95 dark:from-zinc-950/98 dark:to-neutral-950/98
             border-b border-slate-200/80 dark:border-slate-700/55"
    >
      <router-link
        to="/home"
        aria-label="My Shop 홈으로 이동"
        class="order-1 flex items-center justify-start hover:opacity-90 transition shrink-0 overflow-visible h-14 sm:h-[4.25rem] md:h-[4.7rem] w-[min(48vw,16rem)] sm:w-[19rem] md:w-[21rem] rounded-md focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgba(16,185,129,0.38)]"
      >
        <img
          src="/images/0232cce0-e560-4609-9b38-37c5e6165205.png"
          alt=""
          role="presentation"
          class="block h-full w-full max-h-full object-contain object-left shrink-0 origin-left scale-[1.48] sm:scale-[1.42] md:scale-[1.5] opacity-95 drop-shadow-[0_2px_10px_rgba(148,163,184,0.18)]"
        />
      </router-link>

      <div class="relative order-3 basis-full sm:order-2 sm:basis-auto flex-1 max-w-xl mx-0 sm:mx-4 mt-1 sm:mt-0">
        <div
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl
                 bg-white dark:bg-zinc-950
                 border border-slate-200/80 dark:border-slate-700/55
                 shadow-[0_8px_20px_-16px_rgba(15,23,42,0.28)]"
        >
          <Search class="w-4 h-4 text-neutral-500 dark:text-neutral-300 shrink-0" />
          <input
            v-model="headerSearch"
            type="search"
            placeholder="상품 검색"
            aria-label="상품 검색"
            class="flex-1 bg-transparent text-neutral-800 dark:text-neutral-100
                   placeholder-neutral-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400/70 rounded-md text-sm"
            @focus="openSearchDropdown"
            @blur="closeSearchDropdown"
            @keydown="onSearchKeydown"
            @keyup.enter="onSearch"
          />
          <button
            type="button"
            @click="onSearch"
            class="text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-md px-1.5 py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400/70"
          >
            검색
          </button>
        </div>

        <div
          v-if="showSearchDropdown"
          class="absolute z-50 mt-2 w-full rounded-2xl border border-slate-200/85 dark:border-white/10 bg-white dark:bg-zinc-950 shadow-[0_16px_40px_-26px_rgba(15,23,42,0.38)] dark:shadow-[0_16px_40px_-26px_rgba(0,0,0,0.45)] p-3"
        >
          <div v-if="searchSuggestions.length > 0" class="mb-2">
            <p class="px-1 text-[11px] font-semibold tracking-wide text-neutral-500 dark:text-neutral-400">추천 검색어</p>
            <div class="mt-1 flex flex-wrap gap-1.5">
              <button
                v-for="(item, idx) in searchSuggestions"
                :key="'suggestion-' + item"
                type="button"
                :class="[
                  'rounded-full px-3 py-1.5 text-xs transition',
                  highlightedIndex === idx
                    ? 'bg-neutral-200 text-neutral-900 dark:bg-white/20 dark:text-neutral-100'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-white/5 dark:text-neutral-200 dark:hover:bg-white/10'
                ]"
                @mousedown.prevent="pickSuggestion(item)"
                @mouseenter="highlightedIndex = idx"
              >
                {{ item }}
              </button>
            </div>
          </div>

          <div v-if="recentSearches.length > 0">
            <p class="px-1 text-[11px] font-semibold tracking-wide text-neutral-500 dark:text-neutral-400">최근 검색</p>
            <div class="mt-1 flex flex-wrap gap-1.5">
              <span
                v-for="(item, recentIdx) in recentSearches"
                :key="'recent-' + item"
                :class="[
                  'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs',
                  highlightedIndex === searchSuggestions.length + recentIdx
                    ? 'bg-neutral-300 text-neutral-900 dark:bg-white/25 dark:text-white'
                    : 'bg-neutral-100 text-neutral-700 dark:bg-white/10 dark:text-neutral-200'
                ]"
                @mouseenter="highlightedIndex = searchSuggestions.length + recentIdx"
              >
                <button type="button" class="hover:underline" @mousedown.prevent="pickSuggestion(item)">
                  {{ item }}
                </button>
                <button
                  type="button"
                  class="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                  aria-label="최근 검색어 삭제"
                  @mousedown.prevent="removeRecentSearch(item)"
                >
                  ×
                </button>
              </span>
            </div>
          </div>

          <div v-if="!normalizeSearchText(headerSearch) && popularSearches.length > 0" class="mt-2">
            <p class="px-1 text-[11px] font-semibold tracking-wide text-neutral-500 dark:text-neutral-400">인기 검색</p>
            <div class="mt-1 flex flex-wrap gap-1.5">
              <button
                v-for="(item, popIdx) in popularSearches"
                :key="'popular-' + item"
                type="button"
                :class="[
                  'rounded-full px-3 py-1.5 text-xs transition',
                  highlightedIndex === searchSuggestions.length + recentSearches.length + popIdx
                    ? 'bg-emerald-200 text-emerald-950 dark:bg-emerald-400/30 dark:text-emerald-50'
                    : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 dark:bg-emerald-500/12 dark:text-emerald-200 dark:hover:bg-emerald-500/22'
                ]"
                @mousedown.prevent="pickSuggestion(item)"
                @mouseenter="highlightedIndex = searchSuggestions.length + recentSearches.length + popIdx"
              >
                {{ item }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="order-2 sm:order-3 ml-auto flex items-center gap-2 sm:gap-4 shrink-0">
        <router-link
          to="/wishlist"
          class="header-icon-btn"
          title="찜 목록"
          aria-label="찜 목록"
        >
          <Sparkles
            class="w-4.5 h-4.5"
            :class="{ 'header-wish-shimmer': wishlistCount > 0 }"
          />
          <span
            v-if="wishlistCount > 0"
            class="absolute -top-2 -right-2 bg-gradient-to-r from-neutral-700 to-neutral-500
                   text-white text-xs font-semibold rounded-full min-w-[1.25rem] h-5 flex items-center justify-center
                   shadow-[0_0_6px_rgba(0,0,0,0.25)]"
          >
            {{ wishlistCount }}
          </span>
        </router-link>
        <router-link
          to="/cart"
          class="header-icon-btn"
          title="장바구니"
          aria-label="장바구니"
        >
          <ShoppingCart
            class="w-5 h-5 text-black dark:text-white"
          />
          <span
            v-if="totalItems > 0"
            class="absolute -top-2 -right-2 bg-gradient-to-r from-slate-700 to-slate-500 dark:from-slate-100 dark:to-white
                   text-white text-[11px] font-semibold rounded-full min-w-[1.25rem] h-5 flex items-center justify-center
                   dark:text-slate-900 shadow-[0_0_6px_rgba(0,0,0,0.25)]"
          >
            {{ totalItems }}
          </span>
        </router-link>

        <button
          type="button"
          @click="toggleDarkMode"
          class="header-theme-btn"
          title="테마 전환"
          :aria-pressed="isDark"
          aria-label="테마 전환 (라이트/다크)"
        >
          <Moon
            v-if="!isDark"
            class="w-6 h-6 transition"
          />
          <Sun
            v-else
            class="w-6 h-6 text-yellow-500 dark:text-yellow-300 transition"
          />
        </button>

        <div v-if="auth.isLoggedIn" class="hidden sm:flex items-center gap-2">
          <span class="header-user-text hidden sm:inline">
            {{ auth.user?.name }}님
          </span>
          <router-link
            v-if="auth.user?.role === 'admin'"
            to="/admin"
            class="text-sm bg-gradient-to-r from-green-500 to-emerald-400 text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
          >
            관리자
          </router-link>
          <router-link
            to="/mypage"
            class="header-user-link"
          >
            마이페이지
          </router-link>
          <button
            type="button"
            @click="logout"
            class="header-user-text-link"
          >
            로그아웃
          </button>
        </div>

        <div v-else class="hidden sm:flex items-center gap-2">
          <router-link
            to="/signup"
            class="text-sm text-neutral-700 dark:text-slate-100 hover:text-neutral-900 dark:hover:text-white rounded px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
          >
            회원가입
          </router-link>
          <router-link
            to="/login"
            class="shop-btn-primary text-sm inline-flex items-center justify-center px-4 py-2 rounded-lg"
          >
            로그인
          </router-link>
        </div>
      </div>
    </div>

    <div class="group/cat w-full">
      <div
        class="category-glass-bar relative flex items-center gap-2 overflow-x-auto overflow-y-hidden px-4 py-3 no-scrollbar
               bg-slate-50/95 dark:bg-zinc-950/95
               border-b border-slate-200/80 dark:border-slate-700/55
               shadow-[0_10px_26px_-22px_rgba(15,23,42,0.34)]
               transition-all duration-300 ease-out
               group-hover/cat:bg-white dark:group-hover/cat:bg-zinc-900
               group-hover/cat:border-slate-300/80 dark:group-hover/cat:border-slate-600/55"
      >
      <button
        v-for="item in secondaryNavItems"
        :key="item.name + (item.emoji || '')"
        type="button"
        :aria-pressed="isCategoryActive(item)"
        :aria-label="`${item.name} 카테고리 보기`"
        @click="goCategory(item.category)"
        :class="[
          'relative z-10 shrink-0 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900',
          isCategoryActive(item)
            ? 'shop-btn-primary text-white dark:text-white border-emerald-900/25'
            : 'shop-btn-secondary'
        ]"
      >
        {{ item.name }}{{ item.emoji ? ` ${item.emoji}` : "" }}
      </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

@keyframes header-wish-shimmer {
  0%, 100% {
    transform: scale(1);
    filter: drop-shadow(0 0 0 rgba(148, 163, 184, 0));
  }
  50% {
    transform: scale(1.06);
    filter: drop-shadow(0 0 5px rgba(148, 163, 184, 0.22));
  }
}

.header-wish-shimmer {
  animation: header-wish-shimmer 2.2s ease-in-out infinite;
}

:global(.dark) .header-wish-shimmer {
  animation-name: header-wish-shimmer-dark;
  animation-duration: 2.8s;
}

@keyframes header-wish-shimmer-dark {
  0%, 100% {
    transform: scale(1);
    filter: drop-shadow(0 0 0 rgba(148, 163, 184, 0));
  }
  50% {
    transform: scale(1.05);
    filter: drop-shadow(0 0 4px rgba(148, 163, 184, 0.18));
  }
}

@media (prefers-reduced-motion: reduce) {
  .header-wish-shimmer {
    animation: none;
  }
}
</style>
