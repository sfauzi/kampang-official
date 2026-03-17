<script lang="ts" setup>
definePageMeta({
  layout: 'default',
})

const router = useRouter()
const route = useRoute()
const { handleLoginSuccess } = useAuth()

const status = ref<'loading' | 'success' | 'error'>('loading')
const errorMessage = ref('')

onMounted(async () => {
  // Decode token dari query — backend pakai urlencode
  const rawToken = route.query.auth_token

  // Tangani kasus token berupa array (edge case query duplikat)
  const token = Array.isArray(rawToken) ? rawToken[0] : rawToken

  if (!token) {
    status.value = 'error'
    errorMessage.value = 'Token tidak ditemukan. Silakan coba login ulang.'
    return
  }

  // handleLoginSuccess: simpan token ke localStorage + coba fetch user
  // fetchUser boleh gagal — token tetap tersimpan, profile page akan retry
  await handleLoginSuccess(token)

  // ✅ Langsung redirect ke /profile TANPA cek ok/false
  // Middleware di /profile hanya cek keberadaan token di localStorage
  // Jika token ada → masuk. Jika fetchUser gagal → profile retry via onMounted
  status.value = 'success'
  await new Promise((r) => setTimeout(r, 800))
  await router.replace('/profile')
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="bg-white rounded-2xl shadow-lg p-10 flex flex-col items-center gap-4 max-w-sm w-full">

      <!-- Loading -->
      <template v-if="status === 'loading'">
        <div class="w-12 h-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
        <p class="text-gray-600 font-medium">Memproses login...</p>
      </template>

      <!-- Success -->
      <template v-else-if="status === 'success'">
        <div class="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
          <Icon name="heroicons:check-circle-20-solid" class="w-8 h-8 text-green-600" />
        </div>
        <p class="text-gray-800 font-semibold text-lg">Login berhasil!</p>
        <p class="text-gray-500 text-sm">Mengalihkan ke halaman profil...</p>
      </template>

      <!-- Error -->
      <template v-else>
        <div class="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
          <Icon name="heroicons:x-circle-20-solid" class="w-8 h-8 text-red-500" />
        </div>
        <p class="text-gray-800 font-semibold text-lg">Login gagal</p>
        <p class="text-gray-500 text-sm text-center">{{ errorMessage }}</p>
        <NuxtLink
          to="/"
          class="mt-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          Kembali ke Beranda
        </NuxtLink>
      </template>

    </div>
  </div>
</template>