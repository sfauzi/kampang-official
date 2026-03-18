<!-- components/Profile/InfoItem.vue -->

<script lang="ts" setup>
defineProps<{
  label: string
  value: string | null | undefined
  icon: string
}>()
</script>

<template>
  <div class="flex gap-3">
    <div class="mt-0.5 flex-shrink-0 w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950 flex items-center justify-center transition-colors duration-300">
      <Icon :name="icon" class="w-5 h-5 text-amber-600 dark:text-amber-400" />
    </div>
    <div>
      <p class="text-xs font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide transition-colors duration-300">{{ label }}</p>
      <p class="text-sm text-stone-700 dark:text-stone-300 mt-0.5 transition-colors duration-300">
        {{ value ?? '—' }}
      </p>
    </div>
  </div>
</template>