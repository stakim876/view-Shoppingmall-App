<template>
  <svg
    :class="['brand-mark', `brand-mark--${size}`]"
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <defs>
      <linearGradient :id="`${uid}-bg`" x1="8" y1="6" x2="42" y2="44" gradientUnits="userSpaceOnUse">
        <stop stop-color="#818cf8" stop-opacity="0.22" />
        <stop offset="0.55" stop-color="#a78bfa" stop-opacity="0.14" />
        <stop offset="1" stop-color="#22d3ee" stop-opacity="0.18" />
      </linearGradient>
      <linearGradient :id="`${uid}-arc`" x1="10" y1="38" x2="38" y2="10" gradientUnits="userSpaceOnUse">
        <stop stop-color="#6366f1" />
        <stop offset="0.5" stop-color="#8b5cf6" />
        <stop offset="1" stop-color="#38bdf8" />
      </linearGradient>
      <radialGradient :id="`${uid}-core`" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(24 24) rotate(90) scale(10)">
        <stop stop-color="#eef2ff" />
        <stop offset="1" stop-color="#c7d2fe" stop-opacity="0.2" />
      </radialGradient>
      <filter :id="`${uid}-glow`" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="1.2" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    <rect class="brand-mark__frame" x="2" y="2" width="44" height="44" rx="14" :fill="`url(#${uid}-bg)`" />
    <rect class="brand-mark__frame" x="2.5" y="2.5" width="43" height="43" rx="13.5" stroke-width="1" />

    <circle class="brand-mark__orbit" cx="24" cy="24" r="13.5" :stroke="`url(#${uid}-arc)`" stroke-width="1.15" stroke-dasharray="3.5 5.5" opacity="0.85" />
    <circle :fill="`url(#${uid}-core)`" cx="24" cy="24" r="5.2" :filter="`url(#${uid}-glow)`" />
    <circle class="brand-mark__core-dot" cx="24" cy="24" r="2.1" />

    <circle class="brand-mark__node" cx="14.5" cy="17" r="2" />
    <circle class="brand-mark__node" cx="33.5" cy="19" r="1.7" />
    <circle class="brand-mark__node" cx="30" cy="33" r="1.9" />

    <path
      class="brand-mark__link"
      d="M16 17.5 22 22 M31.8 20.2 26.5 23.2 M28.2 31.5 25.8 27"
      stroke-width="1.2"
      stroke-linecap="round"
    />
  </svg>
</template>

<script setup>
import { useId } from "vue";

defineProps({
  size: { type: String, default: "md" },
});

const uid = useId().replace(/:/g, "");
</script>

<style scoped>
.brand-mark {
  @apply shrink-0;
}

.brand-mark__frame {
  stroke: rgb(99 102 241 / 0.28);
}

:global(.dark) .brand-mark__frame {
  stroke: rgb(129 140 248 / 0.38);
}

.brand-mark__orbit {
  transform-origin: 24px 24px;
  animation: brand-orbit 18s linear infinite;
}

.brand-mark__core-dot {
  fill: rgb(79 70 229);
}

:global(.dark) .brand-mark__core-dot {
  fill: rgb(165 180 252);
}

.brand-mark__node {
  fill: rgb(99 102 241);
  opacity: 0.9;
}

:global(.dark) .brand-mark__node {
  fill: rgb(129 140 248);
}

.brand-mark__link {
  stroke: rgb(99 102 241 / 0.45);
}

:global(.dark) .brand-mark__link {
  stroke: rgb(129 140 248 / 0.55);
}

@keyframes brand-orbit {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .brand-mark__orbit {
    animation: none;
  }
}

.brand-mark--xs {
  @apply h-7 w-7;
}

.brand-mark--sm {
  @apply h-8 w-8;
}

.brand-mark--md {
  @apply h-9 w-9 sm:h-10 sm:w-10;
}

.brand-mark--lg {
  @apply h-11 w-11 sm:h-12 sm:w-12;
}
</style>
