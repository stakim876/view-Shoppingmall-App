<template>
  <button
    type="button"
    :aria-label="isWished ? '찜 해제' : '찜하기'"
    :class="[
      'inline-flex items-center justify-center rounded-full transition-all',
      isWished
        ? 'text-rose-500 dark:text-rose-400'
        : 'text-gray-400 dark:text-gray-500 hover:text-rose-400 dark:hover:text-rose-400',
      sizeClass,
    ]"
    :disabled="busy"
    @click.stop="onClick"
  >
    <Heart
      :class="[isWished ? 'fill-current' : '']"
      class="w-full h-full"
    />
  </button>
</template>

<script setup>
import { computed, ref } from "vue";
import { Heart } from "lucide-vue-next";
import { useWishlistStore } from "../../store/wishlist";
import { useAuthStore } from "../../store/auth";
import { useToastStore } from "../../store/toast";

const props = defineProps({
  productId: { type: [Number, String], required: true },
  size: { type: String, default: "md" }, // sm, md, lg
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
      return "w-10 h-10";
    default:
      return "w-9 h-9";
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
