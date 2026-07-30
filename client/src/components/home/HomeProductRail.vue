<template>
  <section v-if="loading || products.length > 0" class="home-rail" :aria-label="title">
    <div class="home-rail__head">
      <div>
        <h2 class="home-section-title">{{ title }}</h2>
        <p v-if="subtitle" class="home-rail__subtitle">{{ subtitle }}</p>
      </div>
      <router-link v-if="moreTo" :to="moreTo" class="home-section-link">더보기</router-link>
    </div>

    <p v-if="loading" class="home-rail__status">불러오는 중…</p>
    <p v-else-if="error" class="home-rail__error">
      {{ error }}
      <button type="button" class="home-rail__retry" @click="$emit('retry')">다시 시도</button>
    </p>

    <div v-else class="home-rail__grid">
      <HomeProductCard
        v-for="product in products"
        :key="`${title}-${product.id}`"
        :product="product"
        @open="(id) => $emit('open', id)"
        @add-to-cart="(p) => $emit('add-to-cart', p)"
      />
    </div>
  </section>
</template>

<script setup>
import HomeProductCard from "./HomeProductCard.vue";

defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: "" },
  products: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  error: { type: String, default: "" },
  moreTo: { type: [Object, String], default: null },
});

defineEmits(["open", "add-to-cart", "retry"]);
</script>

<style scoped>
.home-rail {
  max-width: 80rem;
  margin: 1.75rem auto 0;
  padding: 0 1rem;
}

@media (min-width: 640px) {
  .home-rail {
    padding: 0 1.5rem;
  }
}

.home-rail__head {
  display: flex;
  align-items: flex-start;
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
  flex-shrink: 0;
}

.home-section-link:hover {
  color: var(--color-accent-hover);
  text-decoration: underline;
}

.home-rail__subtitle {
  margin: 0.25rem 0 0;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.home-rail__status,
.home-rail__error {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.home-rail__error {
  color: rgb(220 38 38);
}

.home-rail__retry {
  margin-left: 0.5rem;
  font-size: 0.8rem;
  font-weight: 600;
  text-decoration: underline;
  color: inherit;
  background: none;
  border: none;
  cursor: pointer;
}

.home-rail__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(9.5rem, 1fr));
  gap: 0.85rem 0.65rem;
}

@media (min-width: 640px) {
  .home-rail__grid {
    grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
  }
}

.home-rail__grid :deep(.home-product-card) {
  width: 100%;
}
</style>
