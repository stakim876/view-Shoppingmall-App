<template>
  <div
    class="min-h-screen bg-gradient-to-b 
           from-[#e6eaf3] to-[#d3dae4] 
           dark:from-[#0d1020] dark:to-[#141826] 
           text-neutral-800 dark:text-neutral-200 
           font-['Inter'] transition-colors duration-500"
  >
    <!-- 로고 히어로 (눈에 띄되 아래 콘텐츠가 너무 내려가지 않도록) -->
    <section
      class="relative flex items-center justify-center min-h-[400px] sm:min-h-[480px] md:min-h-[540px] lg:min-h-[600px] xl:min-h-[660px] py-12 overflow-hidden"
    >
      <div
        class="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-50/40 to-transparent
               dark:via-indigo-950/20"
      />
      <div class="relative z-10 flex flex-col items-center justify-center gap-1 jj-hero-logo">
        <img
          src="/images/e5dc74d2-42c2-41cf-9dba-7eb9114fcbf9.png"
          alt="My Shop"
          class="hero-logo-animate h-72 w-auto sm:h-80 sm:w-auto md:h-96 md:w-auto lg:h-[28rem] lg:w-auto xl:h-[32rem] xl:w-auto max-w-[90vw] object-contain"
        />
        <p class="hero-tagline -mt-[5rem] sm:-mt-[6rem] md:-mt-[7rem] text-center text-neutral-600 dark:text-neutral-400 text-sm sm:text-base md:text-lg font-medium max-w-xl px-4">
        당신의 취향을 모은 셀렉트샵!!
        </p>
      </div>
    </section>

    
    <section
      v-if="!loading && carouselSlides.length > 0"
      class="relative overflow-hidden border-b border-white/20 dark:border-neutral-800"
    >
      <div
        class="absolute inset-0 bg-gradient-to-br 
               from-blue-100/80 via-indigo-100/60 to-transparent 
               dark:from-indigo-900/30 dark:via-purple-900/20 dark:to-transparent 
               blur-2xl"
      ></div>
      <div class="relative z-10 max-w-7xl mx-auto px-4 py-8 sm:py-10">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div
            v-for="(slide, idx) in carouselSlides"
            :key="'slide-' + idx"
            @click="goDetail(slide.id)"
            class="group relative overflow-hidden rounded-2xl cursor-pointer
                   bg-white/60 dark:bg-[#1a1d2f]/60 backdrop-blur-xl
                   border border-white/50 dark:border-purple-400/20
                   shadow-[inset_0_1px_2px_rgba(255,255,255,0.6),_0_8px_24px_rgba(0,0,0,0.08)]
                   dark:shadow-[inset_0_1px_2px_rgba(255,255,255,0.08),_0_8px_32px_rgba(88,28,135,0.2)]
                   hover:border-indigo-400/40 hover:shadow-xl transition-all duration-300"
          >
            <div class="absolute top-3 right-3 z-10" @click.stop>
              <WishlistButton :product-id="slide.id" size="sm" />
            </div>
            <div class="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-md text-xs font-bold
                        bg-indigo-500/90 dark:bg-indigo-500/80 text-white backdrop-blur-sm">
              NEW ARRIVAL
            </div>
            <div class="overflow-hidden h-44 sm:h-52 flex items-center justify-center bg-neutral-100/60 dark:bg-[#25283c]/50">
              <img
                :src="imgSrc(slide)"
                :alt="slide.name"
                class="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                @error="onImgError"
              />
            </div>
            <div class="p-4 sm:p-5">
              <h3 class="font-semibold text-base sm:text-lg text-neutral-900 dark:text-neutral-100 mb-1 line-clamp-1">
                {{ slide.name }}
              </h3>
              <p class="text-neutral-600 dark:text-neutral-400 text-sm line-clamp-2 mb-2">
                {{ slide.description }}
              </p>
              <p class="text-blue-600 dark:text-indigo-400 font-bold text-lg">
                {{ formatPrice(slide.price) }}원
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 베스트셀러 섹션 -->
    <section v-if="!loading && products.length > 0" class="max-w-7xl mx-auto px-6 py-16">
      <div class="flex items-center justify-between mb-10">
        <h2 class="text-3xl font-bold text-neutral-800 dark:text-neutral-100">
          베스트셀러
        </h2>
        <button
          @click="goCategory('전체')"
          class="text-sm text-blue-600 dark:text-indigo-400 hover:underline"
        >
          전체보기 →
        </button>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          v-for="p in bestSellers"
          :key="`best-${p.id}`"
          @click="goDetail(p.id)"
          class="group relative overflow-hidden rounded-3xl 
                 bg-white/90 dark:bg-[#1a1d2f]/70 border border-neutral-200/60 dark:border-purple-500/20 
                 backdrop-blur-xl hover:border-blue-400 dark:hover:border-indigo-400 
                 transition-all duration-300 shadow-sm hover:shadow-xl cursor-pointer transform hover:-translate-y-2"
        >
          <div class="absolute top-3 right-3 z-10" @click.stop>
            <WishlistButton :product-id="p.id" size="sm" />
          </div>
          <div class="absolute top-3 left-3 z-10 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
            BEST
          </div>
          <div class="overflow-hidden h-64 flex items-center justify-center bg-neutral-100/80 dark:bg-[#25283c]/70">
            <img
              :src="imgSrc(p)"
              :alt="p.name"
              class="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
              @error="onImgError"
            />
          </div>
          <div class="p-5">
            <h3 class="font-semibold text-lg text-neutral-900 dark:text-neutral-100 mb-1 line-clamp-1">
              {{ p.name }}
            </h3>
            <p class="text-blue-600 dark:text-indigo-400 font-bold text-xl mb-3">
              {{ formatPrice(p.price) }}원
            </p>
            <button
              @click.stop="addToCart(p)"
              class="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-500 
                     dark:from-indigo-500 dark:to-purple-600 
                     text-white rounded-full font-medium 
                     hover:from-indigo-600 hover:to-purple-500 transition-all relative overflow-hidden group"
            >
              장바구니 담기
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- 신상품 섹션 -->
    <section v-if="!loading && newProducts.length > 0" class="max-w-7xl mx-auto px-6 py-16 bg-white/30 dark:bg-[#0f1119]/30">
      <div class="flex items-center justify-between mb-10">
        <h2 class="text-3xl font-bold text-neutral-800 dark:text-neutral-100">
          신상품
        </h2>
        <button
          @click="goCategory('전체')"
          class="text-sm text-blue-600 dark:text-indigo-400 hover:underline"
        >
          전체보기 →
        </button>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          v-for="p in newProducts"
          :key="`new-${p.id}`"
          @click="goDetail(p.id)"
          class="group relative overflow-hidden rounded-3xl 
                 bg-white/90 dark:bg-[#1a1d2f]/70 border border-neutral-200/60 dark:border-purple-500/20 
                 backdrop-blur-xl hover:border-blue-400 dark:hover:border-indigo-400 
                 transition-all duration-300 shadow-sm hover:shadow-xl cursor-pointer transform hover:-translate-y-2"
        >
          <div class="absolute top-3 right-3 z-10" @click.stop>
            <WishlistButton :product-id="p.id" size="sm" />
          </div>
          <div class="absolute top-3 left-3 z-10 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
            NEW
          </div>
          <div class="overflow-hidden h-64 flex items-center justify-center bg-neutral-100/80 dark:bg-[#25283c]/70">
            <img
              :src="imgSrc(p)"
              :alt="p.name"
              class="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
              @error="onImgError"
            />
          </div>
          <div class="p-5">
            <h3 class="font-semibold text-lg text-neutral-900 dark:text-neutral-100 mb-1 line-clamp-1">
              {{ p.name }}
            </h3>
            <p class="text-blue-600 dark:text-indigo-400 font-bold text-xl mb-3">
              {{ formatPrice(p.price) }}원
            </p>
            <button
              @click.stop="addToCart(p)"
              class="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-500 
                     dark:from-indigo-500 dark:to-purple-600 
                     text-white rounded-full font-medium 
                     hover:from-indigo-600 hover:to-purple-500 transition-all relative overflow-hidden group"
            >
              장바구니 담기
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- 최근 본 상품 -->
    <section v-if="recentlyViewed.length > 0" class="max-w-7xl mx-auto px-6 py-16 bg-white/20 dark:bg-[#0f1119]/30">
      <h2 class="text-3xl font-bold text-neutral-800 dark:text-neutral-100 mb-10">
        최근 본 상품
      </h2>
      <div class="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
        <div
          v-for="p in recentlyViewed"
          :key="`recent-${p.id}`"
          @click="goDetail(p.id)"
          class="group shrink-0 w-44 sm:w-52 rounded-2xl overflow-hidden
                 bg-white/90 dark:bg-[#1a1d2f]/70 border border-neutral-200/60 dark:border-purple-500/20
                 backdrop-blur-xl hover:border-blue-400 dark:hover:border-indigo-400
                 transition-all duration-300 shadow-sm hover:shadow-lg cursor-pointer"
        >
          <div class="h-36 sm:h-44 flex items-center justify-center bg-neutral-100/80 dark:bg-[#25283c]/70">
            <img
              :src="imgSrc(p)"
              :alt="p.name"
              class="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
              @error="onImgError"
            />
          </div>
          <div class="p-3">
            <h3 class="font-semibold text-sm text-neutral-900 dark:text-neutral-100 line-clamp-2 mb-1">
              {{ p.name }}
            </h3>
            <p class="text-blue-600 dark:text-indigo-400 font-bold text-sm">
              {{ formatPrice(p.price || 0) }}원
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- 추천 상품 섹션 -->
    <section v-if="!loading && recommendedProducts.length > 0" class="max-w-7xl mx-auto px-6 py-16">
      <div class="flex items-center justify-between mb-10">
        <h2 class="text-3xl font-bold text-neutral-800 dark:text-neutral-100">
          추천 상품
        </h2>
        <button
          @click="goCategory('전체')"
          class="text-sm text-blue-600 dark:text-indigo-400 hover:underline"
        >
          전체보기 →
        </button>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          v-for="p in recommendedProducts"
          :key="`rec-${p.id}`"
          @click="goDetail(p.id)"
          class="group relative overflow-hidden rounded-3xl 
                 bg-white/90 dark:bg-[#1a1d2f]/70 border border-neutral-200/60 dark:border-purple-500/20 
                 backdrop-blur-xl hover:border-blue-400 dark:hover:border-indigo-400 
                 transition-all duration-300 shadow-sm hover:shadow-xl cursor-pointer transform hover:-translate-y-2"
        >
          <div class="overflow-hidden h-64 flex items-center justify-center bg-neutral-100/80 dark:bg-[#25283c]/70">
            <img
              :src="imgSrc(p)"
              :alt="p.name"
              class="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
              @error="onImgError"
            />
          </div>
          <div class="p-5">
            <h3 class="font-semibold text-lg text-neutral-900 dark:text-neutral-100 mb-1 line-clamp-1">
              {{ p.name }}
            </h3>
            <p class="text-blue-600 dark:text-indigo-400 font-bold text-xl mb-3">
              {{ formatPrice(p.price) }}원
            </p>
            <button
              @click.stop="addToCart(p)"
              class="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-500 
                     dark:from-indigo-500 dark:to-purple-600 
                     text-white rounded-full font-medium 
                     hover:from-indigo-600 hover:to-purple-500 transition-all relative overflow-hidden group"
            >
              장바구니 담기
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- 전체 상품 목록 -->
    <div class="max-w-7xl mx-auto px-6 py-10">
      <div class="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2
          class="text-2xl font-semibold text-neutral-800 dark:text-neutral-100"
        >
          {{ selectedCategory === '전체' ? '전체 상품' : selectedCategory }}
          <span class="text-sm font-normal text-neutral-500 dark:text-neutral-400 ml-2">
            ({{ paginatedProducts.length }}개)
          </span>
        </h2>
        
        <!-- 정렬 및 필터 컨트롤 -->
        <div class="flex gap-3 flex-wrap items-center">
          <!-- 가격대 필터 -->
          <select
            v-model="priceRange"
            class="px-4 py-2 rounded-lg bg-white/90 dark:bg-[#1a1d2f]/70 
                   border border-neutral-200/60 dark:border-purple-500/20 
                   text-neutral-800 dark:text-neutral-200 
                   focus:outline-none focus:ring-2 focus:ring-blue-500 
                   backdrop-blur-xl text-sm"
          >
            <option value="">전체 가격대</option>
            <option value="0-10000">~ 1만원</option>
            <option value="10000-30000">1만원 ~ 3만원</option>
            <option value="30000-50000">3만원 ~ 5만원</option>
            <option value="50000-100000">5만원 ~ 10만원</option>
            <option value="100000">10만원 이상</option>
          </select>

          <!-- 정렬 옵션 -->
          <select
            v-model="sortBy"
            class="px-4 py-2 rounded-lg bg-white/90 dark:bg-[#1a1d2f]/70 
                   border border-neutral-200/60 dark:border-purple-500/20 
                   text-neutral-800 dark:text-neutral-200 
                   focus:outline-none focus:ring-2 focus:ring-blue-500 
                   backdrop-blur-xl text-sm"
          >
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
        v-else-if="filteredProducts.length === 0"
        class="text-center text-neutral-400 mt-10"
      >
        {{ searchQuery ? "검색 결과가 없습니다." : "등록된 상품이 없습니다." }}
      </div>

      <div
        v-else
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10"
      >
        <div
          v-for="p in paginatedProducts"
          :key="p.id"
          @click="goDetail(p.id)"           
          class="group relative overflow-hidden rounded-3xl 
                 bg-white/90 dark:bg-[#1a1d2f]/70 border border-neutral-200/60 dark:border-purple-500/20 
                 backdrop-blur-xl hover:border-blue-400 dark:hover:border-indigo-400 
                 transition-all duration-300 shadow-sm hover:shadow-lg cursor-pointer" 
        >
          <div class="absolute top-3 right-3 z-10" @click.stop>
            <WishlistButton :product-id="p.id" size="sm" />
          </div>
          <div
            class="overflow-hidden h-80 flex items-center justify-center bg-neutral-100/80 dark:bg-[#25283c]/70"
          >
            <img
              :src="imgSrc(p)"
              :alt="p.name"
              class="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
              @error="onImgError"
            />
          </div>

          <div class="p-6">
            <h3 class="font-semibold text-lg text-neutral-900 dark:text-neutral-100 mb-1">
              {{ p.name }}
            </h3>
            <p class="text-neutral-500 dark:text-neutral-400 text-sm mb-3 line-clamp-2">
              {{ p.description }}
            </p>
            <p class="text-blue-600 dark:text-indigo-400 font-semibold text-lg mb-6">
              {{ formatPrice(p.price) }}원
            </p>
            <button
              @click.stop="addToCart(p)"
              class="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-500 
                     dark:from-indigo-500 dark:to-purple-600 
                     text-white rounded-full font-medium 
                     hover:from-indigo-600 hover:to-purple-500 transition-all relative overflow-hidden group"
            >
              장바구니 담기
              <span
                class="absolute inset-0 bg-gradient-to-r 
                       from-transparent via-white/40 to-transparent 
                       dark:via-purple-300/30 
                       translate-x-[-150%] group-hover:translate-x-[150%] 
                       transition-transform duration-[1.2s] ease-out opacity-70 blur-[2px]"
              ></span>
            </button>
          </div>
        </div>
      </div>

      <!-- 페이지네이션 -->
      <div
        v-if="!loading && filteredProducts.length > 0"
        class="flex justify-center items-center gap-2 mt-12"
      >
        <button
          @click="currentPage = 1"
          :disabled="currentPage === 1"
          :class="[
            'px-3 py-2 rounded-lg text-sm font-medium transition-all',
            currentPage === 1
              ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-400 cursor-not-allowed'
              : 'bg-white/90 dark:bg-[#1a1d2f]/70 text-neutral-800 dark:text-neutral-200 hover:bg-blue-500 hover:text-white border border-neutral-200/60 dark:border-purple-500/20'
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
              : 'bg-white/90 dark:bg-[#1a1d2f]/70 text-neutral-800 dark:text-neutral-200 hover:bg-blue-500 hover:text-white border border-neutral-200/60 dark:border-purple-500/20'
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
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-500 text-white shadow-lg scale-105'
                  : 'bg-white/90 dark:bg-[#1a1d2f]/70 text-neutral-800 dark:text-neutral-200 hover:bg-blue-500 hover:text-white border border-neutral-200/60 dark:border-purple-500/20'
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
              : 'bg-white/90 dark:bg-[#1a1d2f]/70 text-neutral-800 dark:text-neutral-200 hover:bg-blue-500 hover:text-white border border-neutral-200/60 dark:border-purple-500/20'
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
              : 'bg-white/90 dark:bg-[#1a1d2f]/70 text-neutral-800 dark:text-neutral-200 hover:bg-blue-500 hover:text-white border border-neutral-200/60 dark:border-purple-500/20'
          ]"
        >
          마지막
        </button>
      </div>
    </div>

    <Footer />

    <ChatButton />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import api from "../../lib/api";
import { useRouter, useRoute } from "vue-router";
import { useCartStore } from "../../store/cart";
import { useToastStore } from "../../store/toast";
import ChatButton from "../chat/ChatButton.vue";
import Footer from "./Footer.vue";
import SkeletonLoader from "../common/SkeletonLoader.vue";
import Breadcrumb from "../common/Breadcrumb.vue";
import { getRecentlyViewed } from "../../composables/useRecentlyViewed";
import { formatPrice, normalizeImageUrl } from "../../lib/format";
import WishlistButton from "../product/WishlistButton.vue";

const router = useRouter();
const route = useRoute();

// 로고 아래 히어로 문구 (원하는 텍스트로 수정)
const goDetail = (id) => {
  router.push(`/product/${id}`);
};

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
const products = ref([]);

const placeholderImg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect fill='%23e5e7eb' width='200' height='200'/%3E%3Ctext fill='%239ca3af' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='14'%3E이미지%3C/text%3E%3C/svg%3E";
const imgSrc = (p) => {
  const raw = p && (p.image_url || p.image);
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

// 카테고리 목록 (이미지와 동일)
const filteredProducts = computed(() => {
  let list = [...products.value];

  // 카테고리 필터
  if (selectedCategory.value !== "전체") {
    list = list.filter((p) => p.category === selectedCategory.value);
  }

  // 검색 필터
  if (searchQuery.value.trim() !== "") {
    const q = searchQuery.value.toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }

  // 가격대 필터
  if (priceRange.value) {
    const [min, max] = priceRange.value.split("-").map(Number);
    if (max) {
      list = list.filter((p) => p.price >= min && p.price <= max);
    } else {
      list = list.filter((p) => p.price >= min);
    }
  }

  // 정렬
  switch (sortBy.value) {
    case "price-asc":
      list.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      list.sort((a, b) => b.price - a.price);
      break;
    case "name-asc":
      list.sort((a, b) => a.name.localeCompare(b.name, "ko"));
      break;
    case "name-desc":
      list.sort((a, b) => b.name.localeCompare(a.name, "ko"));
      break;
    case "newest":
      list.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
        const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
        return dateB - dateA;
      });
      break;
    default:
      // 기본순 (변경 없음)
      break;
  }

  return list;
});

// 페이지네이션 계산
const totalPages = computed(() => {
  return Math.ceil(filteredProducts.value.length / itemsPerPage.value);
});

const visiblePages = computed(() => {
  const pages = [];
  const total = totalPages.value;
  const current = currentPage.value;
  
  if (total <= 7) {
    // 페이지가 7개 이하면 모두 표시
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
  } else {
    // 현재 페이지 주변 3개씩 표시
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

const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredProducts.value.slice(start, end);
});

// 베스트셀러 (가격 기준 상위 4개 또는 랜덤)
const bestSellers = computed(() => {
  if (products.value.length === 0) return [];
  const sorted = [...products.value].sort((a, b) => b.price - a.price);
  return sorted.slice(0, 4);
});

// 신상품 (최근 추가된 상품 4개 또는 랜덤)
const newProducts = computed(() => {
  if (products.value.length === 0) return [];
  const sorted = [...products.value].sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
    const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
    return dateB - dateA;
  });
  return sorted.slice(0, 4);
});

// 추천 상품 (랜덤 4개)
const recommendedProducts = computed(() => {
  if (products.value.length === 0) return [];
  const shuffled = [...products.value].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 4);
});

// 메인 배너 캐러셀용 3개 (신상품 우선, 부족하면 베스트로 채움)
const carouselSlides = computed(() => {
  if (products.value.length === 0) return [];
  const newFirst = [...products.value].sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
    const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
    return dateB - dateA;
  });
  const slides = newFirst.slice(0, 3);
  if (slides.length < 3) {
    const rest = bestSellers.value.filter((p) => !slides.some((s) => s.id === p.id));
    slides.push(...rest.slice(0, 3 - slides.length));
  }
  return slides;
});

// 라우트 쿼리와 검색/카테고리 동기화 (헤더 검색·2단 네비와 연동)
watch(
  () => [route.query.q, route.query.category],
  () => {
    if (route.query.q !== undefined) searchQuery.value = route.query.q || "";
    if (route.query.category !== undefined) selectedCategory.value = route.query.category || "전체";
  },
  { immediate: true }
);

const addToCart = (p) => {
  cart.addToCart({
    id: p.id,
    name: p.name,
    price: p.price,
    image_url: p.image_url,
  });
  toast.success(`${p.name}이(가) 장바구니에 추가되었습니다.`);
};

const loadProducts = async () => {
  loading.value = true;
  error.value = null;
  try {
    const res = await api.get("/products");
    products.value = res.data;
    // 필터/정렬 변경 시 첫 페이지로 리셋
    currentPage.value = 1;
    
    // 카테고리가 없는 상품이 있으면 기본값 설정 (선택사항)
    products.value.forEach((p) => {
      if (!p.category || p.category.trim() === "") {
        p.category = "기타";
      }
    });
  } catch (err) {
    error.value = err.userMessage || "상품을 불러오는 중 오류가 발생했습니다.";
    console.error("상품 불러오기 실패:", err);
  } finally {
    loading.value = false;
  }
};

// 필터/정렬 변경 시 첫 페이지로 이동
const resetToFirstPage = () => {
  currentPage.value = 1;
};

// watch를 사용하여 필터/정렬 변경 감지
watch([selectedCategory, searchQuery, priceRange, sortBy], () => {
  resetToFirstPage();
});

onMounted(() => {
  loadProducts();
  recentlyViewed.value = getRecentlyViewed();
});
</script>

<style scoped>
/* 메인 로고: 요즘 스타일 — 짧은 등장만, 무한 애니 제거 */
.hero-logo-animate {
  animation: heroLogoEnter 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  opacity: 0;
}
@keyframes heroLogoEnter {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(8px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
.hero-tagline {
  animation: heroTaglineFade 0.6s ease-out 0.5s forwards;
  opacity: 0;
}
@keyframes heroTaglineFade {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
