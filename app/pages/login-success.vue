<!-- pages/login-success.vue -->
<script lang="ts" setup>
definePageMeta({ layout: 'default' })

const router = useRouter()
const route = useRoute()
const { handleLoginSuccess } = useAuth()

const status = ref<'loading' | 'success' | 'error'>('loading')
const errorMessage = ref('')

onMounted(async () => {
  const rawToken = route.query.auth_token
  const token = Array.isArray(rawToken) ? rawToken[0] : rawToken

  if (!token) {
    status.value = 'error'
    errorMessage.value = 'Token tidak ditemukan. Silakan coba login ulang.'
    return
  }

  await handleLoginSuccess(token)
  status.value = 'success'

  // Ambil intended redirect dari sessionStorage
  const intendedRedirect = sessionStorage.getItem('auth_redirect') || '/dashboard'
  sessionStorage.removeItem('auth_redirect')

  await new Promise((r) => setTimeout(r, 800))
  await router.replace(intendedRedirect)
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0d0d0d] font-[Manrope]">
    <div class="bg-white dark:bg-[#181818] border border-gray-100 dark:border-neutral-800 rounded-2xl shadow-sm p-10 flex flex-col items-center gap-4 max-w-sm w-full">

      <!-- Loading -->
      <template v-if="status === 'loading'">
        <div class="w-12 h-12 rounded-full border-4 border-amber-200 dark:border-amber-900 border-t-amber-500 animate-spin" />
        <p class="text-gray-500 dark:text-gray-400 font-semibold text-sm">Memproses login...</p>
      </template>

      <!-- Success -->
      <template v-else-if="status === 'success'">
        <div class="w-14 h-14 rounded-2xl bg-green-50 dark:bg-green-950/40 flex items-center justify-center">
          <Icon name="heroicons:check-circle" class="w-8 h-8 text-green-500 dark:text-green-400" />
        </div>
        <p class="text-gray-900 dark:text-white font-bold text-lg">Login berhasil!</p>
        <p class="text-gray-400 text-sm">Mengalihkan ke halaman sebelumnya...</p>
      </template>

      <!-- Error -->
      <template v-else>
        <div class="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center">
          <Icon name="heroicons:x-circle" class="w-8 h-8 text-red-500 dark:text-red-400" />
        </div>
        <p class="text-gray-900 dark:text-white font-bold text-lg">Login gagal</p>
        <p class="text-gray-400 text-sm text-center">{{ errorMessage }}</p>
        <NuxtLink
          to="/"
          class="mt-2 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold transition"
        >
          <Icon name="heroicons:arrow-left" class="w-4 h-4" />
          Kembali ke Beranda
        </NuxtLink>
      </template>

    </div>
  </div>
</template>