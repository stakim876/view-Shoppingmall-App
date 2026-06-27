<template>
  <section class="home-hero" aria-label="메인 안내">
    <div class="home-hero__inner">
      <p class="home-hero__eyebrow">{{ BRAND_TAGLINE }}</p>
      <h1 class="home-hero__title">필요한 상품을 빠르게 찾아보세요</h1>
      <p class="home-hero__desc">
        카테고리·베스트·신상품부터 주문까지 한곳에서 이용할 수 있습니다.
      </p>

      <form class="home-hero__search" @submit.prevent="submitSearch">
        <label class="sr-only" for="home-search">상품 검색</label>
        <Search class="home-hero__search-icon" aria-hidden="true" />
        <input
          id="home-search"
          v-model="searchText"
          type="search"
          placeholder="상품 검색 (예: 백팩, 아이폰)"
          class="home-hero__search-input"
        />
        <button type="submit" class="shop-btn-primary home-hero__search-btn">검색</button>
      </form>

      <div v-if="popularTerms.length" class="home-hero__popular">
        <span class="home-hero__popular-label">인기</span>
        <button
          v-for="term in popularTerms"
          :key="term"
          type="button"
          class="home-hero__chip"
          @click="goSearch(term)"
        >
          {{ term }}
        </button>
      </div>

      <div class="home-hero__actions">
        <router-link to="/products?tab=best" class="shop-btn-primary home-hero__cta">
          베스트 보기
        </router-link>
        <router-link to="/products?tab=new" class="shop-btn-secondary home-hero__cta">
          신상품 보기
        </router-link>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { Search } from "lucide-vue-next";
import { BRAND_TAGLINE } from "@/lib/brand.js";

defineProps({
  popularTerms: { type: Array, default: () => [] },
});

const router = useRouter();
const searchText = ref("");

const goSearch = (term) => {
  const q = String(term || "").trim();
  if (!q) return;
  router.push({ path: "/products", query: { q } });
};

const submitSearch = () => {
  const q = searchText.value.trim();
  router.push({ path: "/products", query: q ? { q } : {} });
};
</script>

<style scoped>
.home-hero {
  max-width: 80rem;
  margin: 0 auto;
  padding: 1rem 1rem 0.25rem;
}

@media (min-width: 640px) {
  .home-hero {
    padding: 1.25rem 1.5rem 0.5rem;
  }
}

.home-hero__inner {
  padding: 1.25rem 1rem;
  border-radius: 0.5rem;
  border: 1px solid var(--color-border-default);
  background: var(--color-surface-raised);
}

@media (min-width: 640px) {
  .home-hero__inner {
    padding: 1.5rem 1.25rem;
  }
}

.home-hero__eyebrow {
  margin: 0;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-muted);
}

.home-hero__title {
  margin: 0.4rem 0 0;
  font-size: 1.375rem;
  font-weight: 700;
  line-height: 1.35;
  color: var(--color-text-primary);
}

@media (min-width: 640px) {
  .home-hero__title {
    font-size: 1.5rem;
  }
}

.home-hero__desc {
  margin: 0.5rem 0 0;
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--color-text-secondary);
  max-width: 32rem;
}

.home-hero__search {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  padding: 0.35rem 0.35rem 0.35rem 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid var(--color-border-default);
  background: var(--color-surface-base);
}

.home-hero__search-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  color: var(--color-text-muted);
}

.home-hero__search-input {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  font-size: 0.875rem;
  color: var(--color-text-primary);
  outline: none;
}

.home-hero__search-input::placeholder {
  color: var(--color-text-muted);
}

.home-hero__search-btn {
  flex-shrink: 0;
  padding: 0.5rem 0.85rem;
  font-size: 0.8rem;
  border-radius: 0.375rem;
}

.home-hero__popular {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.75rem;
}

.home-hero__popular-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-muted);
}

.home-hero__chip {
  padding: 0.25rem 0.55rem;
  border-radius: 999px;
  border: 1px solid var(--color-border-default);
  background: var(--color-surface-sunken);
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  cursor: pointer;
}

.home-hero__chip:hover {
  border-color: var(--color-border-strong);
  color: var(--color-text-primary);
}

.home-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
}

.home-hero__cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.55rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: none;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
