<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useCartStore } from "../../store/cart";
import { useWishlistStore } from "../../store/wishlist";
import { useAuthStore } from "../../store/auth";
import { storeToRefs } from "pinia";
import { ShoppingCart, Moon, Sun, Search, Heart, Megaphone, X, Menu } from "lucide-vue-next";
import api from "../../lib/api.js";
import { useTheme } from "@/composables/useTheme";
import BrandLogo from "@/components/brand/BrandLogo.vue";
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
const serverPopularSearches = ref([]);
const highlightedIndex = ref(-1);
const mobileMenuOpen = ref(false);

const closeMobileMenu = () => {
  mobileMenuOpen.value = false;
};

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value;
};

const toggleDarkMode = () => {
  toggleTheme();
};

watch(
  () => route.fullPath,
  () => {
    closeMobileMenu();
  }
);

watch(
  () => route.query.q,
  (q) => {
    headerSearch.value = (q || "").toString();
  },
  { immediate: true }
);

const onSearch = () => {
  const term = (headerSearch.value || "").toString().trim();
  if (term) {
    saveRecentSearch(term);
    trackPopularSearch(term);
    trackSearchOnServer(term);
  }
  searchDropdownOpen.value = false;
  router.push({
    path: "/products",
    query: term ? { q: term } : {},
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
  const fallback = ["백팩", "데님", "스니커즈", "티셔츠", "에어팟"];
  const fromServer = serverPopularSearches.value.filter(Boolean).slice(0, 5);
  if (fromServer.length >= 5) return fromServer;
  const tracked = Object.entries(popularSearchMap.value || {})
    .filter(([term]) => Boolean(term))
    .sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0))
    .map(([term]) => term)
    .filter((term) => !fromServer.includes(term))
    .slice(0, 5 - fromServer.length);
  const merged = [...fromServer, ...tracked];
  if (merged.length >= 5) return merged.slice(0, 5);
  const fromProducts = [...new Set(productSearchPool.value)]
    .filter((name) => !merged.includes(name))
    .slice(0, 5 - merged.length);
  const fromFallback = fallback
    .filter((name) => !merged.includes(name) && !fromProducts.includes(name))
    .slice(0, 5 - merged.length - fromProducts.length);
  return [...merged, ...fromProducts, ...fromFallback].slice(0, 5);
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

const trackSearchOnServer = async (term) => {
  const clean = term.trim();
  if (!clean) return;
  try {
    await api.post("/analytics/search-events", {
      searchTerm: clean,
      userId: auth.user?.id || null,
    });
  } catch (_) {
  }
};

const loadServerPopularSearches = async () => {
  try {
    const res = await api.get("/search/popular", { params: { limit: 8 } });
    const terms = Array.isArray(res.data?.terms) ? res.data.terms : [];
    serverPopularSearches.value = terms.map((item) => item.term).filter(Boolean);
  } catch (_) {
    serverPopularSearches.value = [];
  }
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

const goNavItem = (item) => {
  if (item.tab) {
    router.push({ path: "/products", query: { tab: item.tab } });
    return;
  }
  router.push({
    path: "/products",
    query: item.category === "전체" ? {} : { category: item.category },
  });
};

const isNavActive = (item) => {
  if (route.path !== "/products") return false;
  if (item.tab) return route.query.tab === item.tab;
  if (item.category === "전체") {
    return !route.query.category && !route.query.tab;
  }
  return route.query.category === item.category;
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
    const isDemoNotice = (notice) => /포트폴리오|데모/i.test(String(notice?.title || ""));
    bannerNotice.value = list.find((notice) => !isDemoNotice(notice)) || null;
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
  loadServerPopularSearches();
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

const topLinks = [
  { label: "찜", path: "/wishlist" },
  { label: "공지사항", path: "/notice" },
  { label: "주문/배송 조회", path: "/order-lookup" },
];

const defaultCategories = [
  "의류", "악세서리", "뷰티", "디지털/가전", "식품", "생활용품", "스포츠/레저",
  "취미/문구", "가구/인테리어", "유아동", "패션잡화", "기타",
];

const secondaryNavItems = computed(() => {
  const fixed = [
    { name: "베스트", tab: "best" },
    { name: "신상품", tab: "new" },
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
  <header class="sticky top-0 z-50 flex flex-col border-b border-default bg-surface-raised backdrop-blur-md supports-[backdrop-filter]:bg-surface-raised">
    <div
      v-if="bannerNotice && !bannerClosed"
      class="flex items-center gap-2 px-3 py-2 text-sm
             bg-surface-sunken text-primary border-b border-default"
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
        class="shrink-0 p-1 rounded-md hover:bg-surface-sunken
               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/50"
        aria-label="공지 배너 닫기"
        @click="dismissNoticeBanner"
      >
        <X class="w-4 h-4" />
      </button>
    </div>

    <div
      class="hidden sm:flex items-center justify-center gap-4 sm:gap-6 px-4 py-2 text-xs sm:text-sm leading-none
             overflow-x-auto no-scrollbar whitespace-nowrap
             bg-surface-base border-b border-default"
    >
      <template v-for="link in topLinks" :key="link.label">
        <router-link
          :to="link.path"
          class="header-utility-link inline-flex"
        >
          {{ link.label }}
        </router-link>
      </template>
    </div>

    <div
      class="flex flex-wrap sm:flex-nowrap justify-between items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3
             bg-surface-raised border-b border-default"
    >
      <BrandLogo size="md" link-to="/home" class="order-1 shrink-0 hover:opacity-95 transition" />

      <div class="relative order-3 basis-full sm:order-2 sm:basis-auto flex-1 max-w-xl mx-0 sm:mx-4 mt-1 sm:mt-0">
        <div
          class="flex items-center gap-2 px-3 py-2 rounded-md
                 bg-surface-base border border-default"
        >
          <Search class="w-4 h-4 text-neutral-500 dark:text-neutral-300 shrink-0" />
          <input
            v-model="headerSearch"
            type="search"
            placeholder="상품 검색 (예: 백팩, 데님)"
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
          class="absolute z-50 mt-2 w-full rounded-md border border-default bg-surface-raised p-3 shadow-sm"
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
                    ? 'bg-slate-200 text-slate-900 dark:bg-slate-600 dark:text-slate-50'
                    : 'bg-surface-sunken text-secondary hover:bg-slate-200/80 dark:hover:bg-slate-700/60'
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
          <Heart class="w-4.5 h-4.5" />
          <span
            v-if="wishlistCount > 0"
            class="absolute -top-2 -right-2 bg-slate-700 dark:bg-slate-200
                   text-white text-xs font-semibold rounded-full min-w-[1.25rem] h-5 flex items-center justify-center
                   dark:text-slate-900"
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
            class="absolute -top-2 -right-2 bg-slate-700 dark:bg-slate-200
                   text-white text-[11px] font-semibold rounded-full min-w-[1.25rem] h-5 flex items-center justify-center
                   dark:text-slate-900"
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

        <button
          type="button"
          @click="toggleMobileMenu"
          class="header-icon-btn sm:hidden"
          :aria-expanded="mobileMenuOpen"
          aria-controls="mobile-header-menu"
          aria-label="메뉴 열기"
        >
          <Menu class="w-5 h-5" />
        </button>

        <div v-if="auth.isLoggedIn" class="hidden sm:flex items-center gap-2">
          <span class="header-user-text hidden sm:inline">
            {{ auth.user?.name }}님
          </span>
          <router-link
            v-if="auth.user?.role === 'admin'"
            to="/admin"
            class="shop-btn-accent text-sm px-3 py-1.5 rounded-lg"
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
        class="category-glass-bar relative flex items-center gap-2 overflow-x-auto overflow-y-hidden px-3 sm:px-4 py-2
               bg-surface-base border-b border-default"
      >
      <button
        v-for="item in secondaryNavItems"
        :key="item.name + (item.tab || item.category || '')"
        type="button"
        :aria-pressed="isNavActive(item)"
        :aria-label="`${item.name} 보기`"
        @click="goNavItem(item)"
        :class="[
          'relative z-10 shrink-0 px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/50 focus-visible:ring-offset-2',
          isNavActive(item)
            ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-slate-900/20'
            : 'shop-btn-secondary'
        ]"
      >
        {{ item.name }}
      </button>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="mobileMenuOpen"
        class="fixed inset-0 z-[60] sm:hidden"
        role="dialog"
        aria-modal="true"
        aria-label="모바일 메뉴"
      >
        <button
          type="button"
          class="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
          aria-label="메뉴 닫기"
          @click="closeMobileMenu"
        />
        <div
          id="mobile-header-menu"
          class="absolute right-0 top-0 flex h-full w-[min(100%,18rem)] flex-col
                 border-l border-slate-200/80 bg-white shadow-2xl
                 dark:border-default dark:bg-surface-overlay"
        >
          <div class="flex items-center justify-between border-b border-slate-200/80 px-4 py-3 dark:border-slate-700/60">
            <span class="text-sm font-semibold text-slate-800 dark:text-slate-100">메뉴</span>
            <button
              type="button"
              class="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="메뉴 닫기"
              @click="closeMobileMenu"
            >
              <X class="h-5 w-5" />
            </button>
          </div>

          <div class="border-b border-slate-200/80 px-4 py-4 dark:border-slate-700/60">
            <template v-if="auth.isLoggedIn">
              <p class="mb-3 text-sm font-medium text-slate-700 dark:text-slate-200">{{ auth.user?.name }}님</p>
              <div class="flex flex-col gap-2">
                <router-link to="/mypage" class="mobile-menu-link" @click="closeMobileMenu">마이페이지</router-link>
                <router-link
                  v-if="auth.user?.role === 'admin'"
                  to="/admin"
                  class="mobile-menu-link"
                  @click="closeMobileMenu"
                >
                  관리자
                </router-link>
                <button type="button" class="mobile-menu-link text-left" @click="logout">로그아웃</button>
              </div>
            </template>
            <template v-else>
              <div class="flex flex-col gap-2">
                <router-link to="/login" class="shop-btn-primary rounded-xl px-4 py-2.5 text-center text-sm" @click="closeMobileMenu">
                  로그인
                </router-link>
                <router-link to="/signup" class="mobile-menu-link text-center" @click="closeMobileMenu">회원가입</router-link>
              </div>
            </template>
          </div>

          <nav class="flex-1 overflow-y-auto px-2 py-3" aria-label="바로가기">
            <router-link
              v-for="link in topLinks"
              :key="'mobile-' + link.label"
              :to="link.path"
              class="mobile-menu-link block"
              @click="closeMobileMenu"
            >
              {{ link.label }}
            </router-link>
          </nav>
        </div>
      </div>
    </Teleport>
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

.mobile-menu-link {
  @apply rounded-md px-3 py-2.5 text-sm font-medium text-secondary transition
         hover:bg-surface-sunken hover:text-primary;
}
</style>
