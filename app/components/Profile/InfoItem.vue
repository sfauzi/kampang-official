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
    <div class="mt-0.5 flex-shrink-0 w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
      <Icon :name="icon" class="w-5 h-5 text-blue-600" />
    </div>
    <div>
      <p class="text-xs font-medium text-gray-400 uppercase tracking-wide">{{ label }}</p>
      <p class="text-sm text-gray-700 mt-0.5">
        {{ value ?? '—' }}
      </p>
    </div>
  </div>
</template>