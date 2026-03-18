<!-- components/Base/BaseToast.vue -->
<script lang="ts" setup>
import type { Toast } from '~/composables/useToast'

const { toasts, remove } = useToast()

const iconMap = {
  success: 'heroicons:check-circle-20-solid',
  error: 'heroicons:x-circle-20-solid',
  info: 'heroicons:information-circle-20-solid',
}

const colorMap = {
  success: {
    wrapper: 'bg-stone-900 dark:bg-stone-800 border border-emerald-500/30',
    icon: 'text-emerald-400',
    bar: 'bg-emerald-500',
    text: 'text-stone-100',
  },
  error: {
    wrapper: 'bg-stone-900 dark:bg-stone-800 border border-red-500/30',
    icon: 'text-red-400',
    bar: 'bg-red-500',
    text: 'text-stone-100',
  },
  info: {
    wrapper: 'bg-stone-900 dark:bg-stone-800 border border-amber-500/30',
    icon: 'text-amber-400',
    bar: 'bg-amber-500',
    text: 'text-stone-100',
  },
}
</script>

<template>
  <!-- Portal ke pojok kanan bawah -->
  <Teleport to="body">
    <div
      class="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 items-end pointer-events-none"
      aria-live="polite"
    >
      <TransitionGroup
        name="toast"
        tag="div"
        class="flex flex-col gap-3 items-end"
      >
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="pointer-events-auto relative flex items-start gap-3 w-72 rounded-xl shadow-2xl px-4 py-3 overflow-hidden cursor-pointer select-none"
          :class="colorMap[toast.type].wrapper"
          @click="remove(toast.id)"
          :title="'Klik untuk tutup'"
        >
          <!-- Icon -->
          <Icon
            :name="iconMap[toast.type]"
            class="w-5 h-5 mt-0.5 shrink-0"
            :class="colorMap[toast.type].icon"
          />

          <!-- Message -->
          <p class="text-sm leading-snug flex-1" :class="colorMap[toast.type].text">
            {{ toast.message }}
          </p>

          <!-- Close button -->
          <button
            class="shrink-0 text-stone-500 hover:text-stone-300 transition mt-0.5"
            @click.stop="remove(toast.id)"
            aria-label="Tutup notifikasi"
          >
            <Icon name="heroicons:x-mark-20-solid" class="w-4 h-4" />
          </button>

          <!-- Progress bar (animasi durasi) -->
          <div
            class="absolute bottom-0 left-0 h-[2px] rounded-b-xl animate-shrink"
            :class="colorMap[toast.type].bar"
            :style="{ animationDuration: `${toast.duration ?? 3500}ms` }"
          />
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
/* Slide in dari kanan */
.toast-enter-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.toast-leave-active {
  transition: all 0.25s ease-in;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(100%) scale(0.95);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%) scale(0.95);
}

/* Progress bar shrink */
@keyframes shrink {
  from { width: 100%; }
  to   { width: 0%; }
}
.animate-shrink {
  animation: shrink linear forwards;
}
</style>