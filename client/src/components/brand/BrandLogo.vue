<template>
  <component
    :is="linkTo ? 'router-link' : 'div'"
    :to="linkTo || undefined"
    :class="['brand-logo', `brand-logo--${size}`, { 'brand-logo--stacked': stacked }]"
    :aria-label="linkTo ? `${BRAND_NAME} 홈으로 이동` : undefined"
  >
    <BrandMark v-if="showMark" :size="markSize" class="brand-logo__mark" />
    <span class="brand-logo__lockup">
      <span class="brand-logo__wordmark" aria-hidden="true">
        <span class="brand-logo__my">my</span><span class="brand-logo__shop">shop</span>
      </span>
      <span v-if="stacked && showTagline" class="brand-logo__tagline">{{ tagline }}</span>
    </span>
  </component>
</template>

<script setup>
import { computed } from "vue";
import BrandMark from "./BrandMark.vue";
import { BRAND_TAGLINE, BRAND_NAME } from "@/lib/brand.js";

const props = defineProps({
  size: { type: String, default: "md" },
  linkTo: { type: String, default: "" },
  showMark: { type: Boolean, default: true },
  showTagline: { type: Boolean, default: false },
  stacked: { type: Boolean, default: false },
  tagline: { type: String, default: BRAND_TAGLINE },
});

const markSize = computed(() => {
  if (props.size === "lg") return "lg";
  if (props.size === "sm") return "sm";
  return "md";
});
</script>

<style scoped>
.brand-logo {
  @apply inline-flex items-center gap-2.5 select-none rounded-md
         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/50
         focus-visible:ring-offset-2 focus-visible:ring-offset-white
         dark:focus-visible:ring-offset-surface-base;
}

.brand-logo__mark {
  @apply shrink-0;
}

.brand-logo--stacked {
  @apply items-start gap-3;
}

.brand-logo__lockup {
  @apply inline-flex flex-col items-start min-w-0;
}

.brand-logo--stacked .brand-logo__lockup {
  @apply gap-1.5;
}

.brand-logo__wordmark {
  @apply inline-flex items-baseline leading-none whitespace-nowrap;
  font-family: "Inter", "Noto Sans KR", sans-serif;
}

.brand-logo__my {
  @apply font-semibold tracking-[-0.04em] text-slate-600 dark:text-slate-300;
}

.brand-logo__shop {
  @apply font-bold tracking-[-0.03em] text-slate-900 dark:text-white;
}

.brand-logo--sm .brand-logo__my {
  @apply text-[0.95rem];
}

.brand-logo--sm .brand-logo__shop {
  @apply text-[0.95rem];
}

.brand-logo--md .brand-logo__my,
.brand-logo--md .brand-logo__shop {
  @apply text-[1.05rem] sm:text-[1.12rem];
}

.brand-logo--lg .brand-logo__my,
.brand-logo--lg .brand-logo__shop {
  @apply text-[1.55rem] sm:text-[1.85rem];
}

.brand-logo__tagline {
  @apply text-[10px] sm:text-[11px] font-medium text-slate-500 dark:text-slate-400;
  font-family: "Noto Sans KR", sans-serif;
}
</style>
