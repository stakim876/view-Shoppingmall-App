<template>
  <div
    class="relative min-h-screen bg-slate-50 dark:bg-[#0c0f16]
           text-slate-700 dark:text-slate-200
           font-sans transition-colors duration-500"
  >
    <div class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div
        class="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(99, 102, 241,0.08),transparent_55%)] dark:bg-[radial-gradient(ellipse_70%_40%_at_50%_0%,rgba(99, 102, 241,0.05),transparent_50%)]"
      />
    </div>

    <div class="relative z-10">
      <div class="home-grid-bg pointer-events-none absolute inset-0" aria-hidden="true" />

      <div class="relative mx-auto max-w-7xl px-4 sm:px-6 pt-6 pb-4">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p class="text-[10px] font-bold uppercase tracking-[0.32em] text-indigo-600 dark:text-indigo-400">
              Portfolio Demo
            </p>
            <h1 class="mt-1 text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              AI가 골라주는 쇼핑 경험
            </h1>
            <p v-if="!loading" class="mt-1 text-sm text-slate-500 dark:text-slate-400">
              등록 상품 <span class="font-semibold tabular-nums text-indigo-700 dark:text-indigo-400">{{ catalogTotal }}</span>개
            </p>
          </div>
          <div
            class="inline-flex self-start rounded-xl border border-slate-200/80 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/60 p-1 shadow-sm"
            role="tablist"
            aria-label="홈 화면 섹션"
          >
            <button
              type="button"
              role="tab"
              :aria-selected="homeSection === 'curate'"
              class="home-mode-tab"
              :class="homeSection === 'curate' ? 'home-mode-tab--active' : ''"
              @click="scrollToCurator"
            >
              큐레이션
            </button>
            <button
              type="button"
              role="tab"
              :aria-selected="homeSection === 'catalog'"
              class="home-mode-tab"
              :class="homeSection === 'catalog' ? 'home-mode-tab--active' : ''"
              @click="scrollToCatalog"
            >
              카탈로그
            </button>
          </div>
        </div>
      </div>

      <!-- AI 큐레이터 -->
      <section
        id="home-curator"
        class="relative mx-auto max-w-7xl px-4 sm:px-6 pb-10 scroll-mt-24"
        aria-labelledby="curator-heading"
      >
        <h2 id="curator-heading" class="sr-only">AI 큐레이터</h2>
        <div class="curate-split">
          <aside class="curator-panel">
            <div class="curator-panel-head">
              <div class="curator-avatar" aria-hidden="true">AI</div>
              <div>
                <p class="text-sm font-semibold text-slate-900 dark:text-white">Curator</p>
                <p class="text-xs text-slate-500 dark:text-slate-400">등록 상품만 · 이유와 함께 추천</p>
              </div>
              <span
                class="ml-auto inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                :class="aiRecommendLoading ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200' : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200'"
              >
                <span
                  class="h-1.5 w-1.5 rounded-full"
                  :class="aiRecommendLoading ? 'bg-amber-500 animate-pulse' : 'bg-indigo-500'"
                />
                {{ aiRecommendLoading ? "분석 중" : "대기" }}
              </span>
            </div>

            <ol class="curator-flow-mini">
              <li>조건 입력</li>
              <li aria-hidden="true">→</li>
              <li>AI 해석</li>
              <li aria-hidden="true">→</li>
              <li>추천 · 구매</li>
            </ol>

            <label for="ai-curator-prompt" class="text-xs font-medium text-slate-600 dark:text-slate-400">
              무엇을 찾고 계세요?
            </label>
            <textarea
              id="ai-curator-prompt"
              v-model.trim="aiRecommendPrompt"
              rows="3"
              :placeholder="rotatingPlaceholder"
              class="curator-input mt-1.5"
              @keydown.enter.exact.prevent="requestAiRecommendation"
            />
            <button
              type="button"
              class="shop-btn-ai mt-3 w-full py-3 rounded-xl text-sm font-semibold disabled:opacity-60"
              :disabled="aiRecommendLoading || !aiRecommendPrompt"
              @click="requestAiRecommendation"
            >
              {{ aiRecommendLoading ? aiLoadingLabel : "추천 받기" }}
            </button>

            <div class="mt-3 flex flex-wrap gap-1.5">
              <button
                v-for="suggestion in aiPromptSuggestions"
                :key="suggestion"
                type="button"
                class="curator-chip"
                :disabled="aiRecommendLoading"
                @click="applyAiSuggestion(suggestion)"
              >
                {{ suggestion }}
              </button>
            </div>

            <div v-if="intentTags.length > 0" class="mt-4 pt-4 border-t border-slate-200/70 dark:border-slate-700/50">
              <p class="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                해석된 조건
              </p>
              <div class="flex flex-wrap gap-1.5">
                <span
                  v-for="(tag, i) in intentTags"
                  :key="`tag-${i}`"
                  class="intent-tag"
                  :class="`intent-tag--${tag.type}`"
                >
                  {{ tag.label }}
                </span>
              </div>
            </div>

            <p v-if="aiRecommendError" class="mt-3 text-sm text-red-500">{{ aiRecommendError }}</p>

            <p class="mt-6 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              전체 상품은 아래
              <button type="button" class="text-indigo-700 dark:text-indigo-400 underline underline-offset-2" @click="scrollToCatalog">
                카탈로그
              </button>
              에서 바로 확인할 수 있어요.
            </p>
          </aside>

          <div class="curator-canvas">
            <!-- 로딩 -->
            <div v-if="aiRecommendLoading" class="curator-canvas-inner">
              <div class="curator-loading">
                <div class="curator-loading-bar" />
                <p class="mt-4 text-sm font-medium text-slate-700 dark:text-slate-200">{{ aiLoadingLabel }}</p>
                <ul class="mt-3 space-y-2 text-xs text-slate-500 dark:text-slate-400">
                  <li
                    v-for="(phase, idx) in aiLoadingPhases"
                    :key="phase"
                    :class="idx <= aiLoadingPhase ? 'text-indigo-700 dark:text-indigo-300 font-medium' : ''"
                  >
                    {{ idx <= aiLoadingPhase ? "✓" : "○" }} {{ phase }}
                  </li>
                </ul>
              </div>
            </div>

            <!-- 결과 -->
            <div v-else-if="aiRecommendedProducts.length > 0" class="curator-canvas-inner">
              <div class="flex flex-wrap items-start justify-between gap-3 mb-5">
                <div>
                  <p class="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    추천 결과
                  </p>
                  <p v-if="aiRecommendSummary" class="mt-2 text-sm text-slate-700 dark:text-slate-300 leading-relaxed max-w-xl">
                    {{ aiRecommendSummary }}
                  </p>
                </div>
                <span class="text-xs tabular-nums text-slate-500 dark:text-slate-400 shrink-0">
                  {{ aiRecommendedProducts.length }}건
                </span>
              </div>
              <div class="curator-results">
                <article
                  v-for="(p, rank) in aiRecommendedProducts"
                  :key="`ai-rec-${p.id}`"
                  class="curator-result-card"
                >
                  <span class="curator-rank" aria-label="추천 순위">{{ rank + 1 }}</span>
                  <button type="button" class="flex-1 min-w-0 text-left" @click="openAiRecommendedProduct(p)">
                    <div class="curator-result-media">
                      <img :src="imgSrc(p)" :alt="p.name" class="h-full w-full object-contain" @error="onImgError" />
                    </div>
                    <h3 class="mt-3 font-semibold text-sm text-slate-900 dark:text-white line-clamp-2 leading-snug">
                      {{ p.name }}
                    </h3>
                    <p class="mt-1 text-base font-bold tabular-nums text-indigo-700 dark:text-indigo-400">
                      {{ formatPrice(p.price) }}원
                    </p>
                  </button>
                  <ul v-if="p.reasons?.length" class="mt-2 space-y-1">
                    <li
                      v-for="(reason, idx) in p.reasons"
                      :key="`reason-${p.id}-${idx}`"
                      class="curator-reason"
                    >
                      {{ reason }}
                    </li>
                  </ul>
                  <button type="button" class="mt-3 shop-btn-cart py-2 text-sm w-full" @click="addAiRecommendedToCart(p)">
                    장바구니
                  </button>
                </article>
              </div>
            </div>

            <!-- idle: 예시 대화 -->
            <div v-else class="curator-canvas-inner">
              <p class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">
                이렇게 사용해 보세요
              </p>
              <div class="curator-demo-thread space-y-4">
                <div v-for="(demo, i) in demoThreads" :key="`demo-${i}`" class="curator-demo-block">
                  <div class="curator-bubble curator-bubble--user">{{ demo.prompt }}</div>
                  <div class="curator-bubble curator-bubble--ai">{{ demo.reply }}</div>
                </div>
              </div>
              <p class="mt-8 text-center text-xs text-slate-400 dark:text-slate-500">
                왼쪽에 조건을 입력하면 이 영역에 맞춤 추천이 표시됩니다
              </p>
            </div>

            <div
              v-if="personalizedProducts.length > 0 && !aiRecommendLoading && aiRecommendedProducts.length === 0"
              class="mt-8 pt-6 border-t border-slate-200/60 dark:border-slate-700/50"
            >
              <p class="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">맞춤 추천</p>
              <p class="text-[11px] text-slate-400 dark:text-slate-500 mb-3">{{ personalizedSummary }}</p>
              <div class="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
                <button
                  v-for="p in personalizedProducts"
                  :key="`personal-${p.id}`"
                  type="button"
                  class="recent-mini-card shrink-0 w-28"
                  @click="goDetail(p.id)"
                >
                  <img :src="imgSrc(p)" :alt="p.name" class="h-12 w-12 object-contain mx-auto" @error="onImgError" />
                  <span class="text-[11px] font-medium line-clamp-2 text-left">{{ p.name }}</span>
                  <span class="text-[10px] text-indigo-600 dark:text-indigo-400">{{ p.reason }}</span>
                </button>
              </div>
            </div>

            <div
              v-if="recentlyViewed.length > 0 && !aiRecommendLoading && aiRecommendedProducts.length === 0"
              class="mt-8 pt-6 border-t border-slate-200/60 dark:border-slate-700/50"
            >
              <p class="text-xs font-medium text-slate-500 dark:text-slate-400 mb-3">최근 본 상품</p>
              <div class="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
                <button
                  v-for="p in recentlyViewed.slice(0, 5)"
                  :key="`recent-${p.id}`"
                  type="button"
                  class="recent-mini-card shrink-0"
                  @click="goDetail(p.id)"
                >
                  <img :src="imgSrc(p)" :alt="p.name" class="h-12 w-12 object-contain" @error="onImgError" />
                  <span class="text-[11px] font-medium line-clamp-2 text-left">{{ p.name }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <p class="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
          <router-link to="/notice" class="hover:text-indigo-700 dark:hover:text-indigo-400 underline-offset-4 hover:underline">
            공지사항
          </router-link>
          <span class="mx-2 text-slate-300 dark:text-slate-600" aria-hidden="true">·</span>
          <router-link to="/order-lookup" class="hover:text-indigo-700 dark:hover:text-indigo-400 underline-offset-4 hover:underline">
            주문 조회
          </router-link>
        </p>
      </section>

      <!-- 전체 카탈로그 (항상 표시) -->
    <section v-if="!loading && quickCategories.length > 0" class="max-w-7xl mx-auto px-4 sm:px-6 pt-2 pb-4 border-t border-slate-200/70 dark:border-slate-800/55">
      <div class="flex items-end justify-between gap-4">
        <div>
          <h2 class="text-lg font-bold tracking-tight text-slate-900 dark:text-zinc-50">카테고리</h2>
          <p class="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">필터 없이 빠르게 이동</p>
        </div>
        <button type="button" class="shop-link-muted" @click="scrollToCatalog">
          목록으로 ↓
        </button>
      </div>
      <div class="mt-3 flex flex-wrap gap-2">
        <button
          v-for="cat in quickCategories"
          :key="`qc-${cat}`"
          type="button"
          class="quick-cat-chip"
          @click="goCategory(cat)"
        >
          {{ cat }}
        </button>
      </div>
    </section>
    <div id="home-catalog" class="max-w-7xl mx-auto px-6 py-10 scroll-mt-24 border-t border-slate-200/70 dark:border-slate-800/55">
      <div class="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h2 class="shop-page-title">
            {{ selectedCategory === '전체' ? '전체 카탈로그' : selectedCategory }}
          </h2>
          <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            {{ catalogTotal }}개 상품 · 필터·정렬로 직접 고를 수 있어요
          </p>
        </div>
        
        
        <div class="flex gap-3 flex-wrap items-center">
          
          <select v-model="priceRange" class="shop-input-select">
            <option value="">전체 가격대</option>
            <option value="0-10000">~ 1만원</option>
            <option value="10000-30000">1만원 ~ 3만원</option>
            <option value="30000-50000">3만원 ~ 5만원</option>
            <option value="50000-100000">5만원 ~ 10만원</option>
            <option value="100000">10만원 이상</option>
          </select>

          
          <select v-model="sortBy" class="shop-input-select">
            <option value="default">기본순</option>
            <option value="price-asc">가격 낮은순</option>
            <option value="price-desc">가격 높은순</option>
            <option value="name-asc">이름 가나다순</option>
            <option value="name-desc">이름 역순</option>
            <option value="newest">최신순</option>
          </select>
        </div>
      </div>

      <div v-if="loading" class="mt-10">
        <SkeletonLoader type="product-list" :count="6" />
      </div>

      <div
        v-else-if="error"
        class="text-center mt-10 p-6 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
      >
        <p class="text-red-600 dark:text-red-400 font-medium mb-2">⚠️ 오류가 발생했습니다</p>
        <p class="text-red-500 dark:text-red-500 text-sm">{{ error }}</p>
        <button
          @click="loadProducts"
          class="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
        >
          다시 시도
        </button>
      </div>

      <div
        v-else-if="products.length === 0"
        class="text-center text-neutral-400 mt-10"
      >
        {{ searchQuery ? "검색 결과가 없습니다." : "등록된 상품이 없습니다." }}
      </div>

      <div
        v-else
        class="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8"
      >
        <div
          v-for="p in products"
          :key="p.id"
          @click="goDetail(p.id)"           
          class="group shop-card-product" 
        >
          <div class="absolute top-3 right-3 z-10" @click.stop>
            <WishlistButton :product-id="p.id" size="sm" />
          </div>
          <div
            class="shop-card-product-media h-52 sm:h-80"
          >
            <img
              :src="imgSrc(p)"
              :alt="p.name"
              loading="lazy"
              decoding="async"
              class="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
              @error="onImgError"
            />
          </div>

          <div class="p-3 sm:p-6">
            <h3 class="font-semibold text-sm sm:text-lg text-neutral-900 dark:text-neutral-100 mb-1 line-clamp-1">
              {{ p.name }}
            </h3>
            <p class="hidden sm:block text-neutral-500 dark:text-neutral-400 text-sm mb-3 line-clamp-2">
              {{ p.description }}
            </p>
            <p class="text-neutral-900 dark:text-neutral-100 font-semibold text-sm sm:text-lg mb-3 sm:mb-6">
              {{ formatPrice(p.price) }}원
            </p>
            <button type="button" class="shop-btn-cart group py-1.5 sm:py-2 text-xs sm:text-sm" @click.stop="addToCart(p)">
              장바구니 담기
              <span
                class="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent dark:via-white/20 translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-[1.2s] ease-out opacity-70 blur-[2px]"
              />
            </button>
          </div>
        </div>
      </div>

      
      <div
        v-if="!loading && totalPages > 1"
        class="flex justify-center items-center gap-2 mt-12"
      >
        <button
          @click="currentPage = 1"
          :disabled="currentPage === 1"
          :class="[
            'px-3 py-2 rounded-lg text-sm font-medium transition-all',
            currentPage === 1
              ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-400 cursor-not-allowed'
              : 'bg-white dark:bg-[#1a2235] text-neutral-800 dark:text-neutral-200 hover:bg-slate-100 hover:text-neutral-900 dark:hover:bg-slate-700 dark:hover:text-neutral-100 border border-slate-200/80 dark:border-slate-600/45'
          ]"
        >
          처음
        </button>
        
        <button
          @click="currentPage--"
          :disabled="currentPage === 1"
          :class="[
            'px-3 py-2 rounded-lg text-sm font-medium transition-all',
            currentPage === 1
              ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-400 cursor-not-allowed'
              : 'bg-white dark:bg-[#1a2235] text-neutral-800 dark:text-neutral-200 hover:bg-slate-100 hover:text-neutral-900 dark:hover:bg-slate-700 dark:hover:text-neutral-100 border border-slate-200/80 dark:border-slate-600/45'
          ]"
        >
          이전
        </button>

        <div class="flex gap-1">
          <template v-for="page in visiblePages" :key="page">
            <button
              v-if="page !== '...'"
              @click="currentPage = page"
              :class="[
                'px-4 py-2 rounded-lg text-sm font-medium transition-all min-w-[40px]',
                currentPage === page
                  ? 'shop-btn-primary text-white shadow-md scale-105'
                  : 'bg-white dark:bg-[#1a2235] text-neutral-800 dark:text-neutral-200 hover:bg-slate-100 hover:text-neutral-900 dark:hover:bg-slate-700 dark:hover:text-neutral-100 border border-slate-200/80 dark:border-slate-600/45'
              ]"
            >
              {{ page }}
            </button>
            <span
              v-else
              class="px-2 py-2 text-neutral-500 dark:text-neutral-400"
            >
              ...
            </span>
          </template>
        </div>

        <button
          @click="currentPage++"
          :disabled="currentPage === totalPages"
          :class="[
            'px-3 py-2 rounded-lg text-sm font-medium transition-all',
            currentPage === totalPages
              ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-400 cursor-not-allowed'
              : 'bg-white dark:bg-[#1a2235] text-neutral-800 dark:text-neutral-200 hover:bg-slate-100 hover:text-neutral-900 dark:hover:bg-slate-700 dark:hover:text-neutral-100 border border-slate-200/80 dark:border-slate-600/45'
          ]"
        >
          다음
        </button>
        
        <button
          @click="currentPage = totalPages"
          :disabled="currentPage === totalPages"
          :class="[
            'px-3 py-2 rounded-lg text-sm font-medium transition-all',
            currentPage === totalPages
              ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-400 cursor-not-allowed'
              : 'bg-white dark:bg-[#1a2235] text-neutral-800 dark:text-neutral-200 hover:bg-slate-100 hover:text-neutral-900 dark:hover:bg-slate-700 dark:hover:text-neutral-100 border border-slate-200/80 dark:border-slate-600/45'
          ]"
        >
          마지막
        </button>
      </div>
    </div>

    <Footer />

    <ChatButton />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import api from "../../lib/api";
import { useRouter, useRoute } from "vue-router";
import { useCartStore } from "../../store/cart";
import { useToastStore } from "../../store/toast";
import { useAuthStore } from "../../store/auth";
import ChatButton from "@/components/chat/ChatButton.vue";
import Footer from "@/app/layout/Footer.vue";
import SkeletonLoader from "@/components/ui/SkeletonLoader.vue";
import { getRecentlyViewed } from "../../composables/useRecentlyViewed";
import { formatPrice, normalizeImageUrl } from "../../lib/format";
import WishlistButton from "@/components/product/WishlistButton.vue";

const router = useRouter();
const route = useRoute();

const goDetail = (id) => {
  router.push(`/product/${id}`);
};

const scrollToSection = (id, section) => {
  homeSection.value = section;
  if (typeof window === "undefined") return;
  requestAnimationFrame(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById(id)?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  });
};

const scrollToCurator = () => scrollToSection("home-curator", "curate");

const scrollToCatalog = () => scrollToSection("home-catalog", "catalog");

const goCategory = (catName) => {
  router.push({
    path: "/home",
    query: {
      ...route.query,
      category: catName === "전체" ? undefined : catName,
    },
  });
};

const cart = useCartStore();
const toast = useToastStore();
const auth = useAuthStore();
const products = ref([]);
const catalogTotal = ref(0);
const categoryList = ref([]);
const personalizedProducts = ref([]);
const personalizedSummary = ref("");

const placeholderImg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect fill='%23e5e7eb' width='200' height='200'/%3E%3Ctext fill='%239ca3af' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='14'%3E이미지%3C/text%3E%3C/svg%3E";
const normalizeSearchText = (value) =>
  (value || "")
    .toString()
    .normalize("NFC")
    .toLowerCase()
    .trim();
const imgSrc = (p) => {
  if (!p) return placeholderImg;
  const gallery = Array.isArray(p.images) ? p.images : [];
  const raw = gallery.find(Boolean) || p.image_url || p.image;
  if (!raw) return placeholderImg;
  const url = normalizeImageUrl(raw);
  return url || placeholderImg;
};
const onImgError = (e) => { e.target.src = placeholderImg; };
const loading = ref(true);
const error = ref(null);
const searchQuery = ref("");
const selectedCategory = ref("전체");
const sortBy = ref("default");
const priceRange = ref("");
const currentPage = ref(1);
const itemsPerPage = ref(9);
const recentlyViewed = ref([]);
const homeSection = ref("curate");
const aiLoadingPhase = ref(0);
let aiLoadingTimer = null;
const aiLoadingPhases = ["요청 문장 이해", "예산·카테고리 필터", "후보 비교 · 순위"];
const placeholderExamples = [
  "출퇴근용 백팩, 5만 원대",
  "데님·캐주얼 코디, 10만 원 이하",
  "선물용 액세서리, 3만 원대",
];
const rotatingPlaceholderIndex = ref(0);
let placeholderTimer = null;
const demoThreads = [
  {
    prompt: "출퇴근용 백팩, 5만 원대",
    reply: "백팩 카테고리 · 예산 50,000원 이하로 좁혀 3건을 골랐어요.",
  },
  {
    prompt: "가벼운 태블릿, 150만 원 이하",
    reply: "태블릿 후보 중 예산 안에서 성능·휴대성을 고려해 순위를 매겼어요.",
  },
];

const rotatingPlaceholder = computed(
  () => `예) ${placeholderExamples[rotatingPlaceholderIndex.value]}`
);

const aiLoadingLabel = computed(() => aiLoadingPhases[aiLoadingPhase.value] || aiLoadingPhases[0]);

const intentTags = computed(() => {
  const intent = aiRecommendIntent.value;
  if (!intent) return [];
  const tags = [];
  if (intent.category) tags.push({ label: intent.category, type: "category" });
  if (intent.budgetMax) tags.push({ label: `≤ ${formatPrice(intent.budgetMax)}원`, type: "budget" });
  if (Array.isArray(intent.keywords)) {
    intent.keywords.slice(0, 3).forEach((k) => tags.push({ label: k, type: "keyword" }));
  }
  return tags;
});

const startAiLoadingAnimation = () => {
  aiLoadingPhase.value = 0;
  clearInterval(aiLoadingTimer);
  aiLoadingTimer = setInterval(() => {
    if (aiLoadingPhase.value < aiLoadingPhases.length - 1) aiLoadingPhase.value += 1;
  }, 700);
};

const stopAiLoadingAnimation = () => {
  clearInterval(aiLoadingTimer);
  aiLoadingTimer = null;
  aiLoadingPhase.value = 0;
};

const aiRecommendPrompt = ref("");
const aiRecommendLoading = ref(false);
const aiRecommendError = ref("");
const aiRecommendedProducts = ref([]);
const aiRecommendIntent = ref(null);
const aiRecommendSessionId = ref(
  `ai-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
);
const aiRecommendSummary = ref("");
const aiPromptSuggestions = [
  "출퇴근용 백팩, 5만 원대",
  "데님·캐주얼 코디, 10만 원 이하",
  "선물용 액세서리, 3만 원대",
  "가벼운 태블릿, 150만 원 이하",
];

const buildProductParams = () => {
  const params = {
    withMeta: 1,
    page: currentPage.value,
    limit: itemsPerPage.value,
  };
  const q = searchQuery.value.trim();
  if (q) params.search = q;
  if (selectedCategory.value && selectedCategory.value !== "전체") {
    params.category = selectedCategory.value;
  }
  if (priceRange.value) {
    const parts = priceRange.value.split("-");
    params.minPrice = Number(parts[0]) || 0;
    if (parts[1]) params.maxPrice = Number(parts[1]);
  }
  switch (sortBy.value) {
    case "price-asc":
      params.sortBy = "price";
      params.sortOrder = "asc";
      break;
    case "price-desc":
      params.sortBy = "price";
      params.sortOrder = "desc";
      break;
    case "name-asc":
      params.sortBy = "name";
      params.sortOrder = "asc";
      break;
    case "name-desc":
      params.sortBy = "name";
      params.sortOrder = "desc";
      break;
    case "newest":
      params.sortBy = "created_at";
      params.sortOrder = "desc";
      break;
    default:
      params.sortBy = "id";
      params.sortOrder = "desc";
      break;
  }
  return params;
};

const trackSearch = async (term) => {
  const clean = term.trim();
  if (!clean) return;
  try {
    await api.post("/analytics/search-events", {
      searchTerm: clean,
      userId: auth.user?.id || null,
    });
  } catch (_) {
    // UX를 막지 않음
  }
};

const loadPersonalizedRecommendations = async () => {
  const recentIds = getRecentlyViewed().map((p) => p.id).filter(Boolean);
  if (!auth.isLoggedIn && recentIds.length === 0) {
    personalizedProducts.value = [];
    personalizedSummary.value = "";
    return;
  }
  try {
    const res = await api.get("/recommendations/personalized", {
      params: {
        recentProductIds: recentIds.join(","),
        limit: 5,
      },
    });
    personalizedProducts.value = Array.isArray(res.data?.recommendations)
      ? res.data.recommendations
      : [];
    personalizedSummary.value = res.data?.summary || "";
  } catch (_) {
    personalizedProducts.value = [];
    personalizedSummary.value = "";
  }
};

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(catalogTotal.value / itemsPerPage.value));
});

const visiblePages = computed(() => {
  const pages = [];
  const total = totalPages.value;
  const current = currentPage.value;
  
  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
  } else {
    if (current <= 4) {
      for (let i = 1; i <= 5; i++) {
        pages.push(i);
      }
      pages.push("...");
      pages.push(total);
    } else if (current >= total - 3) {
      pages.push(1);
      pages.push("...");
      for (let i = total - 4; i <= total; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      pages.push("...");
      for (let i = current - 1; i <= current + 1; i++) {
        pages.push(i);
      }
      pages.push("...");
      pages.push(total);
    }
  }
  
  return pages;
});

const quickCategories = computed(() => {
  const cats = categoryList.value.filter(Boolean);
  if (!cats.length) return [];
  return ["전체", ...cats].slice(0, 11);
});

const addToCart = (p) => {
  cart.addToCart({
    id: p.id,
    name: p.name,
    price: p.price,
    image_url: p.image_url,
  });
  toast.success(`${p.name}이(가) 장바구니에 추가되었습니다.`);
};

const sendAiRecommendEvent = async (eventName, extra = {}) => {
  try {
    await api.post("/analytics/ai-recommend-events", {
      eventName,
      promptText: aiRecommendPrompt.value || null,
      productId: extra.productId || null,
      source: "home_ai_widget",
      sessionId: aiRecommendSessionId.value,
      meta: extra.meta || null,
    });
  } catch (_) {
    // UX를 막지 않기 위해 이벤트 전송 실패는 무시
  }
};

const openAiRecommendedProduct = async (p) => {
  await sendAiRecommendEvent("ai_recommend_click", {
    productId: p?.id,
    meta: { productName: p?.name || "" },
  });
  goDetail(p.id);
};

const addAiRecommendedToCart = async (p) => {
  await sendAiRecommendEvent("ai_recommend_add_to_cart", {
    productId: p?.id,
    meta: { productName: p?.name || "" },
  });
  addToCart(p);
};

const applyAiSuggestion = (text) => {
  aiRecommendPrompt.value = text;
  requestAiRecommendation();
};

const requestAiRecommendation = async () => {
  if (!aiRecommendPrompt.value || aiRecommendLoading.value) return;
  aiRecommendLoading.value = true;
  aiRecommendError.value = "";
  aiRecommendSummary.value = "";
  aiRecommendedProducts.value = [];
  aiRecommendIntent.value = null;
  aiRecommendSessionId.value = `ai-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  startAiLoadingAnimation();
  await sendAiRecommendEvent("ai_recommend_request", {
    meta: { promptLength: aiRecommendPrompt.value.length },
  });
  try {
    const res = await api.post("/ai/recommend", { prompt: aiRecommendPrompt.value });
    aiRecommendedProducts.value = Array.isArray(res.data?.recommendations) ? res.data.recommendations : [];
    aiRecommendIntent.value = res.data?.intent || null;
    aiRecommendSummary.value = res.data?.summary || "";
    if (aiRecommendedProducts.value.length > 0) {
      await sendAiRecommendEvent("ai_recommend_impression", {
        meta: {
          resultCount: aiRecommendedProducts.value.length,
          recommendedProductIds: aiRecommendedProducts.value.map((p) => p.id),
        },
      });
    }
    if (aiRecommendedProducts.value.length === 0) {
      aiRecommendError.value = "추천 결과가 없어 다른 조건으로 시도해 주세요.";
    }
  } catch (err) {
    aiRecommendError.value = err.userMessage || "AI 추천을 불러오지 못했습니다.";
  } finally {
    stopAiLoadingAnimation();
    aiRecommendLoading.value = false;
  }
};

const loadProducts = async () => {
  loading.value = true;
  error.value = null;
  const q = searchQuery.value.trim();
  try {
    const res = await api.get("/products", { params: buildProductParams() });
    const payload = res.data?.items != null ? res.data : { items: res.data, pagination: {} };
    const list = Array.isArray(payload.items) ? payload.items : [];
    products.value = list.map((p) => ({
      ...p,
      category: p.category?.trim() ? p.category : "기타",
    }));
    catalogTotal.value = Number(payload.pagination?.total ?? list.length);

    if (
      selectedCategory.value !== "전체" &&
      !categoryList.value.includes(selectedCategory.value)
    ) {
      selectedCategory.value = "전체";
    }

    if (q) await trackSearch(q);
  } catch (err) {
    error.value = err.userMessage || "상품을 불러오는 중 오류가 발생했습니다.";
    console.error("상품 불러오기 실패:", err);
  } finally {
    loading.value = false;
  }
};

const loadCategories = async () => {
  try {
    const res = await api.get("/categories");
    categoryList.value = Array.isArray(res.data) ? res.data.filter(Boolean) : [];
  } catch (_) {
    categoryList.value = [];
  }
};

watch([selectedCategory, searchQuery, priceRange, sortBy], () => {
  if (currentPage.value !== 1) {
    currentPage.value = 1;
  } else {
    loadProducts();
  }
});

watch(currentPage, () => {
  loadProducts();
});

watch(
  () => [route.query.q, route.query.category],
  ([q, category]) => {
    searchQuery.value = (q || "").toString();
    selectedCategory.value = category || "전체";
    currentPage.value = 1;
    loadProducts();
  }
);

onMounted(async () => {
  searchQuery.value = (route.query.q || "").toString();
  selectedCategory.value = route.query.category || "전체";
  recentlyViewed.value = getRecentlyViewed();
  await Promise.all([loadCategories(), loadProducts(), loadPersonalizedRecommendations()]);
  placeholderTimer = setInterval(() => {
    rotatingPlaceholderIndex.value = (rotatingPlaceholderIndex.value + 1) % placeholderExamples.length;
  }, 3200);
});

onUnmounted(() => {
  stopAiLoadingAnimation();
  clearInterval(placeholderTimer);
});
</script>

<style scoped>
.home-grid-bg {
  background-image:
    radial-gradient(circle at 1px 1px, rgba(99, 102, 241, 0.07) 1px, transparent 0);
  background-size: 28px 28px;
  mask-image: linear-gradient(to bottom, black 0%, transparent 85%);
}
:global(.dark) .home-grid-bg {
  background-image:
    radial-gradient(circle at 1px 1px, rgba(129, 140, 248, 0.08) 1px, transparent 0);
}

.home-mode-tab {
  padding: 0.45rem 1rem;
  border-radius: 0.65rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: rgb(100 116 139);
  transition: background-color 160ms ease, color 160ms ease, box-shadow 160ms ease;
}
.home-mode-tab--active {
  background: white;
  color: rgb(49 46 129);
  box-shadow: 0 4px 14px -10px rgba(67, 56, 202, 0.35);
}
:global(.dark) .home-mode-tab {
  color: rgb(148 163 184);
}
:global(.dark) .home-mode-tab--active {
  background: linear-gradient(135deg, rgb(67 56 202), rgb(109 40 217));
  color: rgb(238 242 255);
  box-shadow: 0 8px 24px -8px rgba(129, 140, 248, 0.55);
}

.curate-split {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  align-items: start;
}
@media (min-width: 1024px) {
  .curate-split {
    grid-template-columns: minmax(280px, 340px) 1fr;
    gap: 1.25rem;
  }
}

.curator-panel {
  border-radius: 1.25rem;
  border: 1px solid rgba(99, 102, 241, 0.18);
  background: rgba(255, 255, 255, 0.92);
  padding: 1.25rem;
  box-shadow: 0 24px 60px -40px rgba(67, 56, 202, 0.35);
}
@media (min-width: 1024px) {
  .curator-panel {
    position: sticky;
    top: 5.5rem;
  }
}
:global(.dark) .curator-panel {
  border-color: rgba(129, 140, 248, 0.2);
  background: rgba(15, 23, 42, 0.75);
}

.curator-panel-head {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.curator-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.75rem;
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: white;
  background: linear-gradient(135deg, rgb(79 70 229), rgb(124 58 237));
}

.curator-flow-mini {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
  margin-bottom: 1rem;
  padding: 0.5rem 0.65rem;
  border-radius: 0.65rem;
  background: rgba(238, 242, 255, 0.7);
  font-size: 0.68rem;
  font-weight: 600;
  color: rgb(67 56 202);
}
:global(.dark) .curator-flow-mini {
  background: rgba(49, 46, 129, 0.25);
  color: rgb(165 180 252);
}

.curator-input {
  width: 100%;
  resize: vertical;
  min-height: 4.5rem;
  border-radius: 0.85rem;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: rgba(248, 250, 252, 0.95);
  padding: 0.75rem 0.9rem;
  font-size: 0.875rem;
  line-height: 1.5;
}
.curator-input:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.35);
  border-color: rgba(99, 102, 241, 0.45);
}
:global(.dark) .curator-input {
  border-color: rgba(255, 255, 255, 0.12);
  background: rgba(15, 23, 42, 0.65);
  color: rgb(241 245 249);
}

.curator-chip {
  border-radius: 9999px;
  border: 1px solid rgba(99, 102, 241, 0.22);
  background: rgba(238, 242, 255, 0.8);
  padding: 0.25rem 0.65rem;
  font-size: 0.68rem;
  color: rgb(49 46 129);
  transition: background-color 140ms ease;
}
.curator-chip:hover:not(:disabled) {
  background: rgba(224, 231, 255, 0.95);
}
:global(.dark) .curator-chip {
  border-color: rgba(129, 140, 248, 0.25);
  background: rgba(49, 46, 129, 0.35);
  color: rgb(199 210 254);
}

.intent-tag {
  display: inline-flex;
  align-items: center;
  border-radius: 9999px;
  padding: 0.2rem 0.55rem;
  font-size: 0.68rem;
  font-weight: 600;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}
.intent-tag--category {
  background: rgba(224, 231, 255, 0.95);
  color: rgb(67 56 202);
}
.intent-tag--budget {
  background: rgba(237, 233, 254, 0.95);
  color: rgb(109 40 217);
}
.intent-tag--keyword {
  background: rgba(241, 245, 249, 0.95);
  color: rgb(51 65 85);
}
:global(.dark) .intent-tag--category {
  background: rgba(49, 46, 129, 0.55);
  color: rgb(199 210 254);
}
:global(.dark) .intent-tag--budget {
  background: rgba(76, 29, 149, 0.45);
  color: rgb(221 214 254);
}
:global(.dark) .intent-tag--keyword {
  background: rgba(30, 41, 59, 0.65);
  color: rgb(203 213 225);
}

.curator-canvas {
  min-height: 420px;
  border-radius: 1.25rem;
  border: 1px dashed rgba(99, 102, 241, 0.22);
  background: rgba(255, 255, 255, 0.55);
}
:global(.dark) .curator-canvas {
  border-color: rgba(129, 140, 248, 0.18);
  background: rgba(15, 23, 42, 0.35);
}

.curator-canvas-inner {
  padding: 1.25rem;
}

.curator-loading-bar {
  height: 4px;
  border-radius: 9999px;
  background: linear-gradient(90deg, rgb(99 102 241), rgb(139 92 246), rgb(99 102 241));
  background-size: 200% 100%;
  animation: curator-shimmer 1.2s ease-in-out infinite;
}
@keyframes curator-shimmer {
  0% { background-position: 100% 0; }
  100% { background-position: -100% 0; }
}

.curator-results {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}
@media (min-width: 640px) {
  .curator-results {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (min-width: 1280px) {
  .curator-results {
    grid-template-columns: repeat(3, 1fr);
  }
}

.curator-result-card {
  position: relative;
  border-radius: 1rem;
  border: 1px solid rgba(15, 23, 42, 0.1);
  background: rgba(255, 255, 255, 0.92);
  padding: 1rem;
}
:global(.dark) .curator-result-card {
  border-color: rgba(255, 255, 255, 0.1);
  background: rgba(15, 23, 42, 0.55);
}

.curator-rank {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 9999px;
  font-size: 0.68rem;
  font-weight: 800;
  color: white;
  background: linear-gradient(135deg, rgb(79 70 229), rgb(124 58 237));
}

.curator-result-media {
  height: 8.5rem;
  border-radius: 0.75rem;
  background: rgb(248 250 252);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
:global(.dark) .curator-result-media {
  background: rgb(24 24 27);
}

.curator-reason {
  font-size: 0.68rem;
  line-height: 1.4;
  color: rgb(100 116 139);
  padding-left: 0.55rem;
  border-left: 2px solid rgba(99, 102, 241, 0.35);
}
:global(.dark) .curator-reason {
  color: rgb(148 163 184);
}

.curator-bubble {
  max-width: 92%;
  border-radius: 0.85rem;
  padding: 0.65rem 0.85rem;
  font-size: 0.8125rem;
  line-height: 1.45;
}
.curator-bubble--user {
  margin-left: auto;
  background: rgb(238 242 255);
  color: rgb(49 46 129);
  border-bottom-right-radius: 0.2rem;
}
.curator-bubble--ai {
  margin-right: auto;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(99, 102, 241, 0.15);
  color: rgb(51 65 85);
  border-bottom-left-radius: 0.2rem;
}
:global(.dark) .curator-bubble--user {
  background: rgba(49, 46, 129, 0.55);
  color: rgb(224 231 255);
}
:global(.dark) .curator-bubble--ai {
  background: rgba(15, 23, 42, 0.65);
  border-color: rgba(129, 140, 248, 0.2);
  color: rgb(226 232 240);
}

.recent-mini-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  width: 5.5rem;
  padding: 0.5rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: rgba(255, 255, 255, 0.8);
  transition: border-color 140ms ease;
}
.recent-mini-card:hover {
  border-color: rgba(99, 102, 241, 0.35);
}
:global(.dark) .recent-mini-card {
  border-color: rgba(255, 255, 255, 0.1);
  background: rgba(15, 23, 42, 0.5);
}

.quick-cat-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 42px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: rgba(255, 255, 255, 0.92);
  color: rgba(15, 23, 42, 0.84);
  font-weight: 700;
  font-size: 14px;
  letter-spacing: -0.01em;
  transition: transform 160ms ease, border-color 160ms ease, background-color 160ms ease, box-shadow 160ms ease;
}
.quick-cat-chip:hover {
  transform: translateY(-1px);
  border-color: rgba(15, 23, 42, 0.18);
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 10px 24px -18px rgba(15, 23, 42, 0.35);
}
:global(.dark) .quick-cat-chip {
  border-color: rgba(255, 255, 255, 0.12);
  background: rgba(15, 23, 42, 0.55);
  color: rgba(243, 244, 246, 0.88);
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
