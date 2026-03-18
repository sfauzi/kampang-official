<!-- error.vue -->
<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{
  error: NuxtError
}>()

const handleError = () => clearError({ redirect: '/' })

onMounted(() => {
  const saved = localStorage.getItem('theme')
  const isDark = saved === 'light' 
    ? false 
    : saved === 'dark' 
      ? true 
      : window.matchMedia('(prefers-color-scheme: dark)').matches

  document.documentElement.classList.toggle('dark', isDark)
})

</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-stone-50 dark:bg-stone-950 px-4">
    
    <template v-if="error.statusCode === 404">
      <h1 class="font-mansalva text-8xl font-black text-amber-500">404</h1>
      <p class="mt-2 text-xl font-semibold text-stone-800 dark:text-stone-100">Halaman tidak ditemukan</p>
      <p class="mt-1 text-sm text-stone-500 dark:text-stone-400">Halaman yang kamu cari tidak ada atau sudah dipindahkan.</p>
    </template>

    <template v-else-if="error.statusCode === 500">
      <h1 class="font-mansalva text-8xl font-black text-red-500">500</h1>
      <p class="mt-2 text-xl font-semibold text-stone-800 dark:text-stone-100">Server Error</p>
      <p class="mt-1 text-sm text-stone-500 dark:text-stone-400">Terjadi kesalahan pada server. Coba lagi nanti.</p>
    </template>

    <template v-else>
      <h1 class="font-mansalva text-8xl font-black text-stone-400">{{ error.statusCode }}</h1>
      <p class="mt-2 text-xl font-semibold text-stone-800 dark:text-stone-100">Terjadi Kesalahan</p>
      <p class="mt-1 text-sm text-stone-500 dark:text-stone-400">{{ error.message }}</p>
    </template>

    <button
      @click="handleError"
      class="mt-8 cursor-pointer px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-xl transition"
    >
      Kembali ke Beranda
    </button>
  </div>
</template>

<style>
@import '~/assets/css/main.css';
</style>