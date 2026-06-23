<template>
  <button
    type="button"
    :aria-label="isWished ? '찜 해제' : '찜하기'"
    :class="[
      'relative inline-flex items-center justify-center rounded-full border transition-all duration-200',
      isWished
        ? 'bg-neutral-100 border-neutral-300 text-neutral-800 shadow-[inset_0_1px_2px_rgba(255,255,255,0.85),0_8px_18px_rgba(148,163,184,0.18)] dark:bg-neutral-800/60 dark:border-neutral-600/50 dark:text-neutral-200'
        : 'bg-white border-slate-200/80 text-slate-400 shadow-[0_8px_20px_-16px_rgba(15,23,42,0.22)] hover:text-neutral-900 hover:border-neutral-300 hover:bg-neutral-100 dark:bg-slate-800 dark:border-slate-500/60 dark:text-slate-400 dark:hover:text-neutral-200 dark:hover:border-neutral-400/45',
      busy ? 'opacity-60 cursor-not-allowed' : 'hover:scale-105 active:scale-95',
      sizeClass,
    ]"
    :disabled="busy"
    @click.stop="onClick"
  >
    <Sparkles
      :class="[iconClass, isWished ? 'fill-current animate-wish-shimmer' : '']"
    />
    <span
      v-if="isWished"
      class="absolute -right-0.5 -top-0.5 w-2 h-2 rounded-full bg-neutral-900/80 dark:bg-neutral-200/80"
    />
  </button>
</template>

<script setup>
import { computed, ref } from "vue";
import { Sparkles } from "lucide-vue-next";
import { useWishlistStore } from "../../store/wishlist";
import { useAuthStore } from "../../store/auth";
import { useToastStore } from "../../store/toast";

const props = defineProps({
  productId: { type: [Number, String], required: true },
  size: { type: String, default: "md" },
});

const auth = useAuthStore();
const wishlist = useWishlistStore();
const toast = useToastStore();
const busy = ref(false);

const isWished = computed(() => wishlist.hasProduct(props.productId));

const sizeClass = computed(() => {
  switch (props.size) {
    case "sm":
      return "w-8 h-8";
    case "lg":
      return "w-11 h-11";
    default:
      return "w-9 h-9";
  }
});

const iconClass = computed(() => {
  switch (props.size) {
    case "sm":
      return "w-4 h-4";
    case "lg":
      return "w-5 h-5";
    default:
      return "w-[18px] h-[18px]";
  }
});

async function onClick() {
  if (!auth.isLoggedIn) {
    toast.warning("찜하려면 로그인해 주세요.");
    return;
  }
  if (props.productId == null || props.productId === "") {
    toast.error("상품 정보를 찾을 수 없습니다.");
    return;
  }
  if (busy.value) return;
  busy.value = true;
  try {
    const added = await wishlist.toggle(props.productId);
    toast.success(added ? "찜 목록에 추가되었습니다." : "찜 목록에서 제거되었습니다.");
  } catch (err) {
    const msg = err.response?.data?.message || "찜 처리에 실패했습니다.";
    toast.error(msg);
  } finally {
    busy.value = false;
  }
}
</script>

<style scoped>
@keyframes wish-shimmer {
  0%, 100% {
    transform: scale(1);
    filter: drop-shadow(0 0 0 rgba(148, 163, 184, 0));
  }
  50% {
    transform: scale(1.08);
    filter: drop-shadow(0 0 6px rgba(148, 163, 184, 0.28));
  }
}

.animate-wish-shimmer {
  animation: wish-shimmer 1.8s ease-in-out infinite;
}

:global(.dark) .animate-wish-shimmer {
  animation-name: wish-shimmer-dark;
  animation-duration: 2.6s;
}

@keyframes wish-shimmer-dark {
  0%, 100% {
    transform: scale(1);
    filter: drop-shadow(0 0 0 rgba(148, 163, 184, 0));
  }
  50% {
    transform: scale(1.06);
    filter: drop-shadow(0 0 5px rgba(148, 163, 184, 0.22));
  }
}

@media (prefers-reduced-motion: reduce) {
  .animate-wish-shimmer {
    animation: none;
  }
}
</style>
