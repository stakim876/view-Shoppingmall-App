<template>
  <section class="home-categories" aria-label="카테고리 바로가기">
    <div class="home-categories__head">
      <h2 class="home-section-title">카테고리</h2>
      <router-link to="/products" class="home-section-link">전체 보기</router-link>
    </div>

    <p v-if="loading" class="home-categories__status">불러오는 중…</p>

    <div v-else class="home-categories__grid">
      <router-link
        v-for="name in displayCategories"
        :key="name"
        :to="{ path: '/products', query: { category: name } }"
        class="home-categories__tile"
      >
        <span class="home-categories__emoji" aria-hidden="true">{{ categoryIcon(name) }}</span>
        <span class="home-categories__label">{{ name }}</span>
      </router-link>
    </div>
  </section>
</template>

<script setup>
import { computed } from "vue";
import { categoryIcon } from "@/lib/productDisplay.js";

const props = defineProps({
  categories: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  limit: { type: Number, default: 8 },
});

const fallback = [
  "의류",
  "뷰티",
  "디지털/가전",
  "생활용품",
  "식품",
  "스포츠/레저",
  "패션잡화",
  "악세서리",
];

const displayCategories = computed(() => {
  const source = props.categories?.length ? props.categories : fallback;
  return source.filter(Boolean).slice(0, props.limit);
});
</script>

<style scoped>
.home-categories {
  max-width: 80rem;
  margin: 1.5rem auto 0;
  padding: 0 1rem;
}

@media (min-width: 640px) {
  .home-categories {
    padding: 0 1.5rem;
  }
}

.home-categories__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.home-section-title {
  margin: 0;
  font-size: 1.0625rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.home-section-link {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-accent);
  text-decoration: none;
}

.home-section-link:hover {
  color: var(--color-accent-hover);
  text-decoration: underline;
}

.home-categories__status {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.home-categories__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.5rem;
}

@media (min-width: 640px) {
  .home-categories__grid {
    grid-template-columns: repeat(8, minmax(0, 1fr));
    gap: 0.65rem;
  }
}

.home-categories__tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  min-height: 4.75rem;
  padding: 0.55rem 0.25rem;
  border-radius: 0.75rem;
  border: 1px solid var(--color-border-default);
  background: var(--color-surface-raised);
  box-shadow: var(--shadow-sm);
  text-decoration: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
}

.home-categories__tile:hover {
  border-color: var(--color-border-strong);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
  background: color-mix(in srgb, var(--color-accent-muted) 55%, var(--color-surface-raised));
}

.home-categories__emoji {
  font-size: 1.25rem;
  line-height: 1;
}

.home-categories__label {
  font-size: 0.68rem;
  font-weight: 500;
  text-align: center;
  line-height: 1.2;
  color: var(--color-text-secondary);
  word-break: keep-all;
}

@media (min-width: 640px) {
  .home-categories__label {
    font-size: 0.72rem;
  }
}
</style>
