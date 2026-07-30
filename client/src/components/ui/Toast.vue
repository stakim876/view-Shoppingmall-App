<template>
  <Teleport to="body">
    <div
      class="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none"
    >
      <TransitionGroup name="toast" tag="div">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="[
            'pointer-events-auto min-w-[300px] max-w-[500px] rounded-xl shadow-2xl backdrop-blur-xl border',
            getToastClasses(toast.type),
          ]"
          @click="remove(toast.id)"
        >
          <div class="flex items-start gap-3 p-4">
            <div class="flex-shrink-0 mt-0.5">
              
              <svg
                v-if="toast.type === 'success'"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                class="w-5 h-5"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              
              <svg
                v-else-if="toast.type === 'error'"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                class="w-5 h-5"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              
              <svg
                v-else-if="toast.type === 'warning'"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                class="w-5 h-5"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              
              <svg
                v-else
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                class="w-5 h-5"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div class="flex-1">
              <p class="text-sm font-medium leading-relaxed">
                {{ toast.message }}
              </p>
            </div>
            <button
              @click.stop="remove(toast.id)"
              class="flex-shrink-0 text-current/60 hover:text-current transition-colors"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div
            v-if="toast.duration"
            class="h-1 bg-current/20 rounded-b-xl overflow-hidden"
          >
            <div
              class="h-full bg-current/40 rounded-b-xl animate-shrink"
              :style="{ animationDuration: `${toast.duration}ms` }"
            />
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { storeToRefs } from "pinia";
import { useToastStore } from "../../store/toast";

const toastStore = useToastStore();
const { toasts } = storeToRefs(toastStore);
const { remove } = toastStore;

const getToastClasses = (type) => {
  const base = "bg-white/95 dark:bg-surface-overlay/95";
  const types = {
    success:
      base +
      " text-green-800 dark:text-green-300 border-green-200 dark:border-green-800",
    error:
      base +
      " text-red-800 dark:text-red-300 border-red-200 dark:border-red-800",
    warning:
      base +
      " text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800",
    info: base + " text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  };
  return types[type] || types.info;
};

</script>

<style scoped>
.toast-enter-active {
  transition: all 0.3s ease-out;
}

.toast-leave-active {
  transition: all 0.3s ease-in;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

@keyframes shrink {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}

.animate-shrink {
  animation: shrink linear forwards;
}
</style>
