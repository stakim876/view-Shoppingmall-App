<template>
  <section class="home-trust" aria-label="쇼핑 안내">
    <ul class="home-trust__list">
      <li class="home-trust__item">
        <Truck class="home-trust__icon" aria-hidden="true" />
        <span>{{ freeShippingLabel }}</span>
      </li>
      <li class="home-trust__item">
        <Package class="home-trust__icon" aria-hidden="true" />
        <span>평일 주문 2~3일 내 출고</span>
      </li>
      <li class="home-trust__item">
        <Star class="home-trust__icon" aria-hidden="true" />
        <span>구매 후기로 상품을 확인하세요</span>
      </li>
    </ul>
  </section>
</template>

<script setup>
import { Truck, Package, Star } from "lucide-vue-next";
import { formatFreeShippingBadge } from "@/lib/shopPolicy.js";

const freeShippingLabel = formatFreeShippingBadge();
</script>

<style scoped>
.home-trust {
  max-width: 80rem;
  margin: 0.75rem auto 0;
  padding: 0 1rem;
}

@media (min-width: 640px) {
  .home-trust {
    padding: 0 1.5rem;
  }
}

.home-trust__list {
  display: grid;
  gap: 0.5rem;
  margin: 0;
  padding: 0.75rem 1rem;
  list-style: none;
  border-radius: 0.375rem;
  border: 1px solid var(--color-border-default);
  background: var(--color-surface-raised);
}

@media (min-width: 768px) {
  .home-trust__list {
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
  }
}

.home-trust__item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.home-trust__icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  color: var(--color-text-muted);
}
</style>
