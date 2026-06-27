<template>
  <section class="home-hero" aria-label="메인 안내">
    <div class="home-hero__inner">
      <p class="home-hero__eyebrow">{{ BRAND_TAGLINE }}</p>
      <h1 class="home-hero__title">필요한 상품을 빠르게 찾아보세요</h1>
      <p class="home-hero__desc">
        카테고리·베스트·신상품부터 주문까지 한곳에서 이용할 수 있습니다.
      </p>
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
import { BRAND_TAGLINE } from "@/lib/brand.js";
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
</style>
