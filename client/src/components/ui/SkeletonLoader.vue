<template>
  <div class="animate-pulse">
    
    <div
      v-if="type === 'product-card'"
      class="rounded-3xl bg-white/90 dark:bg-[#1a1d2f]/70 border border-neutral-200/60 dark:border-purple-500/20 overflow-hidden"
    >
      <div class="h-80 bg-neutral-200/50 dark:bg-[#25283c]/50"></div>
      <div class="p-6 space-y-3">
        <div class="h-5 bg-neutral-200/50 dark:bg-[#25283c]/50 rounded w-3/4"></div>
        <div class="h-4 bg-neutral-200/50 dark:bg-[#25283c]/50 rounded w-full"></div>
        <div class="h-4 bg-neutral-200/50 dark:bg-[#25283c]/50 rounded w-2/3"></div>
        <div class="h-6 bg-neutral-200/50 dark:bg-[#25283c]/50 rounded w-1/3 mt-4"></div>
        <div class="h-10 bg-neutral-200/50 dark:bg-[#25283c]/50 rounded-full mt-4"></div>
      </div>
    </div>

    
    <div
      v-else-if="type === 'product-list'"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10"
    >
      <div
        v-for="i in count"
        :key="i"
        class="rounded-3xl bg-white/90 dark:bg-[#1a1d2f]/70 border border-neutral-200/60 dark:border-purple-500/20 overflow-hidden"
      >
        <div class="h-80 bg-neutral-200/50 dark:bg-[#25283c]/50"></div>
        <div class="p-6 space-y-3">
          <div class="h-5 bg-neutral-200/50 dark:bg-[#25283c]/50 rounded w-3/4"></div>
          <div class="h-4 bg-neutral-200/50 dark:bg-[#25283c]/50 rounded w-full"></div>
          <div class="h-4 bg-neutral-200/50 dark:bg-[#25283c]/50 rounded w-2/3"></div>
          <div class="h-6 bg-neutral-200/50 dark:bg-[#25283c]/50 rounded w-1/3 mt-4"></div>
          <div class="h-10 bg-neutral-200/50 dark:bg-[#25283c]/50 rounded-full mt-4"></div>
        </div>
      </div>
    </div>

    
    <div
      v-else-if="type === 'text'"
      class="space-y-2"
    >
      <div
        v-for="i in lines"
        :key="i"
        :class="[
          'h-4 bg-neutral-200/50 dark:bg-[#25283c]/50 rounded',
          i === lines ? 'w-3/4' : 'w-full'
        ]"
      ></div>
    </div>

    
    <div v-else :class="['bg-neutral-200/50 dark:bg-[#25283c]/50 rounded', customClass]">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
defineProps({
  type: {
    type: String,
    default: "product-card",
    validator: (value) =>
      ["product-card", "product-list", "text", "custom"].includes(value),
  },
  count: {
    type: Number,
    default: 6,
  },
  lines: {
    type: Number,
    default: 3,
  },
  customClass: {
    type: String,
    default: "",
  },
});
</script>

<style scoped>
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
