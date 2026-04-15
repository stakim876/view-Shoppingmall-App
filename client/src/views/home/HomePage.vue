<template>
  <div
    class="relative min-h-screen bg-gradient-to-b
           from-white via-slate-50 to-slate-100
           dark:from-[#0c0f16] dark:via-[#0f141d] dark:to-[#121925]
           text-slate-700 dark:text-slate-200
           font-sans transition-colors duration-500"
  >
    <div class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div
        class="absolute inset-0 bg-[radial-gradient(ellipse_100%_55%_at_50%_-15%,rgba(125,211,252,0.12),transparent_55%)] dark:bg-[radial-gradient(ellipse_90%_45%_at_50%_0%,rgba(56,189,248,0.06),transparent_50%)]"
      />
      <div
        class="absolute -top-24 left-[6%] h-[18rem] w-[18rem] rounded-full bg-sky-200/30 blur-[100px] dark:bg-slate-600/18"
      />
      <div
        class="absolute top-[20%] -right-20 h-[22rem] w-[22rem] rounded-full bg-slate-200/35 blur-[118px] dark:bg-slate-700/14"
      />
      <div
        class="absolute bottom-[5%] left-[18%] h-[14rem] w-[14rem] rounded-full bg-sky-100/40 blur-[88px] dark:bg-slate-700/12"
      />
      <div
        class="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.35)_0%,transparent_35%,transparent_65%,rgba(15,23,42,0.04)_100%)] dark:bg-[linear-gradient(180deg,transparent_0%,transparent_55%,rgba(0,0,0,0.35)_100%)]"
      />
    </div>

    <div class="relative z-10">
    
    <section
      class="relative flex items-center justify-center min-h-[300px] sm:min-h-[360px] md:min-h-[400px] lg:min-h-[440px] xl:min-h-[480px] py-10 sm:py-12 pb-14 sm:pb-16"
    >
      <div
        class="absolute inset-0 bg-gradient-to-b from-white/35 via-sky-50/15 to-transparent dark:from-white/[0.03] dark:via-slate-950/30 dark:to-transparent"
      />
      <div
        class="hero-logo-glow pointer-events-none absolute left-1/2 top-1/2 h-[min(90vw,28rem)] w-[min(90vw,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr from-sky-100/35 via-slate-200/25 to-sky-100/30 blur-3xl dark:from-sky-950/25 dark:via-slate-800/20 dark:to-slate-900/15"
        aria-hidden="true"
      />
      <div class="relative z-10 flex flex-col items-center justify-center gap-1 jj-hero-logo">
        <img
          src="/images/0232cce0-e560-4609-9b38-37c5e6165205.png"
          alt="My Shop"
          fetchpriority="high"
          loading="eager"
          decoding="async"
          class="hero-logo-animate h-72 w-auto sm:h-80 sm:w-auto md:h-96 md:w-auto lg:h-[28rem] lg:w-auto xl:h-[32rem] xl:w-auto max-w-[90vw] object-contain"
        />
        <p
          class="hero-tagline -mt-[5rem] sm:-mt-[6rem] md:-mt-[7rem] text-center text-sm sm:text-base md:text-lg font-medium max-w-xl px-4 tracking-wide text-slate-700/90 dark:text-slate-300/90 drop-shadow-sm"
        >
          당신의 취향을 모은 셀렉트샵 !!
        </p>
      </div>
    </section>

    
    <section
      v-if="!loading && carouselSlides.length > 0"
      class="relative rounded-lg px-4 pb-12 pt-0 outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:focus-visible:ring-offset-[#080a12] sm:px-6 sm:pb-14 border-b border-slate-200/75 dark:border-slate-800/55"
      role="region"
      aria-label="추천 상품 슬라이드. 좌우 화살표 키로 넘길 수 있습니다."
      tabindex="0"
      @keydown="onHeroCarouselKeydown"
    >
      <p class="sr-only" aria-live="polite" aria-atomic="true">{{ heroCarouselLiveText }}</p>
      <div
        class="hero-carousel-frame relative mx-auto max-w-[min(1120px,92vw)] overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white shadow-[0_20px_50px_-14px_rgba(30,41,59,0.16)] dark:border-slate-700/45 dark:bg-slate-900 dark:shadow-[0_24px_60px_-12px_rgba(0,0,0,0.45)]"
        @mouseenter="heroPaused = true"
        @mouseleave="heroPaused = false"
      >
        
        <div
          class="relative aspect-[16/10] sm:aspect-[2/1] min-h-[200px] sm:min-h-[240px] max-h-[min(52vh,440px)] bg-neutral-100 dark:bg-neutral-950 px-3 py-3 sm:px-6 sm:py-5"
        >
          <div
            v-for="(slide, idx) in carouselSlides"
            :key="'hero-' + slide.id"
            class="absolute inset-0 overflow-hidden transition-opacity duration-700 ease-out cursor-pointer"
            :class="
              idx === heroSlideIndex
                ? 'z-[1] opacity-100'
                : 'z-0 opacity-0 pointer-events-none'
            "
            role="tabpanel"
            :aria-hidden="idx !== heroSlideIndex"
            @click="goDetail(slide.id)"
          >
            <div
              class="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_80%_70%_at_50%_50%,rgba(0,0,0,0.035),transparent_72%)] dark:bg-[radial-gradient(ellipse_75%_65%_at_50%_50%,rgba(255,255,255,0.04),transparent_70%)]"
              aria-hidden="true"
            />
            
            <div
              class="absolute inset-0 z-[1] box-border grid place-items-center px-[2.75rem] py-2 sm:px-[3.25rem] sm:py-3"
            >
              <img
                :src="imgSrc(slide)"
                :alt="slide.name"
                :loading="idx === 0 ? 'eager' : 'lazy'"
                :fetchpriority="idx === 0 ? 'high' : 'low'"
                :style="heroImageStyle(slide)"
                decoding="async"
                class="hero-feature-img absolute left-1/2 top-1/2 block max-h-full max-w-full h-auto w-auto -translate-x-1/2 -translate-y-1/2 object-contain"
                @error="onImgError"
              />
            </div>
            <div
              class="absolute top-3 right-3 z-20 sm:top-4 sm:right-4"
              @click.stop
            >
              <WishlistButton :product-id="slide.id" size="sm" />
            </div>
          </div>

          <template v-if="carouselSlides.length > 1">
            <button
              type="button"
              class="absolute left-2 sm:left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg border border-white/40 bg-white/90 text-slate-800 shadow-md transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 dark:border-slate-600 dark:bg-slate-800/92 dark:text-slate-100 dark:hover:bg-slate-800"
              aria-label="이전 슬라이드"
              @click.stop="prevHeroSlide"
            >
              <span class="sr-only">이전</span>
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M15 6l-6 6 6 6" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              class="absolute right-2 sm:right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg border border-white/40 bg-white/90 text-slate-800 shadow-md transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 dark:border-slate-600 dark:bg-slate-800/92 dark:text-slate-100 dark:hover:bg-slate-800"
              aria-label="다음 슬라이드"
              @click.stop="nextHeroSlide"
            >
              <span class="sr-only">다음</span>
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M9 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
            <div
              class="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-2 rounded-full bg-black/30 px-3 py-1.5 dark:bg-black/45"
              role="tablist"
              aria-label="슬라이드 선택"
            >
              <button
                v-for="(slide, i) in carouselSlides"
                :key="'dot-' + slide.id"
                type="button"
                role="tab"
                :aria-selected="i === heroSlideIndex"
                :aria-label="`슬라이드 ${i + 1}`"
                class="h-1.5 rounded-md transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/90"
                :class="
                  i === heroSlideIndex
                    ? 'w-7 bg-white shadow-sm'
                    : 'w-1.5 bg-white/45 hover:bg-white/70'
                "
                @click.stop="heroSlideIndex = i"
              />
            </div>
          </template>
        </div>

        
        <div
          class="border-t border-slate-200/90 dark:border-slate-700/80 px-5 py-4 sm:px-7 sm:py-5"
        >
          <template v-for="(slide, idx) in carouselSlides" :key="'cap-' + slide.id">
            <div v-show="idx === heroSlideIndex">
              <p class="text-xs font-semibold text-sky-800 dark:text-sky-400">
                오늘의 셀렉션
              </p>
              <h3
                class="mt-1 text-lg font-bold leading-snug tracking-tight text-neutral-900 dark:text-neutral-50 sm:text-2xl md:text-[1.65rem] line-clamp-2"
              >
                {{ slide.name }}
              </h3>
              <div class="mt-2 flex flex-wrap items-center gap-2">
                <span class="hero-trust-pill">빠른 배송</span>
                <span class="hero-trust-pill">정품 보장</span>
                <span class="hero-trust-pill">간편 반품</span>
              </div>
              <p
                class="mt-3 text-sm leading-relaxed text-neutral-600 line-clamp-2 dark:text-neutral-400"
              >
                {{ slide.description }}
              </p>
              <div
                class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-neutral-200/80 pt-4 dark:border-neutral-700/60"
              >
                <span
                  class="text-lg font-bold tabular-nums text-neutral-900 dark:text-neutral-100 sm:text-xl"
                >
                  {{ formatPrice(slide.price) }}
                  <span class="text-base font-semibold text-neutral-500 dark:text-neutral-400">원</span>
                </span>
                <button
                  type="button"
                  class="shop-btn-cart w-auto px-5 text-sm font-semibold"
                  @click="goDetail(slide.id)"
                >
                  상세 보기
                </button>
              </div>
            </div>
          </template>
        </div>
      </div>
    </section>

    
    <section v-if="!loading && quickCategories.length > 0" class="max-w-7xl mx-auto px-6 pt-4 pb-8">
      <div class="flex items-end justify-between gap-4">
        <div>
          <h2 class="shop-section-title">빠른 탐색</h2>
          <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">원하는 카테고리로 바로 이동하세요.</p>
        </div>
        <button type="button" class="shop-link-muted" @click="goCategory('전체')">
          전체보기 →
        </button>
      </div>
      <div class="mt-5 flex flex-wrap gap-2.5">
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

    
    <section v-if="!loading && trendingTop.length > 0" class="max-w-7xl mx-auto px-6 py-10">
      <div class="flex items-end justify-between gap-4">
        <div>
          <h2 class="shop-section-title">인기 상품</h2>
          <p class="mt-1 text-sm text-neutral-500 dark:text-neutral-400">요즘 많이 찾는 아이템을 가볍게 모았어요.</p>
        </div>
      </div>
      <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          v-for="(p, i) in trendingTop"
          :key="`trend-${p.id}`"
          type="button"
          class="trend-row"
          @click="goDetail(p.id)"
        >
          <span class="trend-rank">{{ i + 1 }}</span>
          <span class="trend-thumb">
            <img :src="imgSrc(p)" :alt="p.name" loading="lazy" decoding="async" class="h-full w-full object-contain" @error="onImgError" />
          </span>
          <span class="min-w-0 flex-1 text-left">
            <span class="block truncate font-semibold text-neutral-900 dark:text-neutral-100">{{ p.name }}</span>
            <span class="mt-0.5 block text-sm text-neutral-500 dark:text-neutral-400 truncate">{{ p.category || "전체" }}</span>
          </span>
          <span class="trend-price">{{ formatPrice(p.price) }}원</span>
        </button>
      </div>
    </section>

    
    <section v-if="!loading && products.length > 0" class="max-w-7xl mx-auto px-6 py-16">
      <div class="shop-section-head">
        <h2 class="shop-section-title">베스트셀러</h2>
        <button type="button" class="shop-link-muted" @click="goCategory('전체')">
          전체보기 →
        </button>
      </div>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div
          v-for="p in bestSellers"
          :key="`best-${p.id}`"
          @click="goDetail(p.id)"
          class="group shop-card-product transform hover:-translate-y-2"
        >
          <div class="absolute top-3 right-3 z-10" @click.stop>
            <WishlistButton :product-id="p.id" size="sm" />
          </div>
          <div class="absolute top-3 left-3 z-10 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
            BEST
          </div>
          <div class="shop-card-product-media h-64">
            <img
              :src="imgSrc(p)"
              :alt="p.name"
              loading="lazy"
              decoding="async"
              class="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
              @error="onImgError"
            />
          </div>
          <div class="p-5">
            <h3 class="font-semibold text-lg text-neutral-900 dark:text-neutral-100 mb-1 line-clamp-1">
              {{ p.name }}
            </h3>
            <p class="text-neutral-900 dark:text-neutral-100 font-bold text-xl mb-3">
              {{ formatPrice(p.price) }}원
            </p>
            <button type="button" class="shop-btn-cart group" @click.stop="addToCart(p)">
              장바구니 담기
            </button>
          </div>
        </div>
      </div>
    </section>

    
    <section v-if="!loading && newProducts.length > 0" class="max-w-7xl mx-auto px-6 py-16 rounded-3xl bg-white/88 dark:bg-[#111a2a]/86 border border-slate-200/70 dark:border-slate-700/45">
      <div class="shop-section-head">
        <h2 class="shop-section-title">신상품</h2>
        <button type="button" class="shop-link-muted" @click="goCategory('전체')">
          전체보기 →
        </button>
      </div>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div
          v-for="p in newProducts"
          :key="`new-${p.id}`"
          @click="goDetail(p.id)"
          class="group shop-card-product transform hover:-translate-y-2"
        >
          <div class="absolute top-3 right-3 z-10" @click.stop>
            <WishlistButton :product-id="p.id" size="sm" />
          </div>
          <div class="absolute top-3 left-3 z-10 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
            NEW
          </div>
          <div class="shop-card-product-media h-64">
            <img
              :src="imgSrc(p)"
              :alt="p.name"
              loading="lazy"
              decoding="async"
              class="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
              @error="onImgError"
            />
          </div>
          <div class="p-5">
            <h3 class="font-semibold text-lg text-neutral-900 dark:text-neutral-100 mb-1 line-clamp-1">
              {{ p.name }}
            </h3>
            <p class="text-neutral-900 dark:text-neutral-100 font-bold text-xl mb-3">
              {{ formatPrice(p.price) }}원
            </p>
            <button type="button" class="shop-btn-cart group" @click.stop="addToCart(p)">
              장바구니 담기
            </button>
          </div>
        </div>
      </div>
    </section>

    
    <section v-if="recentlyViewed.length > 0" class="max-w-7xl mx-auto px-6 py-16 rounded-3xl bg-white/88 dark:bg-[#111a2a]/86 border border-slate-200/70 dark:border-slate-700/45">
      <h2 class="shop-section-title mb-10">최근 본 상품</h2>
      <div class="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
        <div
          v-for="p in recentlyViewed"
          :key="`recent-${p.id}`"
          @click="goDetail(p.id)"
          class="group shrink-0 w-44 sm:w-52 shop-card-product rounded-2xl"
        >
          <div class="shop-card-product-media h-36 sm:h-44">
            <img
              :src="imgSrc(p)"
              :alt="p.name"
              loading="lazy"
              decoding="async"
              class="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
              @error="onImgError"
            />
          </div>
          <div class="p-3">
            <h3 class="font-semibold text-sm text-neutral-900 dark:text-neutral-100 line-clamp-2 mb-1">
              {{ p.name }}
            </h3>
            <p class="text-neutral-900 dark:text-neutral-100 font-bold text-sm">
              {{ formatPrice(p.price || 0) }}원
            </p>
          </div>
        </div>
      </div>
    </section>

    
    <section v-if="!loading && recommendedProducts.length > 0" class="max-w-7xl mx-auto px-6 py-16">
      <div class="shop-section-head">
        <h2 class="shop-section-title">추천 상품</h2>
        <button type="button" class="shop-link-muted" @click="goCategory('전체')">
          전체보기 →
        </button>
      </div>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div
          v-for="p in recommendedProducts"
          :key="`rec-${p.id}`"
          @click="goDetail(p.id)"
          class="group shop-card-product transform hover:-translate-y-2"
        >
          <div class="shop-card-product-media h-64">
            <img
              :src="imgSrc(p)"
              :alt="p.name"
              loading="lazy"
              decoding="async"
              class="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
              @error="onImgError"
            />
          </div>
          <div class="p-5">
            <h3 class="font-semibold text-lg text-neutral-900 dark:text-neutral-100 mb-1 line-clamp-1">
              {{ p.name }}
            </h3>
            <p class="text-neutral-900 dark:text-neutral-100 font-bold text-xl mb-3">
              {{ formatPrice(p.price) }}원
            </p>
            <button type="button" class="shop-btn-cart group" @click.stop="addToCart(p)">
              장바구니 담기
            </button>
          </div>
        </div>
      </div>
    </section>

    
    <div class="max-w-7xl mx-auto px-6 py-10">
      <div class="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 class="shop-page-title">
          {{ selectedCategory === '전체' ? '전체 상품' : selectedCategory }}
          <span class="text-sm font-normal text-neutral-500 dark:text-neutral-400 ml-2">
            ({{ paginatedProducts.length }}개)
          </span>
        </h2>
        
        
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
        v-else-if="filteredProducts.length === 0"
        class="text-center text-neutral-400 mt-10"
      >
        {{ searchQuery ? "검색 결과가 없습니다." : "등록된 상품이 없습니다." }}
      </div>

      <div
        v-else
        class="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8"
      >
        <div
          v-for="p in paginatedProducts"
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
const heroImageStyle = (p) => {
  const raw = (p?.image_url || p?.image || "").toString().toLowerCase();
  if (raw.includes("macbookpro")) return { marginLeft: "-1.5%" };
  if (raw.includes("airpodspro")) return { marginLeft: "-1%" };
  return null;
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

const filteredProducts = computed(() => {
  let list = [...products.value];

  if (selectedCategory.value !== "전체") {
    list = list.filter((p) => p.category === selectedCategory.value);
  }

  const normalizedQuery = normalizeSearchText(searchQuery.value);
  if (normalizedQuery !== "") {
    list = list.filter(
      (p) =>
        normalizeSearchText(p.name).includes(normalizedQuery) ||
        normalizeSearchText(p.description).includes(normalizedQuery)
    );
  }

  if (priceRange.value) {
    const [min, max] = priceRange.value.split("-").map(Number);
    if (max) {
      list = list.filter((p) => p.price >= min && p.price <= max);
    } else {
      list = list.filter((p) => p.price >= min);
    }
  }

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
      break;
  }

  return list;
});

const totalPages = computed(() => {
  return Math.ceil(filteredProducts.value.length / itemsPerPage.value);
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

const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredProducts.value.slice(start, end);
});

const bestSellers = computed(() => {
  if (products.value.length === 0) return [];
  const sorted = [...products.value].sort((a, b) => b.price - a.price);
  return sorted.slice(0, 4);
});

const quickCategories = computed(() => {
  const list = products.value || [];
  if (!list.length) return [];
  const counts = new Map();
  for (const p of list) {
    const c = (p.category || "").trim();
    if (!c) continue;
    counts.set(c, (counts.get(c) || 0) + 1);
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c);
  const unique = ["전체", ...sorted];
  return unique.slice(0, 11); // 전체 포함 11개
});

const trendingTop = computed(() => {
  const list = products.value || [];
  if (!list.length) return [];
  const scored = list.map((p) => {
    const created = p.created_at ? new Date(p.created_at).getTime() : 0;
    const recency = created ? Math.max(0, 1 - (Date.now() - created) / (1000 * 60 * 60 * 24 * 21)) : 0; // 3주 내 가중
    const jitter = Math.random() * 0.12;
    return { p, score: recency + jitter };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 8).map((x) => x.p);
});

const newProducts = computed(() => {
  if (products.value.length === 0) return [];
  const sorted = [...products.value].sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
    const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
    return dateB - dateA;
  });
  return sorted.slice(0, 4);
});

const recommendedProducts = computed(() => {
  if (products.value.length === 0) return [];
  const shuffled = [...products.value].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 4);
});

const carouselSlides = computed(() => {
  if (products.value.length === 0) return [];
  const newFirst = [...products.value].sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
    const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
    return dateB - dateA;
  });
  return newFirst;
});

const heroSlideIndex = ref(0);
const heroPaused = ref(false);
let heroAutoplayId = null;

function clearHeroAutoplay() {
  if (heroAutoplayId != null) {
    clearInterval(heroAutoplayId);
    heroAutoplayId = null;
  }
}

function startHeroAutoplay() {
  clearHeroAutoplay();
  const slides = carouselSlides.value;
  if (slides.length <= 1) return;
  if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }
  heroAutoplayId = setInterval(() => {
    if (heroPaused.value || carouselSlides.value.length <= 1) return;
    heroSlideIndex.value = (heroSlideIndex.value + 1) % carouselSlides.value.length;
  }, 6500);
}

function nextHeroSlide() {
  const n = carouselSlides.value.length;
  if (n <= 1) return;
  heroSlideIndex.value = (heroSlideIndex.value + 1) % n;
}

function prevHeroSlide() {
  const n = carouselSlides.value.length;
  if (n <= 1) return;
  heroSlideIndex.value = (heroSlideIndex.value - 1 + n) % n;
}

const heroCarouselLiveText = computed(() => {
  const slides = carouselSlides.value;
  const i = heroSlideIndex.value;
  if (!slides.length || i < 0 || i >= slides.length) return "";
  return `총 ${slides.length}개 중 ${i + 1}번째, ${slides[i].name}`;
});

function onHeroCarouselKeydown(e) {
  const n = carouselSlides.value.length;
  if (n <= 1) return;
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    prevHeroSlide();
  } else if (e.key === "ArrowRight") {
    e.preventDefault();
    nextHeroSlide();
  } else if (e.key === "Home") {
    e.preventDefault();
    heroSlideIndex.value = 0;
  } else if (e.key === "End") {
    e.preventDefault();
    heroSlideIndex.value = n - 1;
  }
}

watch(carouselSlides, (slides) => {
  if (heroSlideIndex.value >= slides.length) heroSlideIndex.value = 0;
  startHeroAutoplay();
});

onUnmounted(() => {
  clearHeroAutoplay();
});

watch(
  () => [route.query.q, route.query.category],
  ([q, category]) => {
    searchQuery.value = (q || "").toString();
    selectedCategory.value = category || "전체";
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
    currentPage.value = 1;
    
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

const resetToFirstPage = () => {
  currentPage.value = 1;
};

watch([selectedCategory, searchQuery, priceRange, sortBy], () => {
  resetToFirstPage();
});

onMounted(() => {
  loadProducts();
  recentlyViewed.value = getRecentlyViewed();
});
</script>

<style scoped>

.hero-feature-img {
  display: block;
  margin: 0;
  object-position: center center;
  transform-origin: center center;
}

.hero-trust-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 12px;
  font-size: 12px;
  line-height: 1;
  font-weight: 650;
  letter-spacing: -0.015em;
  color: rgba(15, 23, 42, 0.75);
  background: rgba(15, 23, 42, 0.07);
  border: 1px solid rgba(15, 23, 42, 0.14);
}
:global(.dark) .hero-trust-pill {
  color: rgba(243, 244, 246, 0.82);
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.18);
}

.quick-cat-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 42px;
  padding: 0 14px;
  border-radius: 14px;
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

.trend-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 14px 14px;
  border-radius: 18px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background: rgba(255, 255, 255, 0.92);
  transition: transform 180ms ease, border-color 180ms ease, background-color 180ms ease, box-shadow 180ms ease;
}
.trend-row:hover {
  transform: translateY(-2px);
  border-color: rgba(15, 23, 42, 0.18);
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 14px 30px -22px rgba(15, 23, 42, 0.38);
}
:global(.dark) .trend-row {
  border-color: rgba(255, 255, 255, 0.12);
  background: rgba(15, 23, 42, 0.55);
}

.trend-rank {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  font-weight: 800;
  font-size: 13px;
  color: rgba(15, 23, 42, 0.72);
  background: rgba(15, 23, 42, 0.06);
  flex: 0 0 auto;
}
:global(.dark) .trend-rank {
  color: rgba(243, 244, 246, 0.8);
  background: rgba(255, 255, 255, 0.08);
}

.trend-thumb {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(15, 23, 42, 0.10);
  background: rgba(243, 244, 246, 0.8);
  flex: 0 0 auto;
}
:global(.dark) .trend-thumb {
  border-color: rgba(148, 163, 184, 0.16);
  background: rgba(2, 6, 23, 0.35);
}

.trend-price {
  font-weight: 800;
  color: rgba(15, 23, 42, 0.88);
  flex: 0 0 auto;
}
:global(.dark) .trend-price {
  color: rgba(243, 244, 246, 0.88);
}

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

@media (prefers-reduced-motion: reduce) {
  
  .hero-logo-animate,
  .hero-tagline {
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
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
