<template>
  <article class="home-product-card">
    <button type="button" class="home-product-card__main" @click="$emit('open', product.id)">
        <div class="home-product-card__media-wrap">
          <div class="home-product-card__media">
            <img
              :src="productImageSrc(product)"
              :alt="product.name"
              loading="lazy"
              decoding="async"
              class="home-product-card__img"
              @error="onProductImageError"
            />
          </div>
        </div>
      <div class="home-product-card__body">
        <h3 class="home-product-card__name">{{ product.name }}</h3>
        <p class="home-product-card__price">{{ formatPrice(product.price) }}원</p>
        <div class="home-product-card__meta">
          <span
            v-if="stockLabel"
            class="home-product-card__badge"
            :class="stockLabel.tone === 'soldout'
              ? 'home-product-card__badge--soldout'
              : 'home-product-card__badge--low'"
          >
            {{ stockLabel.text }}
          </span>
          <span v-if="reviewStat" class="home-product-card__badge home-product-card__badge--review">
            ★ {{ reviewStat.avg }} ({{ reviewStat.count }})
          </span>
          <span
            class="home-product-card__badge home-product-card__badge--ship"
            :title="freeShippingLabel"
          >
            {{ freeShippingShortLabel }}
          </span>
        </div>
      </div>
    </button>
    <button
      type="button"
      class="shop-btn-cart home-product-card__cart"
      :disabled="isSoldOut"
      @click="$emit('add-to-cart', product)"
    >
      {{ isSoldOut ? "품절" : "장바구니" }}
    </button>
  </article>
</template>

<script setup>
import { computed } from "vue";
import { formatPrice } from "@/lib/format";
import { productImageSrc, onProductImageError, getProductReviewStat, getProductStockLabel } from "@/lib/productDisplay.js";
import { formatFreeShippingBadge } from "@/lib/shopPolicy.js";

const props = defineProps({
  product: { type: Object, required: true },
});

defineEmits(["open", "add-to-cart"]);

const freeShippingLabel = formatFreeShippingBadge();
const freeShippingShortLabel = "무료배송";

const reviewStat = computed(() => getProductReviewStat(props.product));
const stockLabel = computed(() => getProductStockLabel(props.product?.stock));
const isSoldOut = computed(() => stockLabel.value?.tone === "soldout");
</script>

<style scoped>
.home-product-card {
  display: flex;
  flex-direction: column;
  width: 10.5rem;
  flex-shrink: 0;
  border-radius: 0.375rem;
  border: 1px solid var(--color-border-default);
  background: var(--color-surface-raised);
}

@media (min-width: 640px) {
  .home-product-card {
    width: 11.5rem;
  }
}

.home-product-card__media-wrap {
  overflow: hidden;
  border-radius: 0.375rem 0.375rem 0 0;
}

.home-product-card__main {
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 0;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.home-product-card__media {
  position: relative;
  aspect-ratio: 1 / 1;
  width: 100%;
  overflow: hidden;
  background: #fff;
}

.home-product-card__img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.home-product-card__body {
  padding: 0.65rem 0.7rem 0.5rem;
}

.home-product-card__name {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 500;
  line-height: 1.35;
  color: var(--color-text-primary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.home-product-card__price {
  margin: 0.35rem 0 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-primary);
  font-variant-numeric: tabular-nums;
}

.home-product-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-top: 0.4rem;
}

.home-product-card__badge {
  font-size: 0.62rem;
  font-weight: 500;
  padding: 0.15rem 0.35rem;
  border-radius: 0.25rem;
  color: var(--color-text-secondary);
  background: var(--color-surface-sunken);
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.home-product-card__badge--soldout {
  color: rgb(220 38 38);
  background: rgb(254 226 226);
}

.home-product-card__badge--low {
  color: rgb(180 83 9);
  background: rgb(254 243 199);
}

.home-product-card__cart:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.home-product-card__cart {
  box-sizing: border-box;
  width: calc(100% - 1rem);
  margin: 0.35rem 0.5rem 0.5rem;
  padding: 0.5rem 0.5rem;
  font-size: 0.75rem;
  white-space: nowrap;
}
</style>
