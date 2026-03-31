<template>
  <nav class="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 mb-6" aria-label="Breadcrumb">
    <template v-for="(item, i) in items" :key="i">
      <span v-if="i > 0" class="select-none">/</span>
      <router-link
        v-if="item.to"
        :to="item.to"
        class="hover:text-indigo-600 dark:hover:text-indigo-400 transition"
      >
        {{ item.label }}
      </router-link>
      <span v-else class="text-neutral-800 dark:text-neutral-200 font-medium">
        {{ item.label }}
      </span>
    </template>
  </nav>
</template>

<script setup>
defineProps({
  items: {
    type: Array,
    required: true,
  },
});
</script>
